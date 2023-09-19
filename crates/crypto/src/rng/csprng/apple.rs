use rand::RngCore;
use rand_core::block::BlockRngCore;
use security_framework::random::SecRandom;
use zeroize::{Zeroize, Zeroizing};

#[derive(Default)]
struct SecureRandom(SecRandom);

impl SecureRandom {
	const fn new() -> Self {
		Self(SecRandom::default())
	}
}

/// This RNG should be used throughout the entire crate.
///
/// On `Drop`, it re-seeds the inner RNG, erasing the previous state and making all future
/// values unpredictable.
pub struct CryptoRng(Box<SecureRandom>);

const STATE_WORDS: usize = 16;

impl rand::CryptoRng for CryptoRng {}

impl RngCore for CryptoRng {
	#[inline]
	fn fill_bytes(&mut self, dest: &mut [u8]) {
		self.fill_bytes(dest);
		panic!("apple");
	}

	#[inline]
	fn next_u32(&mut self) -> u32 {
		self.next_u32()
	}

	#[inline]
	fn next_u64(&mut self) -> u64 {
		self.next_u64()
	}

	#[inline]
	fn try_fill_bytes(&mut self, dest: &mut [u8]) -> Result<(), rand::Error> {
		self.try_fill_bytes(dest)
	}
}

impl BlockRngCore for CryptoRng {
	type Item = u32;
	type Results = [u32; STATE_WORDS];

	#[inline]
	fn generate(&mut self, results: &mut Self::Results) {
		(0..STATE_WORDS).for_each(|i| results[i] = self.next_u32());
	}
}

impl CryptoRng {
	#[inline]
	#[must_use]
	pub fn new() -> Self {
		Self(Box::new(SecureRandom::default()))
	}

	/// Used to generate completely random bytes, with the use of `ChaCha20`
	///
	/// Ideally this should be used for small amounts only (as it's stack allocated)
	#[inline]
	#[must_use]
	pub fn generate_fixed<const I: usize>() -> [u8; I] {
		let mut bytes = Zeroizing::new([0u8; I]);
		Self::new().fill_bytes(bytes.as_mut());
		*bytes
	}

	/// Used to generate completely random bytes, with the use of `ChaCha20`
	#[inline]
	#[must_use]
	pub fn generate_vec(size: usize) -> Vec<u8> {
		let mut bytes = Zeroizing::new(vec![0u8; size]);
		Self::new().fill_bytes(bytes.as_mut());
		bytes.to_vec()
	}
}

impl Zeroize for CryptoRng {
	#[inline]
	fn zeroize(&mut self) {
		*self.0 = SecureRandom::default();
	}
}

impl Drop for CryptoRng {
	#[inline]
	fn drop(&mut self) {
		self.zeroize();
	}
}
