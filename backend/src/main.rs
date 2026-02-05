use axum::{
    extract::Extension,
    http::Method,
    middleware,
    routing::{get, post, put, delete},
    Router,
};
use sqlx::SqlitePool;
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod models;
mod handlers;
mod services;
mod middleware as app_middleware;
mod error;
mod utils;

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub config: Arc<Config>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            "vyos_web_backend=debug,tower_http=debug".into()
        }))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Arc::new(Config::from_env()?);

    // Initialize database
    let db_pool = SqlitePool::connect(&config.database.url).await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&db_pool).await?;

    // Create application state
    let app_state = AppState {
        db: db_pool,
        config,
    };

    // Build our application with a single route
    let app = Router::new()
        // Health check
        .route("/health", get(handlers::health::health_check))

        // Auth routes
        .route("/api/v1/auth/login", post(handlers::auth::login))
        .route("/api/v1/auth/register", post(handlers::auth::register))
        .route("/api/v1/auth/refresh", post(handlers::auth::refresh))
        .route("/api/v1/auth/me", get(handlers::auth::get_current_user))

        // User routes
        .route("/api/v1/users", get(handlers::user::get_users))
        .route("/api/v1/users", post(handlers::user::create_user))
        .route("/api/v1/users/:id", get(handlers::user::get_user))
        .route("/api/v1/users/:id", put(handlers::user::update_user))
        .route("/api/v1/users/:id", delete(handlers::user::delete_user))

        // Network routes
        .route("/api/v1/network/interfaces", get(handlers::network::get_interfaces))
        .route("/api/v1/network/interfaces", post(handlers::network::create_interface))
        .route("/api/v1/network/interfaces/:id", get(handlers::network::get_interface))
        .route("/api/v1/network/interfaces/:id", put(handlers::network::update_interface))
        .route("/api/v1/network/interfaces/:id", delete(handlers::network::delete_interface))

        // Apply middleware
        .layer(middleware::from_fn(app_middleware::auth::auth_middleware))
        .layer(
            tower_http::cors::CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods(vec![Method::GET, Method::POST, Method::PUT, Method::DELETE])
                .allow_headers(tower_http::cors::Any)
        )
        .layer(Extension(app_state));

    // Run our application with the given configuration
    let listener = tokio::net::TcpListener::bind(&config.server.address).await?;
    tracing::debug!("Listening on {}", listener.local_addr()?);

    axum::serve(listener, app).await?;

    Ok(())
}