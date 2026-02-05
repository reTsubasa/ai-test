# VyOS Web UI - API Documentation

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Authentication](#authentication-1)
  - [User Management](#user-management)
  - [Network Configuration](#network-configuration)
  - [Monitoring](#monitoring)
  - [WebSocket](#websocket)

---

## Overview

The VyOS Web UI API provides a RESTful interface for managing VyOS network devices. All API endpoints return JSON responses and support standard HTTP methods (GET, POST, PUT, DELETE).

### Key Features

- JWT-based authentication
- Role-based access control (RBAC)
- Real-time updates via WebSocket
- Comprehensive error handling
- Support for both single-node and multi-node scenarios

---

## Base URL

### Development

```
http://localhost:8080/api
```

### Production

```
https://your-domain.com/api
```

---

## Authentication

### JWT Token

The API uses JSON Web Tokens (JWT) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Lifecycle

| Token Type | Default Expiration | Description |
|------------|-------------------|-------------|
| Access Token | 60 minutes | Used for API authentication |
| Refresh Token | 7 days | Used to obtain new access tokens |

---

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response

```json
{
  "error": "Error message",
  "status_code": 400,
  "details": { ... }
}
```

---

## Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 202 | Accepted | Request accepted for processing |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | User lacks required permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Validation Error | Input validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |
| 502 | Bad Gateway | External service error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## API Endpoints

### Health Check

#### GET /health

Basic health check endpoint. Returns system status and version.

**Authentication:** Not required

**Response:**

```json
{
  "status": "healthy",
  "version": "0.1.0",
  "database": "connected"
}
```

#### GET /health/detailed

Detailed health check with component status.

**Authentication:** Not required

**Response:**

```json
{
  "status": "healthy",
  "version": "0.1.0",
  "components": {
    "database": {
      "status": "connected",
      "connection_pool": "5/10"
    },
    "websocket": {
      "status": "active",
      "connections": 3
    }
  }
}
```

---

### Authentication

#### POST /auth/login

Authenticate a user and receive access tokens.

**Authentication:** Not required

**Request Body:**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "uuid-user-id",
  "username": "admin",
  "expires_in": 3600
}
```

**Field Requirements:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | User login name (3-50 characters) |
| password | string | Yes | User password (minimum 6 characters) |

#### POST /auth/logout

Logout the current user and invalidate the session.

**Authentication:** Required

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

#### POST /auth/refresh

Refresh an access token using a refresh token.

**Authentication:** Required

**Request Body:**

```json
{
  "refresh_token": "your-refresh-token"
}
```

**Response:**

```json
{
  "token": "new-access-token",
  "user_id": "uuid-user-id",
  "username": "admin",
  "expires_in": 3600
}
```

#### POST /auth/validate

Validate the current access token.

**Authentication:** Required

**Response:**

```json
{
  "valid": true,
  "user_id": "uuid-user-id",
  "username": "admin",
  "expires_at": 1709251200
}
```

---

### User Management

#### GET /users/me

Get the current user's profile.

**Authentication:** Required

**Permissions:** `users.read`

**Response:**

```json
{
  "id": "uuid-user-id",
  "username": "admin",
  "email": "admin@example.com",
  "full_name": "System Administrator",
  "role": "admin",
  "status": "active",
  "last_login": "2025-01-15T10:30:00Z",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

#### PUT /users/me

Update the current user's profile.

**Authentication:** Required

**Permissions:** `users.write`

**Request Body:**

```json
{
  "email": "newemail@example.com",
  "full_name": "Updated Name"
}
```

**Response:**

```json
{
  "id": "uuid-user-id",
  "username": "admin",
  "email": "newemail@example.com",
  "full_name": "Updated Name",
  "role": "admin",
  "status": "active",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-16T14:20:00Z"
}
```

#### POST /users/me/password

Change the current user's password.

**Authentication:** Required

**Request Body:**

```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

**Response:**

```json
{
  "message": "Password changed successfully"
}
```

#### GET /users

List all users (admin only).

**Authentication:** Required

**Permissions:** `users.read`, `users.delete` (for full details)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page |
| role | string | - | Filter by role |
| status | string | - | Filter by status |

**Response:**

```json
{
  "users": [
    {
      "id": "uuid-user-id",
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "System Administrator",
      "role": "admin",
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### POST /users

Create a new user (admin only).

**Authentication:** Required

**Permissions:** `users.write`

**Request Body:**

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "New User",
  "role": "operator"
}
```

**Response:**

```json
{
  "id": "uuid-new-user-id",
  "username": "newuser",
  "email": "newuser@example.com",
  "full_name": "New User",
  "role": "operator",
  "status": "active",
  "created_at": "2025-01-16T10:00:00Z"
}
```

#### PUT /users/{id}

Update a user (admin only).

**Authentication:** Required

**Permissions:** `users.write`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | User ID |

**Request Body:**

```json
{
  "email": "updated@example.com",
  "role": "admin",
  "status": "disabled"
}
```

**Response:**

```json
{
  "id": "uuid-user-id",
  "username": "newuser",
  "email": "updated@example.com",
  "role": "admin",
  "status": "disabled",
  "updated_at": "2025-01-16T11:00:00Z"
}
```

#### DELETE /users/{id}

Delete a user (admin only).

**Authentication:** Required

**Permissions:** `users.delete`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | User ID |

**Response:**

```json
{
  "message": "User deleted successfully"
}
```

---

### Network Configuration

#### GET /network/interfaces

List all network interfaces.

**Authentication:** Required

**Permissions:** `config.read`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| node_id | string (UUID) | - | Filter by node ID |
| type | string | - | Filter by interface type |
| status | string | - | Filter by status |

**Response:**

```json
{
  "interfaces": [
    {
      "id": "uuid-interface-id",
      "name": "eth0",
      "description": "Primary Ethernet Interface",
      "type": "ethernet",
      "status": "up",
      "mac_address": "00:11:22:33:44:55",
      "mtu": 1500,
      "ip_addresses": [
        {
          "address": "192.168.1.1",
          "prefix_length": 24,
          "type": "IPv4",
          "is_primary": true
        }
      ],
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### GET /network/interfaces/{id}

Get details of a specific network interface.

**Authentication:** Required

**Permissions:** `config.read`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Interface ID |

**Response:**

```json
{
  "id": "uuid-interface-id",
  "name": "eth0",
  "description": "Primary Ethernet Interface",
  "type": "ethernet",
  "status": "up",
  "mac_address": "00:11:22:33:44:55",
  "mtu": 1500,
  "ip_addresses": [
    {
      "address": "192.168.1.1",
      "prefix_length": 24,
      "type": "IPv4",
      "is_primary": true
    },
    {
      "address": "2001:db8::1",
      "prefix_length": 64,
      "type": "IPv6",
      "is_primary": false
    }
  ],
  "statistics": {
    "rx_bytes": 1024000,
    "tx_bytes": 512000,
    "rx_packets": 10000,
    "tx_packets": 5000,
    "rx_errors": 0,
    "tx_errors": 0
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

#### POST /network/interfaces/{id}/configure

Configure a network interface.

**Authentication:** Required

**Permissions:** `config.write`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Interface ID |

**Request Body:**

```json
{
  "description": "Updated description",
  "mtu": 9000,
  "ip_addresses": [
    {
      "address": "192.168.2.1",
      "prefix_length": 24,
      "type": "IPv4"
    }
  ],
  "enabled": true
}
```

**Response:**

```json
{
  "message": "Interface configuration accepted",
  "interface_id": "uuid-interface-id",
  "status": "pending_apply"
}
```

#### GET /network/routes

Get the routing table.

**Authentication:** Required

**Permissions:** `config.read`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| node_id | string (UUID) | - | Filter by node ID |
| type | string | - | Filter by route type |

**Response:**

```json
{
  "routes": [
    {
      "id": "uuid-route-id",
      "destination": "192.168.0.0/24",
      "gateway": "192.168.1.254",
      "interface": "eth0",
      "metric": 100,
      "type": "static",
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "uuid-route-id-2",
      "destination": "0.0.0.0/0",
      "gateway": "192.168.1.1",
      "interface": "eth0",
      "metric": 0,
      "type": "connected",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 2
}
```

#### POST /network/routes

Add a static route.

**Authentication:** Required

**Permissions:** `config.write`

**Request Body:**

```json
{
  "destination": "10.0.0.0/24",
  "gateway": "192.168.1.1",
  "interface": "eth0",
  "metric": 100
}
```

**Response:**

```json
{
  "id": "uuid-new-route-id",
  "destination": "10.0.0.0/24",
  "gateway": "192.168.1.1",
  "interface": "eth0",
  "metric": 100,
  "type": "static",
  "created_at": "2025-01-16T12:00:00Z"
}
```

#### DELETE /network/routes/{id}

Delete a route.

**Authentication:** Required

**Permissions:** `config.write`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Route ID |

**Response:**

```json
{
  "message": "Route deleted successfully"
}
```

#### GET /network/firewall/rules

Get firewall rules.

**Authentication:** Required

**Permissions:** `config.read`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| node_id | string (UUID) | - | Filter by node ID |
| chain | string | - | Filter by chain (INPUT, OUTPUT, FORWARD) |

**Response:**

```json
{
  "rules": [
    {
      "id": "uuid-rule-id",
      "name": "Allow SSH",
      "description": "Allow SSH access from trusted network",
      "action": "accept",
      "chain": "INPUT",
      "source_address": "192.168.1.0/24",
      "destination_address": null,
      "source_port": null,
      "destination_port": 22,
      "protocol": "tcp",
      "enabled": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### POST /network/firewall/rules

Add a firewall rule.

**Authentication:** Required

**Permissions:** `config.write`

**Request Body:**

```json
{
  "name": "Allow HTTP",
  "description": "Allow HTTP traffic",
  "action": "accept",
  "chain": "INPUT",
  "destination_port": 80,
  "protocol": "tcp",
  "enabled": true
}
```

**Response:**

```json
{
  "id": "uuid-new-rule-id",
  "name": "Allow HTTP",
  "description": "Allow HTTP traffic",
  "action": "accept",
  "chain": "INPUT",
  "destination_port": 80,
  "protocol": "tcp",
  "enabled": true,
  "created_at": "2025-01-16T12:30:00Z"
}
```

#### DELETE /network/firewall/rules/{id}

Delete a firewall rule.

**Authentication:** Required

**Permissions:** `config.write`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Rule ID |

**Response:**

```json
{
  "message": "Firewall rule deleted successfully"
}
```

---

### Monitoring

#### GET /monitoring/metrics

Get aggregate system metrics across all nodes.

**Authentication:** Required

**Permissions:** `monitoring.read`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| start_time | string (ISO 8601) | - | Start of time range |
| end_time | string (ISO 8601) | - | End of time range |

**Response:**

```json
{
  "cpu": {
    "usage": 15.5,
    "cores": 4,
    "load_average": [0.5, 0.7, 0.6]
  },
  "memory": {
    "total": 8589934592,
    "used": 3221225472,
    "available": 5368709120,
    "percentage": 37.5
  },
  "disk": {
    "total": 1099511627776,
    "used": 439804651110,
    "available": 659706976666,
    "percentage": 40.0,
    "path": "/"
  },
  "network": {
    "interfaces": [
      {
        "name": "eth0",
        "status": "up",
        "speed": 1000,
        "mtu": 1500
      }
    ]
  }
}
```

#### GET /monitoring/nodes/{node_id}/metrics

Get system metrics for a specific node.

**Authentication:** Required

**Permissions:** `monitoring.read`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| node_id | string (UUID) | Yes | Node ID |

**Response:** (Same as `/monitoring/metrics`)

#### GET /monitoring/summary

Get dashboard summary statistics.

**Authentication:** Required

**Permissions:** `monitoring.read`

**Response:**

```json
{
  "total_nodes": 5,
  "online_nodes": 4,
  "offline_nodes": 1,
  "degraded_nodes": 0,
  "active_interfaces": 12,
  "total_bandwidth": 1000,
  "bandwidth_unit": "Mbps",
  "system_status": "healthy"
}
```

#### GET /monitoring/nodes/status

Get status of all nodes.

**Authentication:** Required

**Permissions:** `monitoring.read`

**Response:**

```json
[
  {
    "id": "uuid-node-id",
    "name": "Router-01",
    "ip": "192.168.1.1",
    "status": "online",
    "uptime": 86400,
    "last_seen": "2025-01-16T12:00:00Z",
    "cpu": 15.5,
    "memory": 37.5,
    "disk": 40.0,
    "version": "1.4.0"
  }
]
```

#### GET /monitoring/traffic

Get traffic data for a specific time range.

**Authentication:** Required

**Permissions:** `monitoring.read`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| node_id | string (UUID) | - | Filter by node ID |
| interface | string | - | Filter by interface name |
| start_time | string (ISO 8601) | - | Start of time range |
| end_time | string (ISO 8601) | - | End of time range |

**Response:**

```json
[
  {
    "timestamp": "2025-01-16T12:00:00Z",
    "inbound": 1024000,
    "outbound": 512000,
    "interface": "eth0"
  }
]
```

#### GET /monitoring/activity

Get recent activity log.

**Authentication:** Required

**Permissions:** `monitoring.read`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Maximum number of entries |
| type | string | - | Filter by activity type |

**Response:**

```json
[
  {
    "id": "uuid-activity-id",
    "timestamp": "2025-01-16T12:00:00Z",
    "type": "config",
    "message": "Interface eth0 configuration updated",
    "node": "Router-01",
    "user": "admin",
    "details": {
      "interface": "eth0",
      "changes": ["mtu: 1500 -> 9000"]
    }
  }
]
```

#### GET /monitoring/alerts

Get active alerts.

**Authentication:** Required

**Permissions:** `monitoring.read`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| acknowledged | boolean | false | Include acknowledged alerts |

**Response:**

```json
[
  {
    "id": "uuid-alert-id",
    "severity": "warning",
    "title": "High CPU Usage",
    "message": "CPU usage exceeded 80% threshold",
    "timestamp": "2025-01-16T12:00:00Z",
    "node": "Router-01",
    "acknowledged": false,
    "details": {
      "cpu_usage": 85.5,
      "threshold": 80.0
    }
  }
]
```

#### POST /monitoring/alerts/{alert_id}/acknowledge

Acknowledge an alert.

**Authentication:** Required

**Permissions:** `monitoring.read`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| alert_id | string (UUID) | Yes | Alert ID |

**Response:**

```json
{
  "message": "Alert acknowledged successfully"
}
```

---

### Node Management

#### GET /nodes

List all nodes.

**Authentication:** Required

**Permissions:** `nodes.read`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| type | string | - | Filter by node type |
| status | string | - | Filter by status |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid-node-id",
      "name": "Router-01",
      "hostname": "router01.example.com",
      "ip_address": "192.168.1.1",
      "port": 8443,
      "type": "router",
      "status": "online",
      "version": "1.4.0",
      "description": "Main router",
      "location": "Data Center 1",
      "tags": ["production", "core"],
      "health_metrics": [
        {
          "name": "cpu",
          "value": 15.5,
          "unit": "%",
          "status": "healthy",
          "timestamp": "2025-01-16T12:00:00Z"
        }
      ],
      "last_connected": "2025-01-16T12:00:00Z",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### POST /nodes

Add a new node.

**Authentication:** Required

**Permissions:** `nodes.write`

**Request Body:**

```json
{
  "name": "Router-02",
  "hostname": "router02.example.com",
  "ip_address": "192.168.1.2",
  "port": 8443,
  "type": "router",
  "description": "Backup router",
  "location": "Data Center 1",
  "tags": ["production"]
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid-new-node-id",
    "name": "Router-02",
    "hostname": "router02.example.com",
    "ip_address": "192.168.1.2",
    "port": 8443,
    "type": "router",
    "status": "offline",
    "description": "Backup router",
    "location": "Data Center 1",
    "tags": ["production"],
    "created_at": "2025-01-16T12:00:00Z"
  },
  "message": "Node created successfully"
}
```

#### PUT /nodes/{id}

Update a node.

**Authentication:** Required

**Permissions:** `nodes.write`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Node ID |

**Request Body:**

```json
{
  "description": "Updated description",
  "tags": ["production", "core"]
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid-node-id",
    "name": "Router-01",
    "description": "Updated description",
    "tags": ["production", "core"],
    "updated_at": "2025-01-16T13:00:00Z"
  }
}
```

#### DELETE /nodes/{id}

Delete a node.

**Authentication:** Required

**Permissions:** `nodes.delete`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Node ID |

**Response:** (Empty with 204 status code)

#### POST /nodes/{id}/test-connection

Test connection to a node.

**Authentication:** Required

**Permissions:** `nodes.write`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Node ID |

**Response:**

```json
{
  "success": true,
  "latency": 15.5
}
```

---

### WebSocket

#### Connection

Connect to the WebSocket endpoint for real-time updates.

**WebSocket URL:**

```
ws://localhost:8080/ws
```

For production:

```
wss://your-domain.com/ws
```

### WebSocket Messages

#### Client to Server

##### Authentication

```json
{
  "type": "Auth",
  "data": {
    "token": "your-jwt-token"
  }
}
```

##### Subscribe to Channel

```json
{
  "type": "Subscribe",
  "data": {
    "channel": "monitoring"
  }
}
```

##### Unsubscribe from Channel

```json
{
  "type": "Unsubscribe",
  "data": {
    "channel": "monitoring"
  }
}
```

#### Server to Client

##### Traffic Update

```json
{
  "type": "traffic",
  "data": {
    "timestamp": "2025-01-16T12:00:00Z",
    "inbound": 1024000,
    "outbound": 512000,
    "interface": "eth0",
    "node_id": "uuid-node-id"
  }
}
```

##### Activity Log Update

```json
{
  "type": "activity",
  "data": {
    "id": "uuid-activity-id",
    "timestamp": "2025-01-16T12:00:00Z",
    "type": "config",
    "message": "Interface eth0 configuration updated",
    "node": "Router-01",
    "user": "admin"
  }
}
```

##### Alert

```json
{
  "type": "alert",
  "data": {
    "id": "uuid-alert-id",
    "severity": "warning",
    "title": "High CPU Usage",
    "message": "CPU usage exceeded 80% threshold",
    "timestamp": "2025-01-16T12:00:00Z",
    "node": "Router-01",
    "acknowledged": false
  }
}
```

##### Node Status Update

```json
{
  "type": "nodeStatus",
  "data": {
    "id": "uuid-node-id",
    "name": "Router-01",
    "status": "online",
    "cpu": 15.5,
    "memory": 37.5
  }
}
```

##### Ping (Heartbeat)

```json
{
  "type": "ping"
}
```

##### Error

```json
{
  "type": "error",
  "error": "Authentication failed"
}
```

---

## Rate Limiting

API requests are rate limited to prevent abuse:

| Endpoint | Rate Limit |
|----------|------------|
| Authentication endpoints | 5 requests/minute |
| Read endpoints | 100 requests/minute |
| Write endpoints | 30 requests/minute |

Rate limit information is returned in headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709251200
```

---

## API Versioning

The API is versioned via the base URL. The current version is `v1`.

```
https://your-domain.com/api/v1
```

Backwards compatibility is maintained within major versions.

---

## Pagination

List endpoints support pagination:

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number (1-based) |
| limit | integer | 20 | Items per page (max 100) |

**Response Headers:**

```
X-Total-Count: 150
X-Page-Count: 8
X-Current-Page: 1
```

---

## Sorting

List endpoints support sorting:

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| sort | string | id | Field to sort by |
| order | string | asc | Sort direction (asc, desc) |

Example: `?sort=created_at&order=desc`

---

## Filtering

List endpoints support filtering on common fields:

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| field=value | - | Exact match |
| field__contains=value | - | Contains string |
| field__gt=value | - | Greater than |
| field__lt=value | - | Less than |
| field__gte=value | - | Greater than or equal |
| field__lte=value | - | Less than or equal |

Example: `?status=online&created_at__gte=2025-01-01`

---

**Version**: 0.1.0
**Last Updated**: February 2025