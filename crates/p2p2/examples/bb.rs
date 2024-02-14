use std::{
	convert::Infallible,
	net::{Ipv4Addr, SocketAddr},
	time::Duration,
};

use libp2p::{
	core::muxing::StreamMuxerBox, futures::StreamExt, identity::Keypair, multiaddr::Protocol, ping,
	swarm::dial_opts::DialOpts, Multiaddr, SwarmBuilder, Transport,
};

#[tokio::main]
async fn main() {
	// std::env::set_var("RUST_LOG", "trace");
	tracing_subscriber::fmt::init();

	let k = Keypair::generate_ed25519();
	println!("{:?}", k.public().to_peer_id());
	let mut swarm = ok(ok(SwarmBuilder::with_existing_identity(k)
		.with_tokio()
		.with_other_transport(|keypair| {
			libp2p_quic::GenTransport::<libp2p_quic::tokio::Provider>::new(
				libp2p_quic::Config::new(keypair),
			)
			.map(|(p, c), _| (p, StreamMuxerBox::new(c)))
			.boxed()
		}))
	.with_behaviour(|_| ping::Behaviour::default()))
	.with_swarm_config(|cfg| cfg.with_idle_connection_timeout(Duration::from_secs(u64::MAX)))
	.build();

	swarm
		.listen_on(socketaddr_to_quic_multiaddr(&SocketAddr::from((
			Ipv4Addr::LOCALHOST,
			8076,
		))))
		.unwrap();

	let mut sleep = Box::pin(tokio::time::sleep(tokio::time::Duration::from_secs(1)));
	loop {
		tokio::select! {
			event = swarm.select_next_some() => {
				println!("{event:?}");
			}
			_ = &mut sleep => {
				sleep = Box::pin(tokio::time::sleep(tokio::time::Duration::from_secs(10000000)));
				println!("DIAL");
				let result = swarm.dial(DialOpts::unknown_peer_id().address(socketaddr_to_quic_multiaddr(&SocketAddr::from((
					Ipv4Addr::LOCALHOST,
					8079, // 8075
				)))).build());
				println!("{:?}", result);
			}
		}
	}
}

fn ok<T>(v: Result<T, Infallible>) -> T {
	match v {
		Ok(v) => v,
		Err(_) => unreachable!(),
	}
}

#[must_use]
pub(crate) fn socketaddr_to_quic_multiaddr(m: &SocketAddr) -> Multiaddr {
	let mut addr = Multiaddr::empty();
	match m {
		SocketAddr::V4(ip) => addr.push(Protocol::Ip4(*ip.ip())),
		SocketAddr::V6(ip) => addr.push(Protocol::Ip6(*ip.ip())),
	}
	addr.push(Protocol::Udp(m.port()));
	addr.push(Protocol::QuicV1);
	addr
}
