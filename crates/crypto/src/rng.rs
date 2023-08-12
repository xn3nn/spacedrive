use rand::{seq::index, RngCore, SeedableRng};
use rand_chacha::ChaCha20Rng;
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

use crate::{Protected, Result};

/// This RNG should be used throughout the entire crate.
///
/// On `Drop`, it re-seeds the inner RNG, erasing the previous state and making all future
/// values unpredictable.
pub struct CryptoRng(Box<ChaCha20Rng>);

impl RngCore for CryptoRng {
	fn fill_bytes(&mut self, dest: &mut [u8]) {
		self.0.fill_bytes(dest);
	}

	fn next_u32(&mut self) -> u32 {
		self.0.next_u32()
	}

	fn next_u64(&mut self) -> u64 {
		self.0.next_u64()
	}

	fn try_fill_bytes(&mut self, dest: &mut [u8]) -> std::result::Result<(), rand::Error> {
		self.0.try_fill_bytes(dest)
	}
}

impl CryptoRng {
	#[must_use]
	pub fn from_entropy() -> Self {
		Self(Box::new(ChaCha20Rng::from_entropy()))
	}

	/// Used to generate completely random bytes, with the use of `ChaCha20`
	///
	/// Ideally this should be used for small amounts only (as it's stack allocated)
	#[must_use]
	pub fn generate_fixed<const I: usize>() -> [u8; I] {
		let mut bytes = [0u8; I];
		Self::from_entropy().0.fill_bytes(&mut bytes);
		bytes
	}

	/// Used to generate completely random bytes, with the use of `ChaCha20`
	#[must_use]
	pub fn generate_vec(size: usize) -> Vec<u8> {
		let mut bytes = Zeroizing::new(vec![0u8; size]);
		Self::from_entropy().0.fill_bytes(&mut bytes);
		bytes.to_vec()
	}
}

impl Zeroize for CryptoRng {
	fn zeroize(&mut self) {
		*self.0 = ChaCha20Rng::from_entropy();
	}
}

impl Drop for CryptoRng {
	fn drop(&mut self) {
		self.zeroize();
	}
}

pub const WORDS: &str = include_str!("../assets/eff_large_wordlist.txt");

#[derive(Zeroize, ZeroizeOnDrop, Clone)]
pub struct Mnemonic(Vec<String>);

impl Mnemonic {
	fn get_all_words<'a>() -> Vec<&'a str> {
		WORDS.lines().collect()
	}

	pub fn generate_word() -> Result<Mnemonic> {
		// let i = index::sample(&mut CryptoRng::from_entropy(), WORDS.len(), 1);
		// Ok(Mnemonic::get_all_words()[i.index(0)]))
		todo!()
	}
	pub fn generate_mnemonic(length: usize, delimiter: Option<char>) -> Result<Mnemonic> {
		todo!()
	}
}

impl From<String> for Mnemonic {
	todo!()
}

// #[must_use]
// pub fn generate_passphrase(len: usize, delimiter: Option<char>) -> Protected<String> {
// 	let words: Vec<&str> = WORDS.lines().collect();
// 	let mut output = String::new();

// 	let mut rng = CryptoRng::from_entropy();
// 	let indexes = index::sample(&mut rng, words.len(), len);

// 	indexes.iter().for_each(|i| {
// 		output.push_str(words[i]);
// 		if i < len - 1 && len != 1 {
// 			if let Some(delimiter) = delimiter {
// 				output.push(delimiter);
// 			}
// 		}
// 	});

// 	Protected::new(output)
// }

#[cfg(test)]
mod tests {
	use crate::{ct::ConstantTimeEqNull, primitives::SALT_LEN, rng::CryptoRng};

	#[test]
	fn generate_bytes() {
		let bytes = CryptoRng::generate_vec(SALT_LEN);
		let bytes2 = CryptoRng::generate_vec(SALT_LEN);

		assert!(!bool::from(bytes.ct_eq_null()));
		assert_ne!(bytes, bytes2);
		assert_eq!(bytes.len(), SALT_LEN);
		assert_eq!(bytes2.len(), SALT_LEN);
	}

	#[test]
	fn generate_fixed() {
		let bytes: [u8; SALT_LEN] = CryptoRng::generate_fixed();
		let bytes2: [u8; SALT_LEN] = CryptoRng::generate_fixed();

		assert!(!bool::from(bytes.ct_eq_null()));
		assert_ne!(bytes, bytes2);
		assert_eq!(bytes.len(), SALT_LEN);
		assert_eq!(bytes2.len(), SALT_LEN);
	}
}
