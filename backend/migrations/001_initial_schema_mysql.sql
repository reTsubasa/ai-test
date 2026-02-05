-- VyOS Web UI Database Schema
-- MySQL Initial Migration (001)
-- Supports both single-node and multi-node scenarios

-- Set character set and collation
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `is_superuser` TINYINT(1) NOT NULL DEFAULT 0,
    `last_login` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_users_username` (`username`),
    UNIQUE KEY `idx_users_email` (`email`),
    KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Roles Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Permissions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `permissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `resource` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `description` TEXT,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_permissions_name` (`name`),
    KEY `idx_permissions_resource` (`resource`),
    KEY `idx_permissions_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- User Roles Junction Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `user_roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_user_roles_user_role` (`user_id`, `role_id`),
    KEY `idx_user_roles_user_id` (`user_id`),
    KEY `idx_user_roles_role_id` (`role_id`),
    CONSTRAINT `fk_user_roles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_roles_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Role Permissions Junction Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `permission_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_role_permissions_role_permission` (`role_id`, `permission_id`),
    KEY `idx_role_permissions_role_id` (`role_id`),
    KEY `idx_role_permissions_permission_id` (`permission_id`),
    CONSTRAINT `fk_role_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_role_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Sessions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `session_token` VARCHAR(255) NOT NULL,
    `ip_address` VARCHAR(45),
    `user_agent` VARCHAR(500),
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_sessions_token` (`session_token`),
    KEY `idx_sessions_user_id` (`user_id`),
    KEY `idx_sessions_expires_at` (`expires_at`),
    CONSTRAINT `fk_sessions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Nodes Table (Supports single-node and multi-node scenarios)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `nodes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `hostname` VARCHAR(255) NOT NULL,
    `port` INT NOT NULL DEFAULT 8443,
    `description` TEXT,
    `api_key` VARCHAR(255),
    `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `last_heartbeat` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_nodes_name` (`name`),
    KEY `idx_nodes_hostname` (`hostname`),
    KEY `idx_nodes_is_active` (`is_active`),
    KEY `idx_nodes_is_primary` (`is_primary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Configuration History Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `config_history` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `node_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED,
    `version` VARCHAR(50) NOT NULL,
    `config_data` LONGTEXT NOT NULL,
    `change_summary` TEXT,
    `is_rollback_point` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_config_history_node_id` (`node_id`),
    KEY `idx_config_history_user_id` (`user_id`),
    KEY `idx_config_history_version` (`version`),
    KEY `idx_config_history_created_at` (`created_at`),
    KEY `idx_config_history_rollback_point` (`is_rollback_point`),
    KEY `idx_config_history_node_created` (`node_id`, `created_at` DESC),
    CONSTRAINT `fk_config_history_node_id` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_config_history_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Monitoring Data Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `monitoring_data` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `node_id` BIGINT UNSIGNED NOT NULL,
    `metric_type` VARCHAR(50) NOT NULL,
    `metric_name` VARCHAR(100) NOT NULL,
    `value` DECIMAL(20,6) NOT NULL,
    `unit` VARCHAR(20),
    `timestamp` TIMESTAMP NOT NULL,
    `tags` TEXT,
    PRIMARY KEY (`id`),
    KEY `idx_monitoring_data_node_id` (`node_id`),
    KEY `idx_monitoring_data_metric_type` (`metric_type`),
    KEY `idx_monitoring_data_metric_name` (`metric_name`),
    KEY `idx_monitoring_data_timestamp` (`timestamp`),
    KEY `idx_monitoring_node_metric_time` (`node_id`, `metric_type`, `timestamp` DESC),
    KEY `idx_monitoring_type_time` (`metric_type`, `timestamp` DESC),
    CONSTRAINT `fk_monitoring_data_node_id` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Default Roles
-- ============================================================================
INSERT INTO `roles` (`name`, `description`) VALUES
    ('admin', 'Full system administrator access'),
    ('operator', 'Network configuration operator'),
    ('viewer', 'Read-only viewer access')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================================================
-- Default Permissions
-- ============================================================================
INSERT INTO `permissions` (`name`, `resource`, `action`, `description`) VALUES
    ('users.read', 'users', 'read', 'View users'),
    ('users.write', 'users', 'write', 'Create or update users'),
    ('users.delete', 'users', 'delete', 'Delete users'),
    ('nodes.read', 'nodes', 'read', 'View nodes'),
    ('nodes.write', 'nodes', 'write', 'Configure nodes'),
    ('nodes.delete', 'nodes', 'delete', 'Delete nodes'),
    ('config.read', 'config', 'read', 'View configurations'),
    ('config.write', 'config', 'write', 'Modify configurations'),
    ('config.rollback', 'config', 'rollback', 'Rollback to previous configuration'),
    ('monitoring.read', 'monitoring', 'read', 'View monitoring data')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================================================
-- Assign All Permissions to Admin Role
-- ============================================================================
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
CROSS JOIN `permissions` p
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`);

-- ============================================================================
-- Assign Operator Permissions
-- ============================================================================
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p ON p.name IN (
    'nodes.read',
    'nodes.write',
    'config.read',
    'config.write',
    'config.rollback',
    'monitoring.read'
)
WHERE r.name = 'operator'
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`);

-- ============================================================================
-- Assign Viewer Permissions
-- ============================================================================
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p ON p.name IN (
    'nodes.read',
    'config.read',
    'monitoring.read'
)
WHERE r.name = 'viewer'
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`);

-- ============================================================================
-- Default Admin User (password: admin123 - CHANGE IN PRODUCTION!)
-- Hash generated with bcrypt (12 rounds)
-- ============================================================================
INSERT INTO `users` (`username`, `email`, `password_hash`, `full_name`, `is_active`, `is_superuser`) VALUES
    ('admin', 'admin@vyos.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIPhvCDzGu', 'System Administrator', 1, 1)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- ============================================================================
-- Assign Admin Role to Admin User
-- ============================================================================
INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id
FROM `users` u
JOIN `roles` r ON r.name = 'admin'
WHERE u.username = 'admin'
ON DUPLICATE KEY UPDATE `user_id` = VALUES(`user_id`);

-- ============================================================================
-- Optional: Partitioning for Monitoring Data (MySQL 8.0+)
-- Uncomment for large-scale deployments
-- ============================================================================
-- ALTER TABLE `monitoring_data` PARTITION BY RANGE (UNIX_TIMESTAMP(`timestamp`)) (
--     PARTITION p_202601 VALUES LESS THAN (UNIX_TIMESTAMP('2026-02-01 00:00:00')),
--     PARTITION p_202602 VALUES LESS THAN (UNIX_TIMESTAMP('2026-03-01 00:00:00')),
--     PARTITION p_202603 VALUES LESS THAN (UNIX_TIMESTAMP('2026-04-01 00:00:00')),
--     PARTITION p_202604 VALUES LESS THAN (UNIX_TIMESTAMP('2026-05-01 00:00:00')),
--     PARTITION p_202605 VALUES LESS THAN (UNIX_TIMESTAMP('2026-06-01 00:00:00')),
--     PARTITION p_202606 VALUES LESS THAN (UNIX_TIMESTAMP('2026-07-01 00:00:00')),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Migration complete
-- ============================================================================
-- Schema version: 001
-- Database: VyOS Web UI
-- Supports: MySQL (single-node and multi-node scenarios)
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- ============================================================================