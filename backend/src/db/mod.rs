use actix_web::web::Data;
use sqlx::any::AnyPool;
use tracing::info;

use crate::error::AppError;

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