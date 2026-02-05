use anyhow::Result;
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
    pub app: AppConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ServerConfig {
    #[serde(default = "default_server_address")]
    pub address: String,
    #[serde(default = "default_server_host")]
    pub host: String,
    #[serde(default = "default_server_port")]
    pub port: u16,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseConfig {
    #[serde(default = "default_database_url")]
    pub url: String,
    #[serde(default = "default_database_max_connections")]
    pub max_connections: u32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JwtConfig {
    #[serde(default = "default_jwt_secret")]
    pub secret: String,
    #[serde(default = "default_jwt_expiry_hours")]
    pub expiry_hours: i64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    #[serde(default = "default_app_environment")]
    pub environment: String,
    #[serde(default = "default_app_debug")]
    pub debug: bool,
}

fn default_server_address() -> String {
    "127.0.0.1:8080".to_string()
}

fn default_server_host() -> String {
    "127.0.0.1".to_string()
}

fn default_server_port() -> u16 {
    8080
}

fn default_database_url() -> String {
    "sqlite:data/database.db".to_string()
}

fn default_database_max_connections() -> u32 {
    10
}

fn default_jwt_secret() -> String {
    "default_secret_key_for_development_please_change_in_production".to_string()
}

fn default_jwt_expiry_hours() -> i64 {
    24
}

fn default_app_environment() -> String {
    "development".to_string()
}

fn default_app_debug() -> bool {
    true
}

impl Config {
    pub fn from_env() -> Result<Self> {
        // Load configuration from environment variables using the config crate
        let mut cfg = config::Config::builder()
            .add_source(config::Environment::default())
            .build()?;

        // Map environment variables to expected config keys
        cfg.try_deserialize().map_err(Into::into)
    }
}