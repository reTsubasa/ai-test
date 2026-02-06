use tracing::info;

use crate::db::Database;
use crate::error::AppError;
use crate::models::user::{ChangePasswordRequest, UpdateProfileRequest, UpdateUserRequest, User, UserListQuery, UserListResponse, UserRecord, UserRole, UserStatus};

/// User service for user management operations
#[derive(Clone)]
pub struct UserService {
    db: Database,
}

impl UserService {
    /// Create a new user service
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// Get user by internal ID
    pub async fn get_user(&self, user_id: i64) -> Result<Option<User>, AppError> {
        let record = self.db.find_user_by_id(user_id).await?;
        Ok(record.map(|r| r.to_user()))
    }

    /// Get user by username
    pub async fn get_user_by_username(&self, username: &str) -> Result<Option<User>, AppError> {
        let record = self.db.find_user_by_username(username).await?;
        Ok(record.map(|r| r.to_user()))
    }

    /// List users with filtering and pagination
    pub async fn list_users(&self, query: UserListQuery) -> Result<UserListResponse, AppError> {
        let (records, total) = self.db.list_users(query.clone()).await?;

        let page = query.page.unwrap_or(1);
        let per_page = query.per_page.unwrap_or(20);
        let total_pages = ((total as f64) / (per_page as f64)).ceil() as u32;

        let users: Vec<User> = records.into_iter().map(|r| r.to_user()).collect();

        Ok(UserListResponse {
            users,
            total,
            page,
            per_page,
            total_pages,
        })
    }

    /// Create a new user
    pub async fn create_user(
        &self,
        username: &str,
        email: &str,
        password: &str,
        full_name: Option<String>,
    ) -> Result<User, AppError> {
        // Hash password
        let password_hash = bcrypt::hash(password, bcrypt::DEFAULT_COST)
            .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))?;

        // Create user in database
        let user_id = self
            .db
            .create_user(username, email, &password_hash, full_name.as_deref())
            .await?;

        info!("Created new user: {}", username);

        // Fetch and return the created user
        self.get_user(user_id).await?.ok_or_else(|| {
            AppError::Internal("Failed to retrieve created user".to_string())
        })
    }

    /// Update a user (admin only)
    pub async fn update_user(
        &self,
        user_id: i64,
        request: UpdateUserRequest,
    ) -> Result<User, AppError> {
        // Update email if provided
        if let Some(email) = &request.email {
            self.db.update_user_profile(user_id, Some(email), None).await?;
        }

        // Update full name if provided
        if let Some(full_name) = &request.full_name {
            self.db.update_user_profile(user_id, None, Some(full_name)).await?;
        }

        // Update status if provided
        if let Some(status) = &request.status {
            let is_active = matches!(status, UserStatus::Active);
            self.db.update_user_status(user_id, is_active).await?;
        }

        // Update role if provided
        if let Some(role) = &request.role {
            let is_superuser = matches!(role, UserRole::Admin);
            self.db.update_user_superuser(user_id, is_superuser).await?;
        }

        info!("Updated user: {}", user_id);

        // Fetch and return the updated user
        self.get_user(user_id).await?.ok_or_else(|| {
            AppError::NotFound("User not found".to_string())
        })
    }

    /// Delete a user
    pub async fn delete_user(&self, user_id: i64) -> Result<(), AppError> {
        self.db.delete_user(user_id).await?;
        info!("Deleted user: {}", user_id);
        Ok(())
    }

    /// Change user password
    pub async fn change_password(
        &self,
        user_id: i64,
        request: ChangePasswordRequest,
    ) -> Result<(), AppError> {
        // Verify current password
        let user_record = self
            .db
            .find_user_by_id(user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        let is_valid = bcrypt::verify(&request.current_password, &user_record.password_hash)
            .map_err(|e| AppError::Internal(format!("Password verification failed: {}", e)))?;

        if !is_valid {
            return Err(AppError::Auth("Current password is incorrect".to_string()));
        }

        // Hash new password
        let new_password_hash = bcrypt::hash(&request.new_password, bcrypt::DEFAULT_COST)
            .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))?;

        // Update password in database
        self.db.update_user_password(user_id, &new_password_hash).await?;

        info!("Password changed for user: {}", user_id);

        Ok(())
    }

    /// Update user profile
    pub async fn update_profile(
        &self,
        user_id: i64,
        request: UpdateProfileRequest,
    ) -> Result<User, AppError> {
        self.db
            .update_user_profile(
                user_id,
                request.email.as_deref(),
                request.full_name.as_deref(),
            )
            .await?;

        info!("Profile updated for user: {}", user_id);

        // Fetch and return the updated user
        self.get_user(user_id).await?.ok_or_else(|| {
            AppError::NotFound("User not found".to_string())
        })
    }

    /// Update last login timestamp
    pub async fn update_last_login(&self, user_id: i64) -> Result<(), AppError> {
        self.db.update_last_login(user_id).await?;
        Ok(())
    }
}