use crate::hashing::Hasher;
use std::collections::HashMap;

#[derive(Clone)]
pub struct Identifier {
	id: String,
	usage: String,
	application: String,
}

impl Identifier {
	#[inline]
	#[must_use]
	pub fn new(id: &str, usage: &str, application: &str) -> Self {
		Self {
			id: id.to_string(),
			usage: usage.to_string(),
			application: application.to_string(),
		}
	}

	pub fn application(&self) -> String {
		self.application.to_string()
	}

	#[inline]
	#[must_use]
	pub(super) fn hash(&self) -> String {
		format!(
			"{}:{}",
			self.application,
			Hasher::blake3_hex(&[self.id.as_bytes(), self.usage.as_bytes()].concat())
		)
	}

	#[inline]
	#[must_use]
	#[cfg(any(target_os = "ios", target_os = "macos"))]
	pub(super) fn as_apple_account(&self) -> String {
		format!("{} - {}", self.id, self.usage)
	}

	pub(super) fn as_secret_service_attributes(&self) -> HashMap<&str, &str> {
		HashMap::from([(self.id.as_str(), self.usage.as_str())])
	}
}
