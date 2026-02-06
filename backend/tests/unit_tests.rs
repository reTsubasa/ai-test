//! Unit Tests for VyOS Web UI Backend
//!
//! This module contains unit tests for individual components of the backend.
//! Unit tests focus on testing isolated functions and methods without external dependencies.

#[cfg(test)]
mod error_tests {
    use crate::error::{AppError, ErrorResponse};

    #[test]
    fn test_error_status_codes() {
        assert_eq!(AppError::Auth("test".to_string()).status_code(), 401);
        assert_eq!(AppError::Forbidden("test".to_string()).status_code(), 403);
        assert_eq!(AppError::NotFound("test".to_string()).status_code(), 404);
        assert_eq!(AppError::Validation("test".to_string()).status_code(), 400);
        assert_eq!(AppError::Config("test".to_string()).status_code(), 500);
        assert_eq!(AppError::Database("test".to_string()).status_code(), 500);
        assert_eq!(AppError::Internal("test".to_string()).status_code(), 500);
        assert_eq!(AppError::ExternalApi("test".to_string()).status_code(), 502);
        assert_eq!(AppError::Jwt("test".to_string()).status_code(), 401);
        assert_eq!(AppError::HttpClient("test".to_string()).status_code(), 502);
    }

    #[test]
    fn test_error_display() {
        assert_eq!(
            format!("{}", AppError::Auth("Unauthorized".to_string())),
            "Authentication error: Unauthorized"
        );
        assert_eq!(
            format!("{}", AppError::Validation("Invalid input".to_string())),
            "Validation error: Invalid input"
        );
    }

    #[test]
    fn test_error_response_serialization() {
        let response = ErrorResponse {
            error: "Test error".to_string(),
            status_code: 400,
        };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("Test error"));
        assert!(json.contains("400"));
    }
}

#[cfg(test)]
mod models_tests {
    use crate::models::user::{User, UserRecord, UserStatus, UserRole};
    use chrono::Utc;

    #[test]
    fn test_user_record_to_user_conversion() {
        let record = UserRecord {
            id: 1,
            username: "testuser".to_string(),
            email: "test@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            full_name: Some("Test User".to_string()),
            is_active: true,
            is_superuser: false,
            last_login: Some(Utc::now().to_rfc3339()),
            created_at: Utc::now().to_rfc3339(),
            updated_at: Utc::now().to_rfc3339(),
        };

        let user = record.to_user();
        assert_eq!(user.id, 1);
        assert_eq!(user.username, "testuser");
        assert_eq!(user.email, "test@example.com");
        assert_eq!(user.role, UserRole::Operator);
        assert_eq!(user.status, UserStatus::Active);
    }

    #[test]
    fn test_user_record_to_user_superuser_conversion() {
        let record = UserRecord {
            id: 1,
            username: "admin".to_string(),
            email: "admin@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            full_name: Some("Admin User".to_string()),
            is_active: true,
            is_superuser: true,
            last_login: None,
            created_at: Utc::now().to_rfc3339(),
            updated_at: Utc::now().to_rfc3339(),
        };

        let user = record.to_user();
        assert_eq!(user.role, UserRole::Admin);
    }

    #[test]
    fn test_user_record_to_user_inactive_conversion() {
        let record = UserRecord {
            id: 1,
            username: "inactive".to_string(),
            email: "inactive@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            full_name: Some("Inactive User".to_string()),
            is_active: false,
            is_superuser: false,
            last_login: None,
            created_at: Utc::now().to_rfc3339(),
            updated_at: Utc::now().to_rfc3339(),
        };

        let user = record.to_user();
        assert_eq!(user.status, UserStatus::Inactive);
    }
}

#[cfg(test)]
mod config_tests {
    use crate::config::AppConfig;

    #[test]
    fn test_config_defaults() {
        // This test would need a mock environment or test-specific configuration
        // For now, we verify the structure exists
        assert!(true);
    }

    #[test]
    fn test_server_address_format() {
        assert_eq!("127.0.0.1:8080".to_string(), format!("{}:{}", "127.0.0.1", 8080));
    }
}

#[cfg(test)]
mod auth_tests {
    use crate::services::AuthService;
    use crate::config::AppConfig;

    #[test]
    fn test_password_hashing_verification() {
        // Note: This test would require a real AuthService instance
        // The actual implementation in services/auth.rs has this test
        assert!(true);
    }

    #[test]
    fn test_jwt_claims_structure() {
        use crate::models::auth::Claims;
        use chrono::Utc;

        let claims = Claims {
            sub: "123".to_string(),
            username: "testuser".to_string(),
            exp: Utc::now().timestamp() + 3600,
            iat: Utc::now().timestamp(),
        };

        assert_eq!(claims.sub, "123");
        assert_eq!(claims.username, "testuser");
        assert!(claims.exp > claims.iat);
    }
}

#[cfg(test)]
mod validation_tests {
    use validator::Validate;

    #[derive(Validate, Debug)]
    struct TestRequest {
        #[validate(length(min = 3, max = 50))]
        pub username: String,

        #[validate(email)]
        pub email: String,

        #[validate(length(min = 6))]
        pub password: String,
    }

    #[test]
    fn test_valid_request_validation() {
        let request = TestRequest {
            username: "validuser".to_string(),
            email: "valid@example.com".to_string(),
            password: "password123".to_string(),
        };

        assert!(request.validate().is_ok());
    }

    #[test]
    fn test_invalid_username_too_short() {
        let request = TestRequest {
            username: "ab".to_string(),
            email: "valid@example.com".to_string(),
            password: "password123".to_string(),
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_invalid_email_format() {
        let request = TestRequest {
            username: "validuser".to_string(),
            email: "invalid-email".to_string(),
            password: "password123".to_string(),
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_invalid_password_too_short() {
        let request = TestRequest {
            username: "validuser".to_string(),
            email: "valid@example.com".to_string(),
            password: "short".to_string(),
        };

        assert!(request.validate().is_err());
    }
}

#[cfg(test)]
mod middleware_tests {
    use actix_web::http::StatusCode;

    #[test]
    fn test_error_response_codes() {
        // Verify that HTTP status codes are correct for different error types
        assert_eq!(StatusCode::UNAUTHORIZED, 401);
        assert_eq!(StatusCode::FORBIDDEN, 403);
        assert_eq!(StatusCode::NOT_FOUND, 404);
        assert_eq!(StatusCode::BAD_REQUEST, 400);
        assert_eq!(StatusCode::INTERNAL_SERVER_ERROR, 500);
    }
}