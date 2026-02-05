use crate::error::AppError;
use crate::models::user::{CreateUserRequest, UpdateUserRequest, User};
use bcrypt::{hash, DEFAULT_COST};
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

pub struct UserService;

impl UserService {
    pub async fn create_user(
        db: &Pool<Sqlite>,
        input: CreateUserRequest,
    ) -> Result<User, AppError> {
        // Validate input
        input.validate().map_err(|e| {
            AppError::Validation(format!("Validation error: {}", e))
        })?;

        // Check if user already exists
        let existing_user: Option<(i32,)> = sqlx::query_as(
            "SELECT COUNT(*) FROM users WHERE username = ? OR email = ?"
        )
        .bind(&input.username)
        .bind(&input.email)
        .fetch_optional(db)
        .await?;

        if let Some((count,)) = existing_user {
            if count > 0 {
                return Err(AppError::BadRequest("Username or email already exists".to_string()));
            }
        }

        // Hash password
        let password_hash = hash(&input.password, DEFAULT_COST)
            .map_err(|_| AppError::Internal("Failed to hash password".to_string()))?;

        // Insert user
        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (id, username, email, password_hash, first_name, last_name, is_active)
            VALUES (?, ?, ?, ?, ?, ?, true)
            RETURNING id, username, email, password_hash, first_name, last_name, is_active, created_at, updated_at
            "#,
            Uuid::new_v4(),
            input.username,
            input.email,
            password_hash,
            input.first_name,
            input.last_name
        )
        .fetch_one(db)
        .await?;

        Ok(user)
    }

    pub async fn get_user_by_id(
        db: &Pool<Sqlite>,
        user_id: Uuid,
    ) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as!(
            User,
            "SELECT id, username, email, password_hash, first_name, last_name, is_active, created_at, updated_at FROM users WHERE id = ?",
            user_id
        )
        .fetch_optional(db)
        .await?;

        Ok(user)
    }

    pub async fn get_user_by_username(
        db: &Pool<Sqlite>,
        username: &str,
    ) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as!(
            User,
            "SELECT id, username, email, password_hash, first_name, last_name, is_active, created_at, updated_at FROM users WHERE username = ?",
            username
        )
        .fetch_optional(db)
        .await?;

        Ok(user)
    }

    pub async fn update_user(
        db: &Pool<Sqlite>,
        user_id: Uuid,
        input: UpdateUserRequest,
    ) -> Result<User, AppError> {
        // Validate input
        // Note: We don't have validation attributes on UpdateUserRequest, so we'll validate manually
        if let Some(ref username) = input.username {
            if username.len() < 3 || username.len() > 32 {
                return Err(AppError::Validation("Username must be between 3 and 32 characters".to_string()));
            }
        }

        // Update user
        let user = sqlx::query_as!(
            User,
            r#"
            UPDATE users
            SET
                username = COALESCE($2, username),
                email = COALESCE($3, email),
                first_name = COALESCE($4, first_name),
                last_name = COALESCE($5, last_name),
                is_active = COALESCE($6, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, username, email, password_hash, first_name, last_name, is_active, created_at, updated_at
            "#,
            user_id,
            input.username,
            input.email,
            input.first_name,
            input.last_name,
            input.is_active
        )
        .fetch_one(db)
        .await?;

        Ok(user)
    }

    pub async fn delete_user(
        db: &Pool<Sqlite>,
        user_id: Uuid,
    ) -> Result<(), AppError> {
        sqlx::query!("DELETE FROM users WHERE id = ?", user_id)
            .execute(db)
            .await?;

        Ok(())
    }

    pub async fn verify_password(
        candidate_password: &str,
        hashed_password: &str,
    ) -> Result<bool, AppError> {
        let valid = bcrypt::verify(candidate_password, hashed_password)
            .map_err(|_| AppError::Internal("Password verification failed".to_string()))?;

        Ok(valid)
    }
}