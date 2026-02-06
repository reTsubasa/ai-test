use actix_web::http::StatusCode;
use actix_web::HttpResponse;
use actix_web::ResponseError;
use serde::Serialize;
use std::fmt;
use thiserror::Error;

/// Main application error type
#[derive(Error, Debug)]
pub enum AppError {
    /// Configuration errors
    #[error("Configuration error: {0}")]
    Config(String),

    /// Database errors
    #[error("Database error: {0}")]
    Database(String),

    /// Authentication errors
    #[error("Authentication error: {0}")]
    Auth(String),

    /// Authorization errors
    #[error("Authorization error: {0}")]
    Forbidden(String),

    /// Validation errors
    #[error("Validation error: {0}")]
    Validation(String),

    /// Not found errors
    #[error("Not found: {0}")]
    NotFound(String),

    /// Internal server errors
    #[error("Internal error: {0}")]
    Internal(String),

    /// External API errors
    #[error("External API error: {0}")]
    ExternalApi(String),

    /// JWT errors
    #[error("JWT error: {0}")]
    Jwt(String),

    /// HTTP client errors
    #[error("HTTP client error: {0}")]
    HttpClient(String),
}

impl AppError {
    /// Get the HTTP status code for this error
    pub fn status_code(&self) -> StatusCode {
        match self {
            AppError::Config(_) | AppError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Database(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Auth(_) => StatusCode::UNAUTHORIZED,
            AppError::Forbidden(_) => StatusCode::FORBIDDEN,
            AppError::Validation(_) => StatusCode::BAD_REQUEST,
            AppError::NotFound(_) => StatusCode::NOT_FOUND,
            AppError::ExternalApi(_) => StatusCode::BAD_GATEWAY,
            AppError::Jwt(_) => StatusCode::UNAUTHORIZED,
            AppError::HttpClient(_) => StatusCode::BAD_GATEWAY,
        }
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code()).json(ErrorResponse {
            error: self.to_string(),
            status_code: self.status_code().as_u16(),
        })
    }
}

/// Standardized error response structure
#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub status_code: u16,
}

/// Result type alias for application operations
pub type AppResult<T> = Result<T, AppError>;

/// Convert SQLx errors to AppError
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Database(err.to_string())
    }
}

/// Convert anyhow errors to AppError
impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Internal(err.to_string())
    }
}

/// Convert io errors to AppError
impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Internal(format!("IO error: {}", err))
    }
}

/// Convert serde JSON errors to AppError
impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Internal(format!("JSON error: {}", err))
    }
}

/// Convert validator errors to AppError
impl From<validator::ValidationErrors> for AppError {
    fn from(err: validator::ValidationErrors) -> Self {
        AppError::Validation(format!("Validation failed: {:?}", err))
    }
}

/// Convert JWT errors to AppError
impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        AppError::Jwt(format!("JWT error: {}", err))
    }
}

/// Convert reqwest errors to AppError
impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        AppError::HttpClient(format!("HTTP client error: {}", err))
    }
}

/// Convert environment variable errors to AppError
impl From<std::env::VarError> for AppError {
    fn from(err: std::env::VarError) -> Self {
        AppError::Config(format!("Environment variable error: {}", err))
    }
}

/// Convert actix_web errors to AppError
impl From<actix_web::Error> for AppError {
    fn from(err: actix_web::Error) -> Self {
        AppError::Internal(format!("Actix-web error: {}", err))
    }
}

/// Parse integer errors
impl From<std::num::ParseIntError> for AppError {
    fn from(err: std::num::ParseIntError) -> Self {
        AppError::Validation(format!("Parse integer error: {}", err))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_status_codes() {
        assert_eq!(AppError::Auth("test".to_string()).status_code(), StatusCode::UNAUTHORIZED);
        assert_eq!(AppError::Forbidden("test".to_string()).status_code(), StatusCode::FORBIDDEN);
        assert_eq!(AppError::NotFound("test".to_string()).status_code(), StatusCode::NOT_FOUND);
        assert_eq!(AppError::Validation("test".to_string()).status_code(), StatusCode::BAD_REQUEST);
    }
}