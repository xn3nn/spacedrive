use super::STATE_WORDS;
use rand::RngCore;
use rand_core::block::BlockRngCore;
use security_framework::random::SecRandom;
use zeroize::{Zeroize, Zeroizing};

/// This RNG should be used throughout the entire crate.
///
/// On `Drop`, it re-seeds the inner RNG, erasing the previous state and making all future
/// values unpredictable.
pub struct CryptoRng(Box<SecRandom>);

impl CryptoRng {
	#[inline]
	#[must_use]
	pub fn new() -> Self {
		Self(Box::default())
	}

	/// Used to generate completely random bytes, with the use of Apple's Secure Enclave
	///
	/// Ideally this should be used for small amounts only (as it's stack allocated)
	#[inline]
	#[must_use]
	pub fn generate_fixed<const I: usize>() -> [u8; I] {
		let mut bytes = Zeroizing::new([0u8; I]);
		Self::new().fill_bytes(bytes.as_mut());
		*bytes
	}

	/// Used to generate completely random bytes, with the use of Apple's Secure Enclave
	#[inline]
	#[must_use]
	pub fn generate_vec(size: usize) -> Vec<u8> {
		let mut bytes = Zeroizing::new(vec![0u8; size]);
		Self::new().fill_bytes(bytes.as_mut());
		bytes.to_vec()
	}
}

#[allow(clippy::expect_used)]
impl RngCore for CryptoRng {
	#[inline]
	fn fill_bytes(&mut self, dest: &mut [u8]) {
		self.0.copy_bytes(dest)
			.expect("CRITICAL: ERROR GENERATING CRYPTOGRAPHICALLY-SECURE RANDOM VALUES VIA THE SECURE ENCLAVE");
	}

	#[inline]
	fn next_u32(&mut self) -> u32 {
		let mut b = [0u8; std::mem::size_of::<u32>()];
		self.0.copy_bytes(&mut b)
			.expect("CRITICAL: ERROR GENERATING CRYPTOGRAPHICALLY-SECURE RANDOM VALUES VIA THE SECURE ENCLAVE");
		u32::from_le_bytes(b)
	}

	#[inline]
	fn next_u64(&mut self) -> u64 {
		let mut b = [0u8; std::mem::size_of::<u64>()];
		self.0.copy_bytes(&mut b)
			.expect("CRITICAL: ERROR GENERATING CRYPTOGRAPHICALLY-SECURE RANDOM VALUES VIA THE SECURE ENCLAVE");
		u64::from_le_bytes(b)
	}

	#[inline]
	fn try_fill_bytes(&mut self, dest: &mut [u8]) -> Result<(), rand::Error> {
		self.0.copy_bytes(dest).map_err(rand::Error::new)
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

impl Zeroize for CryptoRng {
	#[inline]
	fn zeroize(&mut self) {
		*self.0 = SecRandom::default();
	}
}
