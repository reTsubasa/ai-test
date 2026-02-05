use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use validator::Validate;
use tracing::{info, warn};

use crate::error::{AppError, AppResult};
use crate::middleware::auth::extract_claims;
use crate::models::auth::{Claims, LoginRequest, LoginResponse, RegisterRequest};
use crate::models::user::{User, UserResponse};
use crate::services::AuthService;

/// Health check endpoint
#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub database: String,
}

/// Handle GET /health
pub async fn health_check() -> AppResult<HttpResponse> {
    Ok(HttpResponse::Ok().json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        database: "connected".to_string(),
    }))
}

/// Register request payload
#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: String,

    #[validate(email)]
    pub email: String,

    #[validate(length(min = 6))]
    pub password: String,

    pub full_name: Option<String>,
}

/// Register handler
pub async fn register(
    req: web::Json<RegisterRequest>,
    auth_service: web::Data<AuthService>,
) -> AppResult<HttpResponse> {
    // Validate request
    req.validate()
        .map_err(|e| AppError::Validation(format!("Validation failed: {:?}", e)))?;

    let user = auth_service
        .register(
            &req.username,
            &req.email,
            &req.password,
            req.full_name.clone(),
        )
        .await?;

    // Generate token for the new user
    let token = auth_service.generate_token(&user.id.to_string(), &user.username)?;

    info!("User registered successfully: {}", user.username);

    Ok(HttpResponse::Created().json(LoginResponse {
        token,
        user_id: user.id.to_string(),
        username: user.username,
    }))
}

/// Login handler - authenticate user and generate JWT token
pub async fn login(
    req: web::Json<LoginRequest>,
    auth_service: web::Data<AuthService>,
) -> AppResult<HttpResponse> {
    // Validate request
    req.validate()
        .map_err(|e| AppError::Validation(format!("Validation failed: {:?}", e)))?;

    // Authenticate user
    let user = auth_service
        .authenticate(&req.username, &req.password)
        .await?;

    // Generate JWT token
    let token = auth_service.generate_token(&user.id.to_string(), &user.username)?;

    info!("User logged in successfully: {}", user.username);

    Ok(HttpResponse::Ok().json(LoginResponse {
        token,
        user_id: user.id.to_string(),
        username: user.username,
    }))
}

/// Logout handler
pub async fn logout(
    claims: Claims,
    auth_service: web::Data<AuthService>,
) -> AppResult<HttpResponse> {
    // Parse user ID from claims (convert string to i64)
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    auth_service.logout(user_id).await?;

    info!("User logged out: {}", claims.username);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Logged out successfully"
    })))
}

/// Refresh token handler
pub async fn refresh_token(
    claims: Claims,
    auth_service: web::Data<AuthService>,
) -> AppResult<HttpResponse> {
    // Generate new token from existing claims
    let (new_token, new_claims) = auth_service.refresh_token(&claims)?;

    info!("Token refreshed for user: {}", claims.username);

    Ok(HttpResponse::Ok().json(LoginResponse {
        token: new_token,
        user_id: new_claims.sub.clone(),
        username: new_claims.username.clone(),
    }))
}

/// Validate token handler
pub async fn validate_token(
    claims: Claims,
) -> AppResult<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "valid": true,
        "user_id": claims.sub,
        "username": claims.username,
        "exp": claims.exp,
        "iat": claims.iat,
    })))
}

/// Get current user info handler
pub async fn get_current_user(
    claims: Claims,
    auth_service: web::Data<AuthService>,
) -> AppResult<HttpResponse> {
    // Parse user ID from claims
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    // Fetch user from database
    let user_record = auth_service
        .find_user_by_id(user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let user = user_record.to_user();

    Ok(HttpResponse::Ok().json(UserResponse {
        id: user.id.to_string(),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at,
    }))
}