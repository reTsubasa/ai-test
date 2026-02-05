use crate::error::AppError;
use crate::models::network::{CreateInterfaceRequest, NetworkInterface, UpdateInterfaceRequest};
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

pub struct NetworkService;

impl NetworkService {
    pub async fn get_interfaces(
        db: &Pool<Sqlite>,
    ) -> Result<Vec<NetworkInterface>, AppError> {
        let interfaces = sqlx::query_as!(
            NetworkInterface,
            r#"
            SELECT
                id,
                name,
                interface_type,
                ip_address,
                subnet_mask,
                gateway,
                mac_address,
                status,
                enabled,
                description,
                created_at,
                updated_at
            FROM network_interfaces
            ORDER BY name
            "#
        )
        .fetch_all(db)
        .await?;

        Ok(interfaces)
    }

    pub async fn get_interface_by_id(
        db: &Pool<Sqlite>,
        interface_id: Uuid,
    ) -> Result<Option<NetworkInterface>, AppError> {
        let interface = sqlx::query_as!(
            NetworkInterface,
            r#"
            SELECT
                id,
                name,
                interface_type,
                ip_address,
                subnet_mask,
                gateway,
                mac_address,
                status,
                enabled,
                description,
                created_at,
                updated_at
            FROM network_interfaces
            WHERE id = ?
            "#,
            interface_id
        )
        .fetch_optional(db)
        .await?;

        Ok(interface)
    }

    pub async fn create_interface(
        db: &Pool<Sqlite>,
        input: CreateInterfaceRequest,
    ) -> Result<NetworkInterface, AppError> {
        // Check if interface already exists
        let existing_interface: Option<(i32,)> = sqlx::query_as(
            "SELECT COUNT(*) FROM network_interfaces WHERE name = ?"
        )
        .bind(&input.name)
        .fetch_optional(db)
        .await?;

        if let Some((count,)) = existing_interface {
            if count > 0 {
                return Err(AppError::BadRequest("Interface name already exists".to_string()));
            }
        }

        // Insert interface
        let interface = sqlx::query_as!(
            NetworkInterface,
            r#"
            INSERT INTO network_interfaces (
                id,
                name,
                interface_type,
                ip_address,
                subnet_mask,
                gateway,
                description,
                enabled
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING
                id,
                name,
                interface_type,
                ip_address,
                subnet_mask,
                gateway,
                mac_address,
                status,
                enabled,
                description,
                created_at,
                updated_at
            "#,
            Uuid::new_v4(),
            input.name,
            input.interface_type,
            input.ip_address,
            input.subnet_mask,
            input.gateway,
            input.description,
            input.enabled
        )
        .fetch_one(db)
        .await?;

        Ok(interface)
    }

    pub async fn update_interface(
        db: &Pool<Sqlite>,
        interface_id: Uuid,
        input: UpdateInterfaceRequest,
    ) -> Result<NetworkInterface, AppError> {
        // Update interface
        let interface = sqlx::query_as!(
            NetworkInterface,
            r#"
            UPDATE network_interfaces
            SET
                name = COALESCE($2, name),
                ip_address = COALESCE($3, ip_address),
                subnet_mask = COALESCE($4, subnet_mask),
                gateway = COALESCE($5, gateway),
                description = COALESCE($6, description),
                enabled = COALESCE($7, enabled),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING
                id,
                name,
                interface_type,
                ip_address,
                subnet_mask,
                gateway,
                mac_address,
                status,
                enabled,
                description,
                created_at,
                updated_at
            "#,
            interface_id,
            input.name,
            input.ip_address,
            input.subnet_mask,
            input.gateway,
            input.description,
            input.enabled
        )
        .fetch_one(db)
        .await?;

        Ok(interface)
    }

    pub async fn delete_interface(
        db: &Pool<Sqlite>,
        interface_id: Uuid,
    ) -> Result<(), AppError> {
        sqlx::query!("DELETE FROM network_interfaces WHERE id = ?", interface_id)
            .execute(db)
            .await?;

        Ok(())
    }
}