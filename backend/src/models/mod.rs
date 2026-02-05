//! Data models and structs
//!
//! This module contains all data models used throughout the application,
//! organized by domain/functionality.

pub mod auth;
pub mod config;
pub mod network;
pub mod system;
pub mod user;

// Re-export models for convenience
pub use auth::*;
pub use config::*;
pub use network::*;
pub use system::*;
pub use user::*;