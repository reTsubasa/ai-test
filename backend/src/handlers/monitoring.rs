//! Monitoring and statistics HTTP handlers
//!
//! This module contains handlers for all monitoring-related API endpoints
//! including metrics retrieval, alerts, network statistics, and historical data.

use actix_web::{web, HttpResponse};
use uuid::Uuid;

use crate::error::AppResult;
use crate::models::monitoring::{
    AlertOperator, AlertSeverity, AlertStatus, MetricsQuery,
    MetricType,
};
use crate::services::monitoring::{AlertRuleCreate, AlertRuleUpdate, MonitoringService};

/// Get system metrics (CPU, memory, disk, network)
///
/// GET /api/monitoring/system
///
/// Query parameters:
/// - node_id: Optional node ID filter (defaults to 'default')
pub async fn get_system_metrics(
    service: web::Data<MonitoringService>,
    query: web::Query<SystemMetricsQuery>,
) -> AppResult<HttpResponse> {
    let node_id = query.node_id.as_deref();
    let metrics = service.get_system_metrics(node_id).await?;

    Ok(HttpResponse::Ok().json(metrics))
}

/// Get network traffic statistics
///
/// GET /api/monitoring/network
///
/// Query parameters:
/// - node_id: Optional node ID filter
/// - interface: Optional interface name filter
pub async fn get_network_statistics(
    service: web::Data<MonitoringService>,
    query: web::Query<NetworkQuery>,
) -> AppResult<HttpResponse> {
    let node_id = query.node_id.as_deref();
    let interface = query.interface.as_deref();
    let stats = service.get_network_statistics(node_id, interface).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "statistics": stats,
        "count": stats.len()
    })))
}

/// Get historical monitoring data
///
/// GET /api/monitoring/history
///
/// Query parameters:
/// - node_id: Optional node ID filter
/// - metric_name: Optional metric name filter
/// - metric_type: Optional metric type filter
/// - start_time: Optional start time (ISO 8601)
/// - end_time: Optional end time (ISO 8601)
/// - limit: Optional result limit
/// - sort_order: Optional sort order (asc/desc)
pub async fn get_history(
    service: web::Data<MonitoringService>,
    query: web::Query<MetricsQuery>,
) -> AppResult<HttpResponse> {
    let query = query.into_inner();
    let response = service.get_metrics_history(&query).await?;

    Ok(HttpResponse::Ok().json(response))
}

/// Get system alerts
///
/// GET /api/monitoring/alerts
///
/// Query parameters:
/// - node_id: Optional node ID filter
/// - severity: Optional severity filter (critical, warning, info)
/// - status: Optional status filter (active, acknowledged, resolved, suppressed)
pub async fn get_alerts(
    service: web::Data<MonitoringService>,
    query: web::Query<AlertsQuery>,
) -> AppResult<HttpResponse> {
    let node_id = query.node_id.as_deref();
    let severity = parse_alert_severity(&query.severity);
    let status = parse_alert_status(&query.status);

    let alerts = service.get_alerts(node_id, severity, status).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "alerts": alerts,
        "count": alerts.len()
    })))
}

/// Create a new alert rule
///
/// POST /api/monitoring/alerts
///
/// Request body:
/// ```json
/// {
///   "name": "High CPU Alert",
///   "description": "Alert when CPU usage exceeds threshold",
///   "metric_name": "cpu_usage",
///   "metric_type": "cpu",
///   "threshold": 90.0,
///   "operator": "greater_than",
///   "severity": "critical",
///   "for_seconds": 300,
///   "labels": []
/// }
/// ```
pub async fn create_alert(
    service: web::Data<MonitoringService>,
    rule: web::Json<AlertRuleCreateRequest>,
) -> AppResult<HttpResponse> {
    let request = rule.into_inner();

    let rule_create = AlertRuleCreate {
        name: request.name,
        description: request.description,
        metric_name: request.metric_name,
        metric_type: request.metric_type,
        threshold: request.threshold,
        operator: request.operator,
        severity: request.severity,
        for_seconds: request.for_seconds,
        labels: request.labels,
    };

    let created_rule = service.create_alert_rule(rule_create).await?;

    Ok(HttpResponse::Created().json(created_rule))
}

/// Update an alert rule
///
/// PUT /api/monitoring/alerts/{id}
///
/// Request body:
/// ```json
/// {
///   "name": "Updated Alert Name",
///   "description": "Updated description",
///   "threshold": 95.0,
///   "severity": "warning",
///   "enabled": true
/// }
/// ```
pub async fn update_alert(
    service: web::Data<MonitoringService>,
    rule_id: web::Path<Uuid>,
    rule: web::Json<AlertRuleUpdateRequest>,
) -> AppResult<HttpResponse> {
    let id = rule_id.into_inner();
    let request = rule.into_inner();

    let rule_update = AlertRuleUpdate {
        name: request.name,
        description: request.description,
        threshold: request.threshold,
        operator: request.operator,
        severity: request.severity,
        for_seconds: request.for_seconds,
        enabled: request.enabled,
        labels: request.labels,
    };

    let updated_rule = service.update_alert_rule(&id, rule_update).await?;

    Ok(HttpResponse::Ok().json(updated_rule))
}

/// Delete an alert rule
///
/// DELETE /api/monitoring/alerts/{id}
pub async fn delete_alert(
    service: web::Data<MonitoringService>,
    rule_id: web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    let id = rule_id.into_inner();
    service.delete_alert_rule(&id).await?;

    Ok(HttpResponse::NoContent().finish())
}

/// Get a specific alert rule by ID
///
/// GET /api/monitoring/alerts/rules/{id}
pub async fn get_alert_rule(
    service: web::Data<MonitoringService>,
    rule_id: web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    let id = rule_id.into_inner();
    let rules = service.get_alert_rules().await?;

    let rule = rules
        .into_iter()
        .find(|r| r.id == id)
        .ok_or_else(|| crate::error::AppError::NotFound(format!("Alert rule {} not found", id)))?;

    Ok(HttpResponse::Ok().json(rule))
}

/// Get all alert rules
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

// Query parameter structures

/// Query parameters for system metrics
#[derive(Debug, Clone, serde::Deserialize)]
pub struct SystemMetricsQuery {
    /// Optional node ID filter
    pub node_id: Option<String>,
}

/// Query parameters for network statistics
#[derive(Debug, Clone, serde::Deserialize)]
pub struct NetworkQuery {
    /// Optional node ID filter
    pub node_id: Option<String>,

    /// Optional interface name filter
    pub interface: Option<String>,
}

/// Query parameters for alerts
#[derive(Debug, Clone, serde::Deserialize)]
pub struct AlertsQuery {
    /// Optional node ID filter
    pub node_id: Option<String>,

    /// Optional severity filter
    pub severity: Option<String>,

    /// Optional status filter
    pub status: Option<String>,

    /// Optional limit on number of results
    pub limit: Option<usize>,
}

/// Request to create an alert rule
#[derive(Debug, Clone, serde::Deserialize)]
pub struct AlertRuleCreateRequest {
    pub name: String,
    pub description: Option<String>,
    pub metric_name: String,
    pub metric_type: MetricType,
    pub threshold: f64,
    pub operator: AlertOperator,
    pub severity: AlertSeverity,
    pub for_seconds: u32,
    pub labels: Vec<crate::models::monitoring::MetricLabel>,
}

/// Request to update an alert rule
#[derive(Debug, Clone, serde::Deserialize)]
pub struct AlertRuleUpdateRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub threshold: Option<f64>,
    pub operator: Option<AlertOperator>,
    pub severity: Option<AlertSeverity>,
    pub for_seconds: Option<u32>,
    pub enabled: Option<bool>,
    pub labels: Option<Vec<crate::models::monitoring::MetricLabel>>,
}

/// Helper function to parse alert severity from string
fn parse_alert_severity(value: &Option<String>) -> Option<AlertSeverity> {
    match value.as_deref() {
        Some("critical") => Some(AlertSeverity::Critical),
        Some("warning") => Some(AlertSeverity::Warning),
        Some("info") => Some(AlertSeverity::Info),
        _ => None,
    }
}

/// Helper function to parse alert status from string
fn parse_alert_status(value: &Option<String>) -> Option<AlertStatus> {
    match value.as_deref() {
        Some("active") => Some(AlertStatus::Active),
        Some("acknowledged") => Some(AlertStatus::Acknowledged),
        Some("resolved") => Some(AlertStatus::Resolved),
        Some("suppressed") => Some(AlertStatus::Suppressed),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_alert_query_creation() {
        let query = AlertsQuery {
            node_id: Some("node-1".to_string()),
            severity: Some("critical".to_string()),
            status: Some("active".to_string()),
            limit: Some(10),
        };

        assert_eq!(query.node_id, Some("node-1".to_string()));
        assert_eq!(query.limit, Some(10));
    }

    #[test]
    fn test_parse_alert_severity() {
        assert_eq!(
            parse_alert_severity(&Some("critical".to_string())),
            Some(AlertSeverity::Critical)
        );
        assert_eq!(
            parse_alert_severity(&Some("warning".to_string())),
            Some(AlertSeverity::Warning)
        );
        assert_eq!(
            parse_alert_severity(&Some("info".to_string())),
            Some(AlertSeverity::Info)
        );
        assert_eq!(parse_alert_severity(&Some("invalid".to_string())), None);
    }

    #[test]
    fn test_parse_alert_status() {
        assert_eq!(
            parse_alert_status(&Some("active".to_string())),
            Some(AlertStatus::Active)
        );
        assert_eq!(
            parse_alert_status(&Some("acknowledged".to_string())),
            Some(AlertStatus::Acknowledged)
        );
        assert_eq!(
            parse_alert_status(&Some("resolved".to_string())),
            Some(AlertStatus::Resolved)
        );
        assert_eq!(
            parse_alert_status(&Some("suppressed".to_string())),
            Some(AlertStatus::Suppressed)
        );
        assert_eq!(parse_alert_status(&Some("invalid".to_string())), None);
    }
}