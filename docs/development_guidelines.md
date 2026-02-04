# Development Guidelines: VyOS Web UI

## Project Structure Overview

The project follows a modular architecture designed for maintainability and scalability:

```
vyos-webui/
├── src/
│   ├── components/          # Reusable UI components
│   ├── services/            # API and service implementations
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions and helpers
│   ├── types/               # TypeScript type definitions
│   ├── assets/              # Images, icons, styles
│   └── views/               # Page-level components
├── public/
│   └── index.html           # Main HTML template
├── tests/                   # Test files
├── docs/                    # Project documentation
├── config/                  # Configuration files
├── package.json             # Dependencies and scripts
└── README.md                # Project introduction
```

## Coding Standards

### JavaScript/TypeScript Guidelines

1. **Type Safety**: All code must be written in TypeScript with proper typing
2. **Naming Conventions**:
   - PascalCase for components and classes
   - camelCase for functions and variables
   - UPPER_SNAKE_CASE for constants
3. **Code Organization**:
   - Component files should be self-contained
   - Related functionality grouped together
   - Clear separation of concerns

### React Component Guidelines

1. **Component Structure**:
   - Use functional components with hooks
   - Implement proper component composition
   - Maintain pure components where possible
2. **State Management**:
   - Use React Context for global state
   - Redux Toolkit for complex application state
   - Local component state for UI-specific data
3. **Performance Optimization**:
   - Memoization of expensive calculations
   - Proper use of React.lazy and Suspense
   - Avoid unnecessary re-renders

### CSS/SCSS Guidelines

1. **Styling Approach**:
   - Use CSS Modules or styled-components for scoped styles
   - Follow BEM methodology for class naming
   - Maintain consistent design system
2. **Responsive Design**:
   - Mobile-first approach
   - Flexbox and Grid for layout
   - Media queries for breakpoints

## API Design Principles

### RESTful API Endpoints

All API endpoints follow standard REST conventions:

```
GET    /api/config              # Retrieve configuration
POST   /api/config              # Create new configuration
PUT    /api/config              # Update existing configuration
DELETE /api/config              # Delete configuration
GET    /api/status              # System status information
GET    /api/monitoring          # Monitoring data
POST   /api/auth/login          # User authentication
```

### Request/Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

#### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": []
  }
}
```

## Security Best Practices

### Authentication and Authorization

1. **Password Security**:
   - Passwords must be hashed with bcrypt
   - Minimum password length of 12 characters
   - Password complexity requirements
   - Account lockout after failed attempts

2. **Session Management**:
   - JWT tokens with short expiration times (15-30 minutes)
   - Secure, HttpOnly session cookies
   - Token refresh mechanism
   - Session timeout handling

### Input Validation

1. **Client-side validation**:
   - Form validation with clear error messages
   - Real-time feedback on user input
2. **Server-side validation**:
   - Comprehensive data validation
   - Sanitization of all inputs
   - Rate limiting for API endpoints

### Data Protection

1. **Transport Security**:
   - All communications over HTTPS
   - Certificate validation
   - Secure header configuration
2. **Data Storage**:
   - Sensitive data encryption at rest
   - Database connection security
   - Backup encryption

## Testing Strategy

### Unit Testing

1. **Component Tests**: Using Jest and React Testing Library
2. **Service Tests**: Mock API calls for service logic
3. **Utility Function Tests**: Pure function testing
4. **Test Coverage**: Target 80%+ code coverage

### Integration Testing

1. **API Integration**: Test full request/response cycles
2. **Database Interaction**: Test data persistence and retrieval
3. **External Service Calls**: Mock third-party integrations
4. **End-to-End Flows**: User journey testing

### Automated Testing Setup

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test path/to/test-file.test.ts
```

## Development Workflow

### Branching Strategy

1. **main**: Production-ready code
2. **develop**: Integration branch for features
3. **feature/***: Feature-specific branches
4. **hotfix/***: Emergency fixes

### Commit Message Guidelines

Format: `<type>(<scope>): <subject>`

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code formatting changes
- refactor: Code restructuring
- test: Test additions/updates
- chore: Maintenance tasks

Examples:
```
feat(auth): Add JWT authentication flow
fix(config): Resolve configuration parsing error
docs(readme): Update installation instructions
```

### Code Review Process

1. Pull requests must be reviewed by at least one team member
2. All tests must pass before merging
3. Code must follow established style guidelines
4. Security review for authentication and data handling changes

## Documentation Standards

### API Documentation

All APIs must include:
- Clear endpoint descriptions
- Request/response examples
- Parameter documentation
- Error code explanations

### Component Documentation

Each component should include:
- Usage examples
- Props documentation
- State management details
- Accessibility considerations

### Development Documentation

Maintain documentation for:
- Setup instructions
- Environment configuration
- Build process
- Deployment procedures

## Performance Guidelines

### Frontend Performance

1. **Bundle Size**: Keep bundle size under 500KB
2. **Loading States**: Implement proper loading indicators
3. **Lazy Loading**: Load components on demand
4. **Image Optimization**: Use appropriate image formats and sizes

### Backend Performance

1. **Response Times**: API responses < 1 second
2. **Database Queries**: Optimize for performance
3. **Caching Strategy**: Implement appropriate caching
4. **Resource Management**: Monitor memory and CPU usage

## Deployment Guidelines

### Environment Configuration

1. **Development**: Local environment with mock data
2. **Staging**: Production-like environment for testing
3. **Production**: Live environment with real data

### Environment Variables

Store configuration in environment variables:
- Database connection strings
- API keys and secrets
- Feature flags
- Debug settings

### Monitoring Setup

1. Application logging with Winston
2. Error tracking with Sentry or similar
3. Performance monitoring
4. Health check endpoints

## Version Control Strategy

### Git Hooks

- Pre-commit: Run linter and tests
- Pre-push: Validate all checks pass
- Post-commit: Update changelog

### Release Process

1. Tag releases with semantic versioning
2. Create release notes
3. Update documentation for new versions
4. Notify users of changes

## Accessibility Guidelines

### WCAG Compliance

The application must meet WCAG 2.1 AA standards:
- Proper semantic HTML structure
- Keyboard navigation support
- Sufficient color contrast
- Screen reader compatibility
- Alternative text for images

### User Experience Considerations

1. Consistent navigation patterns
2. Clear error messages and feedback
3. Responsive design for all devices
4. Intuitive workflow for common tasks