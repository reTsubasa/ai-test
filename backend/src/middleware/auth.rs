use crate::models::auth::Claims;
use crate::services::auth_service::AuthService;
use axum::{
    extract::State,
    http::Request,
    middleware::Next,
    response::{IntoResponse, Response},
};
use axum_extra::extract::cookie::CookieJar;
use serde_json::json;
use std::sync::Arc;

pub async fn auth_middleware<B>(
    cookie_jar: CookieJar,
    State(_state): State<crate::AppState>,
    request: Request<B>,
    next: Next<B>,
) -> Result<Response, impl IntoResponse> {
    // Extract token from Authorization header
    let auth_header = request
        .headers()
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    let token = if let Some(auth_header) = auth_header {
        if auth_header.starts_with("Bearer ") {
            auth_header[7..].trim()
        } else {
            // If header doesn't start with Bearer, try extracting from cookies
            match cookie_jar.get("access_token") {
                Some(cookie) => cookie.value(),
                None => {
                    let unauthorized_response = axum::response::Json(json!({
                        "success": false,
                        "error": {
                            "code": "UNAUTHORIZED",
                            "message": "Authorization token required"
                        },
                        "timestamp": chrono::Utc::now().to_rfc3339()
                    }));

                    return Err((
                        axum::http::StatusCode::UNAUTHORIZED,
                        unauthorized_response
                    ));
                }
            }
        }
    } else {
        // Try getting from cookies
        match cookie_jar.get("access_token") {
            Some(cookie) => cookie.value(),
            None => {
                let unauthorized_response = axum::response::Json(json!({
                    "success": false,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Authorization token required"
                    },
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }));

                return Err((
                    axum::http::StatusCode::UNAUTHORIZED,
                    unauthorized_response
                ));
            }
        }
    };

    // Verify token
    match AuthService::verify_token(token).await {
        Ok(claims) => {
            // Add claims to request extensions
            let mut request = request;
            request.extensions_mut().insert(claims);

            Ok(next.run(request).await)
        }
        Err(_) => {
            let unauthorized_response = axum::response::Json(json!({
                "success": false,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Invalid or expired token"
                },
                "timestamp": chrono::Utc::now().to_rfc3339()
            }));

            Err((
                axum::http::StatusCode::UNAUTHORIZED,
                unauthorized_response
            ))
        }
    }
}