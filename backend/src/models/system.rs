use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// VyOS system image information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VyOSImage {
    /// Image name (e.g., "1.4.0-epa1")
    pub name: String,

    /// Full image version
    pub version: String,

    /// Whether this is the default boot image
    #[serde(default)]
    pub is_default: bool,

    /// Whether this image is currently running
    #[serde(default)]
    pub is_running: bool,

    /// Image build date
    pub build_date: Option<DateTime<Utc>>,

    /// Image file size in bytes
    pub size: Option<u64>,

    /// Image type (rolling release, LTS, etc.)
    #[serde(rename = "type")]
    pub image_type: Option<String>,

    /// Additional metadata about the image
    #[serde(default)]
    pub metadata: HashMap<String, String>,
}

/// Request to add a new VyOS image
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddImageRequest {
    /// Image URL to download from
    pub url: String,

    /// Optional checksum for verification
    pub checksum: Option<String>,

    /// Checksum algorithm (md5, sha1, sha256)
    pub checksum_algorithm: Option<String>,
}

/// Request to delete a VyOS image
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteImageRequest {
    /// Name of the image to delete
    pub name: String,
}

/// Request to set the default boot image
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetDefaultImageRequest {
    /// Name of the image to set as default
    pub name: String,
}

/// Image management operation type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ImageOperation {
    Add,
    Delete,
    SetDefault,
}

/// Request for image management operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageManagementRequest {
    /// Operation type
    pub operation: ImageOperation,

    /// Image name (for delete/set-default operations)
    pub name: Option<String>,

    /// Image URL (for add operations)
    pub url: Option<String>,

    /// Checksum for image verification
    pub checksum: Option<String>,

    /// Checksum algorithm
    pub checksum_algorithm: Option<String>,
}

/// System information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    /// System hostname
    pub hostname: String,

    /// VyOS version
    pub version: String,

    /// System uptime in seconds
    pub uptime_seconds: u64,

    /// System architecture (e.g., "x86_64")
    pub architecture: String,

    /// Kernel version
    pub kernel_version: String,

    /// Number of CPU cores
    pub cpu_cores: u32,

    /// Total memory in bytes
    pub total_memory: u64,

    /// Available memory in bytes
    pub available_memory: u64,

    /// System load averages (1min, 5min, 15min)
    pub load_average: [f64; 3],

    /// Boot time
    pub boot_time: DateTime<Utc>,

    /// Current time
    pub current_time: DateTime<Utc>,

    /// System model (for hardware appliances)
    pub model: Option<String>,

    /// Serial number
    pub serial_number: Option<String>,
}

/// Request to execute a show command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShowCommandRequest {
    /// The show command to execute (without "show" prefix)
    pub command: String,

    /// Whether to return configuration mode commands
    #[serde(default)]
    pub as_config: bool,
}

/// Result of a system operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationResult {
    /// Whether the operation was successful
    pub success: bool,

    /// Operation message
    pub message: String,

    /// Operation ID for tracking
    pub operation_id: String,

    /// Timestamp when operation started
    pub started_at: DateTime<Utc>,

    /// Timestamp when operation completed (if completed)
    pub completed_at: Option<DateTime<Utc>>,

    /// Estimated time to completion in seconds (for running operations)
    pub eta_seconds: Option<u64>,

    /// Additional data related to the operation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

/// Result of executing a show command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShowCommandResult {
    /// The command that was executed
    pub command: String,

    /// The output of the command
    pub output: String,

    /// Whether the command was successful
    pub success: bool,

    /// Error message if command failed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,

    /// Timestamp when command was executed
    pub executed_at: DateTime<Utc>,
}

/// Configuration reset options
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ResetType {
    /// Reset to factory defaults
    Factory,
    /// Reset to default configuration file
    Default,
    /// Clear current configuration only
    ClearConfig,
}

/// Request to reset configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResetConfigRequest {
    /// Type of reset to perform
    #[serde(rename = "type")]
    pub reset_type: ResetType,

    /// Optional backup name to restore from
    pub backup_name: Option<String>,

    /// Whether to confirm the reset (for safety)
    #[serde(default)]
    pub confirmed: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vyos_image_serialization() {
        let image = VyOSImage {
            name: "1.4.0-epa1".to_string(),
            version: "1.4.0-epa1".to_string(),
            is_default: true,
            is_running: true,
            build_date: None,
            size: None,
            image_type: Some("lts".to_string()),
            metadata: HashMap::new(),
        };

        let json = serde_json::to_string(&image).unwrap();
        assert!(json.contains("1.4.0-epa1"));
        assert!(json.contains("is_default"));
        assert!(json.contains("is_running"));
    }

    #[test]
    fn test_operation_result_creation() {
        let result = OperationResult {
            success: true,
            message: "Operation completed".to_string(),
            operation_id: "op-123".to_string(),
            started_at: Utc::now(),
            completed_at: Some(Utc::now()),
            eta_seconds: None,
            data: None,
        };

        assert!(result.success);
        assert_eq!(result.operation_id, "op-123");
    }

    #[test]
    fn test_show_command_request() {
        let request = ShowCommandRequest {
            command: "interfaces".to_string(),
            as_config: false,
        };

        assert_eq!(request.command, "interfaces");
        assert!(!request.as_config);
    }
}