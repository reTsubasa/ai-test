use crate::error::AppError;
use crate::models::auth::{Claims, TokenPair};
use crate::models::user::{LoginRequest, LoginResponse, UserResponse};
use crate::services::user_service::UserService;
use axum::async_trait;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use sqlx::Pool;
use sqlx::Sqlite;
use uuid::Uuid;

pub struct AuthService;

#[async_trait]
pub trait TokenService {
    async fn generate_tokens(user_id: Uuid, username: String) -> Result<TokenPair, AppError>;
    async fn verify_token(token: &str) -> Result<Claims, AppError>;
}

impl AuthService {
    pub async fn login(
        db: &Pool<Sqlite>,
        config: &crate::config::Config,
        input: LoginRequest,
    ) -> Result<LoginResponse, AppError> {
        // Find user by username
        let user = UserService::get_user_by_username(db, &input.username)
            .await?
            .ok_or(AppError::Auth("Invalid credentials".to_string()))?;

        if !user.is_active {
            return Err(AppError::Auth("Account is deactivated".to_string()));
        }

        // Verify password
        let valid_password = UserService::verify_password(&input.password, &user.password_hash).await?;
        if !valid_password {
            return Err(AppError::Auth("Invalid credentials".to_string()));
        }

        // Generate tokens
        let tokens = Self::generate_tokens(user.id, user.username.clone()).await?;

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

        Ok(LoginResponse {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            user: user_response,
        })
    }

    pub async fn generate_tokens(user_id: Uuid, username: String) -> Result<TokenPair, AppError> {
        let now = Utc::now();
        let exp = (now + Duration::hours(1)).timestamp() as usize; // 1 hour expiry
        let iat = now.timestamp() as usize;

        let claims = Claims {
            sub: user_id.to_string(),
            exp,
            iat,
            user_id,
            username: username.clone(),
        };

        let access_token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(crate::config::default_jwt_secret().as_ref()),
        ).map_err(|e| AppError::Internal(format!("JWT encoding error: {}", e)))?;

        // Generate refresh token (simplified, in production use a separate table)
        let refresh_claims = Claims {
            sub: user_id.to_string(),
            exp: (now + Duration::days(30)).timestamp() as usize, // 30 day expiry
            iat,
            user_id,
            username,
        };

        let refresh_token = encode(
            &Header::default(),
            &refresh_claims,
            &EncodingKey::from_secret(crate::config::default_jwt_secret().as_ref()),
        ).map_err(|e| AppError::Internal(format!("JWT encoding error: {}", e)))?;

        Ok(TokenPair {
            access_token,
            refresh_token,
        })
    }

    pub async fn verify_token(token: &str) -> Result<Claims, AppError> {
        let validation = Validation::default();
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(crate::config::default_jwt_secret().as_ref()),
            &validation,
        ).map_err(|e| {
            tracing::error!("JWT decoding error: {}", e);
            AppError::Auth("Invalid token".to_string())
        })?;

        Ok(token_data.claims)
    }

    pub async fn refresh_token(
        _db: &Pool<Sqlite>,
        _config: &crate::config::Config,
        refresh_token: &str,
    ) -> Result<LoginResponse, AppError> {
        // Verify refresh token
        let claims = Self::verify_token(refresh_token).await?;

        // In a real implementation, you would check if the refresh token is valid in a DB
        // For now, we just generate new tokens

        let tokens = Self::generate_tokens(claims.user_id, claims.username).await?;

        // You would typically fetch user details here
        // For now, we'll return a minimal response
        let user_response = UserResponse {
            id: claims.user_id,
            username: claims.username,
            email: "placeholder@example.com".to_string(), // In real app, fetch from DB
            first_name: None,
            last_name: None,
            is_active: true, // In real app, fetch from DB
            created_at: Utc::now(), // In real app, fetch from DB
            updated_at: Utc::now(), // In real app, fetch from DB
        };

        Ok(LoginResponse {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            user: user_response,
        })
    }
}