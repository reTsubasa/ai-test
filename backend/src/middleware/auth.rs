use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    web, Error, FromRequest, HttpMessage,
};
use futures_util::future::LocalBoxFuture;
use std::{
    cell::RefCell,
    future::{ready, Ready},
    rc::Rc,
};

use crate::error::AppError;
use crate::models::auth::Claims;
use crate::services::AuthService;

/// Extract claims from request extension
/// This helper function is used by handlers to get the validated claims
pub fn extract_claims(req: &actix_web::HttpRequest) -> Result<Claims, AppError> {
    req.extensions()
        .get::<Claims>()
        .cloned()
        .ok_or_else(|| AppError::Auth("Authentication required".to_string()))
}

/// Helper to extract claims as a FromRequest implementation
impl FromRequest for Claims {
    type Error = AppError;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &actix_web::HttpRequest, _: &mut actix_web::dev::Payload) -> Self::Future {
        ready(extract_claims(req))
    }
}

/// Validate JWT token using the auth service from app data
fn validate_jwt_token_from_request(req: &ServiceRequest, token: &str) -> Result<Claims, AppError> {
    // Get the auth service from app data
    let auth_service = req
        .app_data::<web::Data<AuthService>>()
        .ok_or_else(|| AppError::Internal("Auth service not available".to_string()))?;

    // Use the auth service to validate the token
    auth_service.validate_token(token)
}

/// Authentication middleware factory
pub struct AuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddlewareService {
            service: Rc::new(RefCell::new(service)),
        }))
    }
}

/// Authentication middleware service
pub struct AuthMiddlewareService<S> {
    service: Rc<RefCell<S>>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();

        Box::pin(async move {
            // Extract the Authorization header
            let auth_header = req
                .headers()
                .get("Authorization")
                .and_then(|h| h.to_str().ok());

            if let Some(auth_value) = auth_header {
                if auth_value.starts_with("Bearer ") {
                    let token = &auth_value[7..];

                    // Validate the token using auth service from app data
                    match validate_jwt_token_from_request(&req, token) {
                        Ok(claims) => {
                            // Attach claims to the request extensions
                            req.extensions_mut().insert(claims);
                            let res = service.call(req).await?;
                            return Ok(res);
                        }
                        Err(e) => {
                            return Err(ErrorUnauthorized(e.to_string()).into());
                        }
                    }
                }
            }

            // If we reach here, authentication failed
            Err(ErrorUnauthorized("Invalid or missing authentication token"))
        })
    }
}

/// Optional authentication middleware
/// Allows requests without authentication but attaches claims if token is present
pub struct OptionalAuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for OptionalAuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = OptionalAuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(OptionalAuthMiddlewareService {
            service: Rc::new(RefCell::new(service)),
        }))
    }
}

/// Optional authentication middleware service
pub struct OptionalAuthMiddlewareService<S> {
    service: Rc<RefCell<S>>,
}

impl<S, B> Service<ServiceRequest> for OptionalAuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();

        Box::pin(async move {
            // Try to extract and validate the token
            let auth_header = req
                .headers()
                .get("Authorization")
                .and_then(|h| h.to_str().ok());

            if let Some(auth_value) = auth_header {
                if auth_value.starts_with("Bearer ") {
                    let token = &auth_value[7..];

                    // Try to validate token (don't fail if invalid)
                    if let Ok(claims) = validate_jwt_token_from_request(&req, token) {
                        req.extensions_mut().insert(claims);
                    }
                }
            }

            // Continue regardless of authentication
            service.call(req).await
        })
    }
}