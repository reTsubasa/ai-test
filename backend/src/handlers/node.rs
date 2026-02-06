//! Node Handlers Module
//!
//! This module contains HTTP request handlers for node management endpoints.

use actix_web::{web, HttpResponse};
use tracing::{debug, error, info};
use uuid::Uuid;

use crate::error::AppResult;
use crate::models::node::{
    CreateNodeRequest, NodeListQuery, NodeListResponse, NodeStatistics,
    NodeTestResult, UpdateNodeRequest,
};
use crate::services::NodeService;

// ============================================================================
// Node Handlers
// ============================================================================

/// Get all nodes
///
/// GET /api/nodes
///
/// Returns a paginated list of all registered nodes with optional filtering.
pub async fn list_nodes(
    query: web::Query<NodeListQuery>,
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    debug!("Handling list_nodes request");

    let response = node_service.list_nodes(query.into_inner()).await?;

    Ok(HttpResponse::Ok().json(response))
}

/// Create a new node
///
/// POST /api/nodes
///
/// Creates a new VyOS node with the provided configuration.
pub async fn create_node(
    request: web::Json<CreateNodeRequest>,
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    info!("Handling create_node request for node: {}", request.name);

    match node_service.create_node(request.into_inner()).await {
        Ok(node) => {
            info!("Node created successfully: {}", node.id);
            Ok(HttpResponse::Created().json(node))
        }
        Err(e) => {
            error!("Failed to create node: {}", e);
            Err(e)
        }
    }
}

/// Get a specific node by ID
///
/// GET /api/nodes/:id
///
/// Returns detailed information about a specific node.
pub async fn get_node(
    path: web::Path<Uuid>,
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    debug!("Handling get_node request");

    let node_id = path.into_inner();
    match node_service.get_node(node_id).await {
        Ok(Some(node)) => {
            Ok(HttpResponse::Ok().json(node))
        }
        Ok(None) => {
            Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Node not found",
                "node_id": node_id.to_string()
            })))
        }
        Err(e) => Err(e),
    }
}

/// Update a node
///
/// PUT /api/nodes/:id
///
/// Updates an existing node's configuration.
pub async fn update_node(
    path: web::Path<Uuid>,
    request: web::Json<UpdateNodeRequest>,
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    info!("Handling update_node request");

    let node_id = path.into_inner();
    match node_service.update_node(node_id, request.into_inner()).await {
        Ok(node) => {
            info!("Node updated successfully: {}", node_id);
            Ok(HttpResponse::Ok().json(node))
        }
        Err(e) => {
            error!("Failed to update node {}: {}", node_id, e);
            Err(e)
        }
    }
}

/// Delete a node
///
/// DELETE /api/nodes/:id
///
/// Deletes a node from the system.
pub async fn delete_node(
    path: web::Path<Uuid>,
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    info!("Handling delete_node request");

    let node_id = path.into_inner();
    match node_service.delete_node(node_id).await {
        Ok(_) => {
            info!("Node deleted successfully: {}", node_id);
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "message": "Node deleted successfully",
                "node_id": node_id.to_string()
            })))
        }
        Err(e) => {
            error!("Failed to delete node {}: {}", node_id, e);
            Err(e)
        }
    }
}

/// Test connection to a node
///
/// POST /api/nodes/:id/test
///
/// Tests the connection to a specific VyOS node and returns the result.
pub async fn test_connection(
    path: web::Path<Uuid>,
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    info!("Handling test_connection request");

    let node_id = path.into_inner();
    match node_service.test_connection(node_id).await {
        Ok(result) => {
            info!("Connection test completed for node: {}", node_id);
            Ok(HttpResponse::Ok().json(result))
        }
        Err(e) => {
            error!("Failed to test connection for node {}: {}", node_id, e);
            Err(e)
        }
    }
}

/// Get node health information
///
/// GET /api/nodes/:id/health
///
/// Returns the health status of a specific node.
pub async fn get_node_health(
    path: web::Path<Uuid>,
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    debug!("Handling get_node_health request");

    let node_id = path.into_inner();
    match node_service.get_node_health(node_id).await {
        Ok(health) => {
            Ok(HttpResponse::Ok().json(health))
        }
        Err(e) => Err(e),
    }
}

/// Get health information for all nodes
///
/// GET /api/nodes/health/all
///
/// Returns health status for all registered nodes.
pub async fn get_all_nodes_health(
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    debug!("Handling get_all_nodes_health request");

    match node_service.get_all_nodes_health().await {
        Ok(health_infos) => {
            Ok(HttpResponse::Ok().json(health_infos))
        }
        Err(e) => Err(e),
    }
}

/// Retrieve configuration from a node
///
/// POST /api/nodes/:id/config
///
/// Retrieves the configuration from a specific node.
pub async fn retrieve_node_config(
    path: web::Path<Uuid>,
    request: Option<web::Json<serde_json::Value>>,
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    info!("Handling retrieve_node_config request");

    let node_id = path.into_inner();
    let path_str = request
        .and_then(|r| r.get("path"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    match node_service.retrieve_node_config(node_id, path_str).await {
        Ok(config) => {
            Ok(HttpResponse::Ok().json(config))
        }
        Err(e) => {
            error!("Failed to retrieve config from node {}: {}", node_id, e);
            Err(e)
        }
    }
}

/// Get system information from a node
///
/// GET /api/nodes/:id/info
///
/// Returns system information from a specific VyOS node.
pub async fn get_node_info(
    path: web::Path<Uuid>,
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    debug!("Handling get_node_info request");

    let node_id = path.into_inner();
    match node_service.get_node_info(node_id).await {
        Ok(info) => {
            Ok(HttpResponse::Ok().json(info))
        }
        Err(e) => {
            error!("Failed to get info from node {}: {}", node_id, e);
            Err(e)
        }
    }
}

/// Get network interfaces from a node
///
/// GET /api/nodes/:id/interfaces
///
/// Returns network interface information from a specific VyOS node.
pub async fn get_node_interfaces(
    path: web::Path<Uuid>,
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    debug!("Handling get_node_interfaces request");

    let node_id = path.into_inner();
    match node_service.get_node_interfaces(node_id).await {
        Ok(interfaces) => {
            Ok(HttpResponse::Ok().json(interfaces))
        }
        Err(e) => {
            error!("Failed to get interfaces from node {}: {}", node_id, e);
            Err(e)
        }
    }
}

/// Execute a show command on a node
///
/// POST /api/nodes/:id/show
///
/// Executes a show command on a specific VyOS node.
pub async fn execute_show_command(
    path: web::Path<Uuid>,
    request: web::Json<serde_json::Value>,
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    info!("Handling execute_show_command request");

    let node_id = path.into_inner();
    let command = request
        .get("command")
        .and_then(|v| v.as_str())
        .ok_or_else(|| crate::error::AppError::Validation("Command is required".to_string()))?;

    match node_service.execute_show_command(node_id, command).await {
        Ok(result) => {
            Ok(HttpResponse::Ok().json(result))
        }
        Err(e) => {
            error!("Failed to execute show command on node {}: {}", node_id, e);
            Err(e)
        }
    }
}

/// Get node statistics
///
/// GET /api/nodes/stats
///
/// Returns summary statistics for all nodes.
pub async fn get_node_statistics(
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    debug!("Handling get_node_statistics request");

    match node_service.get_statistics().await {
        Ok(stats) => {
            Ok(HttpResponse::Ok().json(stats))
        }
        Err(e) => Err(e),
    }
}

/// Check health of all nodes (trigger background check)
///
/// POST /api/nodes/health/check-all
///
/// Triggers a health check for all registered nodes.
pub async fn check_all_nodes_health(
    node_service: web::Data<NodeService>,
) -> AppResult<HttpResponse> {
    info!("Handling check_all_nodes_health request");

    match node_service.check_all_nodes_health().await {
        Ok(health_infos) => {
            Ok(HttpResponse::Ok().json(health_infos))
        }
        Err(e) => {
            error!("Failed to check health of all nodes: {}", e);
            Err(e)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_path_parsing() {
        let uuid_str = "550e8400-e29b-41d4-a716-446655440000";
        let uuid = Uuid::parse_str(uuid_str).unwrap();
        assert_eq!(uuid.to_string(), uuid_str);
    }
}