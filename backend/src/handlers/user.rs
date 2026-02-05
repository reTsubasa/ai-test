use actix_web::{web, HttpRequest};
use serde::{Deserialize, Serialize};
use validator::Validate;
use tracing::info;

use crate::error::AppResult;
use crate::middleware::auth::extract_claims;
use crate::models::user::{ChangePasswordRequest, RegisterRequest, UpdateProfileRequest, UpdateUserRequest, User, UserListQuery, UserListResponse};
use crate::services::UserService;

/// User information structure for response
#[derive(Serialize, Deserialize)]
pub struct UserInfo {
    pub id: String,
    pub username: String,
    pub email: String,
    pub full_name: Option<String>,
    pub role: String,
    pub is_active: bool,
    pub is_superuser: bool,
    pub last_login: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Get current user profile
pub async fn get_profile(
    req: HttpRequest,
    user_service: web::Data<UserService>,
) -> AppResult<actix_web::HttpResponse> {
    let claims = extract_claims(&req)?;
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    let user = user_service
        .get_user(user_id)
        .await?
        .ok_or_else(|| crate::error::AppError::NotFound("User not found".to_string()))?;

    Ok(actix_web::HttpResponse::Ok().json(UserInfo {
        id: user.id.to_string(),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: format!("{:?}", user.role).to_lowercase(),
        is_active: matches!(user.status, crate::models::user::UserStatus::Active),
        is_superuser: matches!(user.role, crate::models::user::UserRole::Admin),
        last_login: user.last_login.map(|dt| dt.to_rfc3339()),
        created_at: user.created_at.to_rfc3339(),
        updated_at: user.updated_at.to_rfc3339(),
    }))
}

/// Update user profile
pub async fn update_profile(
    req: HttpRequest,
    profile: web::Json<UpdateProfileRequest>,
    user_service: web::Data<UserService>,
) -> AppResult<actix_web::HttpResponse> {
    let claims = extract_claims(&req)?;
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    // Validate request
    profile.validate()
        .map_err(|e| crate::error::AppError::Validation(format!("Validation failed: {:?}", e)))?;

    let user = user_service.update_profile(user_id, profile.into_inner()).await?;

    Ok(actix_web::HttpResponse::Ok().json(UserInfo {
        id: user.id.to_string(),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: format!("{:?}", user.role).to_lowercase(),
        is_active: matches!(user.status, crate::models::user::UserStatus::Active),
        is_superuser: matches!(user.role, crate::models::user::UserRole::Admin),
        last_login: user.last_login.map(|dt| dt.to_rfc3339()),
        created_at: user.created_at.to_rfc3339(),
        updated_at: user.updated_at.to_rfc3339(),
    }))
}

/// Change password
pub async fn change_password(
    req: HttpRequest,
    password_data: web::Json<ChangePasswordRequest>,
    user_service: web::Data<UserService>,
) -> AppResult<actix_web::HttpResponse> {
    let claims = extract_claims(&req)?;
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    // Validate request
    password_data.validate()
        .map_err(|e| crate::error::AppError::Validation(format!("Validation failed: {:?}", e)))?;

    user_service
        .change_password(user_id, password_data.into_inner())
        .await?;

    Ok(actix_web::HttpResponse::Ok().json(serde_json::json!({
        "message": "Password changed successfully"
    })))
}

/// Get all users (admin only)
pub async fn list_users(
    req: HttpRequest,
    query: web::Query<UserListQuery>,
    user_service: web::Data<UserService>,
) -> AppResult<actix_web::HttpResponse> {
    // Verify user is admin
    let claims = extract_claims(&req)?;
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    let user = user_service
        .get_user(user_id)
        .await?
        .ok_or_else(|| crate::error::AppError::NotFound("User not found".to_string()))?;

    if !matches!(user.role, crate::models::user::UserRole::Admin) {
        return Err(crate::error::AppError::Forbidden("Admin access required".to_string()));
    }

    let response = user_service.list_users(query.into_inner()).await?;

    Ok(actix_web::HttpResponse::Ok().json(response))
}

pub async fn create_user(
    req: HttpRequest,
    user_data: web::Json<RegisterRequest>,
    user_service: web::Data<UserService>,
) -> AppResult<actix_web::HttpResponse> {
    // Verify user is admin
    let claims = extract_claims(&req)?;
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    let user = user_service
        .get_user(user_id)
        .await?
        .ok_or_else(|| crate::error::AppError::NotFound("User not found".to_string()))?;

    if !matches!(user.role, crate::models::user::UserRole::Admin) {
        return Err(crate::error::AppError::Forbidden("Admin access required".to_string()));
    }

    // Validate request
    user_data.validate()
        .map_err(|e| crate::error::AppError::Validation(format!("Validation failed: {:?}", e)))?;

    let new_user = user_service
        .create_user(
            &user_data.username,
            &user_data.email,
            &user_data.password,
            user_data.full_name.clone(),
        )
        .await?;

    info!("User created by admin: {}", new_user.username);

    Ok(actix_web::HttpResponse::Created().json(UserInfo {
        id: new_user.id.to_string(),
        username: new_user.username,
        email: new_user.email,
        full_name: new_user.full_name,
        role: format!("{:?}", new_user.role).to_lowercase(),
        is_active: matches!(new_user.status, crate::models::user::UserStatus::Active),
        is_superuser: matches!(new_user.role, crate::models::user::UserRole::Admin),
        last_login: new_user.last_login.map(|dt| dt.to_rfc3339()),
        created_at: new_user.created_at.to_rfc3339(),
        updated_at: new_user.updated_at.to_rfc3339(),
    }))
}

/// Update user (admin only)
pub async fn update_user(
    req: HttpRequest,
    user_id_path: web::Path<String>,
    user_data: web::Json<UpdateUserRequest>,
    user_service: web::Data<UserService>,
) -> AppResult<actix_web::HttpResponse> {
    // Verify user is admin
    let claims = extract_claims(&req)?;
    let requesting_user_id: i64 = claims.sub.parse().unwrap_or(0);

    let requesting_user = user_service
        .get_user(requesting_user_id)
        .await?
        .ok_or_else(|| crate::error::AppError::NotFound("User not found".to_string()))?;

    if !matches!(requesting_user.role, crate::models::user::UserRole::Admin) {
        return Err(crate::error::AppError::Forbidden("Admin access required".to_string()));
    }

    // Parse user ID from path
    let target_user_id: i64 = user_id_path
        .parse()
        .map_err(|e| crate::error::AppError::Validation(format!("Invalid user ID: {}", e)))?;

    // Validate request
    user_data.validate()
        .map_err(|e| crate::error::AppError::Validation(format!("Validation failed: {:?}", e)))?;

    let updated_user = user_service
        .update_user(target_user_id, user_data.into_inner())
        .await?;

    info!("User updated by admin: {}", updated_user.username);

    Ok(actix_web::HttpResponse::Ok().json(UserInfo {
        id: updated_user.id.to_string(),
        username: updated_user.username,
        email: updated_user.email,
        full_name: updated_user.full_name,
        role: format!("{:?}", updated_user.role).to_lowercase(),
        is_active: matches!(updated_user.status, crate::models::user::UserStatus::Active),
        is_superuser: matches!(updated_user.role, crate::models::user::UserRole::Admin),
        last_login: updated_user.last_login.map(|dt| dt.to_rfc3339()),
        created_at: updated_user.created_at.to_rfc3339(),
        updated_at: updated_user.updated_at.to_rfc3339(),
    }))
}

/// Delete user (admin only)
pub async fn delete_user(
    req: HttpRequest,
    user_id_path: web::Path<String>,
    user_service: web::Data<UserService>,
) -> AppResult<actix_web::HttpResponse> {
    // Verify user is admin
    let claims = extract_claims(&req)?;
    let requesting_user_id: i64 = claims.sub.parse().unwrap_or(0);

    let requesting_user = user_service
        .get_user(requesting_user_id)
        .await?
        .ok_or_else(|| crate::error::AppError::NotFound("User not found".to_string()))?;

    if !matches!(requesting_user.role, crate::models::user::UserRole::Admin) {
        return Err(crate::error::AppError::Forbidden("Admin access required".to_string()));
    }

    // Parse user ID from path
    let target_user_id: i64 = user_id_path
        .parse()
        .map_err(|e| crate::error::AppError::Validation(format!("Invalid user ID: {}", e)))?;

    // Prevent users from deleting themselves
    if target_user_id == requesting_user_id {
        return Err(crate::error::AppError::Validation(
            "Cannot delete your own account".to_string(),
        ));
    }

    user_service.delete_user(target_user_id).await?;

    info!("User deleted by admin: {}", target_user_id);

    Ok(actix_web::HttpResponse::Ok().json(serde_json::json!({
        "message": "User deleted successfully"
    })))
}