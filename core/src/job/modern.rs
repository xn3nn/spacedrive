//! A rethought approach to the job system to try and solve some of it's issues.

use async_stream::stream;
use async_trait::async_trait;
use futures::Stream;
use serde::{de::DeserializeOwned, Deserialize, Serialize};

use std::{collections::VecDeque, hash::Hash, pin::Pin};

use super::{JobError, JobResult, StatefulJob, WorkerContext};

// TODO: Using https://github.com/dtolnay/typetag for typesafe job data on the frontend?

/// TODO
pub enum JobUpdate {
	Error(JobError),
	Complete(JobResult),
}

/// TODO
// TODO: Probs now remove async_trait?
#[async_trait::async_trait]
pub trait ModernJob: Serialize + DeserializeOwned + Hash + Send + Sync + Sized {
	/// The name of the job is a unique human readable identifier for the job.
	const NAME: &'static str;
	/// Should the job be hidden from the user?
	const IS_BACKGROUND: bool = false;

	// TODO: Cancelation, Progress reports to the UI

	/// TODO
	async fn run(&self, ctx: &mut WorkerContext) -> Pin<Box<dyn Stream<Item = JobUpdate> + '_>>;
}

#[derive(Serialize, Deserialize)]
pub enum ModernJobCompatState {
	Init,
	Step(usize),
	Complete,
}

#[derive(Serialize, Deserialize)]
pub struct ModernJobCompat<Job: StatefulJob> {
	pub state: ModernJobCompatState,
	pub init: Job::Init,
	pub data: Option<Job::Data>,
	pub steps: VecDeque<Job::Step>,
	pub step_number: usize,
}

impl<Job: StatefulJob> Hash for ModernJobCompat<Job> {
	fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
		// self.state.hash(state);
		// self.init.hash(state);
		// self.data.hash(state);
		// self.steps.hash(state);
		// self.step_number.hash(state);
		todo!();
	}
}

#[async_trait]
impl<Job: StatefulJob> ModernJob for ModernJobCompat<Job> {
	const NAME: &'static str = Job::NAME;
	const IS_BACKGROUND: bool = Job::IS_BACKGROUND;

	// TODO: Cancelation, Progress reports to the UI

	/// TODO
	async fn run(&self, ctx: &mut WorkerContext) -> Pin<Box<dyn Stream<Item = JobUpdate> + '_>> {
		Box::pin(stream! {
			match self.state {
				ModernJobCompatState::Init => {
					todo!();
				}
				ModernJobCompatState::Step(step) => {
					todo!();
				}
				ModernJobCompatState::Complete => {
					// todo!();

					yield JobUpdate::Complete(JobResult::Ok(None));
				}
			}
		})
	}
}
