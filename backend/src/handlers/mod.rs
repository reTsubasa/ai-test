//! HTTP request handlers
//!
//! This module contains all the HTTP endpoint handlers for the API.
//! Each handler is organized into submodules by feature/functionality.

pub mod auth;
pub mod health;
pub mod network;
pub mod user;

// Re-export handlers for convenience
pub use auth::*;
pub use health::*;
pub use network::*;
pub use user::*;