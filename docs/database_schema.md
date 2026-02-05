# VyOS Web UI Database Schema

## Overview

This document describes the comprehensive database schema for the VyOS Web UI project. The schema supports both SQLite and MySQL database engines, enabling flexibility for different deployment scenarios from single-node to multi-node environments.

## Design Principles

1. **Database Agnostic**: Schema designed to work with both SQLite and MySQL
2. **Multi-Node Support**: Tables designed to support both single-node and multi-node scenarios
3. **Audit Trail**: All tables include created_at and updated_at timestamps
4. **Foreign Key Integrity**: Relationships enforced with foreign keys
5. **Index Optimization**: Strategic indexes for query performance
6. **RBAC Support**: Role-Based Access Control (RBAC) implementation

## Schema Diagram

```
users (1) ----< (N) user_roles ----> (N) roles (1) ----< (N) role_permissions ----> (N) permissions
    |
    |
    +---- sessions (N)
    |
    |
    +---- config_history (N)
    |
    |
    +---- monitoring_data (N)

nodes (1) ----< (N) config_history (N)
    |
    |
    +---- monitoring_data (N)
```

## Table Definitions

### 1. users

User management table storing all user accounts in the system.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | INTEGER/BIGINT | Primary key | PRIMARY KEY, AUTO_INCREMENT |
| username | VARCHAR(50) | Unique username | UNIQUE, NOT NULL |
| email | VARCHAR(255) | User email address | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | Bcrypt hashed password | NOT NULL |
| full_name | VARCHAR(100) | User's full name | NOT NULL |
| is_active | BOOLEAN | Account active status | DEFAULT TRUE |
| is_superuser | BOOLEAN | Superuser status | DEFAULT FALSE |
| last_login | TIMESTAMP | Last login timestamp | NULLABLE |
| created_at | TIMESTAMP | Account creation time | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | Last update time | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX idx_users_username (username)
- UNIQUE INDEX idx_users_email (email)
- INDEX idx_users_is_active (is_active)

### 2. roles

Role management table for RBAC implementation.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | INTEGER/BIGINT | Primary key | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(50) | Unique role name | UNIQUE, NOT NULL |
| description | TEXT | Role description | NULLABLE |
| created_at | TIMESTAMP | Role creation time | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | Last update time | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX idx_roles_name (name)

**Predefined Roles:**
- `admin`: Full system access
- `operator`: Read/write network config access
- `viewer`: Read-only access

### 3. permissions

Permission management table storing granular permissions.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | INTEGER/BIGINT | Primary key | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(100) | Unique permission name | UNIQUE, NOT NULL |
| resource | VARCHAR(50) | Resource type (e.g., 'users', 'nodes') | NOT NULL |
| action | VARCHAR(50) | Action type (e.g., 'read', 'write', 'delete') | NOT NULL |
| description | TEXT | Permission description | NULLABLE |
| created_at | TIMESTAMP | Permission creation time | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX idx_permissions_name (name)
- INDEX idx_permissions_resource (resource)
- INDEX idx_permissions_action (action)

**Predefined Permissions:**
- `users.read`: View users
- `users.write`: Create/update users
- `users.delete`: Delete users
- `nodes.read`: View nodes
- `nodes.write`: Configure nodes
- `nodes.delete`: Delete nodes
- `config.read`: View configurations
- `config.write`: Modify configurations
- `config.rollback`: Rollback configurations
- `monitoring.read`: View monitoring data

### 4. user_roles

Many-to-many mapping between users and roles.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | INTEGER/BIGINT | Primary key | PRIMARY KEY, AUTO_INCREMENT |
| user_id | INTEGER/BIGINT | Foreign key to users | FOREIGN KEY -> users(id), ON DELETE CASCADE |
| role_id | INTEGER/BIGINT | Foreign key to roles | FOREIGN KEY -> roles(id), ON DELETE CASCADE |
| created_at | TIMESTAMP | Assignment creation time | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX idx_user_roles_user_role (user_id, role_id)
- INDEX idx_user_roles_user_id (user_id)
- INDEX idx_user_roles_role_id (role_id)

### 5. role_permissions

Many-to-many mapping between roles and permissions.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | INTEGER/BIGINT | Primary key | PRIMARY KEY, AUTO_INCREMENT |
| role_id | INTEGER/BIGINT | Foreign key to roles | FOREIGN KEY -> roles(id), ON DELETE CASCADE |
| permission_id | INTEGER/BIGINT | Foreign key to permissions | FOREIGN KEY -> permissions(id), ON DELETE CASCADE |
| created_at | TIMESTAMP | Assignment creation time | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX idx_role_permissions_role_permission (role_id, permission_id)
- INDEX idx_role_permissions_role_id (role_id)
- INDEX idx_role_permissions_permission_id (permission_id)

### 6. sessions

Session management table for user authentication sessions.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | INTEGER/BIGINT | Primary key | PRIMARY KEY, AUTO_INCREMENT |
| user_id | INTEGER/BIGINT | Foreign key to users | FOREIGN KEY -> users(id), ON DELETE CASCADE |
| session_token | VARCHAR(255) | Session token/hash | UNIQUE, NOT NULL |
| ip_address | VARCHAR(45) | Client IP address (IPv6 compatible) | NULLABLE |
| user_agent | VARCHAR(500) | Client user agent | NULLABLE |
| expires_at | TIMESTAMP | Session expiration time | NOT NULL |
| created_at | TIMESTAMP | Session creation time | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | Last activity time | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX idx_sessions_token (session_token)
- INDEX idx_sessions_user_id (user_id)
- INDEX idx_sessions_expires_at (expires_at)

### 7. nodes

Network nodes table supporting both single-node and multi-node scenarios.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | INTEGER/BIGINT | Primary key | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(100) | Node name | UNIQUE, NOT NULL |
| hostname | VARCHAR(255) | Node hostname/IP | NOT NULL |
| port | INTEGER | API port | DEFAULT 8443 |
| description | TEXT | Node description | NULLABLE |
| api_key | VARCHAR(255) | API authentication key | NULLABLE |
| is_primary | BOOLEAN | Primary node flag | DEFAULT FALSE |
| is_active | BOOLEAN | Node active status | DEFAULT TRUE |
| last_heartbeat | TIMESTAMP | Last successful heartbeat | NULLABLE |
| created_at | TIMESTAMP | Node creation time | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | Last update time | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX idx_nodes_name (name)
- INDEX idx_nodes_hostname (hostname)
- INDEX idx_nodes_is_active (is_active)
- INDEX idx_nodes_is_primary (is_primary)

### 8. config_history

Configuration history tracking table for all nodes.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | INTEGER/BIGINT | Primary key | PRIMARY KEY, AUTO_INCREMENT |
| node_id | INTEGER/BIGINT | Foreign key to nodes | FOREIGN KEY -> nodes(id), ON DELETE CASCADE |
| user_id | INTEGER/BIGINT | Foreign key to users (who made change) | FOREIGN KEY -> users(id), ON DELETE SET NULL |
| version | VARCHAR(50) | Configuration version identifier | NOT NULL |
| config_data | TEXT/LONGTEXT | Full configuration (JSON) | NOT NULL |
| change_summary | TEXT | Summary of changes | NULLABLE |
| is_rollback_point | BOOLEAN | Marked as rollback point | DEFAULT FALSE |
| created_at | TIMESTAMP | Configuration creation time | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_config_history_node_id (node_id)
- INDEX idx_config_history_user_id (user_id)
- INDEX idx_config_history_version (version)
- INDEX idx_config_history_created_at (created_at)
- INDEX idx_config_history_rollback_point (is_rollback_point)
- COMPOSITE INDEX idx_config_history_node_created (node_id, created_at DESC)

### 9. monitoring_data

Monitoring data storage table for metrics from all nodes.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | INTEGER/BIGINT | Primary key | PRIMARY KEY, AUTO_INCREMENT |
| node_id | INTEGER/BIGINT | Foreign key to nodes | FOREIGN KEY -> nodes(id), ON DELETE CASCADE |
| metric_type | VARCHAR(50) | Type of metric (cpu, memory, network, etc.) | NOT NULL |
| metric_name | VARCHAR(100) | Specific metric name | NOT NULL |
| value | DECIMAL(20,6) | Metric value | NOT NULL |
| unit | VARCHAR(20) | Unit of measurement | NULLABLE |
| timestamp | TIMESTAMP | Metric collection time | NOT NULL |
| tags | TEXT | Additional metric tags (JSON) | NULLABLE |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_monitoring_data_node_id (node_id)
- INDEX idx_monitoring_data_metric_type (metric_type)
- INDEX idx_monitoring_data_metric_name (metric_name)
- INDEX idx_monitoring_data_timestamp (timestamp)
- COMPOSITE INDEX idx_monitoring_node_metric_time (node_id, metric_type, timestamp DESC)
- COMPOSITE INDEX idx_monitoring_type_time (metric_type, timestamp DESC)

## Data Types Mapping

| Generic Type | SQLite | MySQL |
|--------------|--------|-------|
| INTEGER | INTEGER | BIGINT UNSIGNED |
| VARCHAR(n) | TEXT | VARCHAR(n) |
| TEXT | TEXT | TEXT |
| LONGTEXT | TEXT | LONGTEXT |
| BOOLEAN | INTEGER (0/1) | TINYINT(1) |
| TIMESTAMP | TEXT | TIMESTAMP |
| DECIMAL | REAL | DECIMAL(20,6) |
| AUTO_INCREMENT | AUTOINCREMENT | AUTO_INCREMENT |
| CURRENT_TIMESTAMP | CURRENT_TIMESTAMP | CURRENT_TIMESTAMP |
| ON UPDATE CURRENT_TIMESTAMP | - | ON UPDATE CURRENT_TIMESTAMP |

## Relationship Summary

| Table | References | On Delete |
|-------|------------|-----------|
| user_roles | users(id) | CASCADE |
| user_roles | roles(id) | CASCADE |
| role_permissions | roles(id) | CASCADE |
| role_permissions | permissions(id) | CASCADE |
| sessions | users(id) | CASCADE |
| config_history | nodes(id) | CASCADE |
| config_history | users(id) | SET NULL |
| monitoring_data | nodes(id) | CASCADE |

## Default Data

### Default Users
| username | email | role |
|----------|-------|------|
| admin | admin@vyos.local | admin |

### Default Roles
| name | description |
|------|-------------|
| admin | Full system administrator access |
| operator | Network configuration operator |
| viewer | Read-only viewer access |

### Default Permissions
| name | resource | action |
|------|----------|-------|
| users.read | users | read |
| users.write | users | write |
| users.delete | users | delete |
| nodes.read | nodes | read |
| nodes.write | nodes | write |
| nodes.delete | nodes | delete |
| config.read | config | read |
| config.write | config | write |
| config.rollback | config | rollback |
| monitoring.read | monitoring | read |

## Partitioning Considerations (MySQL)

For large-scale deployments with multi-node scenarios, consider partitioning:

### monitoring_data Partitioning
- **Strategy**: Range partitioning by timestamp
- **Rationale**: Time-series data naturally benefits from time-based partitioning
- **Recommended**: Monthly partitions with automatic pruning

### config_history Partitioning
- **Strategy**: Range partitioning by created_at
- **Rationale**: Configuration history accumulates over time
- **Recommended**: Quarterly partitions

## Retention Policies

| Table | Default Retention | Recommended Cleanup Strategy |
|-------|------------------|------------------------------|
| sessions | 30 days | Delete expired sessions + 7 days |
| monitoring_data | 90 days | Delete records older than retention period |
| config_history | 1 year | Archive older configurations to external storage |

## Performance Considerations

1. **Monitoring Data**: Use time-series optimization for high-frequency inserts
2. **Session Cleanup**: Implement periodic cleanup of expired sessions
3. **Index Maintenance**: Rebuild indexes periodically (especially for monitoring_data)
4. **Connection Pooling**: Use connection pooling for MySQL deployments
5. **Query Optimization**: Use composite indexes for common query patterns

## Security Considerations

1. **Password Hashing**: Always use bcrypt with minimum 12 rounds
2. **Session Tokens**: Use cryptographically secure random tokens (minimum 256 bits)
3. **API Keys**: Store encrypted, rotate regularly
4. **Audit Logging**: Track all data modifications via updated_at timestamps
5. **SQL Injection**: Use parameterized queries exclusively
6. **Least Privilege**: Database users should have minimum required permissions

## Migration Notes

### From SQLite to MySQL
1. Export SQLite data using migration tool
2. Convert data types (INTEGER -> BIGINT UNSIGNED, etc.)
3. Import to MySQL using migration scripts
4. Verify foreign key constraints
5. Update application configuration

### Schema Versioning
- Use semantic versioning for schema changes
- Maintain backwards compatibility where possible
- Document breaking changes clearly
- Test migrations thoroughly in staging environment

## Backup and Recovery

### Backup Strategy
1. **Daily Full Backup**: Complete database dump
2. **Hourly Incremental**: Transaction log backup (MySQL only)
3. **Backup Retention**: Keep 30 days of daily backups
4. **Off-site Storage**: Store backup copies in separate location

### Recovery Procedure
1. Stop application
2. Restore from most recent consistent backup
3. Apply incremental backups if available
4. Verify data integrity
5. Restart application

## Monitoring

### Database Health Metrics
- Connection pool utilization
- Query execution time
- Lock wait time
- Table size growth
- Index usage statistics

### Alerts
- High connection pool usage (>80%)
- Slow query threshold (>5s)
- Replication lag (for multi-node MySQL)
- Disk space remaining (<20%)