-- VyOS Web UI Database Schema
-- SQLite Initial Migration (001)
-- Supports both single-node and multi-node scenarios

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_superuser INTEGER NOT NULL DEFAULT 0,
    last_login TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================================================
-- Roles Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- Permissions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

-- ============================================================================
-- User Roles Junction Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- ============================================================================
-- Role Permissions Junction Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ============================================================================
-- Sessions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================================
-- Nodes Table (Supports single-node and multi-node scenarios)
-- ============================================================================
CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    hostname TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 8443,
    description TEXT,
    api_key TEXT,
    is_primary INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_heartbeat TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_nodes_hostname ON nodes(hostname);
CREATE INDEX IF NOT EXISTS idx_nodes_is_active ON nodes(is_active);
CREATE INDEX IF NOT EXISTS idx_nodes_is_primary ON nodes(is_primary);

-- ============================================================================
-- Configuration History Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS config_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    user_id INTEGER,
    version TEXT NOT NULL,
    config_data TEXT NOT NULL,
    change_summary TEXT,
    is_rollback_point INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_config_history_node_id ON config_history(node_id);
CREATE INDEX IF NOT EXISTS idx_config_history_user_id ON config_history(user_id);
CREATE INDEX IF NOT EXISTS idx_config_history_version ON config_history(version);
CREATE INDEX IF NOT EXISTS idx_config_history_created_at ON config_history(created_at);
CREATE INDEX IF NOT EXISTS idx_config_history_rollback_point ON config_history(is_rollback_point);
CREATE INDEX IF NOT EXISTS idx_config_history_node_created ON config_history(node_id, created_at DESC);

-- ============================================================================
-- Monitoring Data Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS monitoring_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT,
    timestamp TEXT NOT NULL,
    tags TEXT,
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_monitoring_data_node_id ON monitoring_data(node_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_data_metric_type ON monitoring_data(metric_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_data_metric_name ON monitoring_data(metric_name);
CREATE INDEX IF NOT EXISTS idx_monitoring_data_timestamp ON monitoring_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_monitoring_node_metric_time ON monitoring_data(node_id, metric_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_type_time ON monitoring_data(metric_type, timestamp DESC);

-- ============================================================================
-- Default Roles
-- ============================================================================
INSERT OR IGNORE INTO roles (name, description) VALUES
    ('admin', 'Full system administrator access'),
    ('operator', 'Network configuration operator'),
    ('viewer', 'Read-only viewer access');

-- ============================================================================
-- Default Permissions
-- ============================================================================
INSERT OR IGNORE INTO permissions (name, resource, action, description) VALUES
    ('users.read', 'users', 'read', 'View users'),
    ('users.write', 'users', 'write', 'Create or update users'),
    ('users.delete', 'users', 'delete', 'Delete users'),
    ('nodes.read', 'nodes', 'read', 'View nodes'),
    ('nodes.write', 'nodes', 'write', 'Configure nodes'),
    ('nodes.delete', 'nodes', 'delete', 'Delete nodes'),
    ('config.read', 'config', 'read', 'View configurations'),
    ('config.write', 'config', 'write', 'Modify configurations'),
    ('config.rollback', 'config', 'rollback', 'Rollback to previous configuration'),
    ('monitoring.read', 'monitoring', 'read', 'View monitoring data');

-- ============================================================================
-- Assign All Permissions to Admin Role
-- ============================================================================
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

-- ============================================================================
-- Assign Operator Permissions
-- ============================================================================
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'nodes.read',
    'nodes.write',
    'config.read',
    'config.write',
    'config.rollback',
    'monitoring.read'
)
WHERE r.name = 'operator';

-- ============================================================================
-- Assign Viewer Permissions
-- ============================================================================
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'nodes.read',
    'config.read',
    'monitoring.read'
)
WHERE r.name = 'viewer';

-- ============================================================================
-- Default Admin User (password: admin123 - CHANGE IN PRODUCTION!)
-- Hash generated with bcrypt (12 rounds)
-- ============================================================================
INSERT OR IGNORE INTO users (username, email, password_hash, full_name, is_active, is_superuser) VALUES
    ('admin', 'admin@vyos.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIPhvCDzGu', 'System Administrator', 1, 1);

-- ============================================================================
-- Assign Admin Role to Admin User
-- ============================================================================
INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'admin'
WHERE u.username = 'admin';

-- ============================================================================
-- Triggers for automatic updated_at timestamps
-- ============================================================================

-- Users table updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Roles table updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_roles_updated_at
AFTER UPDATE ON roles
FOR EACH ROW
BEGIN
    UPDATE roles SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Nodes table updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_nodes_updated_at
AFTER UPDATE ON nodes
FOR EACH ROW
BEGIN
    UPDATE nodes SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Sessions table updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_sessions_updated_at
AFTER UPDATE ON sessions
FOR EACH ROW
BEGIN
    UPDATE sessions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- Migration complete
-- ============================================================================
-- Schema version: 001
-- Database: VyOS Web UI
-- Supports: SQLite (single-node and multi-node scenarios)
-- ============================================================================