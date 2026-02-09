use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

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
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(email)]
    pub email: Option<String>,
    pub full_name: Option<String>,
    pub role: Option<UserRole>,
    pub status: Option<UserStatus>,
}

/// Update user profile request
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(email)]
    pub email: Option<String>,
    pub full_name: Option<String>,
}

/// Change password request
#[derive(Debug, Deserialize, Validate)]
pub struct ChangePasswordRequest {
    #[validate(length(min = 6))]
    pub current_password: String,
    #[validate(length(min = 6))]
    pub new_password: String,
}

/// User list query parameters for filtering and pagination
#[derive(Debug, Deserialize, Clone)]
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
        // Convert i64 database ID to UUID deterministically
        // Using the i64 as the lower 64 bits of a UUID v4-like format
        let id_bytes = self.id.to_be_bytes();
        let mut uuid_bytes = [0u8; 16];
        // Put the i64 in the last 8 bytes (lower 64 bits)
        uuid_bytes[8..16].copy_from_slice(&id_bytes);
        // Set version 4 (random) and variant bits to make it a valid UUID
        uuid_bytes[6] = (uuid_bytes[6] & 0x0f) | 0x40; // Version 4
        uuid_bytes[8] = (uuid_bytes[8] & 0x3f) | 0x80; // Variant 1
        let id = Uuid::from_bytes(uuid_bytes);

        // Parse SQLite datetime format (e.g., "2026-02-09 08:58:56")
        let parse_sqlite_datetime = |s: &str| -> DateTime<Utc> {
            // Try RFC3339 first
            if let Ok(dt) = DateTime::parse_from_rfc3339(s) {
                return dt.with_timezone(&Utc);
            }
            // Try SQLite format: "YYYY-MM-DD HH:MM:SS"
            if let Ok(dt) = chrono::NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S") {
                return DateTime::from_naive_utc_and_offset(dt, Utc);
            }
            // Fallback to epoch
            DateTime::UNIX_EPOCH
        };

        User {
            id,
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
            last_login: self.last_login.as_ref().map(|s| parse_sqlite_datetime(s)),
            created_at: parse_sqlite_datetime(&self.created_at),
            updated_at: parse_sqlite_datetime(&self.updated_at),
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