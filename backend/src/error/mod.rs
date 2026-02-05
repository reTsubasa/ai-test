use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use std::convert::Infallible;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Authentication error: {0}")]
    Auth(String),

    #[error("Authorization error: {0}")]
    Forbidden(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal server error: {0}")]
    Internal(String),

    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Database(err) => {
                tracing::error!("Database error: {:?}", err);
                (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
            }
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::Auth(msg) => (StatusCode::UNAUTHORIZED, msg.as_str()),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, msg.as_str()),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.as_str()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::Internal(msg) => {
                tracing::error!("Internal error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error")
            }
            AppError::Jwt(err) => {
                tracing::error!("JWT error: {:?}", err);
                (StatusCode::UNAUTHORIZED, "Invalid token")
            }
            AppError::Serialization(_) => (StatusCode::BAD_REQUEST, "Invalid JSON"),
            AppError::Io(err) => {
                tracing::error!("IO error: {:?}", err);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error")
            }
        };

        let body = Json(json!({
            "success": false,
            "error": {
                "code": error_code_from_status(status),
                "message": error_message,
            },
            "timestamp": chrono::Utc::now().to_rfc3339()
        }));

        (status, body).into_response()
    }
}

fn error_code_from_status(status: StatusCode) -> &'static str {
    match status {
        StatusCode::UNAUTHORIZED => "UNAUTHORIZED",
        StatusCode::FORBIDDEN => "FORBIDDEN",
        StatusCode::NOT_FOUND => "NOT_FOUND",
        StatusCode::BAD_REQUEST => "BAD_REQUEST",
        StatusCode::TOO_MANY_REQUESTS => "RATE_LIMITED",
        _ => "INTERNAL_ERROR",
    }
}

// Convert Infallible to AppError for compatibility
impl From<Infallible> for AppError {
    fn from(_: Infallible) -> Self {
        unreachable!()
    }
}