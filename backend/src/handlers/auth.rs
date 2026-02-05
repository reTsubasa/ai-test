use crate::{
    error::AppError,
    models::{
        auth::TokenPair,
        user::{CreateUserRequest, LoginRequest, LoginResponse, UserResponse},
    },
    services::auth_service::AuthService,
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    Extension,
};
use serde::Deserialize;
use std::collections::HashMap;
use uuid::Uuid;

use crate::services::user_service::UserService;

#[derive(Deserialize)]
pub struct Pagination {
    page: Option<u32>,
    limit: Option<u32>,
}

pub async fn health_check() -> Json<HashMap<&'static str, &'static str>> {
    let mut health_check = HashMap::new();
    health_check.insert("status", "healthy");
    health_check.insert("service", "vyos-web-backend");
    Json(health_check)
}

pub async fn login(
    State(state): State<crate::AppState>,
    Json(input): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let result = AuthService::login(&state.db, &state.config, input).await?;
    Ok(Json(result))
}

pub async fn register(
    State(state): State<crate::AppState>,
    Json(input): Json<CreateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
    // Validate input
    input.validate().map_err(|e| {
        AppError::Validation(format!("Validation error: {}", e))
    })?;

    let user = UserService::create_user(&state.db, input).await?;

    let user_response = UserResponse {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
    };

    Ok(Json(user_response))
}

pub async fn refresh(
    State(state): State<crate::AppState>,
    Json(payload): Json<TokenPair>,
) -> Result<Json<LoginResponse>, AppError> {
    let result = AuthService::refresh_token(&state.db, &state.config, &payload.refresh_token).await?;
    Ok(Json(result))
}

pub async fn get_current_user(
    Extension(_claims): Extension<crate::models::auth::Claims>,
    State(state): State<crate::AppState>,
) -> Result<Json<UserResponse>, AppError> {
    // This handler would normally fetch the user from the database using the user_id from claims
    // For now, we return a placeholder - in a real app you'd look up the user
    let user_response = UserResponse {
        id: _claims.user_id,
        username: _claims.username,
        email: "placeholder@example.com".to_string(), // In real app, fetch from DB
        first_name: None,
        last_name: None,
        is_active: true, // In real app, fetch from DB
        created_at: chrono::Utc::now(), // In real app, fetch from DB
        updated_at: chrono::Utc::now(), // In real app, fetch from DB
    };

    Ok(Json(user_response))
}