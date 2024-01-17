#![cfg(feature = "bincode")]
use std::marker::PhantomData;

use crate::{
	crypto::{Decryptor, Encryptor},
	encoding::{decode, encode},
	hashing::Hasher,
	primitives::ENCRYPTED_TYPE_CONTEXT,
	types::{Aad, Algorithm, Key, Nonce, Salt},
	Result,
};

#[derive(Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
#[cfg_attr(feature = "bincode", derive(bincode::Encode, bincode::Decode))]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct Encrypted<T> {
	data: Vec<u8>,
	algorithm: Algorithm,
	nonce: Nonce,
	salt: Salt,
	#[cfg_attr(feature = "specta", specta(skip))]
	_type: PhantomData<T>,
}

impl<T> Encrypted<T>
where
	T: bincode::Encode + bincode::Decode,
{
	#[allow(clippy::needless_pass_by_value)]
	pub fn new(key: &Key, item: &T, algorithm: Algorithm) -> Result<Self> {
		let salt = Salt::generate();
		let nonce = Nonce::generate(algorithm);

		let bytes = Encryptor::encrypt_tiny(
			&Hasher::derive_key(key, salt, ENCRYPTED_TYPE_CONTEXT),
			&nonce,
			algorithm,
			&encode(item)?,
			Aad::Null,
		)?;

		Ok(Self {
			data: bytes,
			algorithm,
			salt,
			nonce,
			_type: PhantomData,
		})
	}

	pub fn decrypt(self, key: &Key) -> Result<T> {
		let bytes = Decryptor::decrypt_bytes(
			&Hasher::derive_key(key, self.salt, ENCRYPTED_TYPE_CONTEXT),
			&self.nonce,
			self.algorithm,
			&self.data,
			Aad::Null,
		)?
		.into_inner();

		decode(&bytes)
	}
}
