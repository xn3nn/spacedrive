use crate::{
	extract_job_data,
	job::{
		JobError, JobInitData, JobReportUpdate, JobResult, JobState, StatefulJob, WorkerContext,
	},
	library::Library,
	location::file_path_helper::{
		ensure_file_path_exists, ensure_sub_path_is_directory, ensure_sub_path_is_in_location,
		file_path_for_thumbnailer, IsolatedFilePathData,
	},
	object::preview::thumbnail::directory::init_thumbnail_dir,
	prisma::{file_path, location, PrismaClient},
};

use std::{
	collections::VecDeque,
	hash::Hash,
	path::{Path, PathBuf},
};

use sd_file_ext::extensions::Extension;

use serde::{Deserialize, Serialize};

use tracing::info;

use super::{
	finalize_thumbnailer, process_step, ThumbnailerError, ThumbnailerJobReport,
	ThumbnailerJobState, ThumbnailerJobStep, ThumbnailerJobStepKind, FILTERED_IMAGE_EXTENSIONS,
};

#[cfg(feature = "ffmpeg")]
use super::FILTERED_VIDEO_EXTENSIONS;

pub struct ThumbnailerJob {}

#[derive(Serialize, Deserialize, Clone)]
pub struct ThumbnailerJobInit {
	pub location: location::Data,
	pub sub_path: Option<PathBuf>,
}

impl Hash for ThumbnailerJobInit {
	fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
		self.location.id.hash(state);
		if let Some(ref sub_path) = self.sub_path {
			sub_path.hash(state);
		}
	}
}

impl JobInitData for ThumbnailerJobInit {
	type Job = ThumbnailerJob;
}

#[async_trait::async_trait]
impl StatefulJob for ThumbnailerJob {
	type Init = ThumbnailerJobInit;
	type Data = Option<ThumbnailerJobState>;
	type Step = ThumbnailerJobStep;

	const NAME: &'static str = "thumbnailer";

	fn new() -> Self {
		Self {}
	}

	async fn init(
		&self,
		ctx: &mut WorkerContext,
		init: &Self::Init,
	) -> Result<(Self::Data, VecDeque<Self::Step>), JobError> {
		let Library { db, .. } = &ctx.library;

		let thumbnail_dir = init_thumbnail_dir(ctx.library.config().data_directory()).await?;
		// .join(THUMBNAIL_CACHE_DIR_NAME);

		let location_id = init.location.id;
		let location_path = match &init.location.path {
			Some(v) => PathBuf::from(v),
			None => return Ok((None, VecDeque::new())),
		};

		let (path, iso_file_path) = match &init.sub_path {
			Some(sub_path) if sub_path != Path::new("") && sub_path != Path::new("/") => {
				let full_path = ensure_sub_path_is_in_location(&location_path, sub_path)
					.await
					.map_err(ThumbnailerError::from)?;
				ensure_sub_path_is_directory(&location_path, sub_path)
					.await
					.map_err(ThumbnailerError::from)?;

				let sub_iso_file_path =
					IsolatedFilePathData::new(location_id, &location_path, &full_path, true)
						.map_err(ThumbnailerError::from)?;

				ensure_file_path_exists(
					sub_path,
					&sub_iso_file_path,
					db,
					ThumbnailerError::SubPathNotFound,
				)
				.await?;

				(full_path, sub_iso_file_path)
			}
			_ => (
				location_path.to_path_buf(),
				IsolatedFilePathData::new(location_id, &location_path, &location_path, true)
					.map_err(ThumbnailerError::from)?,
			),
		};

		info!("Searching for images in location {location_id} at directory {iso_file_path}");

		// query database for all image files in this location that need thumbnails
		let image_files = get_files_by_extensions(
			db,
			&iso_file_path,
			&FILTERED_IMAGE_EXTENSIONS,
			ThumbnailerJobStepKind::Image,
		)
		.await?;
		info!("Found {:?} image files", image_files.len());

		#[cfg(feature = "ffmpeg")]
		let all_files = {
			// query database for all video files in this location that need thumbnails
			let video_files = get_files_by_extensions(
				db,
				&iso_file_path,
				&FILTERED_VIDEO_EXTENSIONS,
				ThumbnailerJobStepKind::Video,
			)
			.await?;
			info!("Found {:?} video files", video_files.len());

			image_files
				.into_iter()
				.chain(video_files.into_iter())
				.collect::<VecDeque<_>>()
		};
		#[cfg(not(feature = "ffmpeg"))]
		let all_files = { image_files.into_iter().collect::<VecDeque<_>>() };

		ctx.progress(vec![
			JobReportUpdate::TaskCount(all_files.len()),
			JobReportUpdate::Message(format!("Preparing to process {} files", all_files.len())),
		]);

		let data = Some(ThumbnailerJobState {
			location: init.location.clone(),
			thumbnail_dir,
			location_path,
			report: ThumbnailerJobReport {
				location_id,
				path,
				thumbnails_created: 0,
				thumbnails_skipped: 0,
			},
		});

		Ok((data, all_files))
	}

	async fn execute_step_raw(
		&self,
		ctx: &mut WorkerContext,
		data: &mut Self::Data,
		steps: &mut VecDeque<Self::Step>,
		step_number: usize,
	) -> Result<(), JobError> {
		if let Some(data) = data {
			process_step(ctx, data, steps, step_number).await
		} else {
			Ok(())
		}
	}

	async fn finalize(&mut self, ctx: &mut WorkerContext, state: &mut JobState<Self>) -> JobResult {
		if let Some(state) = extract_job_data!(state) {
			finalize_thumbnailer(state, ctx)
		} else {
			Ok(None)
		}
	}
}

async fn get_files_by_extensions(
	db: &PrismaClient,
	iso_file_path: &IsolatedFilePathData<'_>,
	extensions: &[Extension],
	kind: ThumbnailerJobStepKind,
) -> Result<Vec<ThumbnailerJobStep>, JobError> {
	Ok(db
		.file_path()
		.find_many(vec![
			file_path::location_id::equals(Some(iso_file_path.location_id())),
			file_path::extension::in_vec(extensions.iter().map(ToString::to_string).collect()),
			file_path::materialized_path::starts_with(
				iso_file_path
					.materialized_path_for_children()
					.expect("sub path iso_file_path must be a directory"),
			),
		])
		.select(file_path_for_thumbnailer::select())
		.exec()
		.await?
		.into_iter()
		.map(|file_path| ThumbnailerJobStep { file_path, kind })
		.collect())
}
