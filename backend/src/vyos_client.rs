//! VyOS API Client Module
//!
//! This module provides a client for interacting with VyOS REST API endpoints.
//! It handles HTTP requests, authentication, and certificate verification.

use crate::error::AppError;
use chrono::{DateTime, Utc};
use reqwest::Client;
use reqwest::Certificate;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

/// VyOS API client configuration
#[derive(Debug, Clone)]
pub struct VyOSClientConfig {
    /// Base URL for the VyOS API (e.g., "https://10.10.5.51")
    pub base_url: String,
    /// API key for authentication
    pub api_key: String,
    /// Port number (default 8443 for HTTPS, 80 for HTTP)
    pub port: u16,
    /// Whether to use HTTPS
    pub use_https: bool,
    /// Whether to verify SSL certificates (useful for self-signed certs)
    pub verify_ssl: bool,
    /// Timeout for API requests in seconds
    pub timeout_secs: u64,
}

impl VyOSClientConfig {
    /// Create a new VyOS client configuration
    pub fn new(
        host: String,
        api_key: String,
        port: u16,
        use_https: bool,
        verify_ssl: bool,
        timeout_secs: u64,
    ) -> Self {
        Self {
            base_url: host,
            api_key,
            port,
            use_https,
            verify_ssl,
            timeout_secs,
        }
    }

    /// Build the full API URL for a given endpoint
    pub fn build_url(&self, endpoint: &str) -> String {
        let scheme = if self.use_https { "https" } else { "http" };
        let port = if self.port == 0 {
            // Default ports
            if self.use_https { 8443 } else { 80 }
        } else {
            self.port
        };
        format!("{}://{}:{}/{}", scheme, self.base_url.trim_end_matches('/'), port, endpoint)
    }
}

/// VyOS API client
#[derive(Debug, Clone)]
pub struct VyOSClient {
    config: VyOSClientConfig,
    client: Client,
}

impl VyOSClient {
    /// Create a new VyOS API client
    pub fn new(config: VyOSClientConfig) -> Result<Self, AppError> {
        let mut client_builder = Client::builder()
            .timeout(Duration::from_secs(config.timeout_secs))
            .connect_timeout(Duration::from_secs(10))
            .pool_idle_timeout(Duration::from_secs(90));

        // Disable SSL verification if configured
        if !config.verify_ssl {
            warn!("SSL certificate verification is disabled for {}", config.base_url);
            let dangerous = client_builder.danger_accept_invalid_certs(true);
            client_builder = dangerous;
        }

        let client = client_builder
            .build()
            .map_err(|e| AppError::HttpClient(format!("Failed to create HTTP client: {}", e)))?;

        Ok(Self { config, client })
    }

    /// Get the client configuration
    pub fn config(&self) -> &VyOSClientConfig {
        &self.config
    }

    /// Execute an HTTP GET request
    async fn get(&self, endpoint: &str) -> Result<serde_json::Value, AppError> {
        let url = self.config.build_url(endpoint);
        debug!("GET request to: {}", url);

        let start = std::time::Instant::now();
        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| AppError::HttpClient(format!("GET request failed: {}", e)))?;

        let latency_ms = start.elapsed().as_millis() as u64;
        debug!("Request latency: {}ms", latency_ms);

        self.handle_response(response).await
    }

    /// Execute an HTTP POST request
    async fn post(&self, endpoint: &str, body: Option<serde_json::Value>) -> Result<serde_json::Value, AppError> {
        let url = self.config.build_url(endpoint);
        debug!("POST request to: {}", url);

        let start = std::time::Instant::now();
        let mut request_builder = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json");

        if let Some(body) = body {
            request_builder = request_builder.json(&body);
        }

        let response = request_builder
            .send()
            .await
            .map_err(|e| AppError::HttpClient(format!("POST request failed: {}", e)))?;

        let latency_ms = start.elapsed().as_millis() as u64;
        debug!("Request latency: {}ms", latency_ms);

        self.handle_response(response).await
    }

    /// Execute an HTTP PUT request
    async fn put(&self, endpoint: &str, body: Option<serde_json::Value>) -> Result<serde_json::Value, AppError> {
        let url = self.config.build_url(endpoint);
        debug!("PUT request to: {}", url);

        let start = std::time::Instant::now();
        let mut request_builder = self.client
            .put(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json");

        if let Some(body) = body {
            request_builder = request_builder.json(&body);
        }

        let response = request_builder
            .send()
            .await
            .map_err(|e| AppError::HttpClient(format!("PUT request failed: {}", e)))?;

        let latency_ms = start.elapsed().as_millis() as u64;
        debug!("Request latency: {}ms", latency_ms);

        self.handle_response(response).await
    }

    /// Execute an HTTP DELETE request
    async fn delete(&self, endpoint: &str) -> Result<serde_json::Value, AppError> {
        let url = self.config.build_url(endpoint);
        debug!("DELETE request to: {}", url);

        let start = std::time::Instant::now();
        let response = self.client
            .delete(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .send()
            .await
            .map_err(|e| AppError::HttpClient(format!("DELETE request failed: {}", e)))?;

        let latency_ms = start.elapsed().as_millis() as u64;
        debug!("Request latency: {}ms", latency_ms);

        self.handle_response(response).await
    }

    /// Handle HTTP response
    async fn handle_response(&self, response: reqwest::Response) -> Result<serde_json::Value, AppError> {
        let status = response.status();
        let body_text = response
            .text()
            .await
            .map_err(|e| AppError::HttpClient(format!("Failed to read response body: {}", e)))?;

        debug!("Response status: {}, body length: {}", status, body_text.len());

        if !status.is_success() {
            error!("API request failed: {} - {}", status, body_text);
            return Err(AppError::ExternalApi(format!(
                "VyOS API error: {} - {}",
                status, body_text
            )));
        }

        serde_json::from_str(&body_text)
            .map_err(|e| AppError::Internal(format!("Failed to parse JSON response: {}", e)))
    }

    // ========================================================================
    // VyOS API Endpoints
    // ========================================================================

    /// GET /info - Get VyOS system information
    ///
    /// Returns information about the VyOS system including version, hostname, etc.
    pub async fn get_info(&self) -> Result<VyOSInfo, AppError> {
        info!("Getting VyOS system information");

        let response = self.get("info").await?;

        Ok(VyOSInfo {
            hostname: response.get("hostname")
                .and_then(|v| v.as_str())
                .unwrap_or("vyos")
                .to_string(),
            version: response.get("version")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string(),
            uptime_seconds: response.get("uptime")
                .and_then(|v| v.as_u64())
                .unwrap_or(0),
            boot_time: response.get("boot_time")
                .and_then(|v| v.as_str())
                .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
                .map(|dt| dt.with_timezone(&Utc)),
            architecture: response.get("architecture")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string(),
            kernel_version: response.get("kernel_version")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string(),
        })
    }

    /// POST /retrieve - Retrieve configuration data
    ///
    /// Retrieves configuration from the VyOS system.
    pub async fn retrieve_config(&self, path: Option<String>) -> Result<serde_json::Value, AppError> {
        info!("Retrieving configuration: path={:?}", path);

        let body = path.map(|p| serde_json::json!({ "path": p }));
        self.post("retrieve", body).await
    }

    /// POST /show - Execute show commands
    ///
    /// Executes a show command on the VyOS system.
    pub async fn show(&self, command: &str) -> Result<VyOSShowResult, AppError> {
        info!("Executing show command: {}", command);

        let body = serde_json::json!({ "command": command });
        let response = self.post("show", Some(body)).await?;

        Ok(VyOSShowResult {
            success: response.get("success")
                .and_then(|v| v.as_bool())
                .unwrap_or(false),
            output: response.get("output")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            error: response.get("error")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            data: response.get("data").cloned(),
        })
    }

    /// POST /configure - Set configuration
    ///
    /// Sets configuration on the VyOS system.
    pub async fn configure(&self, path: String, value: serde_json::Value) -> Result<serde_json::Value, AppError> {
        info!("Setting configuration: path={}", path);

        let body = serde_json::json!({
            "path": path,
            "value": value
        });
        self.post("configure", Some(body)).await
    }

    /// POST /delete - Delete configuration
    ///
    /// Deletes configuration from the VyOS system.
    pub async fn delete_config(&self, path: String) -> Result<serde_json::Value, AppError> {
        info!("Deleting configuration: path={}", path);

        let body = serde_json::json!({ "path": path });
        self.post("delete", Some(body)).await
    }

    /// POST /generate - Generate configuration
    ///
    /// Generates and applies configuration on the VyOS system.
    pub async fn generate_config(&self) -> Result<serde_json::Value, AppError> {
        info!("Generating configuration");

        self.post("generate", None).await
    }

    /// POST /commit - Commit configuration changes
    ///
    /// Commits the current configuration changes.
    pub async fn commit_config(&self) -> Result<serde_json::Value, AppError> {
        info!("Committing configuration");

        self.post("commit", None).await
    }

    /// POST /discard - Discard uncommitted configuration changes
    ///
    /// Discards any uncommitted configuration changes.
    pub async fn discard_config(&self) -> Result<serde_json::Value, AppError> {
        info!("Discarding configuration changes");

        self.post("discard", None).await
    }

    /// GET /interfaces - Get network interfaces
    ///
    /// Retrieves information about network interfaces.
    pub async fn get_interfaces(&self) -> Result<Vec<VyOSInterface>, AppError> {
        info!("Getting network interfaces");

        let response = self.get("interfaces").await?;

        if let Some(interfaces) = response.get("interfaces").and_then(|v| v.as_array()) {
            interfaces
                .iter()
                .map(|v| serde_json::from_value(v.clone())
                    .map_err(|e| AppError::Internal(format!("Failed to parse interface: {}", e))))
                .collect()
        } else {
            Ok(vec![])
        }
    }

    /// POST /reboot - Reboot the system
    ///
    /// Initiates a system reboot.
    pub async fn reboot(&self) -> Result<serde_json::Value, AppError> {
        info!("Initiating system reboot");

        self.post("reboot", None).await
    }

    /// POST /poweroff - Power off the system
    ///
    /// Initiates system power off.
    pub async fn poweroff(&self) -> Result<serde_json::Value, AppError> {
        info!("Initiating system poweroff");

        self.post("poweroff", None).await
    }

    /// Test connection to the VyOS API
    ///
    /// Returns latency and basic system information to verify connectivity.
    pub async fn test_connection(&self) -> Result<VyOSConnectionTest, AppError> {
        info!("Testing connection to VyOS API");

        let start = std::time::Instant::now();
        match self.get_info().await {
            Ok(info) => {
                let latency_ms = start.elapsed().as_millis() as u64;
                info!("Connection test successful: latency={}ms, version={}", latency_ms, info.version);

                Ok(VyOSConnectionTest {
                    success: true,
                    latency_ms: Some(latency_ms),
                    version: Some(info.version.clone()),
                    hostname: Some(info.hostname),
                    uptime: Some(info.uptime_seconds),
                    error: None,
                })
            }
            Err(e) => {
                let latency_ms = start.elapsed().as_millis() as u64;
                error!("Connection test failed: {}", e);
                Ok(VyOSConnectionTest {
                    success: false,
                    latency_ms: Some(latency_ms),
                    version: None,
                    hostname: None,
                    uptime: None,
                    error: Some(e.to_string()),
                })
            }
        }
    }

    /// Get system image information
    ///
    /// Retrieves information about installed VyOS images.
    pub async fn get_images(&self) -> Result<Vec<VyOSImage>, AppError> {
        info!("Getting VyOS images");

        let response = self.get("images").await?;

        if let Some(images) = response.get("images").and_then(|v| v.as_array()) {
            images
                .iter()
                .map(|v| serde_json::from_value(v.clone())
                    .map_err(|e| AppError::Internal(format!("Failed to parse image: {}", e))))
                .collect()
        } else {
            Ok(vec![])
        }
    }
}

// ========================================================================
// VyOS API Response Types
// ========================================================================

/// VyOS system information response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VyOSInfo {
    pub hostname: String,
    pub version: String,
    pub uptime_seconds: u64,
    pub boot_time: Option<DateTime<Utc>>,
    pub architecture: String,
    pub kernel_version: String,
}

/// VyOS show command result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VyOSShowResult {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub data: Option<serde_json::Value>,
}

/// VyOS network interface information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VyOSInterface {
    pub name: String,
    pub description: Option<String>,
    pub address: Option<String>,
    pub netmask: Option<String>,
    pub mac_address: Option<String>,
    pub is_up: bool,
    pub mtu: Option<u32>,
    pub speed: Option<String>,
    pub duplex: Option<String>,
}

/// VyOS image information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VyOSImage {
    pub name: String,
    pub version: String,
    pub is_default: bool,
    pub is_running: bool,
    pub build_date: Option<DateTime<Utc>>,
    pub size: Option<u64>,
    pub image_type: Option<String>,
}

/// VyOS connection test result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VyOSConnectionTest {
    pub success: bool,
    pub latency_ms: Option<u64>,
    pub version: Option<String>,
    pub hostname: Option<String>,
    pub uptime: Option<u64>,
    pub error: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vyos_client_config_build_url() {
        let config = VyOSClientConfig {
            base_url: "10.10.5.51".to_string(),
            api_key: "test-key".to_string(),
            port: 8443,
            use_https: true,
            verify_ssl: false,
            timeout_secs: 30,
        };

        assert_eq!(
            config.build_url("info"),
            "https://10.10.5.51:8443/info"
        );

        assert_eq!(
            config.build_url("retrieve"),
            "https://10.10.5.51:8443/retrieve"
        );
    }

    #[test]
    fn test_vyos_client_config_build_url_http() {
        let config = VyOSClientConfig {
            base_url: "192.168.1.1".to_string(),
            api_key: "test-key".to_string(),
            port: 80,
            use_https: false,
            verify_ssl: false,
            timeout_secs: 30,
        };

        assert_eq!(
            config.build_url("info"),
            "http://192.168.1.1:80/info"
        );
    }

    #[test]
    fn test_vyos_info_serialization() {
        let info = VyOSInfo {
            hostname: "vyos-router".to_string(),
            version: "1.4.0-epa1".to_string(),
            uptime_seconds: 3600,
            boot_time: None,
            architecture: "x86_64".to_string(),
            kernel_version: "5.15.0-amd64".to_string(),
        };

        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("vyos-router"));
        assert!(json.contains("1.4.0-epa1"));

        let deserialized: VyOSInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.hostname, "vyos-router");
    }

    #[test]
    fn test_vyos_connection_test() {
        let test = VyOSConnectionTest {
            success: true,
            latency_ms: Some(50),
            version: Some("1.4.0-epa1".to_string()),
            hostname: Some("vyos-router".to_string()),
            uptime: Some(3600),
            error: None,
        };

        let json = serde_json::to_string(&test).unwrap();
        assert!(json.contains("\"success\":true"));
        assert!(json.contains("\"latency_ms\":50"));

        let deserialized: VyOSConnectionTest = serde_json::from_str(&json).unwrap();
        assert!(deserialized.success);
        assert_eq!(deserialized.latency_ms, Some(50));
    }
}