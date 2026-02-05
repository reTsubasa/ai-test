use crate::{
    error::AppError,
    models::network::{CreateInterfaceRequest, InterfaceResponse, UpdateInterfaceRequest},
    services::network_service::NetworkService,
};
use axum::{
    extract::{Path, State},
    response::Json,
};
use uuid::Uuid;

pub async fn get_interfaces(
    State(state): State<crate::AppState>,
) -> Result<Json<Vec<InterfaceResponse>>, AppError> {
    let interfaces = NetworkService::get_interfaces(&state.db).await?;

    let interfaces_response: Vec<InterfaceResponse> = interfaces
        .into_iter()
        .map(|i| InterfaceResponse {
            id: i.id,
            name: i.name,
            interface_type: i.interface_type,
            ip_address: i.ip_address,
            subnet_mask: i.subnet_mask,
            gateway: i.gateway,
            mac_address: i.mac_address,
            status: i.status,
            enabled: i.enabled,
            description: i.description,
            created_at: i.created_at,
            updated_at: i.updated_at,
        })
        .collect();

    Ok(Json(interfaces_response))
}

pub async fn get_interface(
    State(state): State<crate::AppState>,
    Path(interface_id): Path<String>,
) -> Result<Json<InterfaceResponse>, AppError> {
    let uuid = Uuid::parse_str(&interface_id).map_err(|_| {
        AppError::BadRequest("Invalid interface ID format".to_string())
    })?;

    let interface = NetworkService::get_interface_by_id(&state.db, uuid).await?
        .ok_or(AppError::NotFound("Interface not found".to_string()))?;

    let interface_response = InterfaceResponse {
        id: interface.id,
        name: interface.name,
        interface_type: interface.interface_type,
        ip_address: interface.ip_address,
        subnet_mask: interface.subnet_mask,
        gateway: interface.gateway,
        mac_address: interface.mac_address,
        status: interface.status,
        enabled: interface.enabled,
        description: interface.description,
        created_at: interface.created_at,
        updated_at: interface.updated_at,
    };

    Ok(Json(interface_response))
}

pub async fn create_interface(
    State(state): State<crate::AppState>,
    axum::Json(input): axum::Json<CreateInterfaceRequest>,
) -> Result<Json<InterfaceResponse>, AppError> {
    let interface = NetworkService::create_interface(&state.db, input).await?;

    let interface_response = InterfaceResponse {
        id: interface.id,
        name: interface.name,
        interface_type: interface.interface_type,
        ip_address: interface.ip_address,
        subnet_mask: interface.subnet_mask,
        gateway: interface.gateway,
        mac_address: interface.mac_address,
        status: interface.status,
        enabled: interface.enabled,
        description: interface.description,
        created_at: interface.created_at,
        updated_at: interface.updated_at,
    };

    Ok(Json(interface_response))
}

pub async fn update_interface(
    State(state): State<crate::AppState>,
    Path(interface_id): Path<String>,
    axum::Json(input): axum::Json<UpdateInterfaceRequest>,
) -> Result<Json<InterfaceResponse>, AppError> {
    let uuid = Uuid::parse_str(&interface_id).map_err(|_| {
        AppError::BadRequest("Invalid interface ID format".to_string())
    })?;

    let interface = NetworkService::update_interface(&state.db, uuid, input).await?;

    let interface_response = InterfaceResponse {
        id: interface.id,
        name: interface.name,
        interface_type: interface.interface_type,
        ip_address: interface.ip_address,
        subnet_mask: interface.subnet_mask,
        gateway: interface.gateway,
        mac_address: interface.mac_address,
        status: interface.status,
        enabled: interface.enabled,
        description: interface.description,
        created_at: interface.created_at,
        updated_at: interface.updated_at,
    };

    Ok(Json(interface_response))
}

pub async fn delete_interface(
    State(state): State<crate::AppState>,
    Path(interface_id): Path<String>,
) -> Result<Json<()>, AppError> {
    let uuid = Uuid::parse_str(&interface_id).map_err(|_| {
        AppError::BadRequest("Invalid interface ID format".to_string())
    })?;

    NetworkService::delete_interface(&state.db, uuid).await?;

    Ok(Json(()))
}