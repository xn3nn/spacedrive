// TODO(brxken128): change this, as both of these should be available at runtime
#[cfg(all(feature = "keyutils", feature = "secret-service", target_os = "linux"))]
compile_error!(
	"You may not use both the keyutils and secret-service implementation simultaneously"
);

use crate::{hashing::Hasher, Protected, Result};

mod portable;
use portable::PortableKeyring;

#[cfg(not(feature = "keyring"))]
use portable::PortableKeyring as DefaultKeyring;

#[cfg(all(target_os = "linux", feature = "keyring"))]
mod linux_keyutils;
#[cfg(all(target_os = "linux", feature = "keyring"))]
use linux_keyutils::LinuxKeyring as DefaultKeyring;

#[cfg(target_os = "macos")]
pub mod macos;
#[cfg(target_os = "macos")]
pub use macos::MacosKeyring as DefaultKeyring;

#[cfg(target_os = "ios")]
pub mod ios;
#[cfg(target_os = "ios")]
pub use ios::IosKeyring as DefaultKeyring;

pub trait KeyringInterface {
	fn new() -> Result<Self>
	where
		Self: Sized;

	fn get(&self, id: &Identifier) -> Result<Protected<String>>;
	fn remove(&self, id: &Identifier) -> Result<()>;
	fn insert(&self, id: &Identifier, value: Protected<String>) -> Result<()>;
	fn contains_key(&self, id: &Identifier) -> bool;
	fn name(&self) -> KeyringName;
}

pub enum KeyringName {
	Portable,
	Linux,
	MacOS,
	Ios,
}

#[derive(Clone, Copy)]
pub enum KeyringType {
	Default,
	Portable,
}

#[derive(Clone)]
pub struct Identifier {
	id: String,
	usage: String,
	application: String,
}

impl Identifier {
	#[inline]
	#[must_use]
	pub fn new(id: &'static str, usage: &'static str, application: &'static str) -> Self {
		Self {
			id: id.to_string(),
			usage: usage.to_string(),
			application: application.to_string(),
		}
	}

	#[inline]
	#[must_use]
	pub fn hash(&self) -> String {
		format!(
			"{}:{}",
			self.application,
			Hasher::blake3_hex(&[self.id.as_bytes(), self.usage.as_bytes()].concat())
		)
	}
}

pub struct Keyring {
	inner: Box<dyn KeyringInterface + Send + Sync>,
}

impl Keyring {
	pub fn new(backend: KeyringType) -> Result<Self> {
		let kr = match backend {
			KeyringType::Default => Self {
				inner: Box::new(DefaultKeyring::new()?),
			},
			KeyringType::Portable => Self {
				inner: Box::new(PortableKeyring::new()?),
			},
		};

		Ok(kr)
	}

	#[inline]
	pub fn get(&self, id: &Identifier) -> Result<Protected<String>> {
		self.inner.get(id)
	}

	#[inline]
	#[must_use]
	pub fn contains_key(&self, id: &Identifier) -> bool {
		self.inner.contains_key(id)
	}

	#[inline]
	pub fn remove(&self, id: &Identifier) -> Result<()> {
		self.inner.remove(id)
	}

	#[inline]
	pub fn insert(&self, id: &Identifier, value: Protected<String>) -> Result<()> {
		self.inner.insert(id, value)
	}

	#[inline]
	#[must_use]
	pub fn name(&self) -> KeyringName {
		self.inner.name()
	}
}

#[cfg(test)]
mod tests {
	use crate::Protected;

	use super::{Identifier, Keyring, KeyringType};

	#[test]
	fn full_portable() {
		let password = Protected::new("SuperSecurePassword".to_string());
		let identifier = Identifier::new("0000-0000-0000-0000", "Password", "Crypto");
		let keyring = Keyring::new(KeyringType::Portable).unwrap();

		keyring.insert(&identifier, password.clone()).unwrap();
		assert!(keyring.contains_key(&identifier));

		let pw = keyring.get(&identifier).unwrap();

		assert_eq!(pw.expose(), password.expose());

		keyring.remove(&identifier).unwrap();

		assert!(!keyring.contains_key(&identifier));
	}
}
