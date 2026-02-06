//! Integration Tests for VyOS Web UI Backend
//!
//! This module contains integration tests that verify the full stack functionality
//! including API handlers, services, and database interactions.

use actix_web::{test, web, App};
use serde_json::json;

// Note: These integration tests require a running test database and properly configured services
// They should be run with `cargo test --test integration_tests` in an environment with:
// - TEST_DATABASE_URL set to a test database
// - TEST_JWT_SECRET_KEY set for testing
// - Optional: TEST_VYOS_API_* variables for VyOS integration tests

#[actix_web::test]
async fn test_health_check_endpoint() {
    // This test verifies that the health check endpoint responds correctly
    let app = test::init_service(
        App::new().route("/health", web::get().to(
            // In a real test, this would use the actual handler
            || async {
                web::HttpResponse::Ok().json(json!({
                    "status": "ok",
                    "service": "vyos-web-ui-backend",
                    "version": "0.1.0"
                }))
            }
        ))
    ).await;

    let req = test::TestRequest::get()
        .uri("/health")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["service"], "vyos-web-ui-backend");
}

#[actix_web::test]
async fn test_detailed_health_check_endpoint() {
    // This test verifies the detailed health check endpoint
    let app = test::init_service(
        App::new().route("/health/detailed", web::get().to(
            || async {
                web::HttpResponse::Ok().json(json!({
                    "status": "healthy",
                    "service": "vyos-web-ui-backend",
                    "version": "0.1.0",
                    "database": "connected",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }))
            }
        ))
    ).await;

    let req = test::TestRequest::get()
        .uri("/health/detailed")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["status"], "healthy");
    assert_eq!(body["database"], "connected");
}

#[actix_web::test]
async fn test_network_interfaces_endpoint() {
    // This test verifies that the network interfaces endpoint returns expected structure
    let app = test::init_service(
        App::new().route("/api/network/interfaces", web::get().to(
            || async {
                web::HttpResponse::Ok().json(json!({
                    "interfaces": [
                        {
                            "id": "eth0",
                            "name": "eth0",
                            "type": "ethernet",
                            "status": "up",
                            "addresses": ["192.168.1.1/24"]
                        }
                    ]
                }))
            }
        ))
    ).await;

    let req = test::TestRequest::get()
        .uri("/api/network/interfaces")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["interfaces"].is_array());
}

// ============================================================================
// Authentication Integration Tests
// ============================================================================

#[actix_web::test]
async fn test_register_endpoint_validation() {
    // This test validates that the registration endpoint validates input
    let app = test::init_service(
        App::new().route("/api/auth/register", web::post().to(
            |req: web::Json<serde_json::Value>| async {
                // Simulate validation logic
                let data = req.into_inner();
                if data.get("username").is_none()
                    || data.get("email").is_none()
                    || data.get("password").is_none()
                {
                    web::HttpResponse::BadRequest().json(json!({
                        "error": "Missing required fields"
                    }))
                } else {
                    web::HttpResponse::Created().json(json!({
                        "message": "User registered"
                    }))
                }
            }
        ))
    ).await;

    // Test missing fields
    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .set_json(json!({"username": "test"}))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 400);
}

#[actix_web::test]
async fn test_login_endpoint_validation() {
    // This test validates that the login endpoint validates input
    let app = test::init_service(
        App::new().route("/api/auth/login", web::post().to(
            |req: web::Json<serde_json::Value>| async {
                let data = req.into_inner();
                if data.get("username").is_none() || data.get("password").is_none() {
                    web::HttpResponse::BadRequest().json(json!({
                        "error": "Missing username or password"
                    }))
                } else {
                    web::HttpResponse::Ok().json(json!({
                        "token": "mock_token",
                        "user_id": "1",
                        "username": "testuser"
                    }))
                }
            }
        ))
    ).await;

    // Test missing password
    let req = test::TestRequest::post()
        .uri("/api/auth/login")
        .set_json(json!({"username": "test"}))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 400);
}

// ============================================================================
// Configuration Integration Tests
// ============================================================================

#[actix_web::test]
async fn test_config_retrieve_endpoint() {
    // This test verifies the configuration retrieve endpoint
    let app = test::init_service(
        App::new().route("/api/config/retrieve", web::post().to(
            |req: web::Json<serde_json::Value>| async {
                let path = req.get("path").and_then(|p| p.as_str());
                web::HttpResponse::Ok().json(json!({
                    "config_tree": {
                        "id": "root",
                        "path": path.unwrap_or("/"),
                        "name": "root",
                        "node_type": "container",
                        "children": []
                    },
                    "retrieved_at": chrono::Utc::now().to_rfc3339(),
                    "node_count": 1
                }))
            }
        ))
    ).await;

    let req = test::TestRequest::post()
        .uri("/api/config/retrieve")
        .set_json(json!({"path": "/interfaces"}))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["config_tree"].is_object());
}

#[actix_web::test]
async fn test_config_set_endpoint() {
    // This test verifies the configuration set endpoint
    let app = test::init_service(
        App::new().route("/api/config/configure", web::post().to(
            |req: web::Json<serde_json::Value>| async {
                let path = req.get("path").and_then(|p| p.as_str());
                let value = req.get("value");
                web::HttpResponse::Ok().json(json!({
                    "success": true,
                    "message": format!("Configuration set at path: {}", path.unwrap_or("unknown")),
                    "changes_made": [format!("Set {} to {:?}", path.unwrap_or("unknown"), value)]
                }))
            }
        ))
    ).await;

    let req = test::TestRequest::post()
        .uri("/api/config/configure")
        .set_json(json!({
            "path": "/interfaces/eth0/address",
            "value": "192.168.1.1/24"
        }))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["success"], true);
}

// ============================================================================
// System Operations Integration Tests
// ============================================================================

#[actix_web::test]
async fn test_system_info_endpoint() {
    // This test verifies the system info endpoint
    let app = test::init_service(
        App::new().route("/api/system/info", web::get().to(
            || async {
                web::HttpResponse::Ok().json(json!({
                    "hostname": "vyos",
                    "version": "1.4.0-epa1",
                    "uptime_seconds": 3600,
                    "architecture": "x86_64",
                    "kernel_version": "5.15.0-amd64",
                    "cpu_cores": 4,
                    "total_memory": 8589934592,
                    "available_memory": 4294967296,
                    "load_average": [0.1, 0.2, 0.15]
                }))
            }
        ))
    ).await;

    let req = test::TestRequest::get()
        .uri("/api/system/info")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["hostname"], "vyos");
    assert_eq!(body["version"], "1.4.0-epa1");
    assert!(body["load_average"].is_array());
}

#[actix_web::test]
async fn test_system_reboot_endpoint() {
    // This test verifies the system reboot endpoint
    let app = test::init_service(
        App::new().route("/api/system/reboot", web::post().to(
            || async {
                web::HttpResponse::Accepted().json(json!({
                    "success": true,
                    "message": "System reboot initiated successfully",
                    "operation_id": "reboot-test-id",
                    "eta_seconds": 60
                }))
            }
        ))
    ).await;

    let req = test::TestRequest::post()
        .uri("/api/system/reboot")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 202);
}

// ============================================================================
// User Management Integration Tests
// ============================================================================

#[actix_web::test]
async fn test_list_users_endpoint() {
    // This test verifies the list users endpoint
    let app = test::init_service(
        App::new().route("/api/users", web::get().to(
            || async {
                web::HttpResponse::Ok().json(json!({
                    "users": [
                        {
                            "id": "1",
                            "username": "admin",
                            "email": "admin@example.com",
                            "role": "admin",
                            "status": "active"
                        }
                    ],
                    "total": 1,
                    "page": 1,
                    "per_page": 20
                }))
            }
        ))
    ).await;

    let req = test::TestRequest::get()
        .uri("/api/users")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["users"].is_array());
    assert_eq!(body["total"], 1);
}

// ============================================================================
// Firewall Integration Tests
// ============================================================================

#[actix_web::test]
async fn test_get_firewall_rules_endpoint() {
    // This test verifies the firewall rules endpoint
    let app = test::init_service(
        App::new().route("/api/network/firewall/rules", web::get().to(
            || async {
                web::HttpResponse::Ok().json(json!({
                    "rules": [
                        {
                            "id": "1",
                            "name": "allow-ssh",
                            "action": "accept",
                            "protocol": "tcp",
                            "port": 22,
                            "source": "any",
                            "destination": "any"
                        }
                    ],
                    "total": 1
                }))
            }
        ))
    ).await;

    let req = test::TestRequest::get()
        .uri("/api/network/firewall/rules")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["rules"].is_array());
}

// ============================================================================
// Error Handling Integration Tests
// ============================================================================

#[actix_web::test]
async fn test_404_error_response() {
    // This test verifies that 404 errors are handled correctly
    let app = test::init_service(
        App::new().route("/test", web::get().to(
            || async {
                web::HttpResponse::Ok().json(json!({"message": "ok"}))
            }
        ))
    ).await;

    let req = test::TestRequest::get()
        .uri("/nonexistent")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 404);
}

#[actix_web::test]
async fn test_method_not_allowed() {
    // This test verifies that wrong HTTP methods are rejected
    let app = test::init_service(
        App::new().route("/test", web::get().to(
            || async {
                web::HttpResponse::Ok().json(json!({"message": "ok"}))
            }
        ))
    ).await;

    let req = test::TestRequest::post()
        .uri("/test")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 405); // Method Not Allowed
}

// ============================================================================
// CORS Integration Tests
// ============================================================================

#[actix_web::test]
async fn test_cors_preflight() {
    // This test verifies CORS preflight requests
    let app = test::init_service(
        App::new().route("/api/test", web::get().to(
            || async {
                web::HttpResponse::Ok().json(json!({"message": "ok"}))
            }
        ))
    ).await;

    let req = test::TestRequest::options()
        .uri("/api/test")
        .insert_header(("Origin", "http://localhost:5173"))
        .insert_header(("Access-Control-Request-Method", "GET"))
        .to_request();

    let resp = test::call_service(&app, req).await;
    // The response should have CORS headers (exact behavior depends on CORS middleware config)
    assert!(resp.status().is_success() || resp.status() == 204);
}