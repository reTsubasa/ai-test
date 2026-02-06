//! HTTP request handlers
//!
//! This module contains all the HTTP endpoint handlers for the API.
//! Each handler is organized into submodules by feature/functionality.

pub mod auth;
pub mod config;
pub mod health;
pub mod monitoring;
// pub mod network;
// pub mod node;
pub mod system;
pub mod user;

// Re-export handlers for convenience
pub use auth::*;
pub use config::*;
pub use health::*;
pub use monitoring::*;
// pub use network::*;
// pub use node::*;
pub use system::*;
pub use user::*;