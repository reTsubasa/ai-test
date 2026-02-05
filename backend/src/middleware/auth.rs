use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    web, Error, HttpMessage,
};
use futures_util::future::LocalBoxFuture;
use std::{
    cell::RefCell,
    future::{ready, Ready},
    rc::Rc,
};

use crate::error::AppError;
use crate::models::auth::Claims;

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

    fn new_transform(&self, service: S) -> Result<Self::Transform, Self::InitError> {
        Ok(AuthMiddlewareService {
            service: Rc::new(RefCell::new(service)),
        })
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

                    // Validate the token
                    match validate_jwt_token(token) {
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
            Err(ErrorUnauthorized("Invalid or missing authentication token").into())
        })
    }
}

/// Validate JWT token and return claims
fn validate_jwt_token(token: &str) -> Result<Claims, AppError> {
    // In a real implementation, this would:
    // 1. Decode and verify the JWT signature
    // 2. Check expiration
    // 3. Return the claims

    // For now, return a mock claims object
    // This would be replaced with actual JWT validation
    Ok(Claims {
        sub: "user_id".to_string(),
        username: "user".to_string(),
        exp: chrono::Utc::now().timestamp() + 3600,
        iat: chrono::Utc::now().timestamp(),
    })
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

    fn new_transform(&self, service: S) -> Result<Self::Transform, Self::InitError> {
        Ok(OptionalAuthMiddlewareService {
            service: Rc::new(RefCell::new(service)),
        })
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

                    if let Ok(claims) = validate_jwt_token(token) {
                        req.extensions_mut().insert(claims);
                    }
                }
            }

            // Continue regardless of authentication
            service.call(req).await
        })
    }
}