use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Node status
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NodeStatus {
    /// Node is online and responding
    Online,
    /// Node is offline or not responding
    Offline,
    /// Node connection is in error state
    Error,
    /// Node is being tested
    Testing,
}

/// Node model representing a VyOS device
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub host: String,
    pub port: u16,
    pub api_key: String,
    pub status: NodeStatus,
    /// Last successful connection timestamp
    pub last_seen: Option<DateTime<Utc>>,
    /// VyOS version
    pub version: Option<String>,
    /// System uptime in seconds
    pub uptime: Option<u64>,
    /// Whether to use HTTPS for connection
    pub use_https: bool,
    /// Whether to verify SSL certificate
    pub verify_ssl: bool,
    /// Node tags for organization
    pub tags: Vec<String>,
    /// Default timeout for API requests in seconds
    pub timeout: u64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Create node request
#[derive(Debug, Deserialize)]
pub struct CreateNodeRequest {
    pub name: String,
    pub description: Option<String>,
    pub host: String,
    pub port: Option<u16>,
    pub api_key: String,
    pub use_https: Option<bool>,
    pub verify_ssl: Option<bool>,
    pub tags: Option<Vec<String>>,
    pub timeout: Option<u64>,
}

/// Update node request
#[derive(Debug, Deserialize)]
pub struct UpdateNodeRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub api_key: Option<String>,
    pub use_https: Option<bool>,
    pub verify_ssl: Option<bool>,
    pub tags: Option<Vec<String>>,
    pub timeout: Option<u64>,
}

/// Node list query parameters
#[derive(Debug, Deserialize)]
pub struct NodeListQuery {
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub status: Option<NodeStatus>,
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

/// Paginated node list response
#[derive(Debug, Serialize)]
pub struct NodeListResponse {
    pub nodes: Vec<Node>,
    pub total: u64,
    pub page: u32,
    pub page_size: u32,
    pub total_pages: u32,
}

/// Node test connection result
#[derive(Debug, Serialize)]
pub struct NodeTestResult {
    pub success: bool,
    pub message: String,
    pub latency_ms: Option<u64>,
    pub version: Option<String>,
    pub hostname: Option<String>,
    pub uptime: Option<u64>,
}

/// Node health information
#[derive(Debug, Serialize)]
pub struct NodeHealthInfo {
    pub node_id: Uuid,
    pub status: NodeStatus,
    pub last_check: DateTime<Utc>,
    pub latency_ms: Option<u64>,
    pub error_message: Option<String>,
}

/// Node statistics summary
#[derive(Debug, Serialize)]
pub struct NodeStatistics {
    pub total_nodes: u64,
    pub online_nodes: u64,
    pub offline_nodes: u64,
    pub error_nodes: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_node_status_serialization() {
        let status = NodeStatus::Online;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"online\"");

        let deserialized: NodeStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, NodeStatus::Online);
    }

    #[test]
    fn test_create_node_request_defaults() {
        let request = CreateNodeRequest {
            name: "test-node".to_string(),
            description: None,
            host: "10.10.5.51".to_string(),
            port: None,
            api_key: "test-key".to_string(),
            use_https: None,
            verify_ssl: None,
            tags: None,
            timeout: None,
        };

        assert_eq!(request.name, "test-node");
        assert_eq!(request.port, None);
    }

    #[test]
    fn test_node_list_response() {
        let response = NodeListResponse {
            nodes: vec![],
            total: 0,
            page: 1,
            page_size: 10,
            total_pages: 0,
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"total\":0"));
        assert!(json.contains("\"page\":1"));
    }
}