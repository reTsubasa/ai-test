//! Middleware components
//!
//! This module contains middleware components for request/response processing,
//! authentication, logging, etc.

pub mod auth;

// Re-export middleware for convenience
pub use auth::*;