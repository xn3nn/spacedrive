/*!
 * Linux has the best behaving file system events, with just some small caveats:
 * When we move files or directories, we receive 3 events: Rename From, Rename To and Rename Both.
 * But when we move a file or directory to the outside from the watched location, we just receive
 * the Rename From event, so we have to keep track of all rename events to match them against each
 * other. If we have dangling Rename From events, we have to remove them after some time.
 * Aside from that, when a directory is moved to our watched location from the outside, we receive
 * a Create Dir event, this one is actually ok at least.
 *
 *
 * ## Events dispatched on Linux:
 * - Create File:
 *    1) `EventKind::Create(CreateKind::File)`
 *    2) `EventKind::Modify(ModifyKind::Metadata(MetadataKind::Any))`
 *        or `EventKind::Modify(ModifyKind::Data(DataChange::Any))`
 *    3) `EventKind::Access(AccessKind::Close(AccessMode::Write)))`
 * - Create Directory:
 *    1) `EventKind::Create(CreateKind::Folder)`
 * - Update File:
 *    1) `EventKind::Modify(ModifyKind::Data(DataChange::Any))`
 *    2) `EventKind::Access(AccessKind::Close(AccessMode::Write)))`
 * - Update File (rename):
 *    1) `EventKind::Modify(ModifyKind::Name(RenameMode::From))`
 *    2) `EventKind::Modify(ModifyKind::Name(RenameMode::To))`
 *    3) `EventKind::Modify(ModifyKind::Name(RenameMode::Both))`
 * - Update Directory (rename):
 *    1) `EventKind::Modify(ModifyKind::Name(RenameMode::From))`
 *    2) `EventKind::Modify(ModifyKind::Name(RenameMode::To))`
 *    3) `EventKind::Modify(ModifyKind::Name(RenameMode::Both))`
 * - Delete File:
 *    1) `EventKind::Remove(RemoveKind::File)`
 * - Delete Directory:
 *    1) `EventKind::Remove(RemoveKind::Folder)`
 */

 use std::{
	collections::{BTreeMap, HashMap},
	path::PathBuf,
};

use async_trait::async_trait;
use notify::{
	event::{AccessKind, AccessMode, CreateKind, ModifyKind, RenameMode},
	Event, EventKind as NotifyEventKind,
};
use tokio::{
	sync::{mpsc, oneshot},
	time::Instant,
};
use tracing::trace;

use super::{
	event::{EventHandler, EventKind, WatcherEvent},
	INodeAndDevice, LocationPubId, LocationWatcherError, HUNDRED_MILLIS,
};

pub(super) struct LinuxEventHandler {
	location_pub_id: LocationPubId,
	events_to_emit_tx: mpsc::Sender<WatcherEvent>,
	last_check_rename: Instant,
	rename_from: HashMap<PathBuf, Instant>,
	rename_from_buffer: Vec<(PathBuf, Instant)>,
	recently_created_files: BTreeMap<PathBuf, Instant>,
	recently_renamed_from: BTreeMap<PathBuf, Instant>,
}

#[async_trait]
impl EventHandler for LinuxEventHandler {
	fn new(
		location_pub_id: LocationPubId,
		// Linux file system events are well behaved and doesn't need to check file's inode and device
		_inode_and_device_tx: mpsc::Sender<(
			LocationPubId,
			PathBuf,
			oneshot::Sender<INodeAndDevice>,
		)>,
		events_to_emit_tx: mpsc::Sender<WatcherEvent>,
	) -> Self
	where
		Self: Sized,
	{
		Self {
			location_pub_id,
			events_to_emit_tx,
			last_check_rename: Instant::now(),
			rename_from: HashMap::new(),
			rename_from_buffer: Vec::new(),
			recently_created_files: BTreeMap::new(),
			recently_renamed_from: BTreeMap::new(),
		}
	}

	async fn handle_event(&mut self, event: Event) -> Result<(), LocationWatcherError> {
		trace!("Received Linux event: {:#?}", event);

		let Event {
			kind, mut paths, ..
		} = event;

		match kind {
			NotifyEventKind::Create(CreateKind::File) => {
				let path = paths.remove(0);
				self.recently_created_files
					.insert(path.clone(), Instant::now());
				self.events_to_emit_tx
					.send(WatcherEvent {
						location_pub_id: self.location_pub_id,
						kind: EventKind::Create(path),
					})
					.await
			}

			NotifyEventKind::Access(AccessKind::Close(AccessMode::Write)) => {
				// If a file was closed with write mode, then it was updated or created,
				// so we check if it was created recently
				let path = paths.remove(0);
				if !self.recently_created_files.contains_key(&path) {
					self.events_to_emit_tx
						.send(WatcherEvent {
							location_pub_id: self.location_pub_id,
							kind: EventKind::Update(path),
						})
						.await
				} else {
					Ok(())
				}
			}
			NotifyEventKind::Create(CreateKind::Folder) => {
				self.events_to_emit_tx
					.send(WatcherEvent {
						location_pub_id: self.location_pub_id,
						kind: EventKind::Create(paths.remove(0)),
					})
					.await
			}
			NotifyEventKind::Modify(ModifyKind::Name(RenameMode::From)) => {
				// Just in case we can't garantee that we receive the Rename From event before the
				// Rename Both event. Just a safeguard
				if self.recently_renamed_from.remove(&paths[0]).is_none() {
					self.rename_from.insert(paths.remove(0), Instant::now());
				}

				Ok(())
			}

			NotifyEventKind::Modify(ModifyKind::Name(RenameMode::Both)) => {
				let to = paths.remove(1);
				let from = paths.remove(0);
				self.rename_from.remove(&from);

				self.recently_renamed_from
					.insert(from.clone(), Instant::now());
				self.events_to_emit_tx
					.send(WatcherEvent {
						location_pub_id: self.location_pub_id,
						kind: EventKind::Rename { from, to },
					})
					.await
			}
			NotifyEventKind::Remove(_) => {
				self.events_to_emit_tx
					.send(WatcherEvent {
						location_pub_id: self.location_pub_id,
						kind: EventKind::Delete(paths.remove(0)),
					})
					.await
			}
			other_event_kind => {
				trace!("Other Linux event that we don't handle for now: {other_event_kind:#?}");
				Ok(())
			}
		}
		.map_err(|e| LocationWatcherError::EmitEvent(e.0))
	}

	async fn tick(&mut self) -> Result<(), Vec<LocationWatcherError>> {
		if self.last_check_rename.elapsed() > HUNDRED_MILLIS {
			self.last_check_rename = Instant::now();

			self.recently_renamed_from
				.retain(|_, instant| instant.elapsed() < HUNDRED_MILLIS);

			self.recently_created_files
				.retain(|_, instant| instant.elapsed() < HUNDRED_MILLIS);

			self.handle_rename_from_eviction().await
		} else {
			Ok(())
		}
	}
}

impl LinuxEventHandler {
	async fn handle_rename_from_eviction(&mut self) -> Result<(), Vec<LocationWatcherError>> {
		self.rename_from_buffer.clear();

		let mut errors = vec![];
		for (path, instant) in self.rename_from.drain() {
			if instant.elapsed() > HUNDRED_MILLIS {
				if let Err(e) = self
					.events_to_emit_tx
					.send(WatcherEvent {
						location_pub_id: self.location_pub_id,
						kind: EventKind::Delete(path),
					})
					.await
				{
					errors.push(LocationWatcherError::EmitEvent(e.0));
				}
			} else {
				self.rename_from_buffer.push((path, instant));
			}
		}

		for (path, instant) in self.rename_from_buffer.drain(..) {
			self.rename_from.insert(path, instant);
		}

		if errors.is_empty() {
			Ok(())
		} else {
			Err(errors)
		}
	}
}
