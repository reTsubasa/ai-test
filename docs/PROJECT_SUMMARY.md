# VyOS Web UI - Project Summary

## Table of Contents

- [Introduction](#introduction)
- [Features Overview](#features-overview)
- [Architecture Summary](#architecture-summary)
- [Technology Stack](#technology-stack)
- [Quick Start Guide](#quick-start-guide)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)

---

## Introduction

The VyOS Web UI is a modern, full-stack web application designed to provide a graphical interface for managing VyOS-based network devices. It enables network administrators to configure, monitor, and manage their network infrastructure through an intuitive web interface.

### Project Goals

- Provide a modern, responsive web interface for VyOS network device management
- Support both single-node and multi-node network scenarios
- Enable real-time monitoring and alerting
- Simplify network configuration through a user-friendly interface
- Provide comprehensive role-based access control (RBAC)

### Target Users

- Network Administrators
- System Operators
- DevOps Engineers
- IT Security Professionals

---

## Features Overview

### Core Features

#### 1. Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- User management with three default roles:
  - **Admin**: Full system access
  - **Operator**: Network configuration access
  - **Viewer**: Read-only access
- Session management
- Password security with bcrypt hashing

#### 2. Node Management

- Add, update, and delete network nodes
- Support for multiple node types:
  - Router
  - Switch
  - Firewall
  - Load Balancer
  - Other custom types
- Connection testing and validation
- Health monitoring per node
- Batch import/export functionality

#### 3. Network Configuration

- Interface configuration (Ethernet, VLAN, Bridge, Bond, Wireless)
- IP address management (IPv4/IPv6)
- Routing table management (static, dynamic routes)
- Firewall rule management
- Configuration history with rollback capabilities
- Diff visualization for configuration changes

#### 4. Real-time Monitoring

- System metrics dashboard
- CPU, Memory, Disk usage monitoring
- Network interface statistics
- Traffic data visualization with charts
- Activity logging
- Alert management with acknowledgment
- WebSocket-based real-time updates

#### 5. System Management

- Image management for VyOS updates
- System reboot and poweroff controls
- System logs viewer
- Configuration backup and restore

#### 6. User Interface

- Modern dark/light theme support
- Responsive design for all screen sizes
- Intuitive navigation with sidebar
- Interactive data tables with sorting and filtering
- Toast notifications for user feedback
- Modal dialogs for confirmations

---

## Architecture Summary

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Dashboard  │  │   Network    │  │  Monitoring  │         │
│  │   Page       │  │   Config     │  │   Page       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Rust/Actix-web)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    API Layer                            │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │   │
│  │  │  Auth  │ │  User  │ │Network │ │ Health │          │   │
│  │  │Handler │ │Handler │ │Handler │ │Handler │          │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Business Layer                        │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                       │   │
│  │  │  Auth  │ │  User  │ │Network │                       │   │
│  │  │Service │ │Service │ │Service │                       │   │
│  │  └────────┘ └────────┘ └────────┘                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  WebSocket Layer                        │   │
│  │  ┌──────────────────────────────────────────┐          │   │
│  │  │      Connection Manager                  │          │   │
│  │  │  - Real-time broadcasts                  │          │   │
│  │  │  - Channel subscriptions                 │          │   │
│  │  └──────────────────────────────────────────┘          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Database (SQLite/MySQL)                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │  Users │ │  Roles │ │  Nodes │ │  Config│ │Monitor │      │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Architecture

The backend is built with Rust using the Actix-web framework, organized into several layers:

- **Handlers**: HTTP endpoint handlers for API requests
- **Services**: Business logic layer
- **Models**: Data structures and domain entities
- **Middleware**: Authentication, logging, CORS handling
- **WebSocket**: Real-time bidirectional communication

### Frontend Architecture

The frontend is built with React using modern patterns:

- **State Management**: Zustand for global state
- **Routing**: React Router for navigation
- **API Client**: Axios with interceptors
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Real-time Updates**: Custom WebSocket hook

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Rust | 2021 Edition | Programming language |
| Actix-web | 4.4 | Web framework |
| SQLx | 0.7 | Database ORM |
| Tokio | 1.35 | Async runtime |
| JSONwebtoken | 9.2 | JWT authentication |
| Bcrypt | 0.15 | Password hashing |
| Actix-ws | 0.1 | WebSocket support |
| Tracing | 0.1 | Logging/Tracing |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.7.2 | Type safety |
| Vite | 6.0.5 | Build tool |
| React Router | 7.1.1 | Routing |
| Zustand | 5.0.2 | State management |
| TanStack Query | 5.60.0 | Data fetching |
| Radix UI | Latest | UI primitives |
| Tailwind CSS | 3.4.17 | Styling |
| Recharts | 2.15.0 | Data visualization |
| Axios | 1.7.9 | HTTP client |

### Database

- **SQLite**: Default for development and single-node deployments
- **MySQL**: Supported for production and multi-node scenarios

---

## Quick Start Guide

### Prerequisites

- **Rust**: 1.70 or later
- **Node.js**: 18 or later
- **npm**: 9 or later

### 1. Clone the Repository

```bash
git clone <repository-url>
cd new_ai
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies (Rust)
cargo build

# Set up environment
cp ../.env.example .env

# Run the backend server
cargo run
```

The backend will start on `http://127.0.0.1:8080`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp ../.env.example .env.local

# Run the development server
npm run dev
```

The frontend will start on `http://localhost:3000`

### 4. Default Login

After starting both services, log in with:

- **Username**: `admin`
- **Password**: `admin123`

**Important**: Change the default password immediately after first login!

---

## Project Structure

```
new_ai/
├── backend/
│   ├── migrations/
│   │   └── 001_initial_schema.sql    # Database schema
│   ├── src/
│   │   ├── config/
│   │   │   └── mod.rs                # Configuration management
│   │   ├── db/
│   │   │   └── mod.rs                # Database initialization
│   │   ├── error/
│   │   │   └── mod.rs                # Error handling
│   │   ├── handlers/
│   │   │   ├── auth.rs               # Authentication endpoints
│   │   │   ├── health.rs             # Health check endpoints
│   │   │   ├── network.rs            # Network configuration
│   │   │   └── user.rs               # User management
│   │   ├── middleware/
│   │   │   ├── auth.rs               # JWT authentication
│   │   │   └── mod.rs                # Middleware exports
│   │   ├── models/
│   │   │   ├── auth.rs               # Auth-related models
│   │   │   ├── network.rs            # Network-related models
│   │   │   └── user.rs               # User-related models
│   │   ├── services/
│   │   │   ├── auth.rs               # Auth business logic
│   │   │   ├── network.rs            # Network business logic
│   │   │   └── user.rs               # User business logic
│   │   ├── websocket/
│   │   │   └── mod.rs                # WebSocket handler
│   │   └── main.rs                   # Application entry point
│   └── Cargo.toml                    # Rust dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                # Admin components
│   │   │   ├── common/               # Shared components
│   │   │   ├── config/               # Config components
│   │   │   ├── dashboard/            # Dashboard components
│   │   │   ├── layout/               # Layout components
│   │   │   ├── nodes/                # Node components
│   │   │   ├── system/               # System components
│   │   │   └── ui/                   # UI primitives
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx      # Theme provider
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts       # WebSocket hook
│   │   ├── pages/
│   │   │   ├── admin/                # Admin pages
│   │   │   ├── auth/                 # Auth pages
│   │   │   ├── config/               # Config pages
│   │   │   ├── dashboard/            # Dashboard page
│   │   │   ├── monitoring/           # Monitoring page
│   │   │   ├── nodes/                # Node pages
│   │   │   └── system/               # System pages
│   │   ├── services/
│   │   │   ├── AuthService.ts        # Auth API
│   │   │   ├── ConfigService.ts      # Config API
│   │   │   ├── MonitoringService.ts  # Monitoring API
│   │   │   ├── NodeService.ts        # Node API
│   │   │   ├── SystemService.ts      # System API
│   │   │   └── UserManagementService.ts  # User API
│   │   ├── stores/
│   │   │   ├── authStore.ts          # Auth state
│   │   │   ├── configStore.ts        # Config state
│   │   │   ├── dashboardStore.ts     # Dashboard state
│   │   │   ├── nodeStore.ts          # Node state
│   │   │   ├── systemStore.ts        # System state
│   │   │   └── userManagementStore.ts # User state
│   │   ├── App.tsx                   # Main app component
│   │   └── main.tsx                  # Entry point
│   ├── package.json                  # Node dependencies
│   ├── tsconfig.json                 # TypeScript config
│   ├── vite.config.ts                # Vite config
│   └── tailwind.config.js            # Tailwind config
├── docs/
│   ├── PROJECT_SUMMARY.md            # This file
│   ├── api_documentation.md          # API reference
│   ├── development_guide.md          # Developer guide
│   ├── deployment_guide.md           # Deployment guide
│   ├── user_manual.md                # User manual
│   ├── database_schema.md            # Database documentation
│   └── project_plan.md               # Project planning
├── .env.example                      # Environment template
└── .gitignore                        # Git ignore rules
```

---

## Roadmap

### Current Version: 0.1.0

### Planned Features

- [ ] Enhanced VyOS API integration
- [ ] VPN configuration management
- [ ] Advanced firewall rule builder
- [ ] Backup/restore configurations
- [ ] Multi-node deployment orchestration
- [ ] Mobile-responsive optimization
- [ ] Internationalization (i18n)
- [ ] Custom dashboards
- [ ] Export reports (PDF, CSV)
- [ ] SSH terminal access
- [ ] Configuration templates
- [ ] Ansible playbook generation

---

## Support

For issues, questions, or contributions, please refer to the project repository.

---

**Version**: 0.1.0
**Last Updated**: February 2025