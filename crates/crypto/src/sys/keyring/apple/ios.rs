//! This is Spacedrive's `iOS` keyring integration. It has no strict dependencies.
use crate::{
	sys::keyring::{Identifier, KeyringBackend, KeyringInterface},
	Error, Protected, Result,
};
use security_framework::passwords::{
	delete_generic_password, get_generic_password, set_generic_password,
};

pub struct IosKeyring;

impl KeyringInterface for IosKeyring {
	fn new() -> Result<Self> {
		Ok(Self {})
	}

	fn name(&self) -> KeyringBackend {
		KeyringBackend::Ios
	}

	fn get(&self, id: &Identifier) -> Result<Protected<String>> {
		let key = get_generic_password(&id.application(), &id.as_apple_account())
			.map_err(Error::AppleKeyring)?;

		String::from_utf8(key)
			.map(Protected::new)
			.map_err(|_| Error::Keyring)
	}

	fn contains_key(&self, id: &Identifier) -> bool {
		get_generic_password(&id.application(), &id.as_apple_account()).map_or(false, |_| true)
	}

	fn insert(&self, id: &Identifier, value: Protected<String>) -> Result<()> {
		set_generic_password(
			&id.application(),
			&id.as_apple_account(),
			value.expose().as_bytes(),
		)
		.map_err(Error::AppleKeyring)
	}

	fn remove(&self, id: &Identifier) -> Result<()> {
		delete_generic_password(&id.application(), &id.as_apple_account())
			.map_err(Error::AppleKeyring)
	}
}
