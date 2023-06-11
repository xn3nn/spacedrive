use crate::{
	prisma::location,
	library::Library,
};

use super::{LocationManagerError};

pub(super) async fn check_online(
	location: &location::Data,
	library: &Library,
) -> Result<bool, LocationManagerError> {
	let pub_id = Uuid::from_slice(&location.pub_id)?;

	if location.node_id == library.node_local_id {
		match fs::metadata(&location.path).await {
			Ok(_) => {
				library.location_manager().add_online(pub_id).await;
				Ok(true)
			}
			Err(e) if e.kind() == ErrorKind::NotFound => {
				library.location_manager().remove_online(&pub_id).await;
				Ok(false)
			}
			Err(e) => {
				error!("Failed to check if location is online: {:#?}", e);
				Ok(false)
			}
		}
	} else {
		// In this case, we don't have a `local_path`, but this location was marked as online
		library.location_manager().remove_online(&pub_id).await;
		Err(LocationManagerError::NonLocalLocation(location.id))
	}
}

