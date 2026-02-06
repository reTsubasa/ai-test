use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// Configuration node representing a tree structure for VyOS configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigNode {
    pub id: Uuid,
    pub path: String,
    pub name: String,
    pub value: Option<String>,
    pub node_type: ConfigNodeType,
    pub description: Option<String>,
    pub children: Vec<ConfigNode>,
    pub metadata: ConfigMetadata,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Configuration node type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConfigNodeType {
    /// Leaf node with a value
    Leaf,
    /// Node with children (container)
    Container,
    /// Tag node that can have multiple instances
    Tag,
    /// List node
    List,
}

/// Configuration metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigMetadata {
    pub is_readonly: bool,
    pub is_required: bool,
    pub default_value: Option<String>,
    pub validation: Option<ValidationRule>,
    pub help_text: Option<String>,
}

/// Validation rule for configuration values
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ValidationRule {
    /// String validation
    String {
        min_length: Option<usize>,
        max_length: Option<usize>,
        pattern: Option<String>,
    },
    /// Integer validation
    Integer {
        min: Option<i64>,
        max: Option<i64>,
    },
    /// IP address validation
    IpAddress,
    /// CIDR validation
    Cidr,
    /// MAC address validation
    MacAddress,
    /// Port validation
    Port,
    /// Boolean validation
    Boolean,
    /// Enumeration validation
    Enum {
        values: Vec<String>,
    },
}

/// Configuration history entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigHistory {
    pub id: Uuid,
    pub config_snapshot: ConfigSnapshot,
    pub change_type: ConfigChangeType,
    pub changed_by: String,
    pub changed_at: DateTime<Utc>,
    pub description: String,
    pub is_rollback_point: bool,
    pub commit_status: ConfigCommitStatus,
}

/// Configuration snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigSnapshot {
    pub id: Uuid,
    pub config_tree: ConfigNode,
    pub hash: String,
    pub created_at: DateTime<Utc>,
}

/// Configuration change type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConfigChangeType {
    Retrieve,
    Configure,
    Generate,
    Rollback,
    Import,
}

/// Configuration commit status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConfigCommitStatus {
    Pending,
    Success,
    Failed,
    Partial,
}

/// Configuration retrieve request
#[derive(Debug, Deserialize)]
pub struct ConfigRetrieveRequest {
    /// Optional path to retrieve specific subtree
    pub path: Option<String>,
    /// Include default values
    pub include_defaults: bool,
    /// Include readonly nodes
    pub include_readonly: bool,
}

/// Configuration retrieve response
#[derive(Debug, Serialize)]
pub struct ConfigRetrieveResponse {
    pub config_tree: ConfigNode,
    pub retrieved_at: DateTime<Utc>,
    pub node_count: usize,
}

/// Configuration set request
#[derive(Debug, Deserialize)]
pub struct ConfigSetRequest {
    /// Path to set configuration at
    pub path: String,
    /// Value to set (None for delete)
    pub value: Option<String>,
    /// Whether to validate before setting
    pub validate: bool,
}

/// Configuration delete request
#[derive(Debug, Deserialize)]
pub struct ConfigDeleteRequest {
    /// Path to delete
    pub path: String,
    /// Whether to validate before deletion
    pub validate: bool,
}

/// Configuration set response
#[derive(Debug, Serialize)]
pub struct ConfigSetResponse {
    pub success: bool,
    pub message: String,
    pub changes_made: Vec<String>,
}

/// Configuration generate (commit) request
#[derive(Debug, Deserialize)]
pub struct ConfigGenerateRequest {
    /// Comment for the commit
    pub comment: String,
    /// Whether to save running config to startup config
    pub save: bool,
    /// Whether to validate before commit
    pub validate: bool,
}

/// Configuration generate response
#[derive(Debug, Serialize)]
pub struct ConfigGenerateResponse {
    pub success: bool,
    pub message: String,
    pub config_snapshot_id: Option<Uuid>,
    pub warnings: Vec<String>,
}

/// Configuration history response
#[derive(Debug, Serialize)]
pub struct ConfigHistoryResponse {
    pub history: Vec<ConfigHistory>,
    pub total_count: usize,
}

/// Configuration rollback request
#[derive(Debug, Deserialize)]
pub struct ConfigRollbackRequest {
    /// History entry ID to rollback to
    pub history_id: Uuid,
    /// Comment for the rollback
    pub comment: String,
    /// Whether to apply immediately
    pub apply_immediately: bool,
}

/// Configuration rollback response
#[derive(Debug, Serialize)]
pub struct ConfigRollbackResponse {
    pub success: bool,
    pub message: String,
    pub rolled_back_to: ConfigSnapshot,
    pub new_history_id: Uuid,
}

/// Configuration diff result
#[derive(Debug, Serialize)]
pub struct ConfigDiffResult {
    pub id: Uuid,
    pub snapshot1: ConfigSnapshot,
    pub snapshot2: ConfigSnapshot,
    pub additions: Vec<ConfigChange>,
    pub deletions: Vec<ConfigChange>,
    pub modifications: Vec<ConfigChange>,
    pub generated_at: DateTime<Utc>,
}

/// Configuration change in diff
#[derive(Debug, Serialize)]
pub struct ConfigChange {
    pub path: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub change_type: DiffChangeType,
}

/// Diff change type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DiffChangeType {
    Added,
    Deleted,
    Modified,
}

/// Configuration validation result
#[derive(Debug, Serialize)]
pub struct ConfigValidationResult {
    pub is_valid: bool,
    pub errors: Vec<ValidationError>,
    pub warnings: Vec<ValidationWarning>,
}

/// Validation error
#[derive(Debug, Serialize)]
pub struct ValidationError {
    pub path: String,
    pub message: String,
    pub error_type: ValidationErrorType,
}

/// Validation error type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ValidationErrorType {
    Required,
    InvalidFormat,
    OutOfRange,
    Conflict,
    Dependency,
}

/// Validation warning
#[derive(Debug, Serialize)]
pub struct ValidationWarning {
    pub path: String,
    pub message: String,
    pub warning_type: ValidationWarningType,
}

/// Validation warning type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ValidationWarningType {
    Deprecated,
    DefaultValue,
    Recommendation,
}

/// Bulk configuration change request
#[derive(Debug, Deserialize)]
pub struct BulkConfigChangeRequest {
    pub changes: Vec<ConfigSetRequest>,
    pub comment: String,
    pub validate: bool,
    pub stop_on_error: bool,
}

/// Bulk configuration change response
#[derive(Debug, Serialize)]
pub struct BulkConfigChangeResponse {
    pub success: bool,
    pub message: String,
    pub applied: Vec<String>,
    pub failed: Vec<ConfigChangeFailure>,
}

/// Configuration change failure
#[derive(Debug, Serialize)]
pub struct ConfigChangeFailure {
    pub path: String,
    pub error: String,
}

/// Configuration search request
#[derive(Debug, Deserialize)]
pub struct ConfigSearchRequest {
    pub search_term: String,
    pub search_type: SearchType,
    pub path_filter: Option<String>,
}

/// Search type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SearchType {
    Path,
    Value,
    Both,
}

/// Configuration search response
#[derive(Debug, Serialize)]
pub struct ConfigSearchResponse {
    pub results: Vec<ConfigNode>,
    pub total_count: usize,
}