# VyOS Web UI 开发指南

## 概述

本指南为开发团队提供在 VyOS Web UI 项目中工作的详细指导，包括开发环境设置、代码规范、最佳实践和协作流程。

## 开发环境设置

### 前端开发环境

#### 系统要求
- Node.js 18+ (推荐使用 Node.js 20+)
- npm 8+ 或 yarn 1.22+
- Git 2.0+

#### 安装步骤
```bash
# 1. 克隆项目
git clone https://github.com/vyos/web-ui.git
cd vyos-web-ui

# 2. 进入前端目录
cd frontend

# 3. 安装依赖
npm install
# 或使用 yarn
yarn install

# 4. 启动开发服务器
npm run dev
# 或
yarn dev
```

#### 开发配置
创建 `.env.development` 文件：
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

### 后端开发环境

#### 系统要求
- Rust 1.75+
- Cargo (随 Rust 一起安装)
- SQLite 3.25+ 或 MySQL 8.0+

#### 安装步骤
```bash
# 1. 确保 Rust 已安装
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 2. 检查 Rust 版本
rustc --version

# 3. 进入后端目录
cd backend

# 4. 检查依赖
cargo check

# 5. 启动开发服务器
cargo run
```

#### 开发配置
创建 `.env` 文件：
```
DATABASE_URL=sqlite:data/vyos_dev.db
JWT_SECRET_KEY=dev_super_secret_key_that_should_be_long_enough
APP_ENV=development
SERVER_HOST=127.0.0.1
SERVER_PORT=8080
LOG_LEVEL=debug
VYOS_API_BASE_URL=http://localhost:8443/api
```

## 代码规范

### 前端代码规范

#### TypeScript 规范
- 使用 TypeScript 严格模式
- 所有变量、函数、接口必须有明确的类型注解
- 优先使用类型而不是接口（除非需要声明合并）
- 使用 PascalCase 命名接口和类型
- 使用 camelCase 命名变量和函数
- 使用 UPPER_SNAKE_CASE 命名常量

```typescript
// ✅ 正确
interface UserProfile {
  id: string;
  username: string;
  email: string;
  roles: UserRole[];
}

type UserRole = 'admin' | 'user' | 'guest';

const API_ENDPOINTS = {
  USERS: '/api/v1/users',
  AUTH: '/api/v1/auth',
} as const;
```

#### React 组件规范
- 每个文件只包含一个组件
- 使用函数组件和 Hooks
- 合理使用自定义 Hooks 分离逻辑
- 组件文件命名使用 PascalCase
- 使用有意义的 prop 名称

```typescript
// ✅ 正确
interface UserCardProps {
  user: UserProfile;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleEdit = useCallback(() => {
    setLoading(true);
    onEdit(user.id);
  }, [user.id, onEdit]);

  return (
    <div className="user-card">
      <h3>{user.username}</h3>
      <button onClick={handleEdit} disabled={loading}>
        {loading ? 'Loading...' : 'Edit'}
      </button>
    </div>
  );
};
```

#### 文件组织
```
src/
├── components/           # 可复用 UI 组件
│   ├── common/         # 通用组件 (Button, Input, Modal)
│   ├── forms/          # 表单组件 (LoginForm, UserForm)
│   └── layout/         # 布局组件 (Header, Sidebar, Footer)
├── pages/              # 页面组件
│   ├── Auth/           # 认证相关页面
│   ├── Dashboard/      # 仪表板页面
│   ├── Network/        # 网络配置页面
│   └── Monitoring/     # 监控页面
├── services/           # API 服务和业务逻辑
├── hooks/              # 自定义 React Hooks
├── contexts/           # React Context
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
└── assets/             # 静态资源
```

#### ESLint 和 Prettier 配置
```json
// .eslintrc.json
{
  "extends": [
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    "no-unused-vars": "error",
    "prefer-const": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### 后端代码规范

#### Rust 代码规范
- 遵循 Rust 官方代码风格指南
- 使用 `cargo fmt` 格式化代码
- 使用 `cargo clippy` 进行代码检查
- 优先使用 `Result` 和 `Option` 进行错误处理
- 使用有意义的变量和函数名

```rust
// ✅ 正确
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}
```

#### 项目结构
```
backend/
├── src/
│   ├── main.rs
│   ├── models/          # 数据模型 (structs, DTOs)
│   │   ├── user.rs
│   │   ├── network.rs
│   │   └── mod.rs
│   ├── handlers/        # API 处理器 (controllers)
│   │   ├── auth.rs
│   │   ├── user.rs
│   │   ├── network.rs
│   │   └── mod.rs
│   ├── services/        # 业务逻辑
│   │   ├── auth_service.rs
│   │   ├── user_service.rs
│   │   ├── network_service.rs
│   │   └── mod.rs
│   ├── middleware/      # 中间件
│   │   ├── auth.rs
│   │   ├── cors.rs
│   │   └── mod.rs
│   ├── error/           # 错误定义
│   ├── utils/           # 工具函数
│   └── lib.rs
├── migrations/          # 数据库迁移
├── tests/               # 集成测试
├── Cargo.toml
└── Cargo.lock
```

## API 设计规范

### RESTful API 约定
- 使用名词复数形式表示资源集合
- 使用 HTTP 方法表示操作类型
- 使用标准 HTTP 状态码
- 返回 JSON 格式的响应

```
GET    /api/v1/users          # 获取用户列表
POST   /api/v1/users          # 创建新用户
GET    /api/v1/users/{id}     # 获取特定用户
PUT    /api/v1/users/{id}     # 更新用户（完全替换）
PATCH  /api/v1/users/{id}     # 部分更新用户
DELETE /api/v1/users/{id}     # 删除用户
```

### 响应格式
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation error occurred",
    "details": [
      {
        "field": "email",
        "message": "Email must be a valid email address"
      }
    ]
  },
  "timestamp": "2023-12-01T10:00:00Z"
}
```

## 数据库设计规范

### SQLx 模式
- 使用 SQLx 的编译时查询验证
- 使用 UUID 作为主键
- 遵循数据库命名约定
- 使用适当的数据类型

```rust
// 示例：用户表查询
#[derive(sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// 使用编译时验证的查询
sqlx::query_as!(
    User,
    "SELECT id, username, email, password_hash, created_at, updated_at
     FROM users
     WHERE username = $1",
    username
)
.fetch_one(&pool)
.await?;
```

### 迁移文件命名
```
001_initial_schema.sql    # 初始模式
002_add_users_table.sql   # 添加用户表
003_update_user_fields.sql # 修改用户字段
```

## 测试策略

### 前端测试

#### 单元测试
使用 Vitest + React Testing Library：
```typescript
// __tests__/UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserCard from '../components/UserCard';

const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
};

describe('UserCard', () => {
  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<UserCard user={mockUser} onEdit={onEdit} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

#### 组件测试
- 使用 React Testing Library 进行用户行为测试
- 测试所有用户交互路径
- 验证错误处理逻辑
- 测试加载状态

### 后端测试

#### 单元测试
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePool;
    use tokio;

    #[tokio::test]
    async fn test_create_user_success() {
        let pool = setup_test_db().await;
        let service = UserService::new(pool);

        let request = CreateUserRequest {
            username: "testuser".to_string(),
            email: "test@example.com".to_string(),
            password: "password123".to_string(),
        };

        let result = service.create_user(request).await;

        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.username, "testuser");
    }
}
```

#### 集成测试
```rust
#[cfg(test)]
mod integration_tests {
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use tower::ServiceExt;

    #[sqlx::test]
    async fn test_get_user_endpoint(pool: SqlitePool) {
        let app = setup_test_app(pool).await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/api/v1/users/123")
                    .header("content-type", "application/json")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }
}
```

## Git 工作流

### 分支策略
- `main`: 生产代码
- `develop`: 开发代码
- `feature/*`: 功能分支
- `bugfix/*`: 修复分支
- `release/*`: 发布准备

### 提交信息规范
使用约定式提交格式：
```
feat: 添加用户认证功能
^--^  ^---------------^
|     |
|     +-> 简短的描述
|
+-------> 类型: feat, fix, docs, style, refactor, test, chore
```

常用类型：
- `feat`: 新功能
- `fix`: 修复错误
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构代码
- `test`: 添加测试
- `chore`: 构建过程或辅助工具变动

### Pull Request 规范
- 一个 PR 只解决一个问题
- 标题简洁明了，描述详细具体
- 包含相关的测试
- 通过所有 CI 检查
- 代码审查通过

## 质量保证

### 代码审查清单
- [ ] 代码符合项目规范
- [ ] 所有测试通过
- [ ] 适当的错误处理
- [ ] 无明显的性能问题
- [ ] 安全漏洞检查
- [ ] 文档更新

### 性能考虑
- 避免不必要的组件重渲染
- 使用适当的缓存策略
- 优化数据库查询
- 实现适当的分页

### 安全考虑
- 输入验证和清理
- SQL 注入防护
- XSS 防护
- 认证和授权
- 敏感信息处理

## 部署流程

### 开发部署
```bash
# 前端构建
cd frontend
npm run build

# 后端构建
cd backend
cargo build --release
```

### 生产部署
- 使用 Docker 容器化部署
- 环境变量配置
- 数据库迁移自动化
- 健康检查端点

## 调试技巧

### 前端调试
- 使用 React DevTools
- Chrome 开发者工具
- 日志记录
- TypeScript 错误理解

### 后端调试
- 使用 `tracing` crate 进行日志记录
- PostgreSQL/SQLite 的 EXPLAIN ANALYZE
- 使用 `cargo expand` 查看宏展开
- 使用 `println!` 进行简单调试

## 常见问题解决

### 依赖冲突
- 使用 `cargo update` 更新依赖
- 检查 `Cargo.lock` 文件
- 必要时使用 `[patch]` 进行依赖替换

### TypeScript 类型错误
- 检查类型定义文件
- 使用 `as` 进行类型断言（谨慎使用）
- 创建适当的类型定义

### 数据库迁移问题
- 检查迁移文件顺序
- 验证 SQL 语法
- 备份数据后再迁移

## 有用的命令

### 前端
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 构建生产版本
npm run build

# 运行 linter
npm run lint

# 格式化代码
npm run format
```

### 后端
```bash
# 检查代码
cargo check

# 运行测试
cargo test

# 构建项目
cargo build

# 运行项目
cargo run

# 运行 clippy
cargo clippy

# 格式化代码
cargo fmt
```

## 联系和支持

如有疑问，请联系：
- 项目负责人: [姓名] ([邮箱])
- 技术支持: [支持渠道]
- 代码仓库: [仓库链接]

## 附录

### 有用的资源
- [Rust 官方文档](https://doc.rust-lang.org/)
- [React 官方文档](https://react.dev/)
- [Axum 框架文档](https://docs.rs/axum/)
- [SQLx 文档](https://docs.rs/sqlx/)

### 工具推荐
- IDE: VS Code, IntelliJ IDEA
- 数据库工具: DBeaver, pgAdmin
- API 测试: Postman, Insomnia
- Git GUI: SourceTree, GitKraken