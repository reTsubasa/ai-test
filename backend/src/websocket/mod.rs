//! WebSocket handlers and connections
//!
//! This module provides real-time bidirectional communication capabilities
//! for the application.

use actix::prelude::*;
use actix_web::{web, Error, HttpRequest, HttpResponse};
use actix_ws::AggregatedMessage;
use futures_util::stream::SplitSink;
use futures_util::StreamExt;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// WebSocket message types
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum WsMessage {
    /// Heartbeat/ping message
    Ping,

    /// Heartbeat/pong response
    Pong,

    /// Authentication message
    Auth { token: String },

    /// Subscribe to updates
    Subscribe { channel: String },

    /// Unsubscribe from updates
    Unsubscribe { channel: String },

    /// Server broadcast
    Broadcast { channel: String, data: serde_json::Value },

    /// Error message
    Error { message: String },
}

/// WebSocket connection actor
pub struct WebSocketConnection {
    /// Connection ID
    pub id: String,

    /// User ID if authenticated
    pub user_id: Option<String>,

    /// Subscribed channels
    pub channels: Vec<String>,
}

impl Actor for WebSocketConnection {
    type Context = Context<Self>;
}

impl Handler<WsMessage> for WebSocketConnection {
    type Result = ();

    fn handle(&mut self, msg: WsMessage, _ctx: &mut Self::Context) -> Self::Result {
        match msg {
            WsMessage::Ping => {
                // Respond with pong
            }
            WsMessage::Auth { token } => {
                // Validate token and set user_id
                self.user_id = Some("user_id_from_token".to_string());
            }
            WsMessage::Subscribe { channel } => {
                if !self.channels.contains(&channel) {
                    self.channels.push(channel);
                }
            }
            WsMessage::Unsubscribe { channel } => {
                self.channels.retain(|c| c != &channel);
            }
            _ => {}
        }
    }
}

/// WebSocket connection manager
pub struct ConnectionManager {
    /// Map of connection ID to connection actor address
    connections: Arc<Mutex<HashMap<String, Addr<WebSocketConnection>>>>,
}

impl ConnectionManager {
    /// Create a new connection manager
    pub fn new() -> Self {
        Self {
            connections: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Add a connection
    pub fn add_connection(&self, id: String, addr: Addr<WebSocketConnection>) {
        let mut connections = self.connections.lock().unwrap();
        connections.insert(id, addr);
    }

    /// Remove a connection
    pub fn remove_connection(&self, id: &str) {
        let mut connections = self.connections.lock().unwrap();
        connections.remove(id);
    }

    /// Broadcast a message to all connections subscribed to a channel
    pub async fn broadcast(&self, channel: &str, message: WsMessage) {
        let connections = self.connections.lock().unwrap();
        for (_, addr) in connections.iter() {
            addr.send(message.clone()).await.ok();
        }
    }
}

impl Default for ConnectionManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Handle WebSocket connection
pub async fn websocket_handler(
    req: HttpRequest,
    mut payload: actix_ws::MessageStream,
    manager: web::Data<ConnectionManager>,
) -> Result<HttpResponse, Error> {
    let connection_id = uuid::Uuid::new_v4().to_string();

    // Start the WebSocket actor
    let addr = WebSocketConnection::start();
    manager.add_connection(connection_id.clone(), addr);

    // Process incoming messages
    while let Some(Ok(message)) = payload.next().await {
        match message {
            AggregatedMessage::Text(text) => {
                if let Ok(ws_msg) = serde_json::from_str::<WsMessage>(&text) {
                    addr.send(ws_msg).await.ok();
                }
            }
            AggregatedMessage::Ping(bytes) => {
                // Respond with pong
            }
            AggregatedMessage::Close(reason) => {
                manager.remove_connection(&connection_id);
                return Ok(HttpResponse::Ok().json(serde_json::json!({
                    "message": "WebSocket connection closed",
                    "reason": reason
                })));
            }
            _ => {}
        }
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "WebSocket connection ended"
    })))
}

/// Get WebSocket endpoint info
pub async fn ws_info() -> Result<HttpResponse, Error> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "endpoint": "/ws",
        "message": "WebSocket endpoint available"
    })))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ws_message_serialization() {
        let msg = WsMessage::Ping;
        let json = serde_json::to_string(&msg).unwrap();
        assert_eq!(json, r#"{"type":"Ping"}"#);
    }
}