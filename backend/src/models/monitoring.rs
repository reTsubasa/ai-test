//! Monitoring and statistics models
//!
//! This module contains data models for monitoring system metrics,
//! alerts, and network topology visualization.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Metric type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MetricType {
    /// CPU usage metrics
    Cpu,
    /// Memory usage metrics
    Memory,
    /// Disk usage metrics
    Disk,
    /// Network traffic metrics
    Network,
    /// Interface status metrics
    Interface,
    /// System load metrics
    Load,
    /// Temperature metrics
    Temperature,
    /// Power metrics
    Power,
    /// Custom metric
    Custom,
}

/// Unit of measurement for metrics
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MetricUnit {
    /// Percentage (0-100)
    Percentage,
    /// Bytes
    Bytes,
    /// Bytes per second
    BytesPerSecond,
    /// Bits per second
    BitsPerSecond,
    /// Count
    Count,
    /// Degrees Celsius
    Celsius,
    /// Degrees Fahrenheit
    Fahrenheit,
    /// Volts
    Volts,
    /// Amperes
    Amperes,
    /// Watts
    Watts,
    /// Milliseconds
    Milliseconds,
    /// Seconds
    Seconds,
    /// Custom unit
    #[serde(rename = "custom")]
    Custom(String),
}

/// Individual metric data point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricData {
    /// Unique identifier for the metric data point
    pub id: Uuid,

    /// ID of the node this metric belongs to
    pub node_id: String,

    /// Name of the metric (e.g., "cpu_usage", "memory_available")
    pub metric_name: String,

    /// Type of metric
    pub metric_type: MetricType,

    /// Value of the metric
    pub value: f64,

    /// Unit of measurement
    pub unit: MetricUnit,

    /// Timestamp when the metric was collected
    pub timestamp: DateTime<Utc>,

    /// Optional labels/tags for the metric
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub labels: Vec<MetricLabel>,

    /// Optional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// Label/tag for a metric
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricLabel {
    /// Label key
    pub key: String,

    /// Label value
    pub value: String,
}

/// Request to query metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsQuery {
    /// Optional node ID filter
    pub node_id: Option<String>,

    /// Optional metric name filter
    pub metric_name: Option<String>,

    /// Optional metric type filter
    pub metric_type: Option<MetricType>,

    /// Start time for the query
    pub start_time: Option<DateTime<Utc>>,

    /// End time for the query
    pub end_time: Option<DateTime<Utc>>,

    /// Limit on the number of results
    pub limit: Option<usize>,

    /// Sort order (asc or desc)
    #[serde(default)]
    pub sort_order: SortOrder,
}

/// Sort order for query results
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SortOrder {
    Asc,
    Desc,
}

impl Default for SortOrder {
    fn default() -> Self {
        SortOrder::Desc
    }
}

/// CPU-specific metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuMetrics {
    /// Overall CPU usage percentage (0-100)
    pub usage_percent: f64,

    /// Number of CPU cores
    pub core_count: u32,

    /// CPU usage per core (index 0 = core 1)
    pub core_usage: Vec<f64>,

    /// CPU user time percentage
    pub user_percent: f64,

    /// CPU system time percentage
    pub system_percent: f64,

    /// CPU idle time percentage
    pub idle_percent: f64,

    /// CPU I/O wait percentage
    pub iowait_percent: f64,

    /// CPU steal time percentage (for virtualized systems)
    pub steal_percent: f64,

    /// CPU frequency in MHz
    pub frequency_mhz: Option<f64>,

    /// CPU temperature in Celsius
    pub temperature_celsius: Option<f64>,
}

/// Memory-specific metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryMetrics {
    /// Total memory in bytes
    pub total_bytes: u64,

    /// Available memory in bytes
    pub available_bytes: u64,

    /// Used memory in bytes
    pub used_bytes: u64,

    /// Memory usage percentage (0-100)
    pub usage_percent: f64,

    /// Cached memory in bytes
    pub cached_bytes: u64,

    /// Buffer memory in bytes
    pub buffer_bytes: u64,

    /// Swap total in bytes
    pub swap_total_bytes: u64,

    /// Swap used in bytes
    pub swap_used_bytes: u64,

    /// Swap usage percentage (0-100)
    pub swap_usage_percent: f64,
}

/// Disk-specific metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskMetrics {
    /// Disk mount point or device name
    pub device: String,

    /// Mount point
    pub mount_point: String,

    /// File system type
    pub fs_type: String,

    /// Total disk space in bytes
    pub total_bytes: u64,

    /// Used disk space in bytes
    pub used_bytes: u64,

    /// Available disk space in bytes
    pub available_bytes: u64,

    /// Disk usage percentage (0-100)
    pub usage_percent: f64,

    /// Number of inodes
    pub inodes_total: u64,

    /// Number of used inodes
    pub inodes_used: u64,

    /// Inode usage percentage (0-100)
    pub inodes_usage_percent: f64,

    /// Read operations count
    pub read_ops: u64,

    /// Write operations count
    pub write_ops: u64,

    /// Bytes read
    pub read_bytes: u64,

    /// Bytes written
    pub write_bytes: u64,

    /// I/O operations in progress
    pub io_in_progress: Option<u64>,
}

/// Network-specific metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkMetrics {
    /// Interface name
    pub interface: String,

    /// Interface status
    pub status: NetworkInterfaceStatus,

    /// Bytes received
    pub rx_bytes: u64,

    /// Bytes transmitted
    pub tx_bytes: u64,

    /// Packets received
    pub rx_packets: u64,

    /// Packets transmitted
    pub tx_packets: u64,

    /// Receive errors
    pub rx_errors: u64,

    /// Transmit errors
    pub tx_errors: u64,

    /// Receive drops
    pub rx_drops: u64,

    /// Transmit drops
    pub tx_drops: u64,

    /// Receive bitrate in bits per second
    pub rx_bps: f64,

    /// Transmit bitrate in bits per second
    pub tx_bps: f64,

    /// Number of bytes per packet (average)
    pub avg_packet_size: Option<f64>,

    /// Link speed in Mbps
    pub link_speed_mbps: Option<u64>,

    /// MAC address
    pub mac_address: Option<String>,

    /// IP addresses
    pub ip_addresses: Vec<IpAddressInfo>,
}

/// Network interface status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NetworkInterfaceStatus {
    Up,
    Down,
    Unknown,
}

/// IP address information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpAddressInfo {
    /// IP address
    pub address: String,

    /// CIDR prefix length
    pub prefix_length: u8,

    /// IP type
    #[serde(rename = "type")]
    pub ip_type: IpType,
}

/// IP address type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IpType {
    IPv4,
    IPv6,
}

/// Comprehensive system metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    /// Node ID
    pub node_id: String,

    /// Node name/hostname
    pub node_name: String,

    /// Timestamp when metrics were collected
    pub timestamp: DateTime<Utc>,

    /// CPU metrics
    pub cpu: CpuMetrics,

    /// Memory metrics
    pub memory: MemoryMetrics,

    /// Disk metrics for all mounted filesystems
    pub disks: Vec<DiskMetrics>,

    /// Network metrics for all interfaces
    pub network: Vec<NetworkMetrics>,

    /// System load averages (1min, 5min, 15min)
    pub load_average: [f64; 3],

    /// System uptime in seconds
    pub uptime_seconds: u64,

    /// Number of running processes
    pub process_count: u32,

    /// System time
    pub system_time: DateTime<Utc>,
}

/// Monitoring summary for dashboard
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringSummary {
    /// Overall system health status
    pub overall_status: HealthStatus,

    /// Number of nodes being monitored
    pub total_nodes: u32,

    /// Number of nodes with issues
    pub nodes_with_issues: u32,

    /// Aggregate CPU usage across all nodes
    pub aggregate_cpu: CpuMetricsSummary,

    /// Aggregate memory usage across all nodes
    pub aggregate_memory: MemoryMetricsSummary,

    /// Total network throughput
    pub aggregate_network: NetworkMetricsSummary,

    /// Active alerts count
    pub active_alerts: u32,

    /// Alert summary by severity
    pub alerts_by_severity: AlertsBySeverity,

    /// Timestamp when summary was generated
    pub timestamp: DateTime<Utc>,
}

/// Health status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HealthStatus {
    Healthy,
    Warning,
    Critical,
    Unknown,
}

/// CPU metrics summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuMetricsSummary {
    /// Average CPU usage across all nodes
    pub average_usage_percent: f64,

    /// Maximum CPU usage across all nodes
    pub max_usage_percent: f64,

    /// Node ID with maximum CPU usage
    pub max_usage_node: Option<String>,

    /// Total CPU cores across all nodes
    pub total_cores: u32,
}

/// Memory metrics summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryMetricsSummary {
    /// Average memory usage percentage across all nodes
    pub average_usage_percent: f64,

    /// Maximum memory usage across all nodes
    pub max_usage_percent: f64,

    /// Node ID with maximum memory usage
    pub max_usage_node: Option<String>,

    /// Total memory across all nodes in bytes
    pub total_bytes: u64,

    /// Total used memory across all nodes in bytes
    pub used_bytes: u64,
}

/// Network metrics summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkMetricsSummary {
    /// Total receive throughput in bits per second
    pub total_rx_bps: f64,

    /// Total transmit throughput in bits per second
    pub total_tx_bps: f64,

    /// Total throughput in bits per second
    pub total_bps: f64,

    /// Number of active interfaces
    pub active_interfaces: u32,
}

/// Alerts summary by severity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertsBySeverity {
    /// Number of critical alerts
    pub critical: u32,

    /// Number of warning alerts
    pub warning: u32,

    /// Number of info alerts
    pub info: u32,
}

/// Alert severity level
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

/// Alert status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AlertStatus {
    /// Alert is active and not acknowledged
    Active,
    /// Alert has been acknowledged but not resolved
    Acknowledged,
    /// Alert has been resolved
    Resolved,
    /// Alert has been suppressed
    Suppressed,
}

/// Alert model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    /// Unique identifier for the alert
    pub id: Uuid,

    /// Node ID where the alert originated
    pub node_id: String,

    /// Alert severity
    pub severity: AlertSeverity,

    /// Alert title
    pub title: String,

    /// Detailed description of the alert
    pub description: String,

    /// Current status of the alert
    pub status: AlertStatus,

    /// Metric that triggered the alert
    pub metric_name: Option<String>,

    /// Threshold value that was crossed
    pub threshold_value: Option<f64>,

    /// Actual value that triggered the alert
    pub actual_value: Option<f64>,

    /// When the alert was first triggered
    pub triggered_at: DateTime<Utc>,

    /// When the alert was last updated
    pub updated_at: DateTime<Utc>,

    /// When the alert was acknowledged
    pub acknowledged_at: Option<DateTime<Utc>>,

    /// User who acknowledged the alert
    pub acknowledged_by: Option<String>,

    /// When the alert was resolved
    pub resolved_at: Option<DateTime<Utc>>,

    /// Number of times this alert has triggered
    pub trigger_count: u32,

    /// Associated labels/tags
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub labels: Vec<MetricLabel>,

    /// Additional alert data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

/// Request to acknowledge an alert
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcknowledgeAlertRequest {
    /// Optional comment/reason for acknowledging
    pub comment: Option<String>,
}

/// Alert rule configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertRule {
    /// Unique identifier
    pub id: Uuid,

    /// Rule name
    pub name: String,

    /// Description of the rule
    pub description: Option<String>,

    /// Metric name to monitor
    pub metric_name: String,

    /// Metric type
    pub metric_type: MetricType,

    /// Threshold value
    pub threshold: f64,

    /// Comparison operator
    pub operator: AlertOperator,

    /// Severity level for alerts from this rule
    pub severity: AlertSeverity,

    /// Duration the condition must be met before triggering (seconds)
    pub for_seconds: u32,

    /// Whether the rule is enabled
    pub enabled: bool,

    /// Labels to apply to alerts from this rule
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub labels: Vec<MetricLabel>,

    /// Created timestamp
    pub created_at: DateTime<Utc>,

    /// Updated timestamp
    pub updated_at: DateTime<Utc>,
}

/// Alert comparison operator
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AlertOperator {
    /// Greater than
    GreaterThan,
    /// Less than
    LessThan,
    /// Greater than or equal to
    GreaterThanOrEqual,
    /// Less than or equal to
    LessThanOrEqual,
    /// Equal to
    Equal,
    /// Not equal to
    NotEqual,
}

/// Network topology node
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopologyNode {
    /// Unique identifier
    pub id: String,

    /// Node name
    pub name: String,

    /// Node type
    pub node_type: TopologyNodeType,

    /// Hostname or IP address
    pub host: String,

    /// Current status
    pub status: HealthStatus,

    /// Position in visualization (x, y)
    pub position: Option<TopologyPosition>,

    /// Additional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// Topology node type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TopologyNodeType {
    /// VyOS router
    Router,
    /// Layer 2 switch
    Switch,
    /// Firewall
    Firewall,
    /// Server
    Server,
    /// Workstation
    Workstation,
    /// Unknown device
    Unknown,
}

/// Position for topology visualization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopologyPosition {
    /// X coordinate
    pub x: f64,

    /// Y coordinate
    pub y: f64,
}

/// Network topology link/connection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopologyLink {
    /// Unique identifier
    pub id: String,

    /// Source node ID
    pub source: String,

    /// Target node ID
    pub target: String,

    /// Link type
    pub link_type: TopologyLinkType,

    /// Source interface name
    pub source_interface: Option<String>,

    /// Target interface name
    pub target_interface: Option<String>,

    /// Current link status
    pub status: LinkStatus,

    /// Link bandwidth in Mbps
    pub bandwidth_mbps: Option<u64>,

    /// Current throughput as percentage of bandwidth
    pub utilization_percent: Option<f64>,

    /// Additional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// Topology link type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TopologyLinkType {
    /// Ethernet link
    Ethernet,
    /// Fiber optic link
    Fiber,
    /// Wireless link
    Wireless,
    /// VPN tunnel
    Vpn,
    /// Logical connection
    Logical,
}

/// Link status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LinkStatus {
    /// Link is up
    Up,
    /// Link is down
    Down,
    /// Link status unknown
    Unknown,
}

/// Complete network topology
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkTopology {
    /// All nodes in the topology
    pub nodes: Vec<TopologyNode>,

    /// All links in the topology
    pub links: Vec<TopologyLink>,

    /// Topology version/hash
    pub version: String,

    /// When topology was last updated
    pub updated_at: DateTime<Utc>,
}

/// Metrics history response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsHistoryResponse {
    /// Query parameters used
    pub query: MetricsQuery,

    /// Metric data points
    pub data: Vec<MetricData>,

    /// Total number of points matching the query
    pub total_count: usize,

    /// Aggregated statistics
    pub statistics: Option<MetricsStatistics>,
}

/// Statistics for a set of metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsStatistics {
    /// Minimum value
    pub min: f64,

    /// Maximum value
    pub max: f64,

    /// Average value
    pub avg: f64,

    /// Median value
    pub median: f64,

    /// Standard deviation
    pub std_dev: Option<f64>,

    /// Percentiles
    pub percentiles: Percentiles,
}

/// Percentile values
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Percentiles {
    /// 50th percentile (median)
    pub p50: f64,

    /// 75th percentile
    pub p75: f64,

    /// 90th percentile
    pub p90: f64,

    /// 95th percentile
    pub p95: f64,

    /// 99th percentile
    pub p99: f64,
}

/// Real-time metrics update for WebSocket
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum MetricsUpdate {
    /// New metric data point
    Metric(MetricData),

    /// New alert
    Alert(Alert),

    /// Alert status change
    AlertStatusChange {
        alert_id: Uuid,
        status: AlertStatus,
    },

    /// System metrics update
    SystemMetrics(SystemMetrics),

    /// Batch of metric updates
    Batch {
        metrics: Vec<MetricData>,
        alerts: Vec<Alert>,
    },
}

/// Metrics aggregation request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsAggregationRequest {
    /// Node IDs to aggregate (empty = all nodes)
    pub node_ids: Vec<String>,

    /// Metric names to aggregate (empty = all metrics)
    pub metric_names: Vec<String>,

    /// Aggregation function
    pub function: AggregationFunction,

    /// Time window for aggregation
    pub time_window_seconds: u64,

    /// Number of data points to return
    pub points: u32,
}

/// Aggregation functions
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AggregationFunction {
    /// Average
    Avg,
    /// Sum
    Sum,
    /// Minimum
    Min,
    /// Maximum
    Max,
    /// Count
    Count,
    /// Rate of change
    Rate,
}

/// Aggregated metrics response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedMetrics {
    /// Metric name
    pub metric_name: String,

    /// Metric type
    pub metric_type: MetricType,

    /// Unit of measurement
    pub unit: MetricUnit,

    /// Data points with timestamps and values
    pub data: Vec<AggregatedDataPoint>,
}

/// Single aggregated data point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedDataPoint {
    /// Timestamp
    pub timestamp: DateTime<Utc>,

    /// Aggregated value
    pub value: f64,

    /// Number of raw data points in this aggregation
    pub count: u32,

    /// Minimum value in this aggregation
    pub min: Option<f64>,

    /// Maximum value in this aggregation
    pub max: Option<f64>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metric_type_serialization() {
        let metric_type = MetricType::Cpu;
        let json = serde_json::to_string(&metric_type).unwrap();
        assert_eq!(json, r#""cpu""#);
    }

    #[test]
    fn test_alert_severity_ordering() {
        assert!(AlertSeverity::Critical > AlertSeverity::Warning);
        assert!(AlertSeverity::Warning > AlertSeverity::Info);
    }

    #[test]
    fn test_metric_data_creation() {
        let metric = MetricData {
            id: Uuid::new_v4(),
            node_id: "node-1".to_string(),
            metric_name: "cpu_usage".to_string(),
            metric_type: MetricType::Cpu,
            value: 75.5,
            unit: MetricUnit::Percentage,
            timestamp: Utc::now(),
            labels: vec![],
            metadata: None,
        };

        assert_eq!(metric.metric_type, MetricType::Cpu);
        assert_eq!(metric.value, 75.5);
    }

    #[test]
    fn test_health_status_serialization() {
        let status = HealthStatus::Healthy;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, r#""healthy""#);
    }

    #[test]
    fn test_alert_serialization() {
        let alert = Alert {
            id: Uuid::new_v4(),
            node_id: "node-1".to_string(),
            severity: AlertSeverity::Critical,
            title: "High CPU Usage".to_string(),
            description: "CPU usage exceeded 90%".to_string(),
            status: AlertStatus::Active,
            metric_name: Some("cpu_usage".to_string()),
            threshold_value: Some(90.0),
            actual_value: Some(95.5),
            triggered_at: Utc::now(),
            updated_at: Utc::now(),
            acknowledged_at: None,
            acknowledged_by: None,
            resolved_at: None,
            trigger_count: 1,
            labels: vec![],
            data: None,
        };

        assert_eq!(alert.severity, AlertSeverity::Critical);
        assert_eq!(alert.status, AlertStatus::Active);
    }
}