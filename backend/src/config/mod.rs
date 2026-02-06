use std::env;

use actix_web::web::Data;
use serde::Deserialize;
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;
use tracing::info;

use crate::error::AppError;

/// Application configuration loaded from environment variables
#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    /// Server host address
    pub server_host: String,

    /// Server port
    pub server_port: u16,

    /// Application environment (development, staging, production)
    pub app_env: String,

    /// Database connection URL
    pub database_url: String,

    /// JWT secret key for token signing
    pub jwt_secret_key: String,

    /// JWT token expiration time in minutes
    pub jwt_expiration_minutes: u64,

    /// Log level (trace, debug, info, warn, error)
    pub log_level: String,

    /// VyOS API base URL
    pub vyos_api_url: Option<String>,

    /// VyOS API username
    pub vyos_api_username: Option<String>,

    /// VyOS API password
    pub vyos_api_password: Option<String>,
}

impl AppConfig {
    /// Load configuration from environment variables
    pub fn from_env() -> Result<Self, AppError> {
        dotenv::dotenv().ok();

        let app_env = env::var("APP_ENV").unwrap_or_else(|_| "development".to_string());

        Ok(Self {
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .map_err(|e| AppError::Config(format!("Invalid server port: {}", e)))?,
            app_env: app_env.clone(),
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "sqlite:data/database.db?mode=rwc".to_string()),
            jwt_secret_key: env::var("JWT_SECRET_KEY").unwrap_or_else(|_| {
                "default_secret_key_replace_in_production".to_string()
            }),
            jwt_expiration_minutes: env::var("JWT_EXPIRATION_MINUTES")
                .unwrap_or_else(|_| "60".to_string())
                .parse()
                .unwrap_or(60),
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            vyos_api_url: env::var("VYOS_API_URL").ok(),
            vyos_api_username: env::var("VYOS_API_USERNAME").ok(),
            vyos_api_password: env::var("VYOS_API_PASSWORD").ok(),
        })
    }

    /// Get the server address in format "host:port"
    pub fn server_address(&self) -> String {
        format!("{}:{}", self.server_host, self.server_port)
    }

    /// Check if running in development mode
    pub fn is_development(&self) -> bool {
        self.app_env == "development"
    }

    /// Check if running in production mode
    pub fn is_production(&self) -> bool {
        self.app_env == "production"
    }
}

/// Initialize database connection pool
pub async fn init_database(config: &AppConfig) -> Result<SqlitePool, AppError> {
    info!("Initializing database connection...");

    let max_connections = if config.is_development() { 5 } else { 10 };

    // Create data directory if it doesn't exist
    if config.database_url.starts_with("sqlite:") {
        let db_path = config.database_url.strip_prefix("sqlite:").unwrap_or(&config.database_url);
        let db_path = db_path.split('?').next().unwrap_or(db_path);
        if let Some(parent) = std::path::Path::new(db_path).parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                AppError::Database(format!("Failed to create database directory: {}", e))
            })?;
        }
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(max_connections)
        .connect(&config.database_url)
        .await
        .map_err(|e| AppError::Database(format!("Failed to connect to database: {}", e)))?;

    info!("Database connection established successfully");
    Ok(pool)
}

/// Initialize logging
pub fn init_logging(config: &AppConfig) {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new(&config.log_level)),
        )
        .init();
}