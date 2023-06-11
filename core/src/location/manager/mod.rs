use crate::library::Library;

use std::collections::BTreeSet;
use std::pin::{pin, Pin};
use std::task::{Context, Poll};
use std::time::Duration;

use futures::{Future, FutureExt};
use futures_concurrency::future::Race;
#[cfg(feature = "location-watcher")]
use sd_location_watcher::{
	EventKind, INodeAndDevice, LocationPubId, LocationWatcher, LocationWatcherError, WatcherEvent,
};
#[cfg(not(feature = "location-watcher"))]
type LocationPubId = Uuid;

use futures::{stream::FuturesUnordered, SinkExt, StreamExt};
use futures_concurrency::stream::Merge;
use thiserror::Error;
use tokio::sync::RwLock;
use tokio::time::{sleep, Sleep};
use tokio_stream::{self as stream, wrappers::ReceiverStream};
use tokio_util::sync::{CancellationToken, DropGuard};
use tracing::{debug, error};

use super::LocationId;

mod helpers;

use helpers::{check_online, get_location};

enum ManagerMessage {
	Add {
		location_id: LocationId,
		library: Library,
	},
}

#[derive(Error, Debug)]
pub enum LocationManagerError {}

pub struct LocationManager {
	online_locations: RwLock<BTreeSet<LocationPubId>>,
	location_management_tx: async_channel::Sender<ManagerMessage>,
	_cancel_loop: DropGuard,
}

impl LocationManager {
	pub fn new() -> Self {
		let cancel_token = CancellationToken::new();
		let (location_management_tx, location_management_rx) = async_channel::bounded(128);

		let inner_cancel_token = cancel_token.child_token();
		tokio::spawn(async move {
			let location_management_rx = location_management_rx;

			loop {
				if let Err(e) = tokio::spawn(management_loop(
					location_management_rx.clone(),
					inner_cancel_token.child_token(),
				))
				.await
				{
					error!("Location manager loop failed: {e}; Restarting...");
				}
				if inner_cancel_token.is_cancelled() {
					break;
				}
			}
		});

		Self {
			online_locations: Default::default(),
			location_management_tx,
			_cancel_loop: cancel_token.drop_guard(),
		}
	}
}

enum StreamMessage {
	Management(ManagerMessage),
	Check {
		location_id: LocationId,
		library: Library,
	},
	Stop,
}

async fn management_loop(
	location_management_rx: async_channel::Receiver<ManagerMessage>,
	cancel: CancellationToken,
) {

	let mut online_checker = FuturesUnordered::<LocationCheck>::new();

	let mut stream = (
		location_management_rx.map(StreamMessage::Management),
		stream::once(cancel.cancelled()).map(|_| StreamMessage::Stop),
		
	)
		.merge();

	loop {
		if let Some(msg) =  (online_checker.next(), stream.next()).race().await {
			match msg {
				
			}
		}
	}

	while let Some(msg) = stream.next().await {
		match msg {
			StreamMessage::Management(msg) => match msg {
				ManagerMessage::Add {
					location_id,
					library,
				} => todo!(),
			},
			StreamMessage::Check {
				location_id,
				library,
			} => {
				online_checker.push(LocationCheck::new(location_id, library));
			}
			StreamMessage::Stop => {
				debug!("Stoped Location Manager event handler",);
				break;
			}
		}
	}
}

struct LocationCheck {
	location_id: LocationId,
	library: Library,
	sleep: Sleep,
}

impl LocationCheck {
	fn new(location_id: LocationId, library: Library) -> Self {
		Self {
			location_id,
			library,
			sleep: sleep(Duration::from_secs(5)),
		}
	}
}

impl Future for LocationCheck {
	type Output = StreamMessage;

	fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
		match pin!(self.sleep).poll(cx) {
			Poll::Ready(_) => Poll::Ready(StreamMessage::Check {
				location_id: self.location_id,
				library: self.library,
			}),
			Poll::Pending => Poll::Pending,
		}
	}
}
