use actix_web::{web, HttpResponse};
use serde::Serialize;
use validator::Validate;
use tracing::info;
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::auth::{Claims, LoginRequest, LoginResponse, RegisterRequest, SimpleLoginResponse, UserResponse};
use crate::models::user::{UserStatus, extract_db_id_from_uuid};
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

    // Generate tokens for the new user
    let user_id_str = user.id.to_string();
    let access_token = auth_service.generate_token(&user_id_str, &user.username)?;
    let refresh_token = auth_service.generate_refresh_token(&user_id_str, &user.username)?;
    let expires_in = auth_service.get_expiration();

    info!("User registered successfully: {}", user.username);

    Ok(HttpResponse::Created().json(LoginResponse {
        user: UserResponse {
            id: user.id,
            username: user.username.clone(),
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            status: UserStatus::Active,
            last_login: user.last_login,
            created_at: user.created_at,
            updated_at: user.updated_at,
        },
        access_token,
        refresh_token,
        expires_in,
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

    // Generate tokens
    let user_id_str = user.id.to_string();
    let access_token = auth_service.generate_token(&user_id_str, &user.username)?;
    let refresh_token = auth_service.generate_refresh_token(&user_id_str, &user.username)?;
    let expires_in = auth_service.get_expiration();

    info!("User logged in successfully: {}", user.username);

    Ok(HttpResponse::Ok().json(LoginResponse {
        user: UserResponse {
            id: user.id,
            username: user.username.clone(),
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            status: UserStatus::Active,
            last_login: user.last_login,
            created_at: user.created_at,
            updated_at: user.updated_at,
        },
        access_token,
        refresh_token,
        expires_in,
    }))
}

/// Logout handler
pub async fn logout(
    claims: Claims,
    auth_service: web::Data<AuthService>,
) -> AppResult<HttpResponse> {
    // Parse user ID from claims (UUID string -> extract i64)
    let uuid = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Auth("Invalid user ID in token".to_string()))?;
    let user_id: i64 = extract_db_id_from_uuid(&uuid);

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

    Ok(HttpResponse::Ok().json(SimpleLoginResponse {
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
    // Parse user ID from claims (UUID string -> extract i64)
    let uuid = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Auth("Invalid user ID in token".to_string()))?;
    let user_id: i64 = extract_db_id_from_uuid(&uuid);

    // Fetch user from database
    let user_record = auth_service
        .find_user_by_id(user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let user = user_record.to_user();

    Ok(HttpResponse::Ok().json(UserResponse {
        id: user.id,
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