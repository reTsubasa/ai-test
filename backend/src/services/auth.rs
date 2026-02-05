use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::config::AppConfig;
use crate::error::AppError;
use crate::models::auth::Claims;

/// Authentication service
pub struct AuthService {
    jwt_secret: String,
    jwt_expiration: i64,
}

impl AuthService {
    /// Create a new authentication service
    pub fn new(config: &AppConfig) -> Self {
        Self {
            jwt_secret: config.jwt_secret_key.clone(),
            jwt_expiration: (config.jwt_expiration_minutes * 60) as i64,
        }
    }

    /// Generate a JWT token for a user
    pub fn generate_token(&self, user_id: &str, username: &str) -> Result<String, AppError> {
        let now = Utc::now();
        let exp = now.timestamp() + self.jwt_expiration;

        let claims = Claims {
            sub: user_id.to_string(),
            username: username.to_string(),
            exp,
            iat: now.timestamp(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|e| AppError::Jwt(format!("Token generation failed: {}", e)))
    }

    /// Validate a JWT token and return claims
    pub fn validate_token(&self, token: &str) -> Result<Claims, AppError> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_bytes()),
            &Validation::default(),
        )
        .map(|data| data.claims)
        .map_err(|e| AppError::Jwt(format!("Token validation failed: {}", e)))
    }

    /// Hash a password using bcrypt
    pub fn hash_password(&self, password: &str) -> Result<String, AppError> {
        bcrypt::hash(password, bcrypt::DEFAULT_COST)
            .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))
    }

    /// Verify a password against a hash
    pub fn verify_password(&self, password: &str, hash: &str) -> Result<bool, AppError> {
        bcrypt::verify(password, hash)
            .map_err(|e| AppError::Internal(format!("Password verification failed: {}", e)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let service = AuthService::new(&AppConfig::from_env().unwrap());
        let password = "test_password_123";

        let hash = service.hash_password(password).unwrap();
        assert!(service.verify_password(password, &hash).unwrap());
        assert!(!service.verify_password("wrong_password", &hash).unwrap());
    }
}