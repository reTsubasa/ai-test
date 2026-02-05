//! Data models and structs
//!
//! This module contains all data models used throughout the application,
//! organized by domain/functionality.

pub mod auth;
pub mod network;
pub mod user;

// Re-export models for convenience
pub use auth::*;
pub use network::*;
pub use user::*;