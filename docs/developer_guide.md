# VyOS Web UI Developer Guide

## Project Structure

```
src/
├── components/
│   ├── Auth/
│   ├── NetworkConfig/
│   ├── Monitoring/
│   └── Layout/
├── contexts/
├── hooks/
├── pages/
├── services/
│   ├── apiClient.ts
│   ├── authService.ts
│   └── networkConfigService.ts
├── types/
└── __tests__/
```

## Architecture Overview

The VyOS Web UI follows a modular architecture with the following core components:

### Authentication System

- `AuthService`: Handles user authentication, token management, and role-based access control
- `AuthContext`: Provides authentication state to React components via context API
- `ProtectedRoute`: Component that restricts access based on authentication status

### Network Configuration Management

- `NetworkConfigService`: Manages all network configuration operations including routing, firewall rules, interfaces, and system settings
- Component-based UI for each configuration type

### Monitoring Dashboard

- Real-time monitoring components
- Charting and visualization libraries
- System metrics collection

## API Client

The `apiClient` service provides a consistent way to communicate with the VyOS backend:

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export default apiClient;
```

## Testing Strategy

### Unit Tests

Unit tests are written using Jest and React Testing Library to ensure individual components and services function correctly:

- Services (`authService`, `networkConfigService`) - 100% coverage
- Components (`LoginForm`, `Dashboard`, etc.) - 80%+ coverage
- Context providers (`AuthContext`) - 100% coverage

### Integration Tests

Integration tests verify that components work together as expected:

- Authentication flow from login to protected routes
- Service interactions with API endpoints
- State management across components

## Testing Setup

### Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests with coverage
npm run test:ci

# Run specific test file
npm test src/__tests__/authService.test.tsx
```

### Test Coverage

The testing suite ensures:
- 100% code coverage for services
- 80%+ coverage for components
- Proper error handling in all scenarios
- Authentication state management verification

## Development Workflow

### Setting Up Local Environment

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Code Style and Linting

The project follows standard TypeScript and React best practices:

- ESLint for code quality
- Prettier for code formatting
- Strict TypeScript compilation

## Deployment

### Build Process

```bash
# Build for production
npm run build

# Serve production build
npm run serve
```

### Production Considerations

- Environment-specific configuration
- Security headers
- Performance optimization
- Error handling and logging

## Contributing

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Run all tests to ensure no regressions
5. Submit pull request with description

### Code Review Guidelines

- Ensure code follows existing patterns
- Verify comprehensive test coverage
- Check for security considerations
- Confirm proper error handling

## Troubleshooting

### Common Development Issues

**TypeScript Errors**
- Ensure all dependencies are installed
- Check TypeScript configuration
- Verify type definitions match actual API responses

**Test Failures**
- Verify mock implementations match real API behavior
- Check test environment setup
- Validate service method signatures

**Build Errors**
- Confirm all dependencies are correctly installed
- Check for syntax errors in source files
- Verify build configuration

## Versioning

The project follows semantic versioning principles:

- Major versions: Breaking changes
- Minor versions: New features, backward compatible
- Patch versions: Bug fixes and improvements

---

*This guide provides a comprehensive overview of the VyOS Web UI development environment and processes. For detailed implementation specifics, refer to the source code and inline documentation.*