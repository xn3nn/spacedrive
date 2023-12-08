use std::path::PathBuf;

use sd_core::{library::LibraryName, Env, Node};

#[tokio::main]
async fn main() {
	let (node, _router) = Node::new(
		"./sdserver_data2",
		Env {
			api_url: "".into(),
			client_id: "".into(),
		},
	)
	.await
	.unwrap();

	if node.libraries.get_all().await.len() == 0 {
		node.libraries
			.create(LibraryName::new("test-library").unwrap(), None, &node)
			.await
			.unwrap();
	}

	let libraries = node.libraries.get_all().await;
	let library = libraries.first().unwrap();

	for i in 0..30 {
		let now = std::time::Instant::now();
		let mut _paths = sd_core::location::non_indexed::walk(
			PathBuf::from("/Users/oscar/sd-stuff/test-location"),
			false,
			node.clone(),
			library.clone(),
		)
		.await
		.unwrap();
		println!("walk took {i} - {:?}", now.elapsed());
	}
}
