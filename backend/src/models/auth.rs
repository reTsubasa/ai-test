use serde::{Deserialize, Serialize};
use validator::Validate;

/// JWT Claims structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,

    /// Username
    pub username: String,

    /// Expiration time (Unix timestamp)
    pub exp: i64,

    /// Issued at time (Unix timestamp)
    pub iat: i64,
}

/// Login request payload
#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: String,

    #[validate(length(min = 6))]
    pub password: String,
}

/// Login response payload
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: String,
    pub username: String,
}

/// Refresh token request
#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

/// Token validation response
#[derive(Debug, Serialize)]
pub struct TokenValidationResponse {
    pub valid: bool,
    pub user_id: Option<String>,
    pub username: Option<String>,
    pub expires_at: Option<i64>,
}