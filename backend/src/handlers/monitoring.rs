//! Monitoring and statistics HTTP handlers
//!
//! This module contains handlers for all monitoring-related API endpoints
//! including metrics retrieval, alerts, topology, and monitoring summaries.

use actix_web::{web, HttpResponse};
use uuid::Uuid;

use crate::error::AppResult;
use crate::handlers::monitoring::*;
use crate::models::monitoring::{
    AcknowledgeAlertRequest, MetricsAggregationRequest, MetricsQuery,
};

/// Get metrics for node(s)
///
/// GET /api/monitoring/metrics
///
/// Query parameters:
/// - node_id: Optional node ID filter
/// - metric_name: Optional metric name filter
/// - metric_type: Optional metric type filter
/// - start_time: Optional start time (ISO 8601)
/// - end_time: Optional end time (ISO 8601)
/// - limit: Optional result limit
/// - sort_order: Optional sort order (asc/desc)
pub async fn get_metrics(
    service: web::Data<MonitoringService>,
    query: web::Query<MetricsQuery>,
) -> AppResult<HttpResponse> {
    let query = query.into_inner();
    let response = service.query_metrics(&query).await?;

    Ok(HttpResponse::Ok().json(response))
}

/// Get monitoring summary
///
/// GET /api/monitoring/summary
pub async fn get_monitoring_summary(
    service: web::Data<MonitoringService>,
) -> AppResult<HttpResponse> {
    let summary = service.get_monitoring_summary().await?;

    Ok(HttpResponse::Ok().json(summary))
}

/// Get system metrics for a node
///
/// GET /api/monitoring/system/{node_id}
pub async fn get_system_metrics(
    service: web::Data<MonitoringService>,
    node_id: web::Path<String>,
) -> AppResult<HttpResponse> {
    let node_id = node_id.into_inner();
    let metrics = service.get_system_metrics(&node_id).await?;

    Ok(HttpResponse::Ok().json(metrics))
}

/// Get metrics history with statistics
///
/// GET /api/monitoring/history
pub async fn get_metrics_history(
    service: web::Data<MonitoringService>,
    query: web::Query<MetricsQuery>,
) -> AppResult<HttpResponse> {
    let query = query.into_inner();
    let response = service.get_metrics_history(&query).await?;

    Ok(HttpResponse::Ok().json(response))
}

/// Get all alerts
///
/// GET /api/monitoring/alerts
///
/// Query parameters:
/// - node_id: Optional node ID filter
/// - severity: Optional severity filter
/// - status: Optional status filter
/// - limit: Optional result limit
pub async fn get_alerts(
    service: web::Data<MonitoringService>,
    query: web::Query<AlertQuery>,
) -> AppResult<HttpResponse> {
    let query = query.into_inner();
    let alerts = service.query_alerts(&query).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "alerts": alerts,
        "count": alerts.len()
    })))
}

/// Get a specific alert by ID
///
/// GET /api/monitoring/alerts/{id}
pub async fn get_alert(
    service: web::Data<MonitoringService>,
    alert_id: web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    let id = alert_id.into_inner();
    let alert = service.get_alert(&id).await?;

    Ok(HttpResponse::Ok().json(alert))
}

/// Acknowledge an alert
///
/// POST /api/monitoring/alerts/{id}/acknowledge
pub async fn acknowledge_alert(
    service: web::Data<MonitoringService>,
    alert_id: web::Path<Uuid>,
    request: web::Json<AcknowledgeAlertRequest>,
) -> AppResult<HttpResponse> {
    let id = alert_id.into_inner();
    let request = request.into_inner();
    let alert = service.acknowledge_alert(&id, request).await?;

    Ok(HttpResponse::Ok().json(alert))
}

/// Resolve an alert
///
/// POST /api/monitoring/alerts/{id}/resolve
pub async fn resolve_alert(
    service: web::Data<MonitoringService>,
    alert_id: web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    let id = alert_id.into_inner();
    let alert = service.resolve_alert(&id).await?;

    Ok(HttpResponse::Ok().json(alert))
}

/// Suppress an alert
///
/// POST /api/monitoring/alerts/{id}/suppress
pub async fn suppress_alert(
    service: web::Data<MonitoringService>,
    alert_id: web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    let id = alert_id.into_inner();
    let alert = service.suppress_alert(&id).await?;

    Ok(HttpResponse::Ok().json(alert))
}

/// Get alert rules
///
/// GET /api/monitoring/alerts/rules
pub async fn get_alert_rules(
    service: web::Data<MonitoringService>,
) -> AppResult<HttpResponse> {
    let rules = service.get_alert_rules().await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "rules": rules,
        "count": rules.len()
    })))
}

/// Create an alert rule
///
/// POST /api/monitoring/alerts/rules
pub async fn create_alert_rule(
    service: web::Data<MonitoringService>,
    rule: web::Json<AlertRuleCreate>,
) -> AppResult<HttpResponse> {
    let rule = rule.into_inner();
    let created_rule = service.create_alert_rule(rule).await?;

    Ok(HttpResponse::Created().json(created_rule))
}

/// Update an alert rule
///
/// PUT /api/monitoring/alerts/rules/{id}
pub async fn update_alert_rule(
    service: web::Data<MonitoringService>,
    rule_id: web::Path<Uuid>,
    rule: web::Json<AlertRuleUpdate>,
) -> AppResult<HttpResponse> {
    let id = rule_id.into_inner();
    let rule = rule.into_inner();
    let updated_rule = service.update_alert_rule(&id, rule).await?;

    Ok(HttpResponse::Ok().json(updated_rule))
}

/// Delete an alert rule
///
/// DELETE /api/monitoring/alerts/rules/{id}
pub async fn delete_alert_rule(
    service: web::Data<MonitoringService>,
    rule_id: web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    let id = rule_id.into_inner();
    service.delete_alert_rule(&id).await?;

    Ok(HttpResponse::NoContent().finish())
}

/// Get network topology
///
/// GET /api/monitoring/topology
pub async fn get_network_topology(
    service: web::Data<MonitoringService>,
) -> AppResult<HttpResponse> {
    let topology = service.get_network_topology().await?;

    Ok(HttpResponse::Ok().json(topology))
}

/// Refresh network topology
///
/// POST /api/monitoring/topology/refresh
pub async fn refresh_network_topology(
    service: web::Data<MonitoringService>,
) -> AppResult<HttpResponse> {
    let topology = service.refresh_network_topology().await?;

    Ok(HttpResponse::Ok().json(topology))
}

/// Get aggregated metrics
///
/// POST /api/monitoring/aggregation
pub async fn aggregate_metrics(
    service: web::Data<MonitoringService>,
    request: web::Json<MetricsAggregationRequest>,
) -> AppResult<HttpResponse> {
    let request = request.into_inner();
    let result = service.aggregate_metrics(request).await?;

    Ok(HttpResponse::Ok().json(result))
}

/// Get node health status
///
/// GET /api/monitoring/health/{node_id}
pub async fn get_node_health(
    service: web::Data<MonitoringService>,
    node_id: web::Path<String>,
) -> AppResult<HttpResponse> {
    let node_id = node_id.into_inner();
    let health = service.get_node_health(&node_id).await?;

    Ok(HttpResponse::Ok().json(health))
}

/// Get all nodes health status
///
/// GET /api/monitoring/health
pub async fn get_all_nodes_health(
    service: web::Data<MonitoringService>,
) -> AppResult<HttpResponse> {
    let health = service.get_all_nodes_health().await?;

    Ok(HttpResponse::Ok().json(health))
}

/// Trigger immediate metrics collection
///
/// POST /api/monitoring/collect
pub async fn trigger_metrics_collection(
    service: web::Data<MonitoringService>,
) -> AppResult<HttpResponse> {
    service.collect_all_metrics().await?;

    Ok(HttpResponse::Accepted().json(serde_json::json!({
        "message": "Metrics collection triggered"
    })))
}

/// Query parameters for alert filtering
#[derive(Debug, Clone, serde::Deserialize)]
pub struct AlertQuery {
    /// Optional node ID filter
    pub node_id: Option<String>,

    /// Optional severity filter
    pub severity: Option<String>,

    /// Optional status filter
    pub status: Option<String>,

    /// Optional limit on number of results
    pub limit: Option<usize>,

    /// Optional offset for pagination
    pub offset: Option<usize>,
}

/// Request to create an alert rule
#[derive(Debug, Clone, serde::Deserialize)]
pub struct AlertRuleCreate {
    pub name: String,
    pub description: Option<String>,
    pub metric_name: String,
    pub metric_type: crate::models::monitoring::MetricType,
    pub threshold: f64,
    pub operator: crate::models::monitoring::AlertOperator,
    pub severity: crate::models::monitoring::AlertSeverity,
    pub for_seconds: u32,
    pub labels: Vec<crate::models::monitoring::MetricLabel>,
}

/// Request to update an alert rule
#[derive(Debug, Clone, serde::Deserialize)]
pub struct AlertRuleUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub threshold: Option<f64>,
    pub operator: Option<crate::models::monitoring::AlertOperator>,
    pub severity: Option<crate::models::monitoring::AlertSeverity>,
    pub for_seconds: Option<u32>,
    pub enabled: Option<bool>,
    pub labels: Option<Vec<crate::models::monitoring::MetricLabel>>,
}

/// Node health information
#[derive(Debug, Clone, serde::Serialize)]
pub struct NodeHealth {
    pub node_id: String,
    pub node_name: String,
    pub status: crate::models::monitoring::HealthStatus,
    pub cpu_usage_percent: f64,
    pub memory_usage_percent: f64,
    pub disk_usage_percent: f64,
    pub uptime_seconds: u64,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_alert_query_creation() {
        let query = AlertQuery {
            node_id: Some("node-1".to_string()),
            severity: Some("critical".to_string()),
            status: Some("active".to_string()),
            limit: Some(10),
            offset: None,
        };

        assert_eq!(query.node_id, Some("node-1".to_string()));
        assert_eq!(query.limit, Some(10));
    }
}