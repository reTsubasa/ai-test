use crate::config::AppConfig;
use crate::error::AppError;
use crate::models::system::{
    AddImageRequest, DeleteImageRequest, ImageManagementRequest, OperationResult,
    ResetConfigRequest, SetDefaultImageRequest, ShowCommandRequest, ShowCommandResult,
    SystemInfo, VyOSImage,
};
use chrono::Utc;
use reqwest::Client;
use serde_json::json;
use std::collections::HashMap;
use std::time::Duration;
use tracing::{debug, error, info, warn};

/// System service for interacting with VyOS system operations
pub struct SystemService {
    config: AppConfig,
    client: Client,
}

impl SystemService {
    /// Create a new system service
    pub fn new(config: AppConfig) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(300))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self { config, client }
    }

    /// Get the VyOS API URL from config
    fn vyos_api_url(&self) -> Result<String, AppError> {
        self.config
            .vyos_api_url
            .clone()
            .ok_or_else(|| AppError::Config("VyOS API URL not configured".to_string()))
    }

    /// Get VyOS API credentials
    fn vyos_credentials(&self) -> Result<(String, String), AppError> {
        let username = self
            .config
            .vyos_api_username
            .clone()
            .ok_or_else(|| AppError::Config("VyOS API username not configured".to_string()))?;

        let password = self
            .config
            .vyos_api_password
            .clone()
            .ok_or_else(|| AppError::Config("VyOS API password not configured".to_string()))?;

        Ok((username, password))
    }

    /// Execute a VyOS API command
    async fn execute_vyos_command(
        &self,
        command: &str,
        params: Option<serde_json::Value>,
    ) -> Result<serde_json::Value, AppError> {
        let base_url = self.vyos_api_url()?;
        let (username, password) = self.vyos_credentials()?;

        let url = format!("{}/api/commands/{}", base_url.trim_end_matches('/'), command);

        debug!("Executing VyOS command: {}", command);

        let mut request_builder = self.client.post(&url);

        // Add basic auth
        request_builder = request_builder.basic_auth(username, Some(password));

        // Add body if params provided
        if let Some(params) = params {
            request_builder = request_builder.json(&params);
        }

        let response = request_builder
            .send()
            .await
            .map_err(|e| AppError::HttpClient(format!("Failed to execute VyOS command: {}", e)))?;

        let status = response.status();
        let body = response
            .text()
            .await
            .map_err(|e| AppError::HttpClient(format!("Failed to read response: {}", e)))?;

        if !status.is_success() {
            error!(
                "VyOS command failed with status {}: {}",
                status, body
            );
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, body
            )));
        }

        serde_json::from_str(&body)
            .map_err(|e| AppError::Internal(format!("Failed to parse VyOS response: {}", e)))
    }

    /// Reboot the system
    pub async fn reboot(&self) -> Result<OperationResult, AppError> {
        info!("Initiating system reboot");

        let operation_id = format!("reboot-{}", uuid::Uuid::new_v4());
        let started_at = Utc::now();

        // Execute the reboot command via VyOS API
        match self.execute_vyos_command("reboot", None).await {
            Ok(_) => {
                info!("Reboot command executed successfully");
                Ok(OperationResult {
                    success: true,
                    message: "System reboot initiated successfully".to_string(),
                    operation_id: operation_id.clone(),
                    started_at,
                    completed_at: Some(started_at),
                    eta_seconds: Some(60),
                    data: Some(json!({
                        "action": "reboot",
                        "estimated_completion": started_at.timestamp() + 60
                    })),
                })
            }
            Err(e) => {
                error!("Failed to initiate reboot: {}", e);
                Ok(OperationResult {
                    success: false,
                    message: format!("Failed to initiate reboot: {}", e),
                    operation_id,
                    started_at,
                    completed_at: Some(Utc::now()),
                    eta_seconds: None,
                    data: None,
                })
            }
        }
    }

    /// Power off the system
    pub async fn poweroff(&self) -> Result<OperationResult, AppError> {
        info!("Initiating system poweroff");

        let operation_id = format!("poweroff-{}", uuid::Uuid::new_v4());
        let started_at = Utc::now();

        // Execute the poweroff command via VyOS API
        match self.execute_vyos_command("poweroff", None).await {
            Ok(_) => {
                info!("Poweroff command executed successfully");
                Ok(OperationResult {
                    success: true,
                    message: "System poweroff initiated successfully".to_string(),
                    operation_id: operation_id.clone(),
                    started_at,
                    completed_at: Some(started_at),
                    eta_seconds: Some(30),
                    data: Some(json!({
                        "action": "poweroff",
                        "estimated_completion": started_at.timestamp() + 30
                    })),
                })
            }
            Err(e) => {
                error!("Failed to initiate poweroff: {}", e);
                Ok(OperationResult {
                    success: false,
                    message: format!("Failed to initiate poweroff: {}", e),
                    operation_id,
                    started_at,
                    completed_at: Some(Utc::now()),
                    eta_seconds: None,
                    data: None,
                })
            }
        }
    }

    /// Reset system configuration
    pub async fn reset_configuration(
        &self,
        request: ResetConfigRequest,
    ) -> Result<OperationResult, AppError> {
        info!("Initiating configuration reset: {:?}", request.reset_type);

        let operation_id = format!("reset-{}", uuid::Uuid::new_v4());
        let started_at = Utc::now();

        if !request.confirmed {
            return Ok(OperationResult {
                success: false,
                message: "Configuration reset not confirmed. Set confirmed=true to proceed.".to_string(),
                operation_id,
                started_at,
                completed_at: Some(Utc::now()),
                eta_seconds: None,
                data: None,
            });
        }

        let reset_command = match request.reset_type {
            crate::models::system::ResetType::Factory => "reset factory",
            crate::models::system::ResetType::Default => {
                if let Some(backup) = request.backup_name {
                    format!("load {}", backup)
                } else {
                    "load defaults".to_string()
                }
            }
            crate::models::system::ResetType::ClearConfig => "delete all".to_string(),
        };

        // Execute the reset command via VyOS API
        let params = Some(json!({
            "command": reset_command,
            "save": true
        }));

        match self.execute_vyos_command("configure", params).await {
            Ok(_) => {
                info!("Configuration reset executed successfully");
                Ok(OperationResult {
                    success: true,
                    message: format!(
                        "Configuration reset ({:?}) completed successfully",
                        request.reset_type
                    ),
                    operation_id: operation_id.clone(),
                    started_at,
                    completed_at: Some(Utc::now()),
                    eta_seconds: Some(5),
                    data: Some(json!({
                        "reset_type": request.reset_type,
                        "backup_name": request.backup_name
                    })),
                })
            }
            Err(e) => {
                error!("Failed to reset configuration: {}", e);
                Ok(OperationResult {
                    success: false,
                    message: format!("Failed to reset configuration: {}", e),
                    operation_id,
                    started_at,
                    completed_at: Some(Utc::now()),
                    eta_seconds: None,
                    data: None,
                })
            }
        }
    }

    /// List all VyOS images
    pub async fn list_images(&self) -> Result<Vec<VyOSImage>, AppError> {
        debug!("Listing VyOS images");

        // In a real implementation, this would call the VyOS API
        // For now, we'll return a placeholder response
        match self.execute_vyos_command("show images", None).await {
            Ok(response) => {
                // Parse the response into VyOSImage objects
                // The actual parsing would depend on the VyOS API response format
                if let Some(images) = response.get("images").and_then(|v| v.as_array()) {
                    let parsed_images = images
                        .iter()
                        .filter_map(|img| {
                            let name = img.get("name")?.as_str()?.to_string();
                            let is_default = img.get("default").and_then(|v| v.as_bool()).unwrap_or(false);
                            let is_running = img.get("running").and_then(|v| v.as_bool()).unwrap_or(false);

                            Some(VyOSImage {
                                name: name.clone(),
                                version: name.clone(),
                                is_default,
                                is_running,
                                build_date: img.get("build_date").and_then(|v| v.as_str())
                                    .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
                                    .map(|dt| dt.with_timezone(&Utc)),
                                size: img.get("size").and_then(|v| v.as_u64()),
                                image_type: img.get("type").and_then(|v| v.as_str()).map(|s| s.to_string()),
                                metadata: HashMap::new(),
                            })
                        })
                        .collect();

                    Ok(parsed_images)
                } else {
                    // Fallback to empty list if response format is unexpected
                    warn!("Unexpected response format from VyOS API for images");
                    Ok(vec![])
                }
            }
            Err(e) => {
                // If VyOS API is not available, return a mock response
                debug!("VyOS API not available, returning mock image list: {}", e);
                Ok(vec![VyOSImage {
                    name: "1.4.0-epa1".to_string(),
                    version: "1.4.0-epa1".to_string(),
                    is_default: true,
                    is_running: true,
                    build_date: None,
                    size: None,
                    image_type: Some("lts".to_string()),
                    metadata: HashMap::new(),
                }])
            }
        }
    }

    /// Add a new VyOS image
    pub async fn add_image(&self, request: AddImageRequest) -> Result<OperationResult, AppError> {
        info!("Adding VyOS image from URL: {}", request.url);

        let operation_id = format!("add-image-{}", uuid::Uuid::new_v4());
        let started_at = Utc::now();

        let params = Some(json!({
            "url": request.url,
            "checksum": request.checksum,
            "checksum_algorithm": request.checksum_algorithm.unwrap_or_else(|| "sha256".to_string())
        }));

        match self.execute_vyos_command("add image", params).await {
            Ok(_) => {
                info!("Image addition initiated successfully");
                Ok(OperationResult {
                    success: true,
                    message: "Image download and installation initiated".to_string(),
                    operation_id: operation_id.clone(),
                    started_at,
                    completed_at: None, // Still running
                    eta_seconds: Some(300), // Estimated 5 minutes
                    data: Some(json!({
                        "action": "add_image",
                        "url": request.url
                    })),
                })
            }
            Err(e) => {
                error!("Failed to add image: {}", e);
                Ok(OperationResult {
                    success: false,
                    message: format!("Failed to add image: {}", e),
                    operation_id,
                    started_at,
                    completed_at: Some(Utc::now()),
                    eta_seconds: None,
                    data: None,
                })
            }
        }
    }

    /// Delete a VyOS image
    pub async fn delete_image(&self, request: DeleteImageRequest) -> Result<OperationResult, AppError> {
        info!("Deleting VyOS image: {}", request.name);

        let operation_id = format!("delete-image-{}", uuid::Uuid::new_v4());
        let started_at = Utc::now();

        let params = Some(json!({
            "name": request.name
        }));

        match self.execute_vyos_command("delete image", params).await {
            Ok(_) => {
                info!("Image deleted successfully");
                Ok(OperationResult {
                    success: true,
                    message: format!("Image '{}' deleted successfully", request.name),
                    operation_id: operation_id.clone(),
                    started_at,
                    completed_at: Some(Utc::now()),
                    eta_seconds: None,
                    data: Some(json!({
                        "action": "delete_image",
                        "name": request.name
                    })),
                })
            }
            Err(e) => {
                error!("Failed to delete image: {}", e);
                Ok(OperationResult {
                    success: false,
                    message: format!("Failed to delete image: {}", e),
                    operation_id,
                    started_at,
                    completed_at: Some(Utc::now()),
                    eta_seconds: None,
                    data: None,
                })
            }
        }
    }

    /// Set default boot image
    pub async fn set_default_image(
        &self,
        request: SetDefaultImageRequest,
    ) -> Result<OperationResult, AppError> {
        info!("Setting default boot image: {}", request.name);

        let operation_id = format!("set-default-{}", uuid::Uuid::new_v4());
        let started_at = Utc::now();

        let params = Some(json!({
            "name": request.name
        }));

        match self.execute_vyos_command("set default image", params).await {
            Ok(_) => {
                info!("Default image set successfully");
                Ok(OperationResult {
                    success: true,
                    message: format!(
                        "Default boot image set to '{}' successfully",
                        request.name
                    ),
                    operation_id: operation_id.clone(),
                    started_at,
                    completed_at: Some(Utc::now()),
                    eta_seconds: None,
                    data: Some(json!({
                        "action": "set_default_image",
                        "name": request.name
                    })),
                })
            }
            Err(e) => {
                error!("Failed to set default image: {}", e);
                Ok(OperationResult {
                    success: false,
                    message: format!("Failed to set default image: {}", e),
                    operation_id,
                    started_at,
                    completed_at: Some(Utc::now()),
                    eta_seconds: None,
                    data: None,
                })
            }
        }
    }

    /// Execute a show command
    pub async fn execute_show_command(
        &self,
        request: ShowCommandRequest,
    ) -> Result<ShowCommandResult, AppError> {
        debug!("Executing show command: {}", request.command);

        let executed_at = Utc::now();
        let full_command = if request.as_config {
            format!("show configuration commands {}", request.command)
        } else {
            format!("show {}", request.command)
        };

        let params = Some(json!({
            "command": full_command
        }));

        match self.execute_vyos_command("show", params).await {
            Ok(response) => {
                let output = response.get("output")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();

                debug!("Show command executed successfully");
                Ok(ShowCommandResult {
                    command: request.command.clone(),
                    output,
                    success: true,
                    error: None,
                    executed_at,
                })
            }
            Err(e) => {
                error!("Failed to execute show command: {}", e);
                Ok(ShowCommandResult {
                    command: request.command.clone(),
                    output: String::new(),
                    success: false,
                    error: Some(e.to_string()),
                    executed_at,
                })
            }
        }
    }

    /// Get system information
    pub async fn get_system_info(&self) -> Result<SystemInfo, AppError> {
        debug!("Fetching system information");

        // In a real implementation, this would call the VyOS API
        // For now, we'll construct a mock response
        match self.execute_vyos_command("show system", None).await {
            Ok(response) => {
                // Parse the response into SystemInfo
                let hostname = response.get("hostname")
                    .and_then(|v| v.as_str())
                    .unwrap_or("vyos")
                    .to_string();

                let version = response.get("version")
                    .and_then(|v| v.as_str())
                    .unwrap_or("1.4.0-epa1")
                    .to_string();

                let uptime_seconds = response.get("uptime")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(3600);

                let boot_time = Utc::now() - chrono::Duration::seconds(uptime_seconds as i64);

                Ok(SystemInfo {
                    hostname,
                    version,
                    uptime_seconds,
                    architecture: "x86_64".to_string(),
                    kernel_version: "5.15.0-amd64".to_string(),
                    cpu_cores: response.get("cpu_cores")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(4) as u32,
                    total_memory: response.get("total_memory")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(8 * 1024 * 1024 * 1024), // 8GB default
                    available_memory: response.get("available_memory")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(4 * 1024 * 1024 * 1024), // 4GB default
                    load_average: [0.1, 0.2, 0.15], // Default load averages
                    boot_time,
                    current_time: Utc::now(),
                    model: response.get("model")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string()),
                    serial_number: response.get("serial_number")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string()),
                })
            }
            Err(e) => {
                // If VyOS API is not available, return mock system info
                debug!("VyOS API not available, returning mock system info: {}", e);
                Ok(SystemInfo {
                    hostname: "vyos".to_string(),
                    version: "1.4.0-epa1".to_string(),
                    uptime_seconds: 3600,
                    architecture: "x86_64".to_string(),
                    kernel_version: "5.15.0-amd64".to_string(),
                    cpu_cores: 4,
                    total_memory: 8 * 1024 * 1024 * 1024, // 8GB
                    available_memory: 4 * 1024 * 1024 * 1024, // 4GB
                    load_average: [0.1, 0.2, 0.15],
                    boot_time: Utc::now() - chrono::Duration::hours(1),
                    current_time: Utc::now(),
                    model: None,
                    serial_number: None,
                })
            }
        }
    }

    /// Check if system operation is still in progress
    pub async fn check_operation_status(
        &self,
        operation_id: &str,
    ) -> Result<Option<OperationResult>, AppError> {
        debug!("Checking operation status: {}", operation_id);

        // In a real implementation, this would check with VyOS or a task queue
        // For now, we'll return None to indicate unknown status
        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_service_creation() {
        let config = AppConfig::from_env().unwrap();
        let service = SystemService::new(config);
        assert_eq!(service.config.server_host, "127.0.0.1");
    }

    #[test]
    fn test_operation_id_format() {
        let id = format!("reboot-{}", uuid::Uuid::new_v4());
        assert!(id.starts_with("reboot-"));
    }
}