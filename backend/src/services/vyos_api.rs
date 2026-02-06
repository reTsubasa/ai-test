//! VyOS API client
//!
//! This module provides a client for communicating with VyOS router's REST API.
//! It implements all VyOS API endpoints including system information, configuration
//! management, and system operations.

use crate::error::AppError;
use chrono::{DateTime, Utc};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

/// VyOS API endpoint base
const VYOS_API_BASE: &str = "/rest/conf";

/// VyOS API client configuration
#[derive(Debug, Clone)]
pub struct VyosApiClientConfig {
    /// API base URL (e.g., "https://10.10.5.51")
    pub base_url: String,
    /// API key for authentication
    pub api_key: String,
    /// Request timeout in seconds
    pub timeout: u64,
    /// Whether to verify SSL certificate
    pub verify_ssl: bool,
}

impl Default for VyosApiClientConfig {
    fn default() -> Self {
        Self {
            base_url: String::from("https://10.10.5.51"),
            api_key: String::new(),
            timeout: 30,
            verify_ssl: true,
        }
    }
}

/// VyOS API client
#[derive(Clone)]
pub struct VyosApiClient {
    config: VyosApiClientConfig,
    client: Client,
}

impl VyosApiClient {
    /// Create a new VyOS API client
    pub fn new(config: VyosApiClientConfig) -> Self {
        let mut client_builder = Client::builder()
            .timeout(Duration::from_secs(config.timeout));

        if !config.verify_ssl {
            client_builder = client_builder.danger_accept_invalid_certs(true);
        }

        let client = client_builder.build().unwrap_or_default();

        Self { config, client }
    }

    /// Create client from environment variables
    pub fn from_env() -> Result<Self, AppError> {
        let base_url = std::env::var("VYOS_API_URL")
            .unwrap_or_else(|_| "https://10.10.5.51".to_string());
        let api_key = std::env::var("VYOS_API_KEY")
            .map_err(|_| AppError::Config("VYOS_API_KEY not set".to_string()))?;
        let timeout = std::env::var("VYOS_API_TIMEOUT")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(30);
        let verify_ssl = std::env::var("VYOS_VERIFY_SSL")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(true);

        Ok(Self::new(VyosApiClientConfig {
            base_url,
            api_key,
            timeout,
            verify_ssl,
        }))
    }

    /// Build the full URL for an endpoint
    fn build_url(&self, endpoint: &str) -> String {
        format!("{}{}{}", self.config.base_url, VYOS_API_BASE, endpoint)
    }

    /// Get HTTP client with authentication headers
    fn get_auth_headers(&self) -> reqwest::header::HeaderMap {
        let mut headers = reqwest::header::HeaderMap::new();
        if !self.config.api_key.is_empty() {
            headers.insert(
                reqwest::header::AUTHORIZATION,
                reqwest::header::HeaderValue::from_str(&format!("Bearer {}", self.config.api_key))
                    .unwrap(),
            );
        }
        headers.insert(
            reqwest::header::CONTENT_TYPE,
            reqwest::header::HeaderValue::from_static("application/json"),
        );
        headers
    }

    // ==================== System Information ====================

    /// Get system information
    /// Endpoint: GET /info
    pub async fn get_system_info(&self) -> Result<SystemInfo, AppError> {
        debug!("Fetching VyOS system info");
        let url = format!("{}/info", self.config.base_url);

        let response = self.client
            .get(&url)
            .headers(self.get_auth_headers())
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to get system info: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let info = response.json::<SystemInfo>().await?;
        info!("Successfully fetched system info");
        Ok(info)
    }

    /// Get system information from unauthenticated endpoint
    /// Endpoint: GET /info (no auth required)
    pub async fn get_public_system_info(&self) -> Result<SystemInfo, AppError> {
        debug!("Fetching VyOS public system info");
        let url = format!("{}/info", self.config.base_url);

        let response = self.client
            .get(&url)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let info = response.json::<SystemInfo>().await?;
        Ok(info)
    }

    // ==================== Configuration Operations ====================

    /// Retrieve configuration
    /// Endpoint: POST /retrieve
    pub async fn retrieve_config(&self, path: Option<String>) -> Result<serde_json::Value, AppError> {
        debug!("Retrieving configuration from VyOS, path: {:?}", path);
        let url = self.build_url("/retrieve");

        let body = if let Some(p) = path {
            serde_json::json!({ "path": p })
        } else {
            serde_json::json!({})
        };

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to retrieve config: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let config = response.json::<serde_json::Value>().await?;
        info!("Successfully retrieved configuration");
        Ok(config)
    }

    /// Set configuration value
    /// Endpoint: POST /configure
    pub async fn configure_set(&self, path: String, value: Option<String>) -> Result<ConfigResponse, AppError> {
        debug!("Setting configuration: {} = {:?}", path, value);
        let url = self.build_url("/configure");

        let mut body = serde_json::json!({
            "op": "set",
            "path": path
        });

        if let Some(v) = value {
            body["value"] = serde_json::json!(v);
        }

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to set config: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ConfigResponse>().await?;
        info!("Successfully set configuration");
        Ok(result)
    }

    /// Delete configuration value
    /// Endpoint: POST /configure
    pub async fn configure_delete(&self, path: String) -> Result<ConfigResponse, AppError> {
        debug!("Deleting configuration: {}", path);
        let url = self.build_url("/configure");

        let body = serde_json::json!({
            "op": "delete",
            "path": path
        });

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to delete config: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ConfigResponse>().await?;
        info!("Successfully deleted configuration");
        Ok(result)
    }

    /// Comment configuration node
    /// Endpoint: POST /configure
    pub async fn configure_comment(&self, path: String, comment: String) -> Result<ConfigResponse, AppError> {
        debug!("Adding comment to configuration: {}", path);
        let url = self.build_url("/configure");

        let body = serde_json::json!({
            "op": "comment",
            "path": path,
            "comment": comment
        });

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to add comment: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ConfigResponse>().await?;
        info!("Successfully added comment");
        Ok(result)
    }

    /// Rename configuration node
    /// Endpoint: POST /configure
    pub async fn configure_rename(&self, path: String, new_name: String) -> Result<ConfigResponse, AppError> {
        debug!("Renaming configuration: {} -> {}", path, new_name);
        let url = self.build_url("/configure");

        let body = serde_json::json!({
            "op": "rename",
            "path": path,
            "new_name": new_name
        });

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to rename: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ConfigResponse>().await?;
        info!("Successfully renamed configuration");
        Ok(result)
    }

    /// Copy configuration node
    /// Endpoint: POST /configure
    pub async fn configure_copy(&self, from: String, to: String) -> Result<ConfigResponse, AppError> {
        debug!("Copying configuration: {} -> {}", from, to);
        let url = self.build_url("/configure");

        let body = serde_json::json!({
            "op": "copy",
            "from": from,
            "to": to
        });

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to copy: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ConfigResponse>().await?;
        info!("Successfully copied configuration");
        Ok(result)
    }

    /// Move configuration node
    /// Endpoint: POST /configure
    pub async fn configure_move(&self, from: String, to: String) -> Result<ConfigResponse, AppError> {
        debug!("Moving configuration: {} -> {}", from, to);
        let url = self.build_url("/configure");

        let body = serde_json::json!({
            "op": "move",
            "from": from,
            "to": to
        });

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to move: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ConfigResponse>().await?;
        info!("Successfully moved configuration");
        Ok(result)
    }

    // ==================== Configuration Generation ====================

    /// Generate/commit configuration
    /// Endpoint: POST /generate
    pub async fn generate_config(&self, comment: Option<String>) -> Result<GenerateResponse, AppError> {
        debug!("Generating configuration with comment: {:?}", comment);
        let url = self.build_url("/generate");

        let mut body = serde_json::json!({});
        if let Some(c) = comment {
            body["comment"] = serde_json::json!(c);
        }

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to generate config: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<GenerateResponse>().await?;
        info!("Successfully generated configuration");
        Ok(result)
    }

    /// Save configuration to startup config
    /// Endpoint: POST /generate
    pub async fn save_config(&self) -> Result<GenerateResponse, AppError> {
        debug!("Saving configuration to startup config");
        let url = self.build_url("/generate");

        let body = serde_json::json!({
            "save": true
        });

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to save config: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<GenerateResponse>().await?;
        info!("Successfully saved configuration");
        Ok(result)
    }

    // ==================== Config File Operations ====================

    /// Load config file
    /// Endpoint: POST /config-file
    pub async fn load_config_file(&self, file_path: String) -> Result<ConfigFileResponse, AppError> {
        debug!("Loading config file: {}", file_path);
        let url = self.build_url("/config-file");

        let body = serde_json::json!({
            "op": "load",
            "file": file_path
        });

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to load config file: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ConfigFileResponse>().await?;
        info!("Successfully loaded config file");
        Ok(result)
    }

    /// Save config to file
    /// Endpoint: POST /config-file
    pub async fn save_config_file(&self, file_path: Option<String>) -> Result<ConfigFileResponse, AppError> {
        debug!("Saving config to file: {:?}", file_path);
        let url = self.build_url("/config-file");

        let mut body = serde_json::json!({
            "op": "save"
        });
        if let Some(path) = file_path {
            body["file"] = serde_json::json!(path);
        }

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to save config file: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ConfigFileResponse>().await?;
        info!("Successfully saved config file");
        Ok(result)
    }

    // ==================== Show Operations ====================

    /// Show operational mode command output
    /// Endpoint: POST /show
    pub async fn show(&self, command: String) -> Result<ShowResponse, AppError> {
        debug!("Executing show command: {}", command);
        let url = self.build_url("/show");

        let body = serde_json::json!({
            "op": "show",
            "data": command
        });

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to execute show: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ShowResponse>().await?;
        info!("Successfully executed show command");
        Ok(result)
    }

    /// Show interface information
    pub async fn show_interface(&self, interface: Option<String>) -> Result<ShowResponse, AppError> {
        let cmd = if let Some(iface) = interface {
            format!("interface {}", iface)
        } else {
            String::from("interface")
        };
        self.show(cmd).await
    }

    /// Show IP routes
    pub async fn show_ip_route(&self) -> Result<ShowResponse, AppError> {
        self.show(String::from("ip route")).await
    }

    /// Show system information
    pub async fn show_system(&self) -> Result<ShowResponse, AppError> {
        self.show(String::from("system")).await
    }

    /// Show firewall information
    pub async fn show_firewall(&self) -> Result<ShowResponse, AppError> {
        self.show(String::from("firewall")).await
    }

    /// Show VPN information
    pub async fn show_vpn(&self) -> Result<ShowResponse, AppError> {
        self.show(String::from("vpn")).await
    }

    // ==================== System Operations ====================

    /// Reset configuration
    /// Endpoint: POST /reset
    pub async fn reset_config(&self) -> Result<ResetResponse, AppError> {
        warn!("Resetting configuration");
        let url = self.build_url("/reset");

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to reset config: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ResetResponse>().await?;
        info!("Successfully reset configuration");
        Ok(result)
    }

    /// Reboot the system
    /// Endpoint: POST /reboot
    pub async fn reboot(&self) -> Result<RebootResponse, AppError> {
        warn!("Initiating system reboot");
        let url = self.build_url("/reboot");

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to reboot: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<RebootResponse>().await?;
        info!("Successfully initiated reboot");
        Ok(result)
    }

    /// Power off the system
    /// Endpoint: POST /poweroff
    pub async fn poweroff(&self) -> Result<PoweroffResponse, AppError> {
        warn!("Initiating system poweroff");
        let url = self.build_url("/poweroff");

        let response = self.client
            .post(&url)
            .headers(self.get_auth_headers())
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to poweroff: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<PoweroffResponse>().await?;
        info!("Successfully initiated poweroff");
        Ok(result)
    }

    // ==================== Image Management ====================

    /// Add new system image
    /// Endpoint: POST /image
    pub async fn image_add(&self, url: String) -> Result<ImageResponse, AppError> {
        debug!("Adding system image from: {}", url);
        let api_url = self.build_url("/image");

        let body = serde_json::json!({
            "op": "add",
            "url": url
        });

        let response = self.client
            .post(&api_url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to add image: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ImageResponse>().await?;
        info!("Successfully added system image");
        Ok(result)
    }

    /// Delete system image
    /// Endpoint: POST /image
    pub async fn image_delete(&self, name: String) -> Result<ImageResponse, AppError> {
        debug!("Deleting system image: {}", name);
        let api_url = self.build_url("/image");

        let body = serde_json::json!({
            "op": "delete",
            "name": name
        });

        let response = self.client
            .post(&api_url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to delete image: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ImageResponse>().await?;
        info!("Successfully deleted system image");
        Ok(result)
    }

    /// Set default boot image
    /// Endpoint: POST /image
    pub async fn image_set_default(&self, name: String) -> Result<ImageResponse, AppError> {
        debug!("Setting default boot image: {}", name);
        let api_url = self.build_url("/image");

        let body = serde_json::json!({
            "op": "default",
            "name": name
        });

        let response = self.client
            .post(&api_url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to set default image: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ImageResponse>().await?;
        info!("Successfully set default image");
        Ok(result)
    }

    /// Rename system image
    /// Endpoint: POST /image
    pub async fn image_rename(&self, old_name: String, new_name: String) -> Result<ImageResponse, AppError> {
        debug!("Renaming system image: {} -> {}", old_name, new_name);
        let api_url = self.build_url("/image");

        let body = serde_json::json!({
            "op": "rename",
            "old_name": old_name,
            "new_name": new_name
        });

        let response = self.client
            .post(&api_url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to rename image: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ImageResponse>().await?;
        info!("Successfully renamed system image");
        Ok(result)
    }

    /// Get list of installed images
    pub async fn image_list(&self) -> Result<ImageListResponse, AppError> {
        debug!("Listing system images");
        let api_url = self.build_url("/image");

        let body = serde_json::json!({
            "op": "list"
        });

        let response = self.client
            .post(&api_url)
            .headers(self.get_auth_headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("Failed to list images: {} - {}", status, text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, text
            )));
        }

        let result = response.json::<ImageListResponse>().await?;
        info!("Successfully listed system images");
        Ok(result)
    }
}

// ==================== Response Types ====================

/// System information from VyOS
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    /// Hostname
    #[serde(default)]
    pub hostname: String,
    /// VyOS version
    #[serde(default)]
    pub version: String,
    /// System architecture
    #[serde(default)]
    pub architecture: String,
    /// Kernel version
    #[serde(default)]
    pub kernel: String,
    /// Uptime in seconds
    #[serde(default)]
    pub uptime: u64,
    /// Last boot time
    #[serde(default)]
    pub boot_time: Option<DateTime<Utc>>,
    /// CPU model
    #[serde(default)]
    pub cpu_model: String,
    /// CPU count
    #[serde(default)]
    pub cpu_count: u32,
    /// Total memory in bytes
    #[serde(default)]
    pub total_memory: u64,
    /// Available memory in bytes
    #[serde(default)]
    pub available_memory: u64,
    /// Build date
    #[serde(default)]
    pub build_date: Option<String>,
    /// Build by
    #[serde(default)]
    pub build_by: Option<String>,
    /// Repository URL
    #[serde(default)]
    pub repository: Option<String>,
}

/// Configuration operation response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigResponse {
    /// Success flag
    pub success: bool,
    /// Response message
    #[serde(default)]
    pub message: String,
    /// Data payload
    pub data: Option<serde_json::Value>,
}

/// Configuration generation response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateResponse {
    /// Success flag
    pub success: bool,
    /// Commit message
    #[serde(default)]
    pub message: String,
    /// Warnings generated during commit
    #[serde(default)]
    pub warnings: Vec<String>,
    /// Configuration hash
    pub hash: Option<String>,
    /// Timestamp of the commit
    pub timestamp: Option<DateTime<Utc>>,
}

/// Configuration file operation response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigFileResponse {
    /// Success flag
    pub success: bool,
    /// Response message
    #[serde(default)]
    pub message: String,
    /// File path
    pub file_path: Option<String>,
}

/// Show command response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShowResponse {
    /// Success flag
    pub success: bool,
    /// Output data
    pub data: serde_json::Value,
    /// Raw text output
    pub output: Option<String>,
}

/// Reset configuration response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResetResponse {
    /// Success flag
    pub success: bool,
    /// Response message
    #[serde(default)]
    pub message: String,
    /// Whether system reboot is required
    #[serde(default)]
    pub requires_reboot: bool,
}

/// Reboot response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RebootResponse {
    /// Success flag
    pub success: bool,
    /// Response message
    #[serde(default)]
    pub message: String,
    /// Estimated time until reboot (seconds)
    pub delay_seconds: Option<u32>,
}

/// Power off response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoweroffResponse {
    /// Success flag
    pub success: bool,
    /// Response message
    #[serde(default)]
    pub message: String,
}

/// Image operation response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageResponse {
    /// Success flag
    pub success: bool,
    /// Response message
    #[serde(default)]
    pub message: String,
    /// Image name
    pub name: Option<String>,
}

/// System image information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemImage {
    /// Image name/version
    pub name: String,
    /// Default boot flag
    pub default: bool,
    /// Installed flag
    pub installed: bool,
    /// System version
    #[serde(default)]
    pub version: String,
    /// Build date
    #[serde(default)]
    pub build_date: Option<String>,
}

/// Image list response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageListResponse {
    /// Success flag
    pub success: bool,
    /// List of images
    pub images: Vec<SystemImage>,
    /// Currently running image
    #[serde(default)]
    pub current_image: String,
}

// ==================== Helper Functions ====================

/// Calculate configuration hash from JSON data
pub fn calculate_config_hash(config: &serde_json::Value) -> String {
    use sha2::{Sha256, Digest};
    let config_str = serde_json::to_string(config).unwrap_or_default();
    let mut hasher = Sha256::new();
    hasher.update(config_str.as_bytes());
    format!("{:x}", hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vyos_api_client_config_default() {
        let config = VyosApiClientConfig::default();
        assert_eq!(config.base_url, "https://10.10.5.51");
        assert_eq!(config.api_key, "");
        assert_eq!(config.timeout, 30);
        assert_eq!(config.verify_ssl, true);
    }

    #[test]
    fn test_build_url() {
        let config = VyosApiClientConfig {
            base_url: "https://10.10.5.51".to_string(),
            api_key: "test".to_string(),
            timeout: 30,
            verify_ssl: true,
        };
        let client = VyosApiClient::new(config);
        assert_eq!(
            client.build_url("/retrieve"),
            "https://10.10.5.51/rest/conf/retrieve"
        );
    }

    #[test]
    fn test_calculate_config_hash() {
        let config = serde_json::json!({"interfaces": {"eth0": {"address": "192.168.1.1/24"}}});
        let hash = calculate_config_hash(&config);
        assert!(!hash.is_empty());
        assert_eq!(hash.len(), 64);
    }

    #[test]
    fn test_system_info_deserialize() {
        let json = r#"{
            "hostname": "vyos",
            "version": "1.4.0",
            "architecture": "x86_64",
            "kernel": "6.1.0",
            "uptime": 3600
        }"#;
        let info: SystemInfo = serde_json::from_str(json).unwrap();
        assert_eq!(info.hostname, "vyos");
        assert_eq!(info.version, "1.4.0");
        assert_eq!(info.uptime, 3600);
    }
}