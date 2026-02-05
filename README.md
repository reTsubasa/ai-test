# VyOS Web UI 项目

现代、动态的 VyOS 网络管理 Web UI，前端使用 React 19 和 TypeScript，后端使用 Rust，支持 SQLite 和 MySQL 数据库。

## 项目概述

VyOS Web UI 项目旨在为VyOS网络操作系统提供一个现代化的Web管理界面。项目采用React 19 + TypeScript作为前端技术栈，Rust + Axum作为后端技术栈，支持SQLite和MySQL数据库。

## 技术栈

- **前端**: React 19, TypeScript, Tailwind CSS, Vite
- **后端**: Rust (Axum 框架), SQLx
- **数据库**: SQLite (默认), MySQL
- **构建工具**: Vite (前端), Cargo (后端)

## 项目状态

✅ **基础架构完成**: 前后端框架已搭建完毕
✅ **认证系统**: 用户认证和授权已实现
✅ **用户管理**: 用户增删改查功能已完成
✅ **网络配置**: 网络接口管理功能已实现
✅ **UI组件**: 基础页面和组件已完成
✅ **文档**: 完整的开发和部署文档

## 目录结构

```
vyos-web-ui/
├── backend/                    # Rust后端服务
│   ├── src/
│   │   ├── main.rs           # 主入口文件
│   │   ├── config/           # 配置管理
│   │   ├── models/           # 数据模型
│   │   ├── services/         # 业务逻辑
│   │   ├── handlers/         # API处理器
│   │   ├── middleware/       # 中间件
│   │   └── error/            # 错误处理
│   ├── migrations/           # 数据库迁移
│   └── Cargo.toml            # 依赖配置
├── frontend/                   # React前端应用
│   ├── src/
│   │   ├── components/       # UI组件
│   │   ├── pages/            # 页面组件
│   │   ├── services/         # API服务
│   │   ├── contexts/         # React Context
│   │   └── utils/            # 工具函数
│   ├── package.json          # 依赖配置
│   └── vite.config.ts        # 构建配置
├── docs/                      # 项目文档
└── scripts/                   # 脚本文件
```

## 快速开始

### 环境要求

- Node.js 18+ (前端)
- Rust 1.75+ (后端)
- SQLite 3.25+ (数据库)

### 安装和运行

1. **克隆项目**
   ```bash
   git clone https://github.com/your-org/vyos-web-ui.git
   cd vyos-web-ui
   ```

2. **设置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件以适应你的环境
   ```

3. **启动后端服务**
   ```bash
   cd backend
   cargo run
   ```

4. **启动前端服务**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 功能特性

- **用户认证与授权**: JWT-based 身份验证
- **网络接口管理**: 查看、创建、编辑和删除网络接口
- **用户管理**: 用户的完整 CRUD 操作
- **实时监控**: 系统和网络指标监控
- **响应式UI**: 适配桌面和移动设备

## API 端点

- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `GET /api/v1/users` - 获取用户列表
- `POST /api/v1/users` - 创建用户
- `GET /api/v1/network/interfaces` - 获取网络接口
- `POST /api/v1/network/interfaces` - 创建网络接口

## 文档

查看 `docs/` 目录获取详细的开发、部署和使用文档：

- [项目计划](docs/project_plan.md)
- [架构设计](docs/architecture_design.md)
- [技术规范](docs/technical_specification.md)
- [用户手册](docs/user_manual.md)
- [部署指南](docs/deployment_guide.md)
- [API文档](docs/api_documentation.md)
- [开发指南](docs/development_guide.md)
- [最佳实践](docs/best_practices.md)

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目。

## 许可证

MIT License