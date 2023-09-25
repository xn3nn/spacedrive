use criterion::{criterion_group, criterion_main, BatchSize, BenchmarkId, Criterion};
use rand_core::RngCore;
use sd_crypto::{
	hashing::Hasher,
	rng::CryptoRng,
	types::{HashingAlgorithm, Params, Salt, SecretKey},
	Protected,
};
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicUsize, Ordering::Relaxed};

struct Counter;

static ALLOCATED: AtomicUsize = AtomicUsize::new(0);

unsafe impl GlobalAlloc for Counter {
	unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
		let ret = System.alloc(layout);
		if !ret.is_null() {
			ALLOCATED.fetch_add(layout.size(), Relaxed);
		}
		ret
	}

	unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
		System.dealloc(ptr, layout);
		ALLOCATED.fetch_sub(layout.size(), Relaxed);
	}
}

#[global_allocator]
static A: Counter = Counter;

const PARAMS: [Params; 3] = [Params::Standard, Params::Hardened, Params::Paranoid];

fn bench(c: &mut Criterion) {
	let mut group = c.benchmark_group("blake3-balloon");
	group.sample_size(10);

	let mut rng = CryptoRng::from_entropy();

	for param in PARAMS {
		let password = CryptoRng::generate_fixed<16>().into();
		let salt = Salt::generate();
		let hashing_algorithm = HashingAlgorithm::Blake3Balloon(param);

		group.bench_function(
			BenchmarkId::new("hash", hashing_algorithm.get_parameters().0),
			|b| {
				b.iter_batched(
					|| (password.clone(), salt),
					|(password, salt)| {
						Hasher::hash_password(hashing_algorithm, &password, salt, &SecretKey::Null)
					},
					BatchSize::LargeInput,
				)
			},
		);
	}

	group.finish();

	panic!("{:?}", ALLOCATED.as_ptr().clone() as usize);
}

criterion_group!(
	name = benches;
	config = Criterion::default();
	targets = bench
);

criterion_main!(benches);
