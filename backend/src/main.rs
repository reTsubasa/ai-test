mod config;
mod db;
mod error;
mod handlers;
mod middleware;
mod models;
mod services;
mod vyos_client;
mod websocket;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware::Logger};
use std::env;
use tracing::info;

use config::{AppConfig, init_database, init_logging};
use db::{Database, create_database};
use error::AppResult;
use services::{AuthService, ConfigService, NodeService, SystemService, UserService};
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
    let user_service = UserService::new(db_clone.clone());
    let node_service = NodeService::new(db_clone.get_pool().clone());
    let config_service = ConfigService::new(db_clone.clone(), config.clone());
    let system_service = SystemService::new(config.clone());

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
            .app_data(web::Data::new(node_service.clone()))
            .app_data(web::Data::new(config_service.clone()))
            .app_data(web::Data::new(system_service.clone()))
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
                    // Node endpoints
                    .route("/nodes", web::get().to(handlers::node::list_nodes))
                    .route("/nodes", web::post().to(handlers::node::create_node))
                    .route("/nodes/{id}", web::get().to(handlers::node::get_node))
                    .route("/nodes/{id}", web::put().to(handlers::node::update_node))
                    .route("/nodes/{id}", web::delete().to(handlers::node::delete_node))
                    .route("/nodes/{id}/test", web::post().to(handlers::node::test_connection))
                    .route("/nodes/{id}/health", web::get().to(handlers::node::get_node_health))
                    .route("/nodes/health/all", web::get().to(handlers::node::get_all_nodes_health))
                    .route("/nodes/health/check-all", web::post().to(handlers::node::check_all_nodes_health))
                    .route("/nodes/{id}/config", web::post().to(handlers::node::retrieve_node_config))
                    .route("/nodes/{id}/info", web::get().to(handlers::node::get_node_info))
                    .route("/nodes/{id}/interfaces", web::get().to(handlers::node::get_node_interfaces))
                    .route("/nodes/{id}/show", web::post().to(handlers::node::execute_show_command))
                    .route("/nodes/stats", web::get().to(handlers::node::get_node_statistics))
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
                    // Configuration endpoints
                    .route("/config/retrieve", web::post().to(handlers::config::retrieve_config))
                    .route("/config/configure", web::post().to(handlers::config::set_config))
                    .route("/config/delete", web::post().to(handlers::config::delete_config))
                    .route("/config/generate", web::post().to(handlers::config::generate_config))
                    .route("/config/history", web::get().to(handlers::config::get_history))
                    .route("/config/history/{id}", web::get().to(handlers::config::get_history_entry))
                    .route("/config/rollback", web::post().to(handlers::config::rollback_config))
                    .route("/config/diff/{id1}/{id2}", web::get().to(handlers::config::diff_configs))
                    .route("/config/search", web::post().to(handlers::config::search_config))
                    .route("/config/bulk", web::post().to(handlers::config::bulk_config_change))
                    .route("/config/validate", web::post().to(handlers::config::validate_config))
                    .route("/config/value", web::post().to(handlers::config::get_config_value))
                    .route("/config/subtree", web::post().to(handlers::config::get_config_subtree))
                    .route("/config/compare", web::post().to(handlers::config::compare_configs))
                    .route("/config/discard", web::post().to(handlers::config::discard_config))
                    .route("/config/stats", web::get().to(handlers::config::get_config_stats))
                    // System endpoints
                    .route("/system/reboot", web::post().to(handlers::system::reboot))
                    .route("/system/poweroff", web::post().to(handlers::system::poweroff))
                    .route("/system/reset", web::post().to(handlers::system::reset_configuration))
                    .route("/system/images", web::get().to(handlers::system::list_images))
                    .route("/system/images", web::post().to(handlers::system::manage_images))
                    .route("/system/images/add", web::post().to(handlers::system::add_image))
                    .route("/system/images/delete", web::post().to(handlers::system::delete_image))
                    .route("/system/images/set-default", web::post().to(handlers::system::set_default_image))
                    .route("/system/show", web::post().to(handlers::system::execute_show_command))
                    .route("/system/info", web::get().to(handlers::system::get_system_info))
                    .route("/system/operations/{operation_id}", web::get().to(handlers::system::check_operation_status))
                    .route("/system/health", web::get().to(handlers::system::system_health_check))
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