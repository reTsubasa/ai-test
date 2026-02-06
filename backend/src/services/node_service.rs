//! Node Service Module
//!
//! This module provides business logic for managing VyOS nodes, including
//! CRUD operations, health checking, and configuration retrieval.

use crate::error::AppError;
use crate::models::node::{
    CreateNodeRequest, Node, NodeHealthInfo, NodeListQuery, NodeListResponse,
    NodeStatistics, NodeStatus, NodeTestResult, UpdateNodeRequest,
};
use crate::vyos_client::{VyOSClient, VyOSClientConfig, VyOSConnectionTest, VyOSInfo};
use chrono::{DateTime, Utc};
use sqlx::AnyPool;
use tracing::{debug, info, warn};
use uuid::Uuid;

/// Node service for managing VyOS nodes
#[derive(Clone)]
pub struct NodeService {
    pool: AnyPool,
}

impl NodeService {
    /// Create a new node service
    pub fn new(pool: AnyPool) -> Self {
        Self { pool }
    }

    /// Create a VyOS client for a specific node
    fn create_vyos_client(&self, node: &Node) -> Result<VyOSClient, AppError> {
        let config = VyOSClientConfig::new(
            node.host.clone(),
            node.api_key.clone(),
            node.port,
            node.use_https,
            node.verify_ssl,
            node.timeout,
        );
        VyOSClient::new(config)
    }

    /// Query a single row and convert to Node
    async fn query_row_to_node(
        &self,
        row: sqlx::any::AnyRow,
    ) -> Result<Node, AppError> {
        let id_str: String = row.try_get("id")?;
        let id = Uuid::parse_str(&id_str).unwrap_or_else(|_| Uuid::nil());
        let status_str: String = row.try_get("status").unwrap_or_else(|_| "offline".to_string());
        let tags_str: String = row.try_get("tags").unwrap_or_else(|_| "[]".to_string());
        let created_at_str: String = row.try_get("created_at")?;
        let updated_at_str: String = row.try_get("updated_at")?;

        Ok(Node {
            id,
            name: row.try_get("name")?,
            description: row.try_get("description")?,
            host: row.try_get("host")?,
            port: row.try_get::<i64, _>("port")? as u16,
            api_key: row.try_get("api_key")?,
            status: parse_node_status(&status_str),
            last_seen: row.try_get::<Option<String>, _>("last_seen")?
                .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                .map(|dt| dt.with_timezone(&Utc)),
            version: row.try_get("version")?,
            uptime: row.try_get::<Option<i64>, _>("uptime")?.map(|u| u as u64),
            use_https: row.try_get::<i64, _>("use_https")? != 0,
            verify_ssl: row.try_get::<i64, _>("verify_ssl")? != 0,
            tags: serde_json::from_str(&tags_str).unwrap_or_default(),
            timeout: row.try_get::<i64, _>("timeout")? as u64,
            created_at: DateTime::parse_from_rfc3339(&created_at_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
            updated_at: DateTime::parse_from_rfc3339(&updated_at_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
        })
    }

    // ========================================================================
    // CRUD Operations
    // ========================================================================

    /// List all nodes with optional filtering and pagination
    pub async fn list_nodes(&self, query: NodeListQuery) -> Result<NodeListResponse, AppError> {
        debug!("Listing nodes with query: {:?}", query);

        let page = query.page.unwrap_or(1).max(1);
        let page_size = query.page_size.unwrap_or(20).min(100);
        let offset = (page - 1) * page_size;

        let mut where_clauses = vec!["1=1".to_string()];
        let mut bind_values: Vec<String> = vec![];

        if let Some(status) = query.status {
            where_clauses.push("status = ?".to_string());
            bind_values.push(status.to_string().to_lowercase());
        }

        if let Some(search) = &query.search {
            where_clauses.push("(name LIKE ? OR description LIKE ? OR host LIKE ?)".to_string());
            bind_values.push(format!("%{}%", search));
            bind_values.push(format!("%{}%", search));
            bind_values.push(format!("%{}%", search));
        }

        let where_clause = where_clauses.join(" AND ");

        // Count query
        let count_query = format!("SELECT COUNT(*) FROM nodes WHERE {}", where_clause);
        let mut count_query_builder = sqlx::query_scalar::<_, i64>(&count_query);
        for value in &bind_values {
            count_query_builder = count_query_builder.bind(value);
        }
        let total = count_query_builder.fetch_one(&self.pool).await? as u64;

        // Data query with sorting
        let sort_by = query.sort_by.unwrap_or_else(|| "name".to_string());
        let sort_order = query.sort_order.unwrap_or_else(|| "asc".to_string());
        let data_query = format!(
            "SELECT id, name, description, host, port, api_key, status, last_seen, version, uptime,
             use_https, verify_ssl, tags, timeout, created_at, updated_at
             FROM nodes WHERE {} ORDER BY {} {} LIMIT ? OFFSET ?",
            where_clause, sort_by, sort_order
        );

        let mut rows_builder = sqlx::query(&data_query);
        for value in &bind_values {
            rows_builder = rows_builder.bind(value);
        }
        rows_builder = rows_builder.bind(page_size as i64).bind(offset as i64);

        let rows_result = rows_builder.fetch_all(&self.pool).await?;

        let mut nodes = vec![];
        for row in rows_result {
            nodes.push(self.query_row_to_node(row).await?);
        }

        let total_pages = ((total as f64) / (page_size as f64)).ceil() as u32;

        Ok(NodeListResponse {
            nodes,
            total,
            page,
            page_size,
            total_pages,
        })
    }

    /// Get a node by ID
    pub async fn get_node(&self, node_id: Uuid) -> Result<Option<Node>, AppError> {
        debug!("Getting node: {}", node_id);

        let query = r#"
            SELECT id, name, description, host, port, api_key, status, last_seen, version, uptime,
                   use_https, verify_ssl, tags, timeout, created_at, updated_at
            FROM nodes
            WHERE id = ?
        "#;

        let row = sqlx::query(query)
            .bind(node_id.to_string())
            .fetch_optional(&self.pool)
            .await?;

        match row {
            Some(r) => Ok(Some(self.query_row_to_node(r).await?)),
            None => Ok(None),
        }
    }

    /// Get a node by name
    pub async fn get_node_by_name(&self, name: &str) -> Result<Option<Node>, AppError> {
        debug!("Getting node by name: {}", name);

        let query = r#"
            SELECT id, name, description, host, port, api_key, status, last_seen, version, uptime,
                   use_https, verify_ssl, tags, timeout, created_at, updated_at
            FROM nodes
            WHERE name = ?
        "#;

        let row = sqlx::query(query)
            .bind(name)
            .fetch_optional(&self.pool)
            .await?;

        match row {
            Some(r) => Ok(Some(self.query_row_to_node(r).await?)),
            None => Ok(None),
        }
    }

    /// Create a new node
    pub async fn create_node(&self, request: CreateNodeRequest) -> Result<Node, AppError> {
        info!("Creating node: {}", request.name);

        let id = Uuid::new_v4();
        let now = Utc::now();

        // Use defaults from request
        let port = request.port.unwrap_or(8443);
        let use_https = request.use_https.unwrap_or(true);
        let verify_ssl = request.verify_ssl.unwrap_or(false);
        let timeout = request.timeout.unwrap_or(30);
        let tags = request.tags.unwrap_or_default();
        let tags_json = serde_json::to_string(&tags).unwrap_or_else(|_| "[]".to_string());

        let query = r#"
            INSERT INTO nodes (id, name, description, host, port, api_key, status, use_https,
                              verify_ssl, tags, timeout, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#;

        sqlx::query(query)
            .bind(id.to_string())
            .bind(&request.name)
            .bind(&request.description)
            .bind(&request.host)
            .bind(port)
            .bind(&request.api_key)
            .bind(NodeStatus::Offline.to_string())
            .bind(use_https)
            .bind(verify_ssl)
            .bind(&tags_json)
            .bind(timeout)
            .bind(now.to_rfc3339())
            .bind(now.to_rfc3339())
            .execute(&self.pool)
            .await?;

        // Fetch the created node
        self.get_node(id).await?
            .ok_or_else(|| AppError::Internal("Failed to retrieve created node".to_string()))
    }

    /// Update an existing node
    pub async fn update_node(
        &self,
        node_id: Uuid,
        request: UpdateNodeRequest,
    ) -> Result<Node, AppError> {
        info!("Updating node: {}", node_id);

        // Build update query dynamically
        let mut updates = vec!["updated_at = ?".to_string()];
        let mut params: Vec<String> = vec![];

        if let Some(name) = &request.name {
            updates.push("name = ?");
            params.push(name.clone());
        }
        if let Some(description) = &request.description {
            updates.push("description = ?");
            params.push(description.clone());
        }
        if let Some(host) = &request.host {
            updates.push("host = ?");
            params.push(host.clone());
        }
        if let Some(port) = request.port {
            updates.push("port = ?");
            params.push(port.to_string());
        }
        if let Some(api_key) = &request.api_key {
            updates.push("api_key = ?");
            params.push(api_key.clone());
        }
        if let Some(use_https) = request.use_https {
            updates.push("use_https = ?");
            params.push(if use_https { "1" } else { "0" }.to_string());
        }
        if let Some(verify_ssl) = request.verify_ssl {
            updates.push("verify_ssl = ?");
            params.push(if verify_ssl { "1" } else { "0" }.to_string());
        }
        if let Some(timeout) = request.timeout {
            updates.push("timeout = ?");
            params.push(timeout.to_string());
        }
        if let Some(tags) = &request.tags {
            let tags_json = serde_json::to_string(tags).unwrap_or_else(|_| "[]".to_string());
            updates.push("tags = ?");
            params.push(tags_json);
        }

        updates.push("updated_at = ?");
        params.push(Utc::now().to_rfc3339());

        let set_clause = updates.join(", ");
        let query = format!(
            "UPDATE nodes SET {} WHERE id = ?",
            set_clause
        );

        let mut query_builder = sqlx::query(&query);
        for param in &params {
            query_builder = query_builder.bind(param);
        }
        query_builder = query_builder.bind(node_id.to_string());

        query_builder.execute(&self.pool).await?;

        // Get the updated node
        self.get_node(node_id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Node {} not found after update", node_id)))
    }

    /// Delete a node
    pub async fn delete_node(&self, node_id: Uuid) -> Result<(), AppError> {
        info!("Deleting node: {}", node_id);

        let query = "DELETE FROM nodes WHERE id = ?";
        let result = sqlx::query(query)
            .bind(node_id.to_string())
            .execute(&self.pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Node {} not found", node_id)));
        }

        info!("Node deleted successfully: {}", node_id);
        Ok(())
    }

    // ========================================================================
    // Health Checking
    // ========================================================================

    /// Test connection to a node
    pub async fn test_connection(&self, node_id: Uuid) -> Result<NodeTestResult, AppError> {
        info!("Testing connection for node: {}", node_id);

        let node = self
            .get_node(node_id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Node {} not found", node_id)))?;

        // Update node status to testing
        self.update_node_status(node_id, NodeStatus::Testing).await?;

        let vyos_client = self.create_vyos_client(&node)?;
        let test_result = vyos_client.test_connection().await?;

        // Update node status based on test result
        let new_status = if test_result.success {
            NodeStatus::Online
        } else {
            NodeStatus::Error
        };

        self.update_node_status(node_id, new_status).await?;

        // Update node metadata if successful
        if test_result.success {
            self.update_node_metadata(
                node_id,
                test_result.version.clone(),
                test_result.uptime,
            ).await?;
        }

        Ok(NodeTestResult {
            success: test_result.success,
            message: if test_result.success {
                "Connection successful".to_string()
            } else {
                test_result.error.unwrap_or_else(|| "Connection failed".to_string())
            },
            latency_ms: test_result.latency_ms,
            version: test_result.version,
            hostname: test_result.hostname,
            uptime: test_result.uptime,
        })
    }

    /// Update node status
    async fn update_node_status(
        &self,
        node_id: Uuid,
        status: NodeStatus,
    ) -> Result<(), AppError> {
        let now = Utc::now();

        let query = r#"
            UPDATE nodes
            SET status = ?, updated_at = ?
            WHERE id = ?
        "#;

        sqlx::query(query)
            .bind(status.to_string())
            .bind(now.to_rfc3339())
            .bind(node_id.to_string())
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Update node metadata (version, uptime)
    async fn update_node_metadata(
        &self,
        node_id: Uuid,
        version: Option<String>,
        uptime: Option<u64>,
    ) -> Result<(), AppError> {
        let now = Utc::now();

        let query = r#"
            UPDATE nodes
            SET version = ?, uptime = ?, last_seen = ?, updated_at = ?
            WHERE id = ?
        "#;

        sqlx::query(query)
            .bind(version.unwrap_or_default())
            .bind(uptime.unwrap_or(0))
            .bind(now.to_rfc3339())
            .bind(now.to_rfc3339())
            .bind(node_id.to_string())
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Get health information for all nodes
    pub async fn get_all_nodes_health(&self) -> Result<Vec<NodeHealthInfo>, AppError> {
        debug!("Getting health information for all nodes");

        let query = r#"
            SELECT id, status, updated_at
            FROM nodes
            ORDER BY name
        "#;

        let rows = sqlx::query(query)
            .fetch_all(&self.pool)
            .await?;

        let now = Utc::now();
        let mut health_infos = vec![];
        for row in rows {
            let id_str: String = row.try_get("id")?;
            let status_str: String = row.try_get("status")?;
            let updated_at_str: String = row.try_get("updated_at")?;

            let node_id = Uuid::parse_str(&id_str).unwrap_or_else(|_| Uuid::nil());
            let status = parse_node_status(&status_str);
            let last_check = DateTime::parse_from_rfc3339(&updated_at_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or(now);

            health_infos.push(NodeHealthInfo {
                node_id,
                status,
                last_check,
                latency_ms: None,
                error_message: None,
            });
        }

        Ok(health_infos)
    }

    /// Get health information for a specific node
    pub async fn get_node_health(&self, node_id: Uuid) -> Result<NodeHealthInfo, AppError> {
        debug!("Getting health information for node: {}", node_id);

        let query = r#"
            SELECT id, status, updated_at
            FROM nodes
            WHERE id = ?
        "#;

        let row = sqlx::query(query)
            .bind(node_id.to_string())
            .fetch_optional(&self.pool)
            .await?;

        let row = row.ok_or_else(|| {
            AppError::NotFound(format!("Node {} not found", node_id))
        })?;

        let id_str: String = row.try_get("id")?;
        let status_str: String = row.try_get("status")?;
        let updated_at_str: String = row.try_get("updated_at")?;

        let now = Utc::now();
        let last_check = DateTime::parse_from_rfc3339(&updated_at_str)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or(now);

        Ok(NodeHealthInfo {
            node_id: Uuid::parse_str(&id_str).unwrap_or_else(|_| Uuid::nil()),
            status: parse_node_status(&status_str),
            last_check,
            latency_ms: None,
            error_message: None,
        })
    }

    /// Check health of all nodes (background task)
    pub async fn check_all_nodes_health(&self) -> Result<Vec<NodeHealthInfo>, AppError> {
        info!("Checking health of all nodes");

        let nodes = self.list_nodes(NodeListQuery {
            page: None,
            page_size: Some(1000),
            status: None,
            search: None,
            sort_by: None,
            sort_order: None,
        }).await?;

        let mut health_infos = vec![];

        for node in nodes.nodes {
            let node_id = node.id;
            match self.test_connection(node_id).await {
                Ok(result) => {
                    health_infos.push(NodeHealthInfo {
                        node_id,
                        status: if result.success {
                            NodeStatus::Online
                        } else {
                            NodeStatus::Error
                        },
                        last_check: Utc::now(),
                        latency_ms: result.latency_ms,
                        error_message: if result.success {
                            None
                        } else {
                            Some(result.message)
                        },
                    });
                }
                Err(e) => {
                    warn!("Health check failed for node {}: {}", node_id, e);
                    health_infos.push(NodeHealthInfo {
                        node_id,
                        status: NodeStatus::Error,
                        last_check: Utc::now(),
                        latency_ms: None,
                        error_message: Some(e.to_string()),
                    });
                }
            }
        }

        Ok(health_infos)
    }

    // ========================================================================
    // Configuration Retrieval
    // ========================================================================

    /// Retrieve configuration from a node
    pub async fn retrieve_node_config(
        &self,
        node_id: Uuid,
        path: Option<String>,
    ) -> Result<serde_json::Value, AppError> {
        info!("Retrieving configuration for node: {}, path: {:?}", node_id, path);

        let node = self
            .get_node(node_id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Node {} not found", node_id)))?;

        let vyos_client = self.create_vyos_client(&node)?;
        vyos_client.retrieve_config(path).await
    }

    /// Get system information from a node
    pub async fn get_node_info(&self, node_id: Uuid) -> Result<VyOSInfo, AppError> {
        info!("Getting system info for node: {}", node_id);

        let node = self
            .get_node(node_id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Node {} not found", node_id)))?;

        let vyos_client = self.create_vyos_client(&node)?;
        let info = vyos_client.get_info().await?;

        // Update node metadata
        self.update_node_metadata(
            node_id,
            Some(info.version.clone()),
            Some(info.uptime_seconds),
        ).await?;

        Ok(info)
    }

    /// Get network interfaces from a node
    pub async fn get_node_interfaces(&self, node_id: Uuid) -> Result<Vec<crate::vyos_client::VyOSInterface>, AppError> {
        info!("Getting interfaces for node: {}", node_id);

        let node = self
            .get_node(node_id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Node {} not found", node_id)))?;

        let vyos_client = self.create_vyos_client(&node)?;
        vyos_client.get_interfaces().await
    }

    /// Execute a show command on a node
    pub async fn execute_show_command(
        &self,
        node_id: Uuid,
        command: &str,
    ) -> Result<crate::vyos_client::VyOSShowResult, AppError> {
        info!("Executing show command on node {}: {}", node_id, command);

        let node = self
            .get_node(node_id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Node {} not found", node_id)))?;

        let vyos_client = self.create_vyos_client(&node)?;
        vyos_client.show(command).await
    }

    // ========================================================================
    // Statistics
    // ========================================================================

    /// Get node statistics
    pub async fn get_statistics(&self) -> Result<NodeStatistics, AppError> {
        debug!("Getting node statistics");

        let query = r#"
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
                SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error
            FROM nodes
        "#;

        let row = sqlx::query_as::<_, (i64, i64, i64, i64)>(query)
            .fetch_one(&self.pool)
            .await?;

        Ok(NodeStatistics {
            total_nodes: row.0 as u64,
            online_nodes: row.1 as u64,
            offline_nodes: row.2 as u64,
            error_nodes: row.3 as u64,
        })
    }
}

// ========================================================================
// Helper Functions
// ========================================================================

/// Parse node status from string
fn parse_node_status(s: &str) -> NodeStatus {
    match s.to_lowercase().as_str() {
        "online" => NodeStatus::Online,
        "offline" => NodeStatus::Offline,
        "error" => NodeStatus::Error,
        "testing" => NodeStatus::Testing,
        _ => NodeStatus::Offline,
    }
}

impl NodeStatus {
    /// Convert NodeStatus to string for database storage
    fn to_string(&self) -> String {
        match self {
            NodeStatus::Online => "online".to_string(),
            NodeStatus::Offline => "offline".to_string(),
            NodeStatus::Error => "error".to_string(),
            NodeStatus::Testing => "testing".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_node_status() {
        assert_eq!(parse_node_status("online"), NodeStatus::Online);
        assert_eq!(parse_node_status("OFFLINE"), NodeStatus::Offline);
        assert_eq!(parse_node_status("Error"), NodeStatus::Error);
        assert_eq!(parse_node_status("unknown"), NodeStatus::Offline);
    }

    #[test]
    fn test_node_status_to_string() {
        assert_eq!(NodeStatus::Online.to_string(), "online");
        assert_eq!(NodeStatus::Offline.to_string(), "offline");
        assert_eq!(NodeStatus::Error.to_string(), "error");
        assert_eq!(NodeStatus::Testing.to_string(), "testing");
    }
}