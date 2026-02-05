# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VyOS Web UI project - a React-based web interface for managing VyOS network operating systems. The application provides authentication, network configuration management, and monitoring capabilities.

## Architecture

The application follows a React/TypeScript frontend architecture with the following key components:

- **Frontend Framework**: React 19 with TypeScript
- **Router**: React Router DOM for navigation
- **State Management**: React Context API for authentication state
- **HTTP Client**: Axios with interceptors for API communication
- **Styling**: Tailwind CSS (via index.css)
- **Charts**: Chart.js for monitoring dashboards
- **Build Tool**: Vite

## Key Features

1. **Authentication System**:
   - JWT-based authentication via AuthService
   - Role-based access control
   - Protected routes implementation
   - Session management

2. **Network Configuration Management**:
   - Routing configuration
   - Firewall rules management
   - Interface configuration
   - System settings management
   - Configuration apply/revert functionality

3. **Monitoring Dashboard**:
   - System metrics (CPU, memory, disk, uptime)
   - Network traffic statistics
   - Alert management
   - Real-time monitoring charts

## Key Services

- `apiClient.ts`: Axios-based API client with auth interceptors
- `authService.ts`: Authentication and user management
- `networkConfigService.ts`: Network configuration operations
- `vyosMonitoringService.ts`: VyOS-specific monitoring functionality

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Auth/             # Authentication components
│   ├── Layout/           # Header and Sidebar components
│   ├── Dashboard/        # Dashboard component
│   ├── Monitoring/       # Monitoring components
│   └── NetworkConfig/    # Network configuration components
├── contexts/             # React Context providers
├── hooks/                # Custom React hooks
├── pages/                # Top-level route components
├── services/             # Business logic services
│   └── monitoring/       # Monitoring-specific services
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── App.tsx               # Main application component
└── index.tsx             # Entry point
```

## Development Commands

- `npm run dev` - Start development server (runs on port 3000)
- `npm run build` - Build production bundle to dist/
- `npm run test` - Run unit tests with Jest
- `npm run test:watch` - Run tests in watch mode (if configured)
- `npm run lint` - Lint code with ESLint (if configured)

## Testing

- Unit tests use Jest with React Testing Library
- Located in `src/__tests__/` directory
- Services and components have dedicated test files
- Mocks axios client for API testing

## Environment Variables

- `VYOS_API_BASE_URL` - Base URL for VyOS API (defaults to https://localhost:8443/api)

## Important Patterns

- Authentication state is managed through AuthContext
- API requests automatically include authentication tokens via axios interceptors
- Network configuration changes follow CRUD operations with appropriate error handling
- Components use hooks for state management and service integration
- Type safety is enforced with TypeScript interfaces