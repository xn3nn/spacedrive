use std::{fmt::Display, path::PathBuf};

use async_trait::async_trait;
use notify::Event as NotifyEvent;
use tokio::sync::{mpsc, oneshot};

use super::{INodeAndDevice, LocationPubId, LocationWatcherError};

#[derive(Debug)]
pub struct WatcherEvent {
	pub location_pub_id: LocationPubId,
	pub kind: EventKind,
}

impl Display for WatcherEvent {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		write!(
			f,
			"WatcherEvent {{ location_pub_id: {}, kind: {} }}",
			self.location_pub_id, self.kind
		)
	}
}

#[derive(Debug)]
pub enum EventKind {
	Create(PathBuf),
	Update(PathBuf),
	Rename { from: PathBuf, to: PathBuf },
	Delete(PathBuf),
}

impl Display for EventKind {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		match self {
			EventKind::Create(path) => write!(f, "Create({})", path.display()),
			EventKind::Update(path) => write!(f, "Update({})", path.display()),
			EventKind::Rename { from, to } => {
				write!(f, "Rename({} -> {})", from.display(), to.display())
			}
			EventKind::Delete(path) => write!(f, "Delete({})", path.display()),
		}
	}
}

/// A trait to abstract away how each OS emits file system events
#[async_trait]
pub(super) trait EventHandler {
	fn new(
		location_pub_id: LocationPubId,
		inode_and_device_requester_tx: mpsc::Sender<(
			LocationPubId,
			PathBuf,
			oneshot::Sender<INodeAndDevice>,
		)>,
		events_to_emit_tx: mpsc::Sender<WatcherEvent>,
	) -> Self
	where
		Self: Sized;

	/// Handle a file system event.
	async fn handle_event(&mut self, event: NotifyEvent) -> Result<(), LocationWatcherError>;

	/// As Event Handlers have some inner state, from time to time we need to call this tick method
	/// so the event handler can update its state.
	async fn tick(&mut self) -> Result<(), Vec<LocationWatcherError>>;
}
