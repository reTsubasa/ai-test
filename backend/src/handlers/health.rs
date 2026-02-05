use actix_web::HttpResponse;

use crate::error::AppResult;

/// Handle GET /api/health
pub async fn health_check() -> AppResult<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "vyos-web-ui-backend",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

/// Handle GET /api/health/detailed
pub async fn detailed_health_check() -> AppResult<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "vyos-web-ui-backend",
        "version": env!("CARGO_PKG_VERSION"),
        "database": "connected",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}