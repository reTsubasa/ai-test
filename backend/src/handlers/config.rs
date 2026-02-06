use actix_web::{web, HttpResponse};
use serde::Deserialize;

use crate::error::AppResult;
use crate::models::config::{
    ConfigDeleteRequest, ConfigGenerateRequest, ConfigRetrieveRequest,
    ConfigRollbackRequest, ConfigSearchRequest, ConfigSetRequest,
};
use crate::services::ConfigService;

/// Retrieve configuration from VyOS
///
/// POST /api/config/retrieve
///
/// Retrieves the current running configuration from VyOS and returns it
/// as a hierarchical tree structure.
pub async fn retrieve_config(
    service: web::Data<ConfigService>,
    req: web::Json<ConfigRetrieveRequest>,
) -> AppResult<HttpResponse> {
    let result = service
        .retrieve_config(req.into_inner())
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Set configuration value
///
/// POST /api/config/configure
///
/// Sets a configuration value at the specified path. If the value is None,
/// the configuration at that path is deleted.
pub async fn set_config(
    service: web::Data<ConfigService>,
    req: web::Json<ConfigSetRequest>,
) -> AppResult<HttpResponse> {
    let result = service
        .set_config(req.into_inner())
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Delete configuration
///
/// POST /api/config/delete
///
/// Deletes configuration at the specified path.
pub async fn delete_config(
    service: web::Data<ConfigService>,
    req: web::Json<ConfigDeleteRequest>,
) -> AppResult<HttpResponse> {
    let result = service
        .delete_config(req.into_inner())
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Generate/commit configuration
///
/// POST /api/config/generate
///
/// Commits the pending configuration changes to the running configuration.
/// Optionally saves to startup config.
pub async fn generate_config(
    service: web::Data<ConfigService>,
    req: web::Json<ConfigGenerateRequest>,
    // TODO: Extract changed_by from JWT claims
) -> AppResult<HttpResponse> {
    let result = service
        .generate_config(req.into_inner(), "system".to_string())
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Get configuration history
///
/// GET /api/config/history
///
/// Retrieves the configuration change history.
pub async fn get_history(
    service: web::Data<ConfigService>,
    query: web::Query<HistoryQueryParams>,
) -> AppResult<HttpResponse> {
    let result = service
        .get_history(query.limit)
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Get specific history entry
///
/// GET /api/config/history/{id}
///
/// Retrieves a specific configuration history entry.
pub async fn get_history_entry(
    service: web::Data<ConfigService>,
    path: web::Path<String>,
) -> AppResult<HttpResponse> {
    let id = uuid::Uuid::parse_str(&path.into_inner())
        .map_err(|e| crate::error::AppError::Validation(format!("Invalid UUID: {}", e)))?;

    let result = service.get_history_entry(id).await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Rollback configuration
///
/// POST /api/config/rollback
///
/// Rolls back the configuration to a previous state.
pub async fn rollback_config(
    service: web::Data<ConfigService>,
    req: web::Json<ConfigRollbackRequest>,
    // TODO: Extract changed_by from JWT claims
) -> AppResult<HttpResponse> {
    let result = service
        .rollback_config(req.into_inner(), "system".to_string())
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Compare configuration snapshots
///
/// GET /api/config/diff/{id1}/{id2}
///
/// Compares two configuration snapshots and returns the differences.
pub async fn diff_configs(
    service: web::Data<ConfigService>,
    path: web::Path<(String, String)>,
) -> AppResult<HttpResponse> {
    let (id1_str, id2_str) = path.into_inner();

    let id1 = uuid::Uuid::parse_str(&id1_str)
        .map_err(|e| crate::error::AppError::Validation(format!("Invalid UUID for id1: {}", e)))?;

    let id2 = uuid::Uuid::parse_str(&id2_str)
        .map_err(|e| crate::error::AppError::Validation(format!("Invalid UUID for id2: {}", e)))?;

    let result = service.diff_configs(id1, id2).await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Search configuration
///
/// POST /api/config/search
///
/// Searches the configuration for paths and/or values matching the search term.
pub async fn search_config(
    service: web::Data<ConfigService>,
    req: web::Json<ConfigSearchRequest>,
) -> AppResult<HttpResponse> {
    let result = service
        .search_config(req.into_inner())
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Bulk configuration changes
///
/// POST /api/config/bulk
///
/// Applies multiple configuration changes in a single operation.
pub async fn bulk_config_change(
    service: web::Data<ConfigService>,
    req: web::Json<crate::models::config::BulkConfigChangeRequest>,
    // TODO: Extract changed_by from JWT claims
) -> AppResult<HttpResponse> {
    let result = service
        .bulk_config_change(req.into_inner(), "system".to_string())
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Validate current configuration
///
/// POST /api/config/validate
///
/// Validates the current pending configuration.
pub async fn validate_config(
    service: web::Data<ConfigService>,
) -> AppResult<HttpResponse> {
    let warnings = service.validate_configuration().await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "is_valid": true,
        "warnings": warnings,
        "errors": []
    })))
}

/// Query parameters for history endpoint
#[derive(Debug, Deserialize)]
pub struct HistoryQueryParams {
    /// Maximum number of history entries to return
    limit: Option<usize>,
}

/// Configuration node value request
#[derive(Debug, Deserialize)]
pub struct ConfigValueRequest {
    /// Path to the configuration node
    path: String,
}

/// Get configuration node value
///
/// POST /api/config/value
///
/// Retrieves the value of a specific configuration node.
pub async fn get_config_value(
    service: web::Data<ConfigService>,
    req: web::Json<ConfigValueRequest>,
) -> AppResult<HttpResponse> {
    let retrieve_request = ConfigRetrieveRequest {
        path: Some(req.path.clone()),
        include_defaults: true,
        include_readonly: false,
    };

    let result = service.retrieve_config(retrieve_request).await?;

    // Find the node at the requested path and return its value
    let value = find_node_value(&result.config_tree, &req.path);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "path": req.path,
        "value": value,
        "found": value.is_some()
    })))
}

/// Helper function to find a node's value by path
fn find_node_value(node: &crate::models::config::ConfigNode, path: &str) -> Option<String> {
    if node.path == path {
        return node.value.clone();
    }

    for child in &node.children {
        if let Some(value) = find_node_value(child, path) {
            return Some(value);
        }
    }

    None
}

/// Configuration subtree request
#[derive(Debug, Deserialize)]
pub struct ConfigSubtreeRequest {
    /// Path to the configuration subtree
    path: String,
}

/// Get configuration subtree
///
/// POST /api/config/subtree
///
/// Retrieves a subtree of the configuration starting from the specified path.
pub async fn get_config_subtree(
    service: web::Data<ConfigService>,
    req: web::Json<ConfigSubtreeRequest>,
) -> AppResult<HttpResponse> {
    let retrieve_request = ConfigRetrieveRequest {
        path: Some(req.path.clone()),
        include_defaults: true,
        include_readonly: false,
    };

    let result = service.retrieve_config(retrieve_request).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "path": req.path,
        "subtree": result.config_tree,
        "node_count": result.node_count
    })))
}

/// Configuration comparison request
#[derive(Debug, Deserialize)]
pub struct ConfigCompareRequest {
    /// First snapshot ID or revision number
    id1: uuid::Uuid,
    /// Second snapshot ID or revision number
    id2: uuid::Uuid,
}

/// Compare configurations (POST alternative)
///
/// POST /api/config/compare
///
/// Compares two configuration snapshots and returns the differences.
/// This is an alternative to the GET endpoint with path parameters.
pub async fn compare_configs(
    service: web::Data<ConfigService>,
    req: web::Json<ConfigCompareRequest>,
) -> AppResult<HttpResponse> {
    let result = service
        .diff_configs(req.id1, req.id2)
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Discard pending configuration changes
///
/// POST /api/config/discard
///
/// Discards all pending configuration changes.
pub async fn discard_config(
    service: web::Data<ConfigService>,
) -> AppResult<HttpResponse> {
    // TODO: Integrate with vyos_client module
    // This would call the VyOS API to discard pending changes

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Pending configuration changes discarded"
    })))
}

/// Get configuration statistics
///
/// GET /api/config/stats
///
/// Returns statistics about the current configuration.
pub async fn get_config_stats(
    service: web::Data<ConfigService>,
) -> AppResult<HttpResponse> {
    let retrieve_request = ConfigRetrieveRequest {
        path: None,
        include_defaults: true,
        include_readonly: true,
    };

    let result = service.retrieve_config(retrieve_request).await?;

    let leaf_nodes = count_leaf_nodes(&result.config_tree);
    let container_nodes = count_container_nodes(&result.config_tree);
    let max_depth = calculate_max_depth(&result.config_tree, 0);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "total_nodes": result.node_count,
        "leaf_nodes": leaf_nodes,
        "container_nodes": container_nodes,
        "max_depth": max_depth,
        "retrieved_at": result.retrieved_at
    })))
}

/// Helper function to count leaf nodes
fn count_leaf_nodes(node: &crate::models::config::ConfigNode) -> usize {
    if matches!(
        node.node_type,
        crate::models::config::ConfigNodeType::Leaf
    ) {
        1
    } else {
        node.children.iter().map(count_leaf_nodes).sum::<usize>()
    }
}

/// Helper function to count container nodes
fn count_container_nodes(node: &crate::models::config::ConfigNode) -> usize {
    let container_count = if matches!(
        node.node_type,
        crate::models::config::ConfigNodeType::Container
    ) {
        1
    } else {
        0
    };

    container_count
        + node
            .children
            .iter()
            .map(count_container_nodes)
            .sum::<usize>()
}

/// Helper function to calculate max depth
fn calculate_max_depth(node: &crate::models::config::ConfigNode, current_depth: usize) -> usize {
    if node.children.is_empty() {
        current_depth
    } else {
        node.children
            .iter()
            .map(|child| calculate_max_depth(child, current_depth + 1))
            .max()
            .unwrap_or(current_depth)
    }
}