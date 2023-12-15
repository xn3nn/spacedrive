use std::process::Command;

pub fn get_hardware_model_name() -> Result<String, String> {
	#[cfg(target_os = "macos")]
	{
		let output = Command::new("system_profiler")
			.arg("SPHardwareDataType")
			.output();

		return match output {
			Ok(output) => {
				if output.status.success() {
					let output_str = String::from_utf8_lossy(&output.stdout);
					let lines: Vec<&str> = output_str.split('\n').collect();
					for line in lines {
						if line.to_lowercase().contains("model name") {
							return Ok(line.to_string());
						}
					}
					Err("Model name not found".to_string())
				} else {
					Err(format!(
						"Command executed with a non-zero status. STDERR: {}",
						String::from_utf8_lossy(&output.stderr)
					))
				}
			}
			Err(e) => Err(format!("Failed to execute command: {}", e)),
		};
	}
	#[allow(unreachable_code)]
	Ok("Other".to_string())
}
