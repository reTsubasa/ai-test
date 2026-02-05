mod config;
mod db;
mod error;
mod handlers;
mod middleware;
mod models;
mod services;
mod websocket;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware::Logger};
use std::env;
use tracing::info;

use config::{AppConfig, init_database, init_logging};
use db::{Database, create_database};
use error::AppResult;
use services::{AuthService, UserService};
use websocket::ConnectionManager;

#[actix_web::main]
async fn main() -> AppResult<()> {
    // Load configuration
    let config = AppConfig::from_env()?;

    // Initialize logging
    init_logging(&config);

    info!("Starting VyOS Web UI Backend");
    info!("Environment: {}", config.app_env);
    info!("Server: {}", config.server_address());

    // Initialize database
    let pool = init_database(&config).await?;
    let db = create_database(pool).await?;

    // Create services
    let db_clone = db.get_ref().clone();
    let auth_service = AuthService::new(&config, db_clone.clone());
    let user_service = UserService::new(db_clone);

    // Create WebSocket connection manager
    let connection_manager = ConnectionManager::new();

    // Build the HTTP server
    let bind_address = config.server_address();
    let server = HttpServer::new(move || {
        // Configure CORS
        let cors = if config.is_development() {
            Cors::permissive()
        } else {
            Cors::default()
                .allowed_origin("https://your-domain.com")
                .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
                .allowed_headers(vec!["Authorization", "Content-Type"])
                .max_age(3600)
        };

        App::new()
            .app_data(web::Data::new(config.clone()))
            .app_data(db.clone())
            .app_data(web::Data::new(auth_service.clone()))
            .app_data(web::Data::new(user_service.clone()))
            .app_data(web::Data::new(connection_manager.clone()))
            .wrap(cors)
            .wrap(Logger::default())
            .service(
                web::scope("/api")
                    // Health check endpoints
                    .route("/health", web::get().to(handlers::health::health_check))
                    .route("/health/detailed", web::get().to(handlers::health::detailed_health_check))
                    // Authentication endpoints
                    .route("/auth/register", web::post().to(handlers::auth::register))
                    .route("/auth/login", web::post().to(handlers::auth::login))
                    .route("/auth/logout", web::post().to(handlers::auth::logout))
                    .route("/auth/refresh", web::post().to(handlers::auth::refresh_token))
                    .route("/auth/validate", web::post().to(handlers::auth::validate_token))
                    .route("/auth/me", web::get().to(handlers::auth::get_current_user))
                    // User endpoints
                    .route("/users/me", web::get().to(handlers::user::get_profile))
                    .route("/users/me", web::put().to(handlers::user::update_profile))
                    .route("/users/me/password", web::post().to(handlers::user::change_password))
                    .route("/users", web::get().to(handlers::user::list_users))
                    .route("/users", web::post().to(handlers::user::create_user))
                    .route("/users/{id}", web::put().to(handlers::user::update_user))
                    .route("/users/{id}", web::delete().to(handlers::user::delete_user))
                    // Network endpoints
                    .route("/network/interfaces", web::get().to(handlers::network::get_interfaces))
                    .route("/network/interfaces/{id}", web::get().to(handlers::network::get_interface_details))
                    .route("/network/interfaces/{id}/configure", web::post().to(handlers::network::configure_interface))
                    .route("/network/routes", web::get().to(handlers::network::get_routing_table))
                    .route("/network/routes", web::post().to(handlers::network::add_route))
                    .route("/network/routes/{id}", web::delete().to(handlers::network::delete_route))
                    .route("/network/firewall/rules", web::get().to(handlers::network::get_firewall_rules))
                    .route("/network/firewall/rules", web::post().to(handlers::network::add_firewall_rule))
                    .route("/network/firewall/rules/{id}", web::delete().to(handlers::network::delete_firewall_rule))
            )
            .route("/ws", web::get().to(websocket::websocket_handler))
            .route("/ws/info", web::get().to(websocket::ws_info))
    })
    .bind(&bind_address)?;

    info!("Server listening on {}", bind_address);

    server.run().await?;

    info!("Server shutting down");

    Ok(())
}