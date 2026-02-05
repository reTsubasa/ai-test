# VyOS Web UI 技术规范文档

## 1. 项目结构

```
vyos-web-ui/
├── backend/                    # Rust 后端服务
│   ├── src/
│   │   ├── main.rs
│   │   ├── models/            # 数据模型
│   │   ├── handlers/          # API 处理器
│   │   ├── services/          # 业务逻辑
│   │   ├── middleware/        # 中间件
│   │   ├── utils/             # 工具函数
│   │   └── config/            # 配置管理
│   ├── Cargo.toml
│   └── migrations/            # 数据库迁移
├── frontend/                   # React 前端应用
│   ├── src/
│   │   ├── components/        # 可复用组件
│   │   ├── pages/             # 页面组件
│   │   ├── services/          # API 服务
│   │   ├── contexts/          # React Context
│   │   ├── hooks/             # 自定义 Hooks
│   │   ├── utils/             # 工具函数
│   │   ├── types/             # TypeScript 类型定义
│   │   ├── assets/            # 静态资源
│   │   └── styles/            # 样式文件
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docs/                      # 项目文档
│   ├── project_plan.md
│   ├── architecture_design.md
│   ├── api_documentation.md
│   ├── deployment_guide.md
│   └── user_manual.md
├── tests/                     # 测试文件
│   ├── backend/
│   ├── frontend/
│   └── integration/
├── docker/                    # Docker 配置
├── scripts/                   # 脚本文件
└── README.md
```

## 2. 前端技术规范

### 2.1 React 组件结构

```typescript
// 示例：一个标准的组件结构
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NetworkConfigService } from '../services/NetworkConfigService';

interface Props {
  configId?: string;
}

const NetworkInterfaceComponent: React.FC<Props> = ({ configId }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<NetworkInterface | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (configId) {
      loadConfig(configId);
    }
  }, [configId]);

  const loadConfig = async (id: string) => {
    try {
      setLoading(true);
      const data = await NetworkConfigService.getInterface(id);
      setConfig(data);
    } catch (error) {
      console.error('Failed to load interface:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="network-interface-card">
      {loading ? <div>Loading...</div> : <InterfaceDetails config={config} />}
    </div>
  );
};

export default NetworkInterfaceComponent;
```

### 2.2 TypeScript 类型定义

```typescript
// src/types/network.ts
export interface NetworkInterface {
  id: string;
  name: string;
  type: 'ethernet' | 'vlan' | 'bond' | 'loopback';
  ipAddress?: string;
  subnetMask?: string;
  status: 'up' | 'down';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirewallRule {
  id: string;
  name: string;
  action: 'accept' | 'drop' | 'reject';
  protocol: 'tcp' | 'udp' | 'icmp' | 'all';
  source?: string;
  destination?: string;
  sourcePort?: number;
  destPort?: number;
  position: number;
  enabled: boolean;
}

export interface Route {
  id: string;
  destination: string;
  gateway: string;
  metric: number;
  interface: string;
  protocol: string;
  createdAt: string;
}
```

### 2.3 API 服务层

```typescript
// src/services/ApiClient.ts
import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 清除认证信息并重定向到登录页
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: any): Promise<T> {
    return this.client.get(url, config).then(response => response.data);
  }

  post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.post(url, data, config).then(response => response.data);
  }

  put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.put(url, data, config).then(response => response.data);
  }

  delete<T>(url: string, config?: any): Promise<T> {
    return this.client.delete(url, config).then(response => response.data);
  }
}

export default new ApiClient(process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api');
```

### 2.4 React Context 模式

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 检查现有会话
    const token = localStorage.getItem('access_token');
    if (token) {
      // 验证令牌有效性
      validateToken(token);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      // 实现令牌验证逻辑
      const userData = await fetchUserData();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      // 令牌无效，清除本地存储
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // 调用登录 API
      const response = await apiClient.post('/auth/login', { username, password });

      localStorage.setItem('access_token', response.accessToken);
      localStorage.setItem('refresh_token', response.refreshToken);

      setUser(response.user);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }

      const response = await apiClient.post('/auth/refresh', { refreshToken });
      localStorage.setItem('access_token', response.accessToken);
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 3. 后端技术规范

### 3.1 Rust 项目结构

```toml
# Cargo.toml
[package]
name = "vyos-web-backend"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = { version = "0.7", features = ["ws"] }
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "sqlite", "mysql", "chrono", "uuid"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
jsonwebtoken = "9.0"
bcrypt = "0.15"
anyhow = "1.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
config = "0.14"
dotenv = "0.15"
thiserror = "1.0"
chrono = { version = "0.4", features = ["serde"] }
validator = { version = "0.18", features = ["derive"] }
regex = "1.0"
futures = "0.3"
tower = { version = "0.4", features = ["cors", "trace"] }
tower-http = { version = "0.5", features = ["cors", "fs", "trace"] }
```

### 3.2 数据模型定义

```rust
// src/models/user.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(length(min = 3, max = 32))]
    pub username: String,

    #[validate(email)]
    pub email: String,

    #[validate(length(min = 8))]
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(length(min = 3, max = 32))]
    pub username: Option<String>,

    #[validate(email)]
    pub email: Option<String>,

    pub is_active: Option<bool>,
}
```

### 3.3 API Handler 结构

```rust
// src/handlers/auth.rs
use axum::{
    extract::{Extension, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::{
    models::{user::CreateUserRequest, auth::LoginRequest},
    services::auth_service::AuthService,
    error::AppError,
    AppState,
};

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserDto,
}

#[derive(Debug, Serialize)]
pub struct UserDto {
    pub id: Uuid,
    pub username: String,
    pub email: String,
}

pub async fn login_handler(
    State(state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let result = AuthService::login(&state.pool, &request.username, &request.password).await?;

    Ok(Json(LoginResponse {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user: UserDto {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
        },
    }))
}

pub async fn register_handler(
    State(state): State<AppState>,
    Json(request): Json<CreateUserRequest>,
) -> Result<Json<UserDto>, AppError> {
    // 验证请求数据
    request.validate().map_err(|e| AppError::Validation(e))?;

    let user = AuthService::register(&state.pool, request).await?;

    Ok(Json(UserDto {
        id: user.id,
        username: user.username,
        email: user.email,
    }))
}

pub async fn get_current_user(
    Extension(user): Extension<User>,
) -> Result<Json<UserDto>, AppError> {
    Ok(Json(UserDto {
        id: user.id,
        username: user.username,
        email: user.email,
    }))
}
```

### 3.4 服务层模式

```rust
// src/services/auth_service.rs
use argon2::{self, Config};
use rand::rngs::OsRng;
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::user::User;
use crate::error::AppError;

pub struct LoginResult {
    pub access_token: String,
    pub refresh_token: String,
    pub user: User,
}

pub struct AuthService;

impl AuthService {
    pub async fn login(
        pool: &PgPool,
        username: &str,
        password: &str,
    ) -> Result<LoginResult, AppError> {
        // 从数据库获取用户
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE username = $1 AND is_active = true"
        )
        .bind(username)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::Unauthorized("Invalid credentials".into()))?;

        // 验证密码
        Self::verify_password(&password, &user.password_hash)?;

        // 生成 JWT tokens
        let access_token = Self::generate_access_token(&user)?;
        let refresh_token = Self::generate_refresh_token(&user)?;

        Ok(LoginResult {
            access_token,
            refresh_token,
            user,
        })
    }

    pub async fn register(
        pool: &PgPool,
        request: CreateUserRequest,
    ) -> Result<User, AppError> {
        // 检查用户名是否已存在
        let exists = sqlx::query_scalar!(
            "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)",
            request.username
        )
        .fetch_one(pool)
        .await?
        .unwrap_or(false);

        if exists {
            return Err(AppError::BadRequest("Username already exists".into()));
        }

        // 生成密码哈希
        let password_hash = Self::hash_password(&request.password)?;

        // 插入新用户
        let user = sqlx::query_as::<_, User>(
            "INSERT INTO users (id, username, email, password_hash, is_active) VALUES ($1, $2, $3, $4, true) RETURNING *"
        )
        .bind(Uuid::new_v4())
        .bind(&request.username)
        .bind(&request.email)
        .bind(&password_hash)
        .fetch_one(pool)
        .await?;

        Ok(user)
    }

    fn hash_password(password: &str) -> Result<String, AppError> {
        let salt = SaltString::generate(&mut OsRng);
        let config = Config::default();
        let hash = argon2::hash_encoded(password.as_bytes(), &salt, &config)
            .map_err(|_| AppError::InternalServerError("Failed to hash password".into()))?;

        Ok(hash)
    }

    fn verify_password(password: &str, hash: &str) -> Result<(), AppError> {
        argon2::verify_encoded(hash, password.as_bytes())
            .map_err(|_| AppError::Unauthorized("Invalid credentials".into()))
    }

    fn generate_access_token(user: &User) -> Result<String, AppError> {
        // JWT token generation implementation
        todo!()
    }

    fn generate_refresh_token(user: &User) -> Result<String, AppError> {
        // Refresh token generation implementation
        todo!()
    }
}
```

## 4. 数据库设计

### 4.1 数据库表结构

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 角色表
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户角色关联表
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- 权限表
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 网络接口配置表
CREATE TABLE network_interfaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL,
    ipv4_address INET,
    subnet_mask CIDR,
    gateway INET,
    mac_address MACADDR,
    status VARCHAR(16) DEFAULT 'down',
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 防火墙规则表
CREATE TABLE firewall_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    sequence INTEGER NOT NULL,
    action VARCHAR(16) NOT NULL,
    protocol VARCHAR(16),
    source_network CIDR,
    destination_network CIDR,
    source_port INTEGER,
    destination_port INTEGER,
    interface VARCHAR(64),
    enabled BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统配置历史表
CREATE TABLE config_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    config_type VARCHAR(64) NOT NULL,
    config_data JSONB NOT NULL,
    action VARCHAR(32) NOT NULL,
    applied_successfully BOOLEAN,
    rollback_possible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 监控数据表
CREATE TABLE monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(64) NOT NULL,
    node_id VARCHAR(128) NOT NULL,
    metric_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 审计日志表
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 数据库迁移脚本示例

```sql
-- migration_001_initial_schema.sql
-- 创建初始数据库结构

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 创建用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(64) UNIQUE NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建审计触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户表添加更新时间触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 5. API 接口规范

### 5.1 认证相关接口

```
POST /api/v1/auth/login
Request:
{
  "username": "admin",
  "password": "securepassword"
}

Response (200):
{
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "uuid_here",
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

```
POST /api/v1/auth/register
Request:
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword"
}

Response (201):
{
  "id": "uuid_here",
  "username": "newuser",
  "email": "user@example.com"
}
```

```
GET /api/v1/auth/me
Headers: Authorization: Bearer {token}
Response (200):
{
  "id": "uuid_here",
  "username": "admin",
  "email": "admin@example.com",
  "roles": ["admin", "user"]
}
```

### 5.2 网络配置相关接口

```
GET /api/v1/network/interfaces
Headers: Authorization: Bearer {token}
Response (200):
[
  {
    "id": "uuid_here",
    "name": "eth0",
    "type": "ethernet",
    "ipv4_address": "192.168.1.1",
    "subnet_mask": "255.255.255.0",
    "status": "up",
    "enabled": true
  }
]
```

```
POST /api/v1/network/interfaces
Headers: Authorization: Bearer {token}
Request:
{
  "name": "eth1",
  "type": "ethernet",
  "ipv4_address": "10.0.0.1",
  "subnet_mask": "255.255.255.0"
}
Response (201):
{
  "id": "uuid_here",
  "name": "eth1",
  "type": "ethernet",
  "ipv4_address": "10.0.0.1",
  "subnet_mask": "255.255.255.0",
  "status": "down",
  "enabled": false
}
```

## 6. 部署配置

### 6.1 Docker Compose 配置

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://vyos:password@db:5432/vyos_web_ui
      - JWT_SECRET_KEY=your-super-secret-jwt-key
      - APP_ENV=production
    depends_on:
      - db
    networks:
      - vyos-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - vyos-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=vyos_web_ui
      - POSTGRES_USER=vyos
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - vyos-network

volumes:
  postgres_data:

networks:
  vyos-network:
    driver: bridge
```

### 6.2 构建脚本

```bash
#!/bin/bash
# scripts/build.sh

set -e

echo "Building VyOS Web UI..."

# 构建前端
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 构建后端
echo "Building backend..."
cd backend
cargo build --release
cd ..

echo "Build completed successfully!"
```

## 7. 测试规范

### 7.1 单元测试结构

```rust
// src/services/auth_service_test.rs
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;
    use std::sync::Arc;

    #[tokio::test]
    async fn test_login_success() {
        let pool = setup_test_db().await;
        let user = create_test_user(&pool).await;

        let result = AuthService::login(&pool, &user.username, "password123").await;

        assert!(result.is_ok());
        let login_result = result.unwrap();
        assert_eq!(login_result.user.id, user.id);
    }

    #[tokio::test]
    async fn test_login_invalid_credentials() {
        let pool = setup_test_db().await;

        let result = AuthService::login(&pool, "nonexistent", "wrongpass").await;

        assert!(result.is_err());
        match result.err().unwrap() {
            AppError::Unauthorized(_) => (),
            _ => panic!("Expected Unauthorized error"),
        }
    }

    async fn setup_test_db() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .unwrap();
        pool
    }

    async fn create_test_user(pool: &SqlitePool) -> User {
        // 创建测试用户
        todo!()
    }
}
```

```typescript
// frontend/src/services/__tests__/authService.test.ts
import { AuthService } from '../AuthService';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import axios from 'axios';

vi.mock('axios');

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login and store tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'user-id',
            username: 'testuser',
            email: 'test@example.com',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await AuthService.login('testuser', 'password');

      expect(result.success).toBe(true);
      expect(localStorage.getItem('access_token')).toBe('mock-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token');
    });

    it('should return error for invalid credentials', async () => {
      vi.mocked(axios.post).mockRejectedValue({
        response: { status: 401, data: { message: 'Invalid credentials' } },
      });

      const result = await AuthService.login('invalid', 'wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear tokens and redirect', () => {
      localStorage.setItem('access_token', 'some-token');
      localStorage.setItem('refresh_token', 'some-refresh-token');

      AuthService.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });
});
```

### 7.2 集成测试示例

```rust
// tests/integration/auth_api_test.rs
use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use serde_json::json;
use sqlx::PgPool;
use tower::ServiceExt;

#[sqlx::test]
async fn test_auth_login_endpoint(pool: PgPool) {
    let app_state = AppState::new(pool).await.unwrap();
    let app = create_app(app_state);

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/auth/login")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::to_vec(&json!({
                        "username": "admin",
                        "password": "password"
                    }))
                    .unwrap(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}
```

## 8. 安全规范

### 8.1 密码安全
- 使用 Argon2 或 bcrypt 进行密码哈希
- 最小密码长度 8 位，推荐 12 位以上
- 实现密码复杂度验证
- 支持密码轮换策略

### 8.2 API 安全
- 所有 API 端点都需要身份验证
- 实现速率限制防止暴力攻击
- 使用 HTTPS 加密传输
- 验证和清理所有输入数据

### 8.3 数据库安全
- 使用参数化查询防止 SQL 注入
- 最小权限原则配置数据库用户
- 定期备份和验证备份完整性
- 敏感数据加密存储

## 9. 性能优化

### 9.1 前端优化
- 实现组件懒加载
- 使用虚拟滚动处理大量数据
- 实现数据缓存机制
- 优化图片和其他静态资源

### 9.2 后端优化
- 使用数据库连接池
- 实现适当的缓存策略
- 优化数据库查询
- 异步处理耗时操作

### 9.3 监控和日志
- 实现应用性能监控
- 记录关键业务事件
- 实现错误跟踪系统
- 设置系统资源监控

## 10. 部署和运维

### 10.1 环境变量
```
APP_ENV=production/staging/development
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET_KEY=your-super-secret-key
SERVER_PORT=8080
LOG_LEVEL=info/debug/warn/error
```

### 10.2 健康检查端点
```
GET /health
Response (200):
{
  "status": "healthy",
  "timestamp": "2023-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

### 10.3 配置管理
- 使用外部配置文件
- 支持环境特定配置
- 配置热更新机制
- 配置验证和默认值

此技术规范文档为 VyOS Web UI 项目的开发提供了完整的技术指导，涵盖了从前端到后端、数据库设计、API 规范、安全措施、测试策略、部署运维等方面的内容。