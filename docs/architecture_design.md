# VyOS Web UI 系统架构设计文档

## 1. 系统概述

### 1.1 系统目标
VyOS Web UI 是一个现代化的网络管理界面，旨在为 VyOS 网络操作系统提供直观的 Web 管理体验。该系统允许网络管理员通过图形化界面进行配置、监控和管理 VyOS 路由器。

### 1.2 系统范围
- 提供对 VyOS 核心功能的 Web 访问
- 支持用户身份验证和授权
- 实现实时监控和告警
- 提供配置管理功能
- 支持多数据库后端

## 2. 架构概览

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browser       │────│  Frontend App    │────│   Backend API   │
│                 │    │  (React/TS)      │    │   (Rust/Axum)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                           │
                                           │
                                    ┌─────────────────┐
                                    │  Database       │
                                    │  (SQLite/MySQL) │
                                    └─────────────────┘
                                           │
                                    ┌─────────────────┐
                                    │   VyOS System   │
                                    │                 │
                                    └─────────────────┘
```

### 2.1 架构风格
系统采用前后端分离的微服务架构，前端独立部署，通过 RESTful API 与后端通信。

## 3. 组件设计

### 3.1 前端组件 (React/TypeScript)

#### 3.1.1 核心组件
- **AuthContext**: 用户认证和授权状态管理
- **ApiClient**: 与后端 API 通信的客户端
- **Layout Components**: 通用布局组件（Header, Sidebar, Footer）
- **Page Components**: 特定功能页面（Dashboard, Network Config, Monitoring）

#### 3.1.2 主要页面
- **Login Page**: 用户登录界面
- **Dashboard**: 系统概览和监控
- **Network Configuration**: 网络配置管理
- **User Management**: 用户和权限管理
- **Monitoring**: 系统和网络监控
- **System Settings**: 系统配置

### 3.2 后端组件 (Rust/Axum)

#### 3.2.1 核心服务
- **Authentication Service**: 用户认证和会话管理
- **Authorization Service**: 权限检查和访问控制
- **Network Config Service**: 网络配置管理
- **Monitoring Service**: 系统监控数据收集
- **Database Service**: 数据持久化抽象

#### 3.2.2 API 层
- **RESTful API**: 标准化的 HTTP 接口
- **WebSocket**: 实时数据传输（监控、通知）
- **Middleware**: 认证、日志、错误处理中间件

### 3.3 数据库层

#### 3.3.1 数据库抽象
使用 SQLx 提供统一的数据库访问接口，支持 SQLite 和 MySQL：

- **User Management Tables**: 存储用户信息和权限
- **Configuration History Tables**: 配置历史记录
- **Monitoring Data Tables**: 监控指标存储
- **Audit Logs Tables**: 审计日志

#### 3.3.2 数据模型
- **User**: 用户信息（ID, Username, Email, Roles, Password Hash）
- **UserRole**: 角色定义（ID, Name, Permissions）
- **ConfigHistory**: 配置历史（ID, UserID, ConfigData, Timestamp）
- **Metric**: 监控数据（ID, Type, Value, Timestamp）

### 3.4 集成层

#### 3.4.1 VyOS 系统接口
- **VyOS API Client**: 与底层 VyOS 系统通信
- **Command Executor**: 执行 VyOS 命令
- **Configuration Applier**: 应用网络配置

## 4. 数据流设计

### 4.1 用户认证流程
```
Browser → API → Auth Service → Database (Validate User)
  ↓
Return JWT Token
  ↓
Browser Stores Token
```

### 4.2 网络配置流程
```
Browser (Form Input) → API → Validation → VyOS API Client
  ↓
Apply Configuration → Response Back to Browser
```

### 4.3 监控数据流程
```
VyOS System → Data Collector → Processing → Database Storage
  ↓
Real-time Push → WebSocket → Browser Display
```

## 5. 安全设计

### 5.1 认证机制
- JWT (JSON Web Tokens) 用于无状态认证
- Bcrypt 加密用户密码
- HTTPS 强制加密传输

### 5.2 授权机制
- RBAC (Role-Based Access Control) 模型
- 细粒度权限控制
- API 端点级别权限检查

### 5.3 安全措施
- 输入验证和清理
- SQL 注入防护
- XSS 防护
- CSRF 防护
- 审计日志记录

## 6. 性能设计

### 6.1 前端性能
- 组件懒加载
- 代码分割
- 缓存策略
- 防抖和节流

### 6.2 后端性能
- 异步处理
- 数据库连接池
- 查询优化
- 缓存机制

### 6.3 监控和日志
- 性能指标收集
- 请求追踪
- 错误监控
- 系统资源监控

## 7. 部署架构

### 7.1 部署方式
- 前端: 静态文件部署到 CDN 或 Web 服务器
- 后端: 可执行文件部署到服务器
- 数据库: 根据配置部署到合适位置

### 7.2 环境配置
- 开发环境: 本地开发和测试
- 测试环境: 功能验证
- 生产环境: 正式运行

## 8. API 设计规范

### 8.1 RESTful API 约定
- GET /api/users - 获取用户列表
- POST /api/users - 创建新用户
- PUT /api/users/{id} - 更新用户
- DELETE /api/users/{id} - 删除用户
- GET /api/network/interfaces - 获取网络接口

### 8.2 错误处理
- 统一错误响应格式
- HTTP 状态码遵循标准
- 详细的错误消息和代码

### 8.3 认证头部
- Authorization: Bearer {JWT_TOKEN}

## 9. 技术选型理由

### 9.1 为什么选择 Rust 后端
- 内存安全
- 高性能
- 并发能力强
- 生态系统成熟

### 9.2 为什么选择 React 前端
- 组件化架构
- 丰富的生态系统
- 良好的开发者体验
- 社区支持强大

### 9.3 为什么选择 SQLite 作为默认数据库
- 无需单独安装
- 轻量级
- 嵌入式特性
- 适合小型部署

## 10. 扩展性和维护性考虑

### 10.1 模块化设计
- 清晰的职责分离
- 松耦合组件
- 易于替换和升级

### 10.2 可维护性
- 一致的编码规范
- 全面的测试覆盖
- 详尽的文档

### 10.3 可扩展性
- 插件架构支持
- API 版本管理
- 水平扩展能力