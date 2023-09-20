use zeroize::Zeroize;
const STATE_WORDS: usize = 16;

#[cfg(all(any(target_os = "macos", target_os = "ios"), feature = "hw-rng"))]
mod apple;
#[cfg(all(any(target_os = "macos", target_os = "ios"), feature = "hw-rng"))]
pub use apple::CryptoRng;

#[cfg(not(any(feature = "hw-rng", not(any(target_os = "macos", target_os = "ios")))))]
mod chacha20;
#[cfg(not(any(feature = "hw-rng", not(any(target_os = "macos", target_os = "ios")))))]
pub use chacha20::CryptoRng;

impl rand::CryptoRng for CryptoRng {}

impl Default for CryptoRng {
	fn default() -> Self {
		Self::new()
	}
}

impl Drop for CryptoRng {
	#[inline]
	fn drop(&mut self) {
		self.zeroize();
	}
}
