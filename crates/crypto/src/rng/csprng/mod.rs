#[cfg(all(any(target_os = "macos", target_os = "ios"), feature = "hw-rng"))]
mod apple;

#[cfg(all(any(target_os = "macos", target_os = "ios"), feature = "hw-rng"))]
pub use apple::CryptoRng;

#[cfg(not(any(feature = "hw-rng", not(any(target_os = "macos", target_os = "ios")))))]
mod chacha20;

#[cfg(not(any(feature = "hw-rng", not(any(target_os = "macos", target_os = "ios")))))]
pub use chacha20::CryptoRng;
