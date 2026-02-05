use crate::{
    error::AppError,
    models::user::{CreateUserRequest, UpdateUserRequest, UserResponse},
    services::user_service::UserService,
};
use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Pagination {
    page: Option<u32>,
    limit: Option<u32>,
}

pub async fn get_users(
    State(state): State<crate::AppState>,
    Query(params): Query<Pagination>,
) -> Result<Json<Vec<UserResponse>>, AppError> {
    // In a real implementation, we would use pagination parameters
    // For now, just return all users
    let users = sqlx::query!(
        r#"
        SELECT id, username, email, first_name, last_name, is_active, created_at, updated_at
        FROM users
        ORDER BY username
        "#
    )
    .fetch_all(&state.db)
    .await?;

    let users_response: Vec<UserResponse> = users
        .into_iter()
        .map(|u| UserResponse {
            id: u.id,
            username: u.username,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            is_active: u.is_active == 1,
            created_at: u.created_at,
            updated_at: u.updated_at,
        })
        .collect();

    Ok(Json(users_response))
}

pub async fn get_user(
    State(state): State<crate::AppState>,
    Path(user_id): Path<String>,
) -> Result<Json<UserResponse>, AppError> {
    let uuid = Uuid::parse_str(&user_id).map_err(|_| {
        AppError::BadRequest("Invalid user ID format".to_string())
    })?;

    let user = UserService::get_user_by_id(&state.db, uuid).await?
        .ok_or(AppError::NotFound("User not found".to_string()))?;

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

pub async fn create_user(
    State(state): State<crate::AppState>,
    axum::Json(input): axum::Json<CreateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
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

pub async fn update_user(
    State(state): State<crate::AppState>,
    Path(user_id): Path<String>,
    axum::Json(input): axum::Json<UpdateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
    let uuid = Uuid::parse_str(&user_id).map_err(|_| {
        AppError::BadRequest("Invalid user ID format".to_string())
    })?;

    let user = UserService::update_user(&state.db, uuid, input).await?;

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

pub async fn delete_user(
    State(state): State<crate::AppState>,
    Path(user_id): Path<String>,
) -> Result<Json<()>, AppError> {
    let uuid = Uuid::parse_str(&user_id).map_err(|_| {
        AppError::BadRequest("Invalid user ID format".to_string())
    })?;

    UserService::delete_user(&state.db, uuid).await?;

    Ok(Json(()))
}