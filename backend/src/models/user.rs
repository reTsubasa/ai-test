use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// User role
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    Operator,
    Viewer,
}

/// User status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UserStatus {
    Active,
    Disabled,
    Locked,
}

/// User model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub full_name: Option<String>,
    pub role: UserRole,
    pub status: UserStatus,
    pub last_login: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Create user request
#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub full_name: Option<String>,
    pub role: UserRole,
}

/// Update user request
#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub full_name: Option<String>,
    pub role: Option<UserRole>,
    pub status: Option<UserStatus>,
}

/// Update user profile request
#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub email: Option<String>,
    pub full_name: Option<String>,
}

/// Change password request
#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

/// Register request (same as CreateUserRequest but without role)
#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: String,

    #[validate(email)]
    pub email: String,

    #[validate(length(min = 6))]
    pub password: String,

    pub full_name: Option<String>,
}

/// User list query parameters for filtering and pagination
#[derive(Debug, Deserialize)]
pub struct UserListQuery {
    /// Filter by status
    pub status: Option<UserStatus>,
    /// Filter by role
    pub role: Option<UserRole>,
    /// Search by username or email
    pub search: Option<String>,
    /// Page number (1-based)
    pub page: Option<u32>,
    /// Items per page
    pub per_page: Option<u32>,
}

/// User list response
#[derive(Debug, Serialize)]
pub struct UserListResponse {
    pub users: Vec<User>,
    pub total: u64,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

/// User database record (includes password_hash)
#[derive(Debug, Clone)]
pub struct UserRecord {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub full_name: Option<String>,
    pub is_active: bool,
    pub is_superuser: bool,
    pub last_login: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl UserRecord {
    /// Convert database record to public User model
    pub fn to_user(&self) -> User {
        User {
            id: uuid::Uuid::new_v4(), // Use integer ID in production
            username: self.username.clone(),
            email: self.email.clone(),
            full_name: self.full_name.clone(),
            role: if self.is_superuser {
                UserRole::Admin
            } else {
                UserRole::Viewer
            },
            status: if self.is_active {
                UserStatus::Active
            } else {
                UserStatus::Disabled
            },
            last_login: self.last_login.as_ref().and_then(|s| {
                DateTime::parse_from_rfc3339(s)
                    .ok()
                    .map(|dt| dt.with_timezone(&Utc))
            }),
            created_at: DateTime::parse_from_rfc3339(&self.created_at)
                .unwrap_or_default()
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&self.updated_at)
                .unwrap_or_default()
                .with_timezone(&Utc),
        }
    }

    /// Get primary role name from database record
    pub fn role_name(&self) -> String {
        if self.is_superuser {
            "admin".to_string()
        } else {
            "viewer".to_string()
        }
    }
}