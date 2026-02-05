-- Initial schema for VyOS Web UI

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Network interfaces table
CREATE TABLE network_interfaces (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    interface_type TEXT NOT NULL,
    ip_address TEXT,
    subnet_mask TEXT,
    gateway TEXT,
    mac_address TEXT,
    status TEXT DEFAULT 'down',
    enabled BOOLEAN DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Firewall rules table
CREATE TABLE firewall_rules (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    action TEXT NOT NULL, -- accept, drop, reject
    protocol TEXT,
    source_network TEXT,
    destination_network TEXT,
    source_port INTEGER,
    destination_port INTEGER,
    interface TEXT,
    enabled BOOLEAN DEFAULT 1,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configuration history table
CREATE TABLE config_history (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    config_type TEXT NOT NULL,
    config_data TEXT NOT NULL,
    action TEXT NOT NULL, -- create, update, delete, apply
    applied_successfully BOOLEAN,
    rollback_possible BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_network_interfaces_name ON network_interfaces(name);
CREATE INDEX idx_firewall_rules_sequence ON firewall_rules(sequence);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);