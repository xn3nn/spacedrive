/******************************************************************************
* Some annotations on how file system events are emitted on each OS			  *
*******************************************************************************
*	Events dispatched on Linux:												  *
*		Create File:														  *
*			1) EventKind::Create(CreateKind::File)							  *
*			2) EventKind::Modify(ModifyKind::Metadata(MetadataKind::Any))	  *
*				or EventKind::Modify(ModifyKind::Data(DataChange::Any))		  *
*			3) EventKind::Access(AccessKind::Close(AccessMode::Write)))		  *
*		Create Directory:													  *
*			1) EventKind::Create(CreateKind::Folder)						  *
*		Update File:														  *
*			1) EventKind::Modify(ModifyKind::Data(DataChange::Any))			  *
*			2) EventKind::Access(AccessKind::Close(AccessMode::Write)))		  *
*		Update File (rename):												  *
*			1) EventKind::Modify(ModifyKind::Name(RenameMode::From))		  *
*			2) EventKind::Modify(ModifyKind::Name(RenameMode::To))			  *
*			3) EventKind::Modify(ModifyKind::Name(RenameMode::Both))		  *
*		Update Directory (rename):											  *
*			1) EventKind::Modify(ModifyKind::Name(RenameMode::From))		  *
*			2) EventKind::Modify(ModifyKind::Name(RenameMode::To))			  *
*			3) EventKind::Modify(ModifyKind::Name(RenameMode::Both))		  *
*		Delete File:														  *
*			1) EventKind::Remove(RemoveKind::File)							  *
*		Delete Directory:													  *
*			1) EventKind::Remove(RemoveKind::Folder)						  *
*																			  *
*	Events dispatched on MacOS:												  *
*		Create File:														  *
*			1) EventKind::Create(CreateKind::File)							  *
*			2) EventKind::Modify(ModifyKind::Data(DataChange::Content))		  *
*		Create Directory:													  *
*			1) EventKind::Create(CreateKind::Folder)						  *
*		Update File:														  *
*			1) EventKind::Modify(ModifyKind::Data(DataChange::Content))		  *
*		Update File (rename):												  *
*			1) EventKind::Modify(ModifyKind::Name(RenameMode::Any)) -- From	  *
*			2) EventKind::Modify(ModifyKind::Name(RenameMode::Any))	-- To	  *
*		Update Directory (rename):											  *
*			1) EventKind::Modify(ModifyKind::Name(RenameMode::Any)) -- From	  *
*			2) EventKind::Modify(ModifyKind::Name(RenameMode::Any))	-- To	  *
*		Delete File:														  *
*			1) EventKind::Remove(RemoveKind::File)							  *
*		Delete Directory:													  *
*			1) EventKind::Remove(RemoveKind::Folder)						  *
*																			  *
*	Events dispatched on Windows:											  *
*		Create File:														  *
*			1) EventKind::Create(CreateKind::Any)							  *
*			2) EventKind::Modify(ModifyKind::Any)							  *
*		Create Directory:													  *
*			1) EventKind::Create(CreateKind::Any)							  *
*		Update File:														  *
*			1) EventKind::Modify(ModifyKind::Any)							  *
*		Update File (rename):												  *
*			1) EventKind::Modify(ModifyKind::Name(RenameMode::From))		  *
*			2) EventKind::Modify(ModifyKind::Name(RenameMode::To))			  *
*		Update Directory (rename):											  *
*			1) EventKind::Modify(ModifyKind::Name(RenameMode::From))		  *
*			2) EventKind::Modify(ModifyKind::Name(RenameMode::To))			  *
*		Delete File:														  *
*			1) EventKind::Remove(RemoveKind::Any)							  *
*		Delete Directory:													  *
*			1) EventKind::Remove(RemoveKind::Any)							  *
*																			  *
*	Events dispatched on Android:											  *
*	TODO																	  *
*																			  *
*	Events dispatched on iOS:												  *
*	TODO																	  *
*																			  *
******************************************************************************/

use std::{
	fmt::Display,
	path::{Path, PathBuf},
	time::Duration,
};

use async_trait::async_trait;
use futures_concurrency::{future::Join, stream::Merge};
use notify::{Config, Event as NotifyEvent, RecommendedWatcher, RecursiveMode, Watcher};
use thiserror::Error;
use tokio::{
	sync::{mpsc, oneshot},
	time::{interval_at, Instant, MissedTickBehavior},
};
use tokio_stream::{
	self as stream,
	wrappers::{IntervalStream, UnboundedReceiverStream},
	StreamExt,
};
use tokio_util::sync::{CancellationToken, DropGuard};
use tracing::{debug, error, trace, warn};
use uuid::Uuid;

mod linux;
mod macos;
mod windows;

#[cfg(target_os = "linux")]
type Handler = linux::LinuxEventHandler;

#[cfg(target_os = "macos")]
type Handler = macos::MacOsEventHandler;

#[cfg(target_os = "windows")]
type Handler = windows::WindowsEventHandler;

pub type INodeAndDevice = (u64, u64);

type InstantAndPath = (Instant, PathBuf);

const ONE_SECOND: Duration = Duration::from_secs(1);
const HUNDRED_MILLIS: Duration = Duration::from_millis(100);

pub type LocationPubId = Uuid;

#[derive(Debug)]
pub struct WatcherEvent {
	pub location_pub_id: LocationPubId,
	pub kind: EventKind,
}

#[derive(Debug)]
pub enum EventKind {
	Create(PathBuf),
	Rename { from: PathBuf, to: PathBuf },
	Delete(PathBuf),
}

/// A trait to abstract away how each OS emits file system events
#[async_trait]
trait EventHandler {
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
	async fn tick(&mut self);
}

#[derive(Error, Debug)]
pub enum LocationWatcherError {
	#[error("Notify Error: {0}")]
	Notify(#[from] notify::Error),
}

#[derive(Debug)]
pub struct LocationWatcher {
	location_pub_id: LocationPubId,
	location_path: PathBuf,
	watcher: RecommendedWatcher,
	is_watching: bool,
	_cancel_loop: DropGuard,
}

impl Display for LocationWatcher {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		write!(
			f,
			"LocationWatcher <pub_id='{}', path='{}'> ({})",
			self.location_pub_id,
			self.location_path.display(),
			if self.is_watching {
				"watching"
			} else {
				"not watching"
			}
		)
	}
}

impl LocationWatcher {
	pub fn new(
		location_pub_id: LocationPubId,
		location_path: impl AsRef<Path>,
		check_paths_rejection_tx: mpsc::Sender<(LocationPubId, PathBuf, oneshot::Sender<bool>)>,
		inode_and_device_requester_tx: mpsc::Sender<(
			LocationPubId,
			PathBuf,
			oneshot::Sender<INodeAndDevice>,
		)>,
		check_location_online_tx: mpsc::Sender<(LocationPubId, oneshot::Sender<bool>)>,
		event_to_emit_tx: mpsc::Sender<WatcherEvent>,
	) -> Result<Self, LocationWatcherError> {
		let (fs_events_tx, fs_events_rx) = mpsc::unbounded_channel();
		let cancel_token = CancellationToken::new();

		let watcher = RecommendedWatcher::new(
			move |result| {
				if !fs_events_tx.is_closed() {
					if fs_events_tx.send(result).is_err() {
						error!(
					"Unable to send watcher event to location manager for location: <id='{}'>",
					location_pub_id
				);
					}
				} else {
					error!(
						"Tried to send location file system events to a closed channel: <id='{}'",
						location_pub_id
					);
				}
			},
			Config::default(),
		)?;

		tokio::spawn(watch_events_loop(
			location_pub_id,
			InnerWatchingLoopChannels {
				check_paths_rejection_tx,
				inode_and_device_requester_tx,
				check_location_online_tx,
				fs_events_rx,
				event_to_emit_tx,
			},
			cancel_token.child_token(),
		));

		Ok(Self {
			location_pub_id,
			location_path: location_path.as_ref().to_path_buf(),
			watcher,
			is_watching: false,
			_cancel_loop: cancel_token.drop_guard(),
		})
	}

	pub fn watch(&mut self) {
		if !self.is_watching {
			if let Err(e) = self
				.watcher
				.watch(&self.location_path, RecursiveMode::Recursive)
			{
				error!("Unable to watch location: {self}; Error: {e})");
			} else {
				self.is_watching = true;
				debug!("Now watching location: {self}");
			}
		} else {
			warn!("Tried to watch a location already being watched: {self}");
		}
	}

	pub fn unwatch(&mut self) {
		if self.is_watching {
			if let Err(e) = self.watcher.unwatch(&self.location_path) {
				/**************************************** TODO: ****************************************
				 * According to an unit test, this error may occur when a subdirectory is removed	   *
				 * and we try to unwatch the parent directory then we have to check the implications   *
				 * of unwatch error for this case.   												   *
				 **************************************************************************************/
				error!("Unable to unwatch location: {self}; Error: {e})");
			} else {
				debug!("Stop watching location: {self}");
			}
		} else {
			warn!("Tried to unwatch a location that wasn't being watched: {self}");
		}
	}

	pub fn location_path(&self) -> &Path {
		&self.location_path
	}

	pub fn update_location(&mut self, new_location_path: impl AsRef<Path>, to_watch: bool) {
		let new_location_path = new_location_path.as_ref();
		// Checking if we really received a new path
		if self.location_path != new_location_path {
			self.unwatch();
			self.location_path = new_location_path.to_path_buf();
			if to_watch {
				self.watch();
			}
		} else {
			// If we didn't, we just watch or unwatch according inner state
			match (to_watch, self.is_watching) {
				(true, false) => self.watch(),
				(false, true) => self.unwatch(),
				_ => {}
			}
		}
	}
}

async fn reject_event(
	location_pub_id: LocationPubId,
	event: &NotifyEvent,
	check_paths_rejection_tx: &mpsc::Sender<(LocationPubId, PathBuf, oneshot::Sender<bool>)>,
) -> bool {
	event.paths
		.iter()
		.cloned()
		.map(|path| {
			async {
				let (tx, rx) = oneshot::channel();
				check_paths_rejection_tx.send((location_pub_id, path, tx))
					.await
					.expect("Unable to send check path request to location manager: application in inconsistent state");

				rx.await
					.expect("Unable to receive check path response from location manager: application in inconsistent state")
			}
		})
		.collect::<Vec<_>>()
		.join()
		.await
		.iter()
		.all(|is_rejected| *is_rejected)
}

struct InnerWatchingLoopChannels {
	check_paths_rejection_tx: mpsc::Sender<(LocationPubId, PathBuf, oneshot::Sender<bool>)>,
	inode_and_device_requester_tx:
		mpsc::Sender<(LocationPubId, PathBuf, oneshot::Sender<INodeAndDevice>)>,
	check_location_online_tx: mpsc::Sender<(LocationPubId, oneshot::Sender<bool>)>,
	fs_events_rx: mpsc::UnboundedReceiver<notify::Result<NotifyEvent>>,
	event_to_emit_tx: mpsc::Sender<WatcherEvent>,
}

async fn watch_events_loop(
	location_pub_id: LocationPubId,
	InnerWatchingLoopChannels {
		check_paths_rejection_tx: check_paths_tx,
		inode_and_device_requester_tx,
		check_location_online_tx,
		fs_events_rx,
		event_to_emit_tx,
	}: InnerWatchingLoopChannels,
	cancel: CancellationToken,
) {
	let mut event_handler = Handler::new(
		location_pub_id,
		inode_and_device_requester_tx,
		event_to_emit_tx,
	);

	let mut handler_ticker = interval_at(Instant::now() + HUNDRED_MILLIS, HUNDRED_MILLIS);
	// In case of doubt check: https://docs.rs/tokio/latest/tokio/time/enum.MissedTickBehavior.html
	handler_ticker.set_missed_tick_behavior(MissedTickBehavior::Delay);

	enum StreamMessage {
		MaybeEvent(notify::Result<NotifyEvent>),
		Tick,
		Stop,
	}

	let mut stream = (
		UnboundedReceiverStream::new(fs_events_rx).map(StreamMessage::MaybeEvent),
		IntervalStream::new(handler_ticker).map(|_| StreamMessage::Tick),
		stream::once(cancel.cancelled()).map(|_| StreamMessage::Stop),
	)
		.merge();

	while let Some(msg) = stream.next().await {
		match msg {
			StreamMessage::MaybeEvent(Ok(event)) => {
				if let Err(e) = handle_event(
					location_pub_id,
					event,
					&mut event_handler,
					&check_paths_tx,
					&check_location_online_tx,
				)
				.await
				{
					error!("Failed to handle location file system event: <pub_id='{location_pub_id}'>; Error: {e}");
				}
			}
			StreamMessage::MaybeEvent(Err(e)) => error!("Watcher error: {e}"),
			StreamMessage::Tick => event_handler.tick().await,
			StreamMessage::Stop => {
				debug!(
					"Stop Location Manager event handler for location: <pub_id='{}'>",
					location_pub_id
				);
				break;
			}
		}
	}
}

async fn handle_event(
	location_pub_id: LocationPubId,
	event: NotifyEvent,
	event_handler: &mut impl EventHandler,
	check_paths_tx: &mpsc::Sender<(LocationPubId, PathBuf, oneshot::Sender<bool>)>,
	check_location_online_tx: &mpsc::Sender<(LocationPubId, oneshot::Sender<bool>)>,
) -> Result<(), LocationWatcherError> {
	if reject_event(location_pub_id, &event, check_paths_tx).await {
		trace!("Rejected event: {event:#?}");
		return Ok(());
	}

	let (tx, rx) = oneshot::channel();
	check_location_online_tx
		.send((location_pub_id, tx))
		.await
		.expect("closed check location online channel, application in inconsistent state");

	let online = if let Ok(online) = rx.await {
		online
	} else {
		error!("Check location online response channel was dropped, marking location <pub_id='{location_pub_id}'> as offline");
		false
	};

	if !online {
		warn!("Tried to handle event for offline location: <pub_id='{location_pub_id}'>");
		return Ok(());
	}

	event_handler.handle_event(event).await
}
