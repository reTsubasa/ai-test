use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

use crate::config::AppConfig;
use crate::db::Database;
use crate::error::AppError;
use crate::models::auth::Claims;
use crate::models::user::{User, UserRecord};

/// Authentication service
pub struct AuthService {
    jwt_secret: String,
    jwt_expiration: i64,
    db: Database,
}

impl AuthService {
    /// Create a new authentication service
    pub fn new(config: &AppConfig, db: Database) -> Self {
        Self {
            jwt_secret: config.jwt_secret_key.clone(),
            jwt_expiration: (config.jwt_expiration_minutes * 60) as i64,
            db,
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

    /// Find user by username
    pub async fn find_user_by_username(&self, username: &str) -> Result<Option<UserRecord>, AppError> {
        self.db.find_user_by_username(username).await
    }

    /// Find user by email
    pub async fn find_user_by_email(&self, email: &str) -> Result<Option<UserRecord>, AppError> {
        self.db.find_user_by_email(email).await
    }

    /// Find user by ID
    pub async fn find_user_by_id(&self, user_id: i64) -> Result<Option<UserRecord>, AppError> {
        self.db.find_user_by_id(user_id).await
    }

    /// Authenticate a user with username/email and password
    pub async fn authenticate(
        &self,
        username_or_email: &str,
        password: &str,
    ) -> Result<User, AppError> {
        // Try to find user by username first, then by email
        let user_record = self
            .find_user_by_username(username_or_email)
            .await?
            .or_else(|| async {
                self.find_user_by_email(username_or_email).await.ok().flatten()
            }.await)
            .ok_or_else(|| AppError::Auth("Invalid credentials".to_string()))?;

        // Check if user is active
        if !user_record.is_active {
            return Err(AppError::Auth("User account is disabled".to_string()));
        }

        // Verify password
        let is_valid = self.verify_password(password, &user_record.password_hash)?;
        if !is_valid {
            return Err(AppError::Auth("Invalid credentials".to_string()));
        }

        // Update last login timestamp
        if let Err(e) = self.db.update_last_login(user_record.id).await {
            warn!("Failed to update last login for user {}: {}", user_record.username, e);
        }

        Ok(user_record.to_user())
    }

    /// Register a new user
    pub async fn register(
        &self,
        username: &str,
        email: &str,
        password: &str,
        full_name: Option<String>,
    ) -> Result<User, AppError> {
        // Validate username
        if username.len() < 3 {
            return Err(AppError::Validation(
                "Username must be at least 3 characters long".to_string(),
            ));
        }

        if username.len() > 50 {
            return Err(AppError::Validation(
                "Username must be at most 50 characters long".to_string(),
            ));
        }

        // Validate email
        if !email.contains('@') || !email.contains('.') {
            return Err(AppError::Validation("Invalid email address".to_string()));
        }

        // Validate password
        if password.len() < 6 {
            return Err(AppError::Validation(
                "Password must be at least 6 characters long".to_string(),
            ));
        }

        // Check if username already exists
        if self.find_user_by_username(username).await?.is_some() {
            return Err(AppError::Validation("Username already exists".to_string()));
        }

        // Check if email already exists
        if self.find_user_by_email(email).await?.is_some() {
            return Err(AppError::Validation("Email already exists".to_string()));
        }

        // Hash the password
        let password_hash = self.hash_password(password)?;

        // Create the user
        let user_id = self
            .db
            .create_user(username, email, &password_hash, full_name.as_deref())
            .await?;

        info!("Created new user: {}", username);

        // Fetch the created user
        let user_record = self
            .find_user_by_id(user_id)
            .await?
            .ok_or_else(|| AppError::Internal("Failed to retrieve created user".to_string()))?;

        Ok(user_record.to_user())
    }

    /// Refresh an access token
    pub fn refresh_token(&self, claims: &Claims) -> Result<(String, Claims), AppError> {
        let now = Utc::now();
        let exp = now.timestamp() + self.jwt_expiration;

        let new_claims = Claims {
            sub: claims.sub.clone(),
            username: claims.username.clone(),
            exp,
            iat: now.timestamp(),
        };

        let token = encode(
            &Header::default(),
            &new_claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|e| AppError::Jwt(format!("Token refresh failed: {}", e)))?;

        Ok((token, new_claims))
    }

    /// Logout a user (invalidate session)
    pub async fn logout(&self, _user_id: i64) -> Result<(), AppError> {
        // In a real implementation, this would invalidate the JWT token
        // by adding it to a blacklist or revoking the session
        // For now, we just log the action
        info!("User logged out");
        Ok(())
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