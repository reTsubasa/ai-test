# VyOS Web UI - Development Guide

## Table of Contents

- [Overview](#overview)
- [Development Environment Setup](#development-environment-setup)
- [Backend Development](#backend-development)
- [Frontend Development](#frontend-development)
- [Code Conventions](#code-conventions)
- [Git Workflow](#git-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Debugging](#debugging)
- [Contributing Guidelines](#contributing-guidelines)

---

## Overview

This guide provides comprehensive information for developers working on the VyOS Web UI project. It covers environment setup, development practices, testing, and contribution guidelines.

---

## Development Environment Setup

### Prerequisites

Ensure you have the following installed:

- **Rust**: 1.70 or later
- **Node.js**: 18 or later
- **npm**: 9 or later
- **Git**: Latest stable version
- **SQLite** (for development)

### IDE Recommendations

- **Backend**: VS Code with rust-analyzer extension, or CLion with Rust plugin
- **Frontend**: VS Code with ESLint, Prettier, and TypeScript extensions

### Cloning the Repository

```bash
git clone <repository-url>
cd new_ai
```

### Environment Configuration

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Edit `.env` with your local settings:

```env
# Server Configuration
SERVER_HOST=127.0.0.1
SERVER_PORT=8080
APP_ENV=development

# Database Configuration
DATABASE_URL=sqlite:data/database.db

# Authentication
JWT_SECRET_KEY=your-dev-secret-key
JWT_EXPIRATION_MINUTES=60

# Logging
LOG_LEVEL=debug

# VyOS API Configuration (optional)
VYOS_API_URL=https://your-vyos-node:8443
VYOS_API_USERNAME=vyos
VYOS_API_PASSWORD=your-password
```

---

## Backend Development

### Project Structure

The backend follows a modular architecture:

```
backend/src/
├── config/          # Configuration management
├── db/              # Database initialization
├── error/           # Error types and handling
├── handlers/        # HTTP request handlers
├── middleware/      # Request/response middleware
├── models/          # Data models and DTOs
├── services/        # Business logic
├── websocket/       # WebSocket handlers
└── main.rs          # Application entry point
```

### Building

```bash
cd backend

# Debug build
cargo build

# Release build
cargo build --release
```

### Running the Development Server

```bash
cd backend
cargo run
```

The server will start on `http://127.0.0.1:8080`

### Cargo Commands

```bash
# Check code without building
cargo check

# Run tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Check for unused dependencies
cargo +nightly udeps

# Update dependencies
cargo update

# Format code
cargo fmt

# Run linter
cargo clippy

# Generate documentation
cargo doc --open
```

### Adding Dependencies

Edit `backend/Cargo.toml`:

```toml
[dependencies]
# Add new dependencies here
```

Then run:

```bash
cargo build
```

### Backend Code Conventions

#### Naming

- Use `snake_case` for variables, functions, and modules
- Use `PascalCase` for types and structs
- Use `SCREAMING_SNAKE_CASE` for constants

```rust
// Good
fn get_user_by_id(user_id: Uuid) -> Result<User> {
    // ...
}

const MAX_CONNECTIONS: usize = 100;

struct UserProfile {
    user_id: Uuid,
    username: String,
}

// Bad
fn GetUserByID(userID: Uuid) -> Result<User> { ... }
const max_connections: usize = 100;
struct user_profile { ... }
```

#### Error Handling

Use the `AppResult<T>` type alias for results:

```rust
use crate::error::AppResult;

pub async fn get_user(user_id: Uuid) -> AppResult<User> {
    // ...
}
```

#### Database Operations

Use SQLx with parameterized queries:

```rust
use sqlx::query_as;

pub async fn get_user(pool: &Pool, id: Uuid) -> AppResult<User> {
    let user = query_as!(
        User,
        "SELECT id, username, email FROM users WHERE id = ?",
        id
    )
    .fetch_one(pool)
    .await?;

    Ok(user)
}
```

#### Handler Pattern

Handlers should be thin and delegate to services:

```rust
// handlers/user.rs
use actix_web::{web, HttpResponse};
use crate::services::UserService;

pub async fn get_user(
    path: web::Path<Uuid>,
    service: web::Data<UserService>,
) -> AppResult<HttpResponse> {
    let user = service.get_user(path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(user))
}
```

#### Service Layer

Services contain business logic:

```rust
// services/user.rs
use crate::error::AppResult;
use crate::models::User;
use crate::db::Pool;

pub struct UserService {
    pool: Pool,
}

impl UserService {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }

    pub async fn get_user(&self, id: Uuid) -> AppResult<User> {
        // Business logic here
    }
}
```

---

## Frontend Development

### Project Structure

The frontend follows a component-based architecture:

```
frontend/src/
├── components/
│   ├── admin/           # Admin-specific components
│   ├── auth/            # Authentication components
│   ├── common/          # Shared components
│   ├── config/          # Configuration components
│   ├── dashboard/       # Dashboard components
│   ├── layout/          # Layout components
│   ├── nodes/           # Node management components
│   ├── system/          # System components
│   └── ui/              # UI primitives (Radix UI)
├── contexts/            # React contexts
├── hooks/               # Custom React hooks
├── pages/               # Page components
├── services/            # API services
├── stores/              # Zustand state stores
├── utils/               # Utility functions
├── App.tsx              # Root component
└── main.tsx             # Entry point
```

### Installing Dependencies

```bash
cd frontend
npm install
```

### Running the Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### NPM Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Adding Dependencies

```bash
# Runtime dependencies
npm install package-name

# Development dependencies
npm install -D package-name

# TypeScript types
npm install -D @types/package-name
```

### Frontend Code Conventions

#### Component Structure

```tsx
// Good: Functional component with TypeScript
import { useState } from 'react';

interface ComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: React.FC<ComponentProps> = ({
  title,
  onAction
}) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="component">
      <h1>{title}</h1>
      <button onClick={() => setIsActive(!isActive)}>
        {isActive ? 'Active' : 'Inactive'}
      </button>
      <button onClick={onAction}>Action</button>
    </div>
  );
};
```

#### State Management

Use Zustand for global state:

```tsx
// stores/exampleStore.ts
import { create } from 'zustand';

interface ExampleState {
  items: string[];
  addItem: (item: string) => void;
  removeItem: (index: number) => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),
}));
```

#### API Services

Use Axios with interceptors:

```tsx
// services/ExampleService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const exampleService = {
  async getData() {
    const response = await apiClient.get('/endpoint');
    return response.data;
  },
};
```

#### Custom Hooks

```tsx
// hooks/useExample.ts
import { useEffect, useState } from 'react';

export function useExample(param: string) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchData(param);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [param]);

  return { data, isLoading, error };
}
```

#### TypeScript Best Practices

```tsx
// Define interfaces for API responses
interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Define union types for known values
type Status = 'online' | 'offline' | 'degraded';

// Use proper typing for props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}
```

---

## Code Conventions

### General Principles

- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **SOLID**: Follow SOLID principles
- **Testability**: Write testable code

### Rust-Specific Guidelines

- Use `cargo fmt` for consistent formatting
- Run `cargo clippy` before committing
- Document public APIs with `///` comments
- Prefer idiomatic Rust patterns

### TypeScript/React-Specific Guidelines

- Use strict TypeScript mode
- Define interfaces for all props
- Use functional components and hooks
- Avoid `any` type - use `unknown` if necessary
- Use Tailwind CSS for styling
- Follow the React hooks rules

### File Naming

- **Rust**: `snake_case.rs`
- **TypeScript**: `PascalCase.ts` for components, `camelCase.ts` for utilities
- **CSS**: `kebab-case.css`

---

## Git Workflow

### Branch Strategy

- `master`: Main production branch
- `develop`: Development integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### Commit Message Format

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(auth): add JWT token refresh

Implement automatic token refresh when the access token expires.
Users will stay logged in without needing to re-authenticate.

Closes #123
```

```
fix(api): resolve CORS issue in production

Update CORS configuration to properly handle production domain.
This fixes login failures in staging environment.

Fixes #456
```

### Development Workflow

1. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:

```bash
git add .
git commit -m "feat(your-scope): your commit message"
```

3. Push to remote:

```bash
git push origin feature/your-feature-name
```

4. Create a pull request to `develop` or `master`

### Pull Request Guidelines

- Title should follow commit message format
- Include description of changes
- Reference related issues
- Ensure all tests pass
- Update documentation if needed

---

## Testing Guidelines

### Backend Testing

#### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_example() {
        let result = calculate(2, 2);
        assert_eq!(result, 4);
    }

    #[test]
    fn test_error_case() {
        let result = calculate(-1, 2);
        assert!(result.is_err());
    }
}
```

#### Integration Tests

```rust
#[actix_web::test]
async fn test_api_endpoint() {
    let app = test::init_service(|| App::new().service(handler)).await;

    let req = test::TestRequest::get()
        .uri("/api/endpoint")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), http::StatusCode::OK);
}
```

#### Running Tests

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_name

# Run tests with output
cargo test -- --nocapture

# Run tests in release mode
cargo test --release
```

### Frontend Testing

#### Unit Tests with Vitest

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExample } from './useExample';

describe('useExample', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useExample());
    expect(result.current.isLoading).toBe(true);
  });
});
```

#### Component Tests

```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render title', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## Debugging

### Backend Debugging

#### Logging

Use the `tracing` crate:

```rust
use tracing::{info, warn, error};

pub async fn handler() -> AppResult<HttpResponse> {
    info!("Processing request");
    // ...
    warn!("Unexpected value: {}", value);
    // ...
    error!("Operation failed: {:?}", error);
}
```

#### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "lldb",
      "request": "launch",
      "name": "Debug executable 'vyos-web-ui-backend'",
      "cargo": {
        "args": ["build", "--package=vyos-web-ui-backend"],
        "filter": {
          "name": "vyos-web-ui-backend",
          "kind": "bin"
        }
      },
      "args": [],
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

### Frontend Debugging

#### React DevTools

Install React DevTools browser extension for component inspection.

#### Browser Console

Use console logging:

```tsx
console.log('Data:', data);
console.warn('Warning message');
console.error('Error:', error);
```

#### Network Tab

Use browser DevTools Network tab to inspect API requests and responses.

---

## Contributing Guidelines

### Before Contributing

1. Read this development guide
2. Check existing issues and pull requests
3. Create an issue for major changes before implementing

### Code Review Process

1. All changes require pull request
2. At least one approval required
3. All tests must pass
4. Code must follow conventions

### Documentation

- Update API documentation for new endpoints
- Update component documentation for new features
- Add comments for complex logic
- Keep README files current

### Issue Reporting

When reporting issues, include:

- Description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment information
- Screenshots/logs if applicable

---

**Version**: 0.1.0
**Last Updated**: February 2025