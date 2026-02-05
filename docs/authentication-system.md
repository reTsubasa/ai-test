# VyOS Web UI Authentication System

This document describes the complete authentication system implemented for the VyOS Web UI, including login, logout, session management, and role-based access control.

## Overview

The authentication system provides secure access to the VyOS Web UI with the following features:
- User login and registration
- Session management with automatic timeout
- Role-based access control (RBAC)
- Protected routes
- Secure token handling

## Components

### 1. Authentication Service (`AuthService`)

Located in `src/services/authService.ts`, this service handles all authentication logic including:

- User login with username/password
- Token storage and retrieval
- User session management
- Role-based access control
- Token refresh mechanism
- User registration and profile management

### 2. Authentication Context (`AuthContext`)

Located in `src/contexts/AuthContext.tsx`, this React context provides:

- Global authentication state
- Access to current user data
- Authentication helper methods
- Role checking functionality

### 3. Login Component (`LoginForm`)

Located in `src/components/Auth/LoginForm.tsx`, this component provides:

- Username/password login form
- Error handling and validation
- Loading states
- Switch to registration view

### 4. Registration Component (`RegisterForm`)

Located in `src/components/Auth/RegisterForm.tsx`, this component provides:

- User registration form
- Password confirmation
- Role assignment (default user role)
- Error handling

### 5. Session Manager (`SessionManager`)

Located in `src/components/Auth/SessionManager.tsx`, this component provides:

- Automatic session timeout after 30 minutes of inactivity
- Activity detection for mouse movement, keypresses, clicks, and scrolling
- Automatic logout when timeout occurs

### 6. Protected Routes (`ProtectedRoute`)

Located in `src/components/ProtectedRoute.tsx`, this component ensures:

- Only authenticated users can access protected routes
- Role-based route protection
- Redirects to login or unauthorized pages as needed

## Implementation Details

### Authentication Flow

1. User navigates to `/login`
2. User enters credentials and submits form
3. AuthService calls API to authenticate user
4. If successful, token and user data are stored in localStorage
5. User is redirected to dashboard
6. All subsequent requests include the authentication token
7. Session automatically expires after 30 minutes of inactivity

### Role-Based Access Control (RBAC)

The system supports RBAC through:
- Users have one or more roles (e.g., 'user', 'admin', 'monitoring')
- Navigation items are filtered based on user roles
- Protected routes can specify required roles
- Admin-only features are only accessible to users with 'admin' role

### Session Management

- Tokens are stored in localStorage for persistence across sessions
- Automatic timeout after 30 minutes of inactivity
- Activity detection via mouse movement, keypresses, clicks, and scrolling
- Automatic logout when session expires
- Token refresh mechanism for long-lived sessions

## Usage Examples

### Checking Authentication Status

```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Render protected content
};
```

### Role Checking

```typescript
import { useAuth } from '../contexts/AuthContext';

const AdminOnlyComponent = () => {
  const { hasRole } = useAuth();

  if (!hasRole('admin')) {
    return <Redirect to="/unauthorized" />;
  }

  // Render admin-only content
};
```

### Protected Routes

```typescript
// In App.tsx or routing configuration
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

## Security Considerations

- Tokens are stored in localStorage, which is suitable for this implementation but could be improved with HttpOnly cookies in a production environment
- Passwords are never stored locally or exposed in logs
- Session timeouts help prevent unauthorized access from inactive sessions
- Role-based access control ensures users only see features appropriate to their permissions
- All API calls include authentication headers

## Future Enhancements

1. Implement secure token storage using HttpOnly cookies instead of localStorage
2. Add two-factor authentication support
3. Implement password reset functionality
4. Add OAuth integration (Google, GitHub, etc.)
5. Improve session management with server-side session validation
6. Add audit logging for authentication events
7. Implement account lockout after failed login attempts

This implementation provides a solid foundation for secure access control in the VyOS Web UI.