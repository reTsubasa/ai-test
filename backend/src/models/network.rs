use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Network interface status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InterfaceStatus {
    Up,
    Down,
    Unknown,
}

/// Network interface type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InterfaceType {
    Ethernet,
    Loopback,
    Vlan,
    Bridge,
    Bond,
    Wireless,
    Other,
}

/// Network interface
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterface {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub interface_type: InterfaceType,
    pub status: InterfaceStatus,
    pub mac_address: Option<String>,
    pub mtu: Option<u32>,
    pub ip_addresses: Vec<IpAddress>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// IP address configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpAddress {
    pub address: String,
    pub prefix_length: u8,
    #[serde(rename = "type")]
    pub ip_type: IpType,
    pub is_primary: bool,
}

/// IP address type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IpType {
    IPv4,
    IPv6,
}

/// Route entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Route {
    pub id: Uuid,
    pub destination: String,
    pub gateway: Option<String>,
    pub interface: Option<String>,
    pub metric: Option<u32>,
    pub route_type: RouteType,
    pub created_at: DateTime<Utc>,
}

/// Route type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RouteType {
    Connected,
    Static,
    Dynamic,
}

/// Firewall rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FirewallRule {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub action: FirewallAction,
    pub source_address: Option<String>,
    pub destination_address: Option<String>,
    pub source_port: Option<u16>,
    pub destination_port: Option<u16>,
    pub protocol: Option<String>,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Firewall action
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FirewallAction {
    Accept,
    Drop,
    Reject,
}