//! Monitoring service
//!
//! This module provides the business logic for monitoring system metrics,
//! collecting historical data, and managing alert rules.

use crate::config::AppConfig;
use crate::error::AppError;
use crate::models::monitoring::{
    Alert, AlertOperator, AlertRule, AlertSeverity, AlertStatus, CpuMetrics,
    DiskMetrics, MemoryMetrics, MetricsHistoryResponse, MetricsQuery, MetricsStatistics,
    MetricType, NetworkMetrics, SystemMetrics,
};
use chrono::Utc;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, info};
use uuid::Uuid;

/// In-memory storage for monitoring data
#[derive(Debug, Clone, Default)]
struct MonitoringStore {
    /// Historical metrics data
    metrics_history: Vec<crate::models::monitoring::MetricData>,

    /// Active alerts
    alerts: Vec<Alert>,

    /// Alert rules
    alert_rules: Vec<AlertRule>,

    /// Last collected system metrics
    system_metrics: HashMap<String, SystemMetrics>,
}

/// Monitoring service
#[derive(Clone)]
pub struct MonitoringService {
    config: AppConfig,
    store: Arc<RwLock<MonitoringStore>>,
}

impl MonitoringService {
    /// Create a new monitoring service
    pub fn new(config: AppConfig) -> Self {
        Self {
            config,
            store: Arc::new(RwLock::new(MonitoringStore::default())),
        }
    }

    /// Get current system metrics (CPU, memory, disk, network)
    pub async fn get_system_metrics(
        &self,
        node_id: Option<&str>,
    ) -> Result<SystemMetrics, AppError> {
        debug!("Fetching system metrics for node: {:?}", node_id);

        let id = node_id.unwrap_or("default");

        let store = self.store.read().await;

        if let Some(metrics) = store.system_metrics.get(id) {
            Ok(metrics.clone())
        } else {
            // Return mock metrics if not yet collected
            Ok(SystemMetrics {
                node_id: id.to_string(),
                node_name: format!("Node-{}", id),
                timestamp: Utc::now(),
                cpu: CpuMetrics {
                    usage_percent: 25.5,
                    core_count: 4,
                    core_usage: vec![20.0, 25.0, 30.0, 27.0],
                    user_percent: 15.0,
                    system_percent: 10.0,
                    idle_percent: 75.0,
                    iowait_percent: 0.5,
                    steal_percent: 0.0,
                    frequency_mhz: Some(2400.0),
                    temperature_celsius: Some(45.0),
                },
                memory: MemoryMetrics {
                    total_bytes: 8 * 1024 * 1024 * 1024,
                    available_bytes: 4 * 1024 * 1024 * 1024,
                    used_bytes: 4 * 1024 * 1024 * 1024,
                    usage_percent: 50.0,
                    cached_bytes: 2 * 1024 * 1024 * 1024,
                    buffer_bytes: 512 * 1024 * 1024,
                    swap_total_bytes: 2 * 1024 * 1024 * 1024,
                    swap_used_bytes: 0,
                    swap_usage_percent: 0.0,
                },
                disks: vec![DiskMetrics {
                    device: "/dev/sda1".to_string(),
                    mount_point: "/".to_string(),
                    fs_type: "ext4".to_string(),
                    total_bytes: 500 * 1024 * 1024 * 1024,
                    used_bytes: 250 * 1024 * 1024 * 1024,
                    available_bytes: 250 * 1024 * 1024 * 1024,
                    usage_percent: 50.0,
                    inodes_total: 32_000_000,
                    inodes_used: 8_000_000,
                    inodes_usage_percent: 25.0,
                    read_ops: 1000,
                    write_ops: 500,
                    read_bytes: 10 * 1024 * 1024,
                    write_bytes: 5 * 1024 * 1024,
                    io_in_progress: Some(0),
                }],
                network: vec![
                    NetworkMetrics {
                        interface: "eth0".to_string(),
                        status: crate::models::monitoring::NetworkInterfaceStatus::Up,
                        rx_bytes: 1_000_000_000,
                        tx_bytes: 500_000_000,
                        rx_packets: 1_000_000,
                        tx_packets: 500_000,
                        rx_errors: 0,
                        tx_errors: 0,
                        rx_drops: 10,
                        tx_drops: 5,
                        rx_bps: 1_000_000_000.0,
                        tx_bps: 500_000_000.0,
                        avg_packet_size: Some(1000.0),
                        link_speed_mbps: Some(1000),
                        mac_address: Some("00:11:22:33:44:55".to_string()),
                        ip_addresses: vec![
                            crate::models::monitoring::IpAddressInfo {
                                address: "192.168.1.1".to_string(),
                                prefix_length: 24,
                                ip_type: crate::models::monitoring::IpType::IPv4,
                            },
                        ],
                    },
                ],
                load_average: [0.5, 0.7, 0.6],
                uptime_seconds: 3600,
                process_count: 150,
                system_time: Utc::now(),
            })
        }
    }

    /// Get network traffic statistics
    pub async fn get_network_statistics(
        &self,
        node_id: Option<&str>,
        interface: Option<&str>,
    ) -> Result<Vec<NetworkMetrics>, AppError> {
        debug!("Fetching network statistics for node: {:?}, interface: {:?}", node_id, interface);

        let system_metrics = self.get_system_metrics(node_id).await?;

        if let Some(iface) = interface {
            Ok(system_metrics
                .network
                .into_iter()
                .filter(|n| n.interface == iface)
                .collect())
        } else {
            Ok(system_metrics.network)
        }
    }

    /// Get historical monitoring data
    pub async fn get_metrics_history(
        &self,
        query: &MetricsQuery,
    ) -> Result<MetricsHistoryResponse, AppError> {
        debug!("Fetching metrics history with query: {:?}", query);

        let store = self.store.read().await;

        let mut data: Vec<crate::models::monitoring::MetricData> = store
            .metrics_history
            .iter()
            .filter(|metric| {
                // Filter by node_id if specified
                if let Some(ref node_id) = query.node_id {
                    if &metric.node_id != node_id {
                        return false;
                    }
                }

                // Filter by metric_name if specified
                if let Some(ref metric_name) = query.metric_name {
                    if &metric.metric_name != metric_name {
                        return false;
                    }
                }

                // Filter by metric_type if specified
                if let Some(metric_type) = query.metric_type {
                    if metric.metric_type != metric_type {
                        return false;
                    }
                }

                // Filter by time range
                if let Some(start_time) = query.start_time {
                    if metric.timestamp < start_time {
                        return false;
                    }
                }

                if let Some(end_time) = query.end_time {
                    if metric.timestamp > end_time {
                        return false;
                    }
                }

                true
            })
            .cloned()
            .collect();

        // Sort results
        match query.sort_order {
            crate::models::monitoring::SortOrder::Asc => {
                data.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));
            }
            crate::models::monitoring::SortOrder::Desc => {
                data.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
            }
        }

        // Apply limit
        if let Some(limit) = query.limit {
            data.truncate(limit);
        }

        let total_count = data.len();

        // Calculate statistics if we have data
        let statistics = if data.is_empty() {
            None
        } else {
            let values: Vec<f64> = data.iter().map(|m| m.value).collect();
            let min = values.iter().cloned().fold(f64::INFINITY, f64::min);
            let max = values.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
            let sum: f64 = values.iter().sum();
            let avg = sum / values.len() as f64;

            // Calculate median
            let mut sorted_values = values.clone();
            sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
            let len = sorted_values.len();
            let median = if len % 2 == 0 {
                (sorted_values[len / 2 - 1] + sorted_values[len / 2]) / 2.0
            } else {
                sorted_values[len / 2]
            };

            // Calculate percentiles
            let percentile = |p: f64| -> f64 {
                let idx = ((values.len() - 1) as f64 * p / 100.0) as usize;
                sorted_values[idx]
            };

            Some(MetricsStatistics {
                min,
                max,
                avg,
                median,
                std_dev: {
                    let variance: f64 = values
                        .iter()
                        .map(|&x| (x - avg).powi(2))
                        .sum::<f64>()
                        / values.len() as f64;
                    Some(variance.sqrt())
                },
                percentiles: crate::models::monitoring::Percentiles {
                    p50: percentile(50.0),
                    p75: percentile(75.0),
                    p90: percentile(90.0),
                    p95: percentile(95.0),
                    p99: percentile(99.0),
                },
            })
        };

        Ok(MetricsHistoryResponse {
            query: query.clone(),
            data,
            total_count,
            statistics,
        })
    }

    /// Get all alerts
    pub async fn get_alerts(
        &self,
        node_id: Option<&str>,
        severity: Option<AlertSeverity>,
        status: Option<AlertStatus>,
    ) -> Result<Vec<Alert>, AppError> {
        debug!("Fetching alerts with filters: node_id={:?}, severity={:?}, status={:?}",
               node_id, severity, status);

        let store = self.store.read().await;

        let alerts: Vec<Alert> = store
            .alerts
            .iter()
            .filter(|alert| {
                if let Some(ref id) = node_id {
                    if &alert.node_id != id {
                        return false;
                    }
                }

                if let Some(s) = severity {
                    if alert.severity != s {
                        return false;
                    }
                }

                if let Some(s) = status {
                    if alert.status != s {
                        return false;
                    }
                }

                true
            })
            .cloned()
            .collect();

        Ok(alerts)
    }

    /// Get a specific alert by ID
    pub async fn get_alert(&self, id: &Uuid) -> Result<Alert, AppError> {
        debug!("Fetching alert: {}", id);

        let store = self.store.read().await;

        store
            .alerts
            .iter()
            .find(|a| &a.id == id)
            .cloned()
            .ok_or_else(|| AppError::NotFound(format!("Alert {} not found", id)))
    }

    /// Create a new alert rule
    pub async fn create_alert_rule(
        &self,
        rule: AlertRuleCreate,
    ) -> Result<AlertRule, AppError> {
        info!("Creating alert rule: {}", rule.name);

        let id = Uuid::new_v4();
        let now = Utc::now();

        let alert_rule = AlertRule {
            id,
            name: rule.name,
            description: rule.description,
            metric_name: rule.metric_name,
            metric_type: rule.metric_type,
            threshold: rule.threshold,
            operator: rule.operator,
            severity: rule.severity,
            for_seconds: rule.for_seconds,
            enabled: true,
            labels: rule.labels,
            created_at: now,
            updated_at: now,
        };

        let mut store = self.store.write().await;
        store.alert_rules.push(alert_rule.clone());

        info!("Alert rule created: {}", id);
        Ok(alert_rule)
    }

    /// Update an existing alert rule
    pub async fn update_alert_rule(
        &self,
        id: &Uuid,
        rule: AlertRuleUpdate,
    ) -> Result<AlertRule, AppError> {
        info!("Updating alert rule: {}", id);

        let mut store = self.store.write().await;

        let alert_rule = store
            .alert_rules
            .iter_mut()
            .find(|r| &r.id == id)
            .ok_or_else(|| AppError::NotFound(format!("Alert rule {} not found", id)))?;

        if let Some(name) = rule.name {
            alert_rule.name = name;
        }
        if let Some(description) = rule.description {
            alert_rule.description = Some(description);
        }
        if let Some(threshold) = rule.threshold {
            alert_rule.threshold = threshold;
        }
        if let Some(operator) = rule.operator {
            alert_rule.operator = operator;
        }
        if let Some(severity) = rule.severity {
            alert_rule.severity = severity;
        }
        if let Some(for_seconds) = rule.for_seconds {
            alert_rule.for_seconds = for_seconds;
        }
        if let Some(enabled) = rule.enabled {
            alert_rule.enabled = enabled;
        }
        if let Some(labels) = rule.labels {
            alert_rule.labels = labels;
        }

        alert_rule.updated_at = Utc::now();

        info!("Alert rule updated: {}", id);
        Ok(alert_rule.clone())
    }

    /// Delete an alert rule
    pub async fn delete_alert_rule(&self, id: &Uuid) -> Result<(), AppError> {
        info!("Deleting alert rule: {}", id);

        let mut store = self.store.write().await;

        let initial_len = store.alert_rules.len();
        store.alert_rules.retain(|r| &r.id != id);

        if store.alert_rules.len() == initial_len {
            return Err(AppError::NotFound(format!("Alert rule {} not found", id)));
        }

        info!("Alert rule deleted: {}", id);
        Ok(())
    }

    /// Get all alert rules
    pub async fn get_alert_rules(&self) -> Result<Vec<AlertRule>, AppError> {
        debug!("Fetching alert rules");

        let store = self.store.read().await;
        Ok(store.alert_rules.clone())
    }
}

/// Request to create an alert rule
#[derive(Debug, Clone)]
pub struct AlertRuleCreate {
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
#[derive(Debug, Clone)]
pub struct AlertRuleUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub threshold: Option<f64>,
    pub operator: Option<AlertOperator>,
    pub severity: Option<AlertSeverity>,
    pub for_seconds: Option<u32>,
    pub enabled: Option<bool>,
    pub labels: Option<Vec<crate::models::monitoring::MetricLabel>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_monitoring_service_creation() {
        let config = AppConfig::from_env().unwrap();
        let service = MonitoringService::new(config);
        assert_eq!(service.config.server_host, "127.0.0.1");
    }

    #[test]
    fn test_alert_rule_create() {
        let rule = AlertRuleCreate {
            name: "High CPU".to_string(),
            description: Some("Alert when CPU usage is high".to_string()),
            metric_name: "cpu_usage".to_string(),
            metric_type: MetricType::Cpu,
            threshold: 90.0,
            operator: AlertOperator::GreaterThan,
            severity: AlertSeverity::Critical,
            for_seconds: 300,
            labels: vec![],
        };

        assert_eq!(rule.name, "High CPU");
        assert_eq!(rule.severity, AlertSeverity::Critical);
    }
}