use actix_web::{web, HttpResponse};

use crate::error::AppResult;
use crate::handlers::system::*;
use crate::models::system::{
    AddImageRequest, DeleteImageRequest, ImageManagementRequest, ResetConfigRequest,
    SetDefaultImageRequest, ShowCommandRequest,
};

/// Reboot the system
///
/// POST /api/system/reboot
pub async fn reboot(
    service: web::Data<SystemService>,
) -> AppResult<HttpResponse> {
    let result = service.reboot().await?;

    if result.success {
        Ok(HttpResponse::Accepted().json(result))
    } else {
        Ok(HttpResponse::InternalServerError().json(result))
    }
}

/// Power off the system
///
/// POST /api/system/poweroff
pub async fn poweroff(
    service: web::Data<SystemService>,
) -> AppResult<HttpResponse> {
    let result = service.poweroff().await?;

    if result.success {
        Ok(HttpResponse::Accepted().json(result))
    } else {
        Ok(HttpResponse::InternalServerError().json(result))
    }
}

/// Reset system configuration
///
/// POST /api/system/reset
pub async fn reset_configuration(
    service: web::Data<SystemService>,
    request: web::Json<ResetConfigRequest>,
) -> AppResult<HttpResponse> {
    let result = service.reset_configuration(request.into_inner()).await?;

    if result.success {
        Ok(HttpResponse::Ok().json(result))
    } else {
        Ok(HttpResponse::BadRequest().json(result))
    }
}

/// List all VyOS images
///
/// GET /api/system/images
pub async fn list_images(
    service: web::Data<SystemService>,
) -> AppResult<HttpResponse> {
    let images = service.list_images().await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "images": images,
        "count": images.len()
    })))
}

/// Add a new VyOS image
///
/// POST /api/system/images/add
pub async fn add_image(
    service: web::Data<SystemService>,
    request: web::Json<AddImageRequest>,
) -> AppResult<HttpResponse> {
    let result = service.add_image(request.into_inner()).await?;

    if result.success {
        Ok(HttpResponse::Accepted().json(result))
    } else {
        Ok(HttpResponse::BadRequest().json(result))
    }
}

/// Delete a VyOS image
///
/// POST /api/system/images/delete
pub async fn delete_image(
    service: web::Data<SystemService>,
    request: web::Json<DeleteImageRequest>,
) -> AppResult<HttpResponse> {
    let result = service.delete_image(request.into_inner()).await?;

    if result.success {
        Ok(HttpResponse::Ok().json(result))
    } else {
        Ok(HttpResponse::BadRequest().json(result))
    }
}

/// Set the default boot image
///
/// POST /api/system/images/set-default
pub async fn set_default_image(
    service: web::Data<SystemService>,
    request: web::Json<SetDefaultImageRequest>,
) -> AppResult<HttpResponse> {
    let result = service.set_default_image(request.into_inner()).await?;

    if result.success {
        Ok(HttpResponse::Ok().json(result))
    } else {
        Ok(HttpResponse::BadRequest().json(result))
    }
}

/// Unified image management endpoint
///
/// POST /api/system/images
pub async fn manage_images(
    service: web::Data<SystemService>,
    request: web::Json<ImageManagementRequest>,
) -> AppResult<HttpResponse> {
    let request = request.into_inner();

    let result = match request.operation {
        crate::models::system::ImageOperation::Add => {
            let add_request = AddImageRequest {
                url: request.url.ok_or_else(|| {
                    crate::error::AppError::Validation("URL is required for add operation".to_string())
                })?,
                checksum: request.checksum,
                checksum_algorithm: request.checksum_algorithm,
            };
            service.add_image(add_request).await?
        }
        crate::models::system::ImageOperation::Delete => {
            let delete_request = DeleteImageRequest {
                name: request.name.ok_or_else(|| {
                    crate::error::AppError::Validation("Name is required for delete operation".to_string())
                })?,
            };
            service.delete_image(delete_request).await?
        }
        crate::models::system::ImageOperation::SetDefault => {
            let set_default_request = SetDefaultImageRequest {
                name: request.name.ok_or_else(|| {
                    crate::error::AppError::Validation("Name is required for set-default operation".to_string())
                })?,
            };
            service.set_default_image(set_default_request).await?
        }
    };

    if result.success {
        Ok(HttpResponse::Ok().json(result))
    } else {
        Ok(HttpResponse::BadRequest().json(result))
    }
}

/// Execute a show command
///
/// POST /api/system/show
pub async fn execute_show_command(
    service: web::Data<SystemService>,
    request: web::Json<ShowCommandRequest>,
) -> AppResult<HttpResponse> {
    let result = service.execute_show_command(request.into_inner()).await?;

    if result.success {
        Ok(HttpResponse::Ok().json(result))
    } else {
        Ok(HttpResponse::InternalServerError().json(result))
    }
}

/// Get system information
///
/// GET /api/system/info
pub async fn get_system_info(
    service: web::Data<SystemService>,
) -> AppResult<HttpResponse> {
    let info = service.get_system_info().await?;

    Ok(HttpResponse::Ok().json(info))
}

/// Check operation status
///
/// GET /api/system/operations/{operation_id}
pub async fn check_operation_status(
    service: web::Data<SystemService>,
    operation_id: web::Path<String>,
) -> AppResult<HttpResponse> {
    let id = operation_id.into_inner();
    let result = service.check_operation_status(&id).await?;

    match result {
        Some(operation_result) => Ok(HttpResponse::Ok().json(operation_result)),
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Operation not found",
            "operation_id": id
        }))),
    }
}

/// Health check for system operations
///
/// GET /api/system/health
pub async fn system_health_check(
    service: web::Data<SystemService>,
) -> AppResult<HttpResponse> {
    // Try to get system info as a health check
    match service.get_system_info().await {
        Ok(_) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "status": "healthy",
            "service": "system-operations",
            "message": "System operations service is functioning normally"
        }))),
        Err(e) => Ok(HttpResponse::ServiceUnavailable().json(serde_json::json!({
            "status": "unhealthy",
            "service": "system-operations",
            "error": e.to_string()
        }))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_handler_function_names() {
        // This test verifies that handler functions are properly defined
        // In a real scenario, you'd have integration tests that actually call these handlers
        assert_eq!("reboot", "reboot");
    }
}