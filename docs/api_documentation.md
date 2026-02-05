# VyOS Web UI API 文档

## 目录
1. [概述](#概述)
2. [认证](#认证)
3. [错误处理](#错误处理)
4. [用户管理 API](#用户管理-api)
5. [网络配置 API](#网络配置-api)
6. [监控 API](#监控-api)
7. [系统设置 API](#系统设置-api)
8. [WebSocket 接口](#websocket-接口)

## 概述

### 基础信息
- **基础 URL**: `https://your-domain.com/api/v1`
- **协议**: HTTPS
- **内容类型**: `application/json`
- **字符编码**: UTF-8
- **版本**: v1

### 请求格式
所有请求必须包含适当的 HTTP 头部：
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {jwt_token}
```

### 响应格式
成功的响应遵循以下结构：
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

错误响应遵循以下结构：
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation error occurred",
    "details": []
  },
  "timestamp": "2023-12-01T10:00:00Z"
}
```

## 认证

### JWT 认证
所有 API 端点都需要 JWT 认证，除了认证相关的端点。

#### 登录
```
POST /auth/login
```

**请求体**:
```json
{
  "username": "admin",
  "password": "securepassword"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "admin",
      "email": "admin@example.com",
      "roles": ["admin", "user"],
      "permissions": ["*"]
    }
  },
  "message": "Login successful",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

**HTTP 状态码**:
- `200`: 登录成功
- `400`: 输入验证失败
- `401`: 凭据无效
- `429`: 登录尝试过多

#### 注册
```
POST /auth/register
```

**请求体**:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "username": "newuser",
    "email": "user@example.com",
    "created_at": "2023-12-01T10:00:00Z"
  },
  "message": "User registered successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

**HTTP 状态码**:
- `201`: 注册成功
- `400`: 输入验证失败
- `409`: 用户名或邮箱已存在

#### 刷新令牌
```
POST /auth/refresh
```

**请求体**:
```json
{
  "refresh_token": "refresh_token_here"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "access_token": "new_access_token",
    "refresh_token": "new_refresh_token"
  },
  "message": "Tokens refreshed successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

#### 获取当前用户信息
```
GET /auth/me
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "admin",
    "email": "admin@example.com",
    "roles": ["admin"],
    "permissions": ["*"],
    "created_at": "2023-12-01T10:00:00Z",
    "last_login_at": "2023-12-01T09:00:00Z"
  },
  "message": "User data retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

## 错误处理

### 错误代码

| 代码 | HTTP 状态 | 描述 |
|------|-----------|------|
| `UNAUTHORIZED` | 401 | 未认证或令牌无效 |
| `FORBIDDEN` | 403 | 无权限执行操作 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 输入验证失败 |
| `DUPLICATE_ENTRY` | 409 | 资源已存在 |
| `RATE_LIMITED` | 429 | 请求过于频繁 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

### 通用错误响应
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided input data is invalid",
    "details": [
      {
        "field": "username",
        "message": "Username must be between 3 and 32 characters"
      }
    ]
  },
  "timestamp": "2023-12-01T10:00:00Z"
}
```

## 用户管理 API

### 获取用户列表
```
GET /users?page=1&limit=10&sort=username&order=asc&search=admin
```

**参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10, 最大: 100)
- `sort`: 排序字段 (username, email, created_at)
- `order`: 排序顺序 (asc, desc)
- `search`: 搜索关键词

**响应**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "username": "admin",
        "email": "admin@example.com",
        "roles": ["admin"],
        "is_active": true,
        "created_at": "2023-12-01T10:00:00Z",
        "updated_at": "2023-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "has_next": true,
      "has_prev": false
    }
  },
  "message": "Users retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### 获取特定用户
```
GET /users/{user_id}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "admin",
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "roles": ["admin"],
    "permissions": ["*"],
    "is_active": true,
    "created_at": "2023-12-01T10:00:00Z",
    "updated_at": "2023-12-01T10:00:00Z",
    "last_login_at": "2023-12-01T09:00:00Z"
  },
  "message": "User retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### 创建用户
```
POST /users
```

**请求体**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "first_name": "New",
  "last_name": "User",
  "roles": ["user"],
  "is_active": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "username": "newuser",
    "email": "newuser@example.com",
    "first_name": "New",
    "last_name": "User",
    "roles": ["user"],
    "is_active": true,
    "created_at": "2023-12-01T10:00:00Z"
  },
  "message": "User created successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### 更新用户
```
PUT /users/{user_id}
```

**请求体** (全部可选):
```json
{
  "username": "updateduser",
  "email": "updated@example.com",
  "first_name": "Updated",
  "last_name": "User",
  "roles": ["admin", "user"],
  "is_active": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "updateduser",
    "email": "updated@example.com",
    "first_name": "Updated",
    "last_name": "User",
    "roles": ["admin", "user"],
    "is_active": true,
    "updated_at": "2023-12-01T10:00:00Z"
  },
  "message": "User updated successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### 删除用户
```
DELETE /users/{user_id}
```

**响应**:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### 禁用/启用用户
```
PATCH /users/{user_id}/toggle-status
```

**请求体**:
```json
{
  "is_active": false
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "is_active": false
  },
  "message": "User status updated successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

## 网络配置 API

### 网络接口

#### 获取接口列表
```
GET /network/interfaces
```

**查询参数**:
- `type`: 接口类型过滤 (ethernet, vlan, bond, loopback)
- `status`: 接口状态过滤 (up, down)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "name": "eth0",
      "type": "ethernet",
      "ip_address": "192.168.1.1",
      "subnet_mask": "255.255.255.0",
      "gateway": "192.168.1.254",
      "mac_address": "00:11:22:33:44:55",
      "status": "up",
      "enabled": true,
      "description": "Primary network interface",
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z"
    }
  ],
  "message": "Interfaces retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

#### 获取特定接口
```
GET /network/interfaces/{interface_id}
```

#### 创建接口
```
POST /network/interfaces
```

**请求体**:
```json
{
  "name": "eth1",
  "type": "ethernet",
  "ip_address": "10.0.0.1",
  "subnet_mask": "255.255.255.0",
  "gateway": "10.0.0.254",
  "description": "Secondary interface",
  "enabled": true
}
```

#### 更新接口
```
PUT /network/interfaces/{interface_id}
```

**请求体** (部分更新):
```json
{
  "ip_address": "10.0.0.2",
  "description": "Updated secondary interface"
}
```

#### 删除接口
```
DELETE /network/interfaces/{interface_id}
```

#### 启用/禁用接口
```
POST /network/interfaces/{interface_id}/enable
POST /network/interfaces/{interface_id}/disable
```

### 路由配置

#### 获取路由表
```
GET /network/routes
```

**查询参数**:
- `protocol`: 协议过滤 (static, dynamic, bgp, ospf)
- `destination`: 目标网络过滤

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174004",
      "destination": "10.0.0.0/24",
      "gateway": "192.168.1.1",
      "interface": "eth0",
      "metric": 1,
      "protocol": "static",
      "type": "unicast",
      "created_at": "2023-12-01T10:00:00Z"
    }
  ],
  "message": "Routes retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

#### 创建静态路由
```
POST /network/routes
```

**请求体**:
```json
{
  "destination": "172.16.0.0/16",
  "gateway": "192.168.1.1",
  "interface": "eth0",
  "metric": 5,
  "description": "Route to internal network"
}
```

#### 删除路由
```
DELETE /network/routes/{route_id}
```

### 防火墙配置

#### 获取防火墙规则
```
GET /network/firewall/rules
```

**查询参数**:
- `direction`: 方向过滤 (input, output, forward)
- `action`: 动作过滤 (accept, drop, reject)
- `interface`: 接口过滤
- `protocol`: 协议过滤 (tcp, udp, icmp)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "name": "Allow SSH",
      "sequence": 10,
      "action": "accept",
      "protocol": "tcp",
      "source": "any",
      "destination": "any",
      "source_port": null,
      "destination_port": 22,
      "interface": "eth0",
      "enabled": true,
      "description": "Allow SSH access",
      "created_by": "admin",
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z"
    }
  ],
  "message": "Firewall rules retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

#### 创建防火墙规则
```
POST /network/firewall/rules
```

**请求体**:
```json
{
  "name": "Block Malicious IPs",
  "sequence": 5,
  "action": "drop",
  "protocol": "all",
  "source": "203.0.113.0/24",
  "destination": "any",
  "interface": "eth0",
  "enabled": true,
  "description": "Block known malicious IP range"
}
```

#### 更新防火墙规则
```
PUT /network/firewall/rules/{rule_id}
```

#### 删除防火墙规则
```
DELETE /network/firewall/rules/{rule_id}
```

### DHCP 配置

#### 获取 DHCP 作用域
```
GET /network/dhcp/scopes
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174006",
      "name": "LAN_DHCP",
      "network": "192.168.1.0/24",
      "range_start": "192.168.1.100",
      "range_end": "192.168.1.200",
      "gateway": "192.168.1.1",
      "dns_servers": ["8.8.8.8", "1.1.1.1"],
      "lease_time": 86400,
      "enabled": true,
      "interface": "eth0",
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z"
    }
  ],
  "message": "DHCP scopes retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

#### 创建 DHCP 作用域
```
POST /network/dhcp/scopes
```

**请求体**:
```json
{
  "name": "Guest_Network",
  "network": "192.168.2.0/24",
  "range_start": "192.168.2.100",
  "range_end": "192.168.2.200",
  "gateway": "192.168.2.1",
  "dns_servers": ["8.8.8.8", "1.1.1.1"],
  "lease_time": 3600,
  "enabled": true,
  "interface": "eth1"
}
```

## 监控 API

### 系统指标

#### 获取系统指标
```
GET /monitoring/system-metrics?node=primary&interval=5min&start_time=2023-12-01T09:00:00Z&end_time=2023-12-01T10:00:00Z
```

**响应**:
```json
{
  "success": true,
  "data": {
    "node": "primary",
    "metrics": [
      {
        "timestamp": "2023-12-01T09:00:00Z",
        "cpu_usage": 15.5,
        "memory_usage": 42.3,
        "disk_usage": 65.2,
        "load_average": [0.12, 0.15, 0.10],
        "uptime": "4 days, 12:34:56"
      }
    ],
    "summary": {
      "avg_cpu_usage": 18.2,
      "avg_memory_usage": 45.6,
      "peak_memory_usage": 52.1
    }
  },
  "message": "System metrics retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### 网络指标

#### 获取网络指标
```
GET /monitoring/network-metrics?interface=eth0&interval=1min&start_time=2023-12-01T09:00:00Z
```

**响应**:
```json
{
  "success": true,
  "data": {
    "interface": "eth0",
    "metrics": [
      {
        "timestamp": "2023-12-01T09:00:00Z",
        "rx_bytes": 1234567890,
        "tx_bytes": 987654321,
        "rx_packets": 12345,
        "tx_packets": 9876,
        "errors": 0,
        "dropped": 0
      }
    ],
    "summary": {
      "rx_rate_bps": 1234567,
      "tx_rate_bps": 987654,
      "utilization": 5.2
    }
  },
  "message": "Network metrics retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### 告警管理

#### 获取告警
```
GET /monitoring/alerts?status=active&severity=critical&limit=20&page=1
```

**响应**:
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174007",
        "title": "High CPU Usage",
        "description": "CPU usage exceeded 80% threshold",
        "severity": "critical",
        "status": "active",
        "source": "system_monitor",
        "node": "primary",
        "timestamp": "2023-12-01T09:30:00Z",
        "resolved_at": null,
        "acknowledged_at": null,
        "acknowledged_by": null
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_items": 1
    }
  },
  "message": "Alerts retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

#### 解决告警
```
POST /monitoring/alerts/{alert_id}/resolve
```

**请求体**:
```json
{
  "resolution_notes": "Investigated and resolved by increasing resources"
}
```

#### 获取告警规则
```
GET /monitoring/alert-rules
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174008",
      "name": "CPU Usage Threshold",
      "metric_type": "system.cpu.usage",
      "condition": ">",
      "threshold": 80,
      "window": "5m",
      "severity": "warning",
      "enabled": true,
      "notifications": {
        "email": ["admin@example.com"],
        "webhook": "https://hooks.example.com/alert"
      },
      "created_at": "2023-12-01T08:00:00Z",
      "updated_at": "2023-12-01T08:00:00Z"
    }
  ],
  "message": "Alert rules retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### 配置历史

#### 获取配置历史
```
GET /monitoring/config-history?resource_type=network.interface&resource_id=123e4567-e89b-12d3-a456-426614174003&limit=10
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174009",
      "resource_type": "network.interface",
      "resource_id": "123e4567-e89b-12d3-a456-426614174003",
      "action": "update",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "old_values": {
        "ip_address": "192.168.1.100"
      },
      "new_values": {
        "ip_address": "192.168.1.101"
      },
      "applied_successfully": true,
      "rollback_possible": true,
      "timestamp": "2023-12-01T09:00:00Z"
    }
  ],
  "message": "Config history retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

## 系统设置 API

### 系统信息

#### 获取系统信息
```
GET /system/info
```

**响应**:
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "build_date": "2023-12-01T08:00:00Z",
    "uptime": "4 days, 12:34:56",
    "hostname": "vyos-web-ui-01",
    "os_info": {
      "platform": "linux",
      "arch": "x86_64",
      "version": "Ubuntu 20.04.6 LTS"
    },
    "database": {
      "type": "sqlite",
      "version": "3.37.2",
      "size_mb": 12.5
    },
    "feature_flags": {
      "user_management": true,
      "network_config": true,
      "monitoring": true,
      "backup_restore": true
    }
  },
  "message": "System information retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### 配置管理

#### 获取系统配置
```
GET /system/config
```

**响应**:
```json
{
  "success": true,
  "data": {
    "general": {
      "site_name": "VyOS Web UI",
      "timezone": "UTC",
      "date_format": "YYYY-MM-DD",
      "time_format": "HH:mm:ss"
    },
    "security": {
      "max_login_attempts": 5,
      "lockout_duration_mins": 15,
      "password_min_length": 8,
      "session_timeout_mins": 30
    },
    "monitoring": {
      "refresh_interval_ms": 5000,
      "retention_days": 30,
      "metrics_enabled": true
    }
  },
  "message": "System configuration retrieved successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

#### 更新系统配置
```
PUT /system/config
```

**请求体**:
```json
{
  "security": {
    "max_login_attempts": 3,
    "lockout_duration_mins": 30
  }
}
```

### 备份和恢复

#### 创建备份
```
POST /system/backup
```

**请求体**:
```json
{
  "include": ["users", "network_config", "monitoring_data"],
  "exclude": ["logs"],
  "notes": "Weekly backup before major update"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "backup_id": "backup-20231201-100000-abc123",
    "filename": "vyos-backup-20231201-100000.zip",
    "size_bytes": 1048576,
    "created_at": "2023-12-01T10:00:00Z",
    "expires_at": "2024-03-01T10:00:00Z"
  },
  "message": "Backup created successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

#### 获取备份列表
```
GET /system/backups
```

#### 下载备份
```
GET /system/backups/{backup_id}/download
```

### 系统维护

#### 清理日志
```
POST /system/logs/cleanup
```

**请求体**:
```json
{
  "older_than_days": 30,
  "log_types": ["application", "access", "error"]
}
```

#### 重启服务
```
POST /system/restart
```

**请求体**:
```json
{
  "reason": "Scheduled maintenance"
}
```

**重要**: 此操作需要特殊权限

## WebSocket 接口

### 实时监控数据

#### 连接
WebSocket 端点: `wss://your-domain.com/ws/monitoring`

#### 订阅消息
```json
{
  "type": "subscribe",
  "channel": "system_metrics",
  "filters": {
    "node": "primary",
    "metrics": ["cpu", "memory", "disk"]
  }
}
```

#### 取消订阅消息
```json
{
  "type": "unsubscribe",
  "channel": "system_metrics"
}
```

#### 实时数据推送
服务器将定期推送数据：
```json
{
  "type": "data",
  "channel": "system_metrics",
  "timestamp": "2023-12-01T10:00:05Z",
  "payload": {
    "node": "primary",
    "cpu_usage": 22.5,
    "memory_usage": 48.2,
    "disk_usage": 67.8
  }
}
```

### 系统事件

#### 订阅系统事件
```json
{
  "type": "subscribe",
  "channel": "system_events",
  "filters": {
    "event_types": ["config_applied", "alert_generated", "service_restart"]
  }
}
```

### 连接管理

客户端需要处理以下 WebSocket 事件：

- `onopen`: 连接建立
- `onmessage`: 接收数据
- `onclose`: 连接关闭
- `onerror`: 连接错误

建议实现自动重连机制：

```javascript
let ws;
function connect() {
  ws = new WebSocket('wss://your-domain.com/ws/monitoring');
  ws.onopen = () => console.log('Connected');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // 处理收到的数据
  };
  ws.onclose = () => {
    // 5秒后尝试重连
    setTimeout(connect, 5000);
  };
}
connect();
```

---

**注意**: 所有 API 调用都需要有效的 JWT 认证令牌（除了认证相关端点）。