//! On MacOS, we use the FSEvents backend of notify-rs and Rename events are pretty complicated;
//! There are just (ModifyKind::Name(RenameMode::Any) events and nothing else.
//! This means that we have to link the old path with the new path to know which file was renamed.
//! But you can't forget that renames events aren't always the case that I file name was modified,
//! but its path was modified. So we have to check if the file was moved. When a file is moved
//! inside the same location, we received 2 events: one for the old path and one for the new path.
//! But when a file is moved to another location, we only receive the old path event... This
//! way we have to handle like a file deletion, and the same applies for when a file is moved to our
//! current location from anywhere else, we just receive the new path rename event, which means a
//! creation.

use std::{
	collections::{BTreeMap, HashMap},
	path::PathBuf,
};

use async_trait::async_trait;
use notify::Event;
use tokio::{
	sync::{mpsc, oneshot},
	time::Instant,
};

use super::{
	EventHandler, INodeAndDevice, InstantAndPath, LocationPubId, LocationWatcherError, WatcherEvent,
};

pub(super) struct MacOsEventHandler {
	location_pub_id: LocationPubId,
	inode_and_device_tx: mpsc::Sender<(LocationPubId, PathBuf, oneshot::Sender<INodeAndDevice>)>,
	events_to_emit_tx: mpsc::Sender<WatcherEvent>,
	recently_created_files: BTreeMap<PathBuf, Instant>,
	last_check_created_files: Instant,
	latest_created_dir: Option<PathBuf>,
	last_check_rename: Instant,
	old_paths_map: HashMap<INodeAndDevice, InstantAndPath>,
	new_paths_map: HashMap<INodeAndDevice, InstantAndPath>,
	paths_map_buffer: Vec<(INodeAndDevice, InstantAndPath)>,
}

#[async_trait]
impl EventHandler for MacOsEventHandler {
	fn new(
		location_pub_id: LocationPubId,
		inode_and_device_tx: mpsc::Sender<(
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
			inode_and_device_tx,
			events_to_emit_tx,
			recently_created_files: BTreeMap::new(),
			last_check_created_files: Instant::now(),
			latest_created_dir: None,
			last_check_rename: Instant::now(),
			old_paths_map: HashMap::new(),
			new_paths_map: HashMap::new(),
			paths_map_buffer: Vec::new(),
		}
	}

	async fn handle_event(&mut self, event: Event) -> Result<(), LocationWatcherError> {
		todo!()
	}

	async fn tick(&mut self) {
		todo!()
	}
}
