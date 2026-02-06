# VyOS Web UI Project Plan

## Project Overview

**项目名称：** VyOS Web UI
**目标：** 为VyOS开源路由器开发功能完备的Web管理界面
**仓库：** https://github.com/reTsubasa/ai-test

## 技术栈

- **后端：** Rust + Actix-web
- **数据库：** SQLite（默认） / MySQL
- **前端：** Vite + TypeScript + React 18 + shadcn/ui + Tailwind CSS
- **状态管理：** Zustand + React Query
- **实时通信：** WebSocket

## 项目阶段

### Phase 1: 单节点管理 (Single Node Management)

1. 系统架构设计
2. 数据库设计
3. 后端API开发
4. 前端UI开发

### Phase 2: 多节点管理 (Multi-Node Management)

1. 多节点管理功能
2. 节点聚合监控
3. 批量操作

## 任务列表

| ID | 任务 | 角色 | 状态 |
|----|------|------|------|
| 1 | Design overall system architecture | 架构师 | Pending |
| 2 | Design database schema | 架构师 | Pending |
| 3 | Setup Rust backend project foundation | 后端开发 | Pending |
| 4 | Implement authentication system | 后端开发 | Pending |
| 5 | Implement node management API | 后端开发 | Pending |
| 6 | Implement configuration management API | 后端开发 | Pending |
| 7 | Implement system operations API | 后端开发 | Pending |
| 8 | Implement monitoring and statistics API | 后端开发 | Pending |
| 9 | Setup modern frontend project | 前端开发 | Pending |
| 10 | Implement authentication UI | 前端开发 | Pending |
| 11 | Implement node management UI | 前端开发 | Pending |
| 12 | Implement dashboard UI | 前端开发 | Pending |
| 13 | Implement network configuration UI | 前端开发 | Pending |
| 14 | Implement system management UI | 前端开发 | Pending |
| 15 | Implement user management UI | 前端开发 | Pending |
| 16 | Write comprehensive project documentation | 架构师 | Pending |

## 测试环境

- **VyOS API Endpoint:** https://10.10.5.51/info
- **SSH:** 10.10.5.51, vyos/vyos

## VyOS API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /info | GET | 系统信息（无需认证） |
| /retrieve | POST | 获取配置 |
| /configure | POST | 配置设置 |
| /generate | POST | 生成配置 |
| /config-file | POST | 配置文件操作 |
| /show | POST | 显示操作模式数据 |
| /reset | POST | 重置配置 |
| /reboot | POST | 重启系统 |
| /poweroff | POST | 关闭系统 |
| /image | POST | 镜像管理 |

## 项目结构

```
vyos-webui/
├── backend/
│   ├── src/
│   │   ├── main.rs
│   │   ├── config/
│   │   ├── db/
│   │   ├── error/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── services/
│   │   └── websocket/
│   ├── migrations/
│   └── Cargo.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── hooks/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
└── docs/
```

## 执行策略

1. **架构设计优先：** 任务1-2优先执行
2. **后端并行开发：** 任务3-8可并行（依赖任务2完成）
3. **前端并行开发：** 任务9-15可并行（依赖任务3完成）
4. **文档持续更新：** 任务16贯穿整个项目