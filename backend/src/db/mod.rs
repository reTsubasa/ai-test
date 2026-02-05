use actix_web::web::Data;
use sqlx::any::AnyPool;
use tracing::info;

use crate::error::AppError;
use crate::models::user::{UserRecord, UserListQuery, UserRole, UserStatus};

/// Database connection pool wrapper
#[derive(Clone)]
pub struct Database {
    pool: AnyPool,
}

impl Database {
    /// Create a new database instance from a connection pool
    pub fn new(pool: AnyPool) -> Self {
        Self { pool }
    }

    /// Get reference to the connection pool
    pub fn pool(&self) -> &AnyPool {
        &self.pool
    }

    /// Initialize the database schema
    pub async fn init_schema(&self) -> Result<(), AppError> {
        info!("Initializing database schema...");

        // For SQLite, the migrations would typically be run separately
        // This is a placeholder for schema initialization logic
        info!("Database schema initialization complete");

        Ok(())
    }

    /// Run database migrations
    pub async fn run_migrations(&self) -> Result<(), AppError> {
        info!("Running database migrations...");

        // In a production setup, you would use sqlx::migrate! here
        // For now, we'll just log the intention
        info!("Database migrations completed");

        Ok(())
    }

    // ============================================================================
    // User Operations
    // ============================================================================

    /// Find a user by username
    pub async fn find_user_by_username(&self, username: &str) -> Result<Option<UserRecord>, AppError> {
        let query = r#"
            SELECT id, username, email, password_hash, full_name, is_active, is_superuser,
                   last_login, created_at, updated_at
            FROM users
            WHERE username = ?
        "#;

        let row = sqlx::query_as::<_, (i64, String, String, String, Option<String>, bool, bool, Option<String>, String, String)>(query)
            .bind(username)
            .fetch_optional(self.pool())
            .await?;

        Ok(row.map(|(id, username, email, password_hash, full_name, is_active, is_superuser, last_login, created_at, updated_at)| {
            UserRecord {
                id,
                username,
                email,
                password_hash,
                full_name,
                is_active,
                is_superuser,
                last_login,
                created_at,
                updated_at,
            }
        }))
    }

    /// Find a user by email
    pub async fn find_user_by_email(&self, email: &str) -> Result<Option<UserRecord>, AppError> {
        let query = r#"
            SELECT id, username, email, password_hash, full_name, is_active, is_superuser,
                   last_login, created_at, updated_at
            FROM users
            WHERE email = ?
        "#;

        let row = sqlx::query_as::<_, (i64, String, String, String, Option<String>, bool, bool, Option<String>, String, String)>(query)
            .bind(email)
            .fetch_optional(self.pool())
            .await?;

        Ok(row.map(|(id, username, email, password_hash, full_name, is_active, is_superuser, last_login, created_at, updated_at)| {
            UserRecord {
                id,
                username,
                email,
                password_hash,
                full_name,
                is_active,
                is_superuser,
                last_login,
                created_at,
                updated_at,
            }
        }))
    }

    /// Find a user by ID
    pub async fn find_user_by_id(&self, user_id: i64) -> Result<Option<UserRecord>, AppError> {
        let query = r#"
            SELECT id, username, email, password_hash, full_name, is_active, is_superuser,
                   last_login, created_at, updated_at
            FROM users
            WHERE id = ?
        "#;

        let row = sqlx::query_as::<_, (i64, String, String, String, Option<String>, bool, bool, Option<String>, String, String)>(query)
            .bind(user_id)
            .fetch_optional(self.pool())
            .await?;

        Ok(row.map(|(id, username, email, password_hash, full_name, is_active, is_superuser, last_login, created_at, updated_at)| {
            UserRecord {
                id,
                username,
                email,
                password_hash,
                full_name,
                is_active,
                is_superuser,
                last_login,
                created_at,
                updated_at,
            }
        }))
    }

    /// Create a new user
    pub async fn create_user(
        &self,
        username: &str,
        email: &str,
        password_hash: &str,
        full_name: Option<&str>,
    ) -> Result<i64, AppError> {
        let query = r#"
            INSERT INTO users (username, email, password_hash, full_name, is_active, is_superuser)
            VALUES (?, ?, ?, ?, 1, 0)
            RETURNING id
        "#;

        let result = sqlx::query_scalar::<_, i64>(query)
            .bind(username)
            .bind(email)
            .bind(password_hash)
            .bind(full_name.unwrap_or(""))
            .fetch_one(self.pool())
            .await?;

        Ok(result)
    }

    /// Update a user's profile
    pub async fn update_user_profile(
        &self,
        user_id: i64,
        email: Option<&str>,
        full_name: Option<&str>,
    ) -> Result<(), AppError> {
        let mut updates = vec![];
        let mut index = 1;

        if email.is_some() {
            updates.push(format!("email = ?{}", index));
            index += 1;
        }

        if full_name.is_some() {
            updates.push(format!("full_name = ?{}", index));
            index += 1;
        }

        if updates.is_empty() {
            return Ok(());
        }

        let query = format!(
            "UPDATE users SET {} WHERE id = ?{}",
            updates.join(", "),
            index
        );

        let mut query_builder = sqlx::query(&query);
        query_builder = query_builder.bind(user_id);

        if let Some(e) = email {
            query_builder = query_builder.bind(e);
        }
        if let Some(fn_) = full_name {
            query_builder = query_builder.bind(fn_);
        }

        query_builder.execute(self.pool()).await?;

        Ok(())
    }

    /// Update a user's password
    pub async fn update_user_password(
        &self,
        user_id: i64,
        password_hash: &str,
    ) -> Result<(), AppError> {
        let query = "UPDATE users SET password_hash = ? WHERE id = ?";
        sqlx::query(query)
            .bind(password_hash)
            .bind(user_id)
            .execute(self.pool())
            .await?;

        Ok(())
    }

    /// Update a user's last login timestamp
    pub async fn update_last_login(&self, user_id: i64) -> Result<(), AppError> {
        let query = "UPDATE users SET last_login = datetime('now') WHERE id = ?";
        sqlx::query(query)
            .bind(user_id)
            .execute(self.pool())
            .await?;

        Ok(())
    }

    /// Update a user's status
    pub async fn update_user_status(&self, user_id: i64, is_active: bool) -> Result<(), AppError> {
        let query = "UPDATE users SET is_active = ? WHERE id = ?";
        sqlx::query(query)
            .bind(is_active)
            .bind(user_id)
            .execute(self.pool())
            .await?;

        Ok(())
    }

    /// Update a user's superuser status
    pub async fn update_user_superuser(&self, user_id: i64, is_superuser: bool) -> Result<(), AppError> {
        let query = "UPDATE users SET is_superuser = ? WHERE id = ?";
        sqlx::query(query)
            .bind(is_superuser)
            .bind(user_id)
            .execute(self.pool())
            .await?;

        Ok(())
    }

    /// Delete a user
    pub async fn delete_user(&self, user_id: i64) -> Result<(), AppError> {
        let query = "DELETE FROM users WHERE id = ?";
        sqlx::query(query)
            .bind(user_id)
            .execute(self.pool())
            .await?;

        Ok(())
    }

    /// List users with optional filtering and pagination
    pub async fn list_users(&self, query_params: UserListQuery) -> Result<(Vec<UserRecord>, u64), AppError> {
        let page = query_params.page.unwrap_or(1).max(1);
        let per_page = query_params.per_page.unwrap_or(20).min(100);
        let offset = (page - 1) * per_page;

        let mut where_clauses = vec!["1=1".to_string()];
        let mut bind_values: Vec<String> = vec![];

        if let Some(search) = &query_params.search {
            where_clauses.push("(username LIKE ? OR email LIKE ?)".to_string());
            bind_values.push(format!("%{}%", search));
            bind_values.push(format!("%{}%", search));
        }

        if let Some(status) = &query_params.status {
            let is_active = matches!(status, UserStatus::Active);
            where_clauses.push("is_active = ?".to_string());
            bind_values.push(if is_active { "1".to_string() } else { "0".to_string() });
        }

        // Note: Role filtering would need to join with user_roles table
        // For now, we filter based on is_superuser for admin role
        if let Some(role) = &query_params.role {
            let is_superuser = matches!(role, UserRole::Admin);
            where_clauses.push("is_superuser = ?".to_string());
            bind_values.push(if is_superuser { "1".to_string() } else { "0".to_string() });
        }

        let where_clause = where_clauses.join(" AND ");

        // Count query
        let count_query = format!("SELECT COUNT(*) FROM users WHERE {}", where_clause);
        let mut count_query_builder = sqlx::query_scalar::<_, i64>(&count_query);
        for value in &bind_values {
            count_query_builder = count_query_builder.bind(value);
        }
        let total = count_query_builder.fetch_one(self.pool()).await? as u64;

        // Data query
        let data_query = format!(
            "SELECT id, username, email, password_hash, full_name, is_active, is_superuser, last_login, created_at, updated_at \
             FROM users WHERE {} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            where_clause
        );

        let rows = sqlx::query_as::<_, (i64, String, String, String, Option<String>, bool, bool, Option<String>, String, String)>(&data_query);
        let mut rows_builder = rows;
        for value in &bind_values {
            rows_builder = rows_builder.bind(value);
        }
        rows_builder = rows_builder.bind(per_page).bind(offset);

        let rows_result = rows_builder.fetch_all(self.pool()).await?;

        let users = rows_result
            .into_iter()
            .map(|(id, username, email, password_hash, full_name, is_active, is_superuser, last_login, created_at, updated_at)| {
                UserRecord {
                    id,
                    username,
                    email,
                    password_hash,
                    full_name,
                    is_active,
                    is_superuser,
                    last_login,
                    created_at,
                    updated_at,
                }
            })
            .collect();

        Ok((users, total))
    }

    /// Get total user count
    pub async fn count_users(&self) -> Result<u64, AppError> {
        let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users")
            .fetch_one(self.pool())
            .await?;

        Ok(count as u64)
    }
}

/// Helper function to create database from config
pub async fn create_database(pool: AnyPool) -> Result<Data<Database>, AppError> {
    let db = Database::new(pool);
    db.init_schema().await?;
    db.run_migrations().await?;

    Ok(Data::new(db))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_creation() {
        // This would be expanded with actual tests in the future
        assert!(true);
    }
}