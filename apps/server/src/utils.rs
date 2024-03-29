use std::sync::Arc;

use sd_core::Node;
use tokio::signal;

/// `shutdown_signal` will inform axum to gracefully shutdown when the process is asked to shutdown.
pub async fn axum_shutdown_signal(node: Arc<Node>) {
	let ctrl_c = async {
		signal::ctrl_c()
			.await
			.expect("failed to install Ctrl+C handler");
	};

	#[cfg(unix)]
	let terminate = async {
		signal::unix::signal(signal::unix::SignalKind::terminate())
			.expect("failed to install signal handler")
			.recv()
			.await;
	};

	#[cfg(not(unix))]
	let terminate = std::future::pending::<()>();

	tokio::select! {
		() = ctrl_c => {},
		() = terminate => {},
	}

	println!("signal received, starting graceful shutdown");
	node.shutdown().await;
}
