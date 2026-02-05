import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'user' | 'readonly' | ('admin' | 'user' | 'readonly')[];
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * ProtectedRoute - Route guard component for authenticated users
 *
 * Features:
 * - Checks authentication status
 * - Optionally checks user role/permissions
 * - Shows loading state while initializing
 * - Redirects to login page if not authenticated
 * - Redirects to unauthorized page if lacking required role
 *
 * @example
 * ```tsx
 * // Basic usage - requires authentication only
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 *
 * // With role requirement
 * <ProtectedRoute requireRole="admin">
 *   <AdminSettings />
 * </ProtectedRoute>
 *
 * // With multiple allowed roles
 * <ProtectedRoute requireRole={['admin', 'user']}>
 *   <NetworkConfig />
 * </ProtectedRoute>
 *
 * // With custom loading component
 * <ProtectedRoute loadingComponent={<CustomSpinner />}>
 *   <SomePage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requireRole,
  redirectTo = '/login',
  loadingComponent,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isInitialized, isLoading, user } = useAuthStore();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Store the intended destination for post-login redirect
  useEffect(() => {
    if (!isAuthenticated && isInitialized) {
      setShouldRedirect(true);
    }
  }, [isAuthenticated, isInitialized]);

  // Show loading state while auth is initializing
  if (!isInitialized || isLoading) {
    return (
      loadingComponent || (
        <div className="flex h-screen w-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Redirect to login if not authenticated
  if (shouldRedirect || !isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // Check role requirements
  if (requireRole && user) {
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    const hasRequiredRole = allowedRoles.includes(user.role);

    if (!hasRequiredRole) {
      return (
        <Navigate
          to="/unauthorized"
          state={{ from: location, requiredRole: requireRole }}
          replace
        />
      );
    }
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
}

/**
 * AuthGuard - Component-level guard for checking auth status
 *
 * Use this when you want to conditionally render a component
 * based on authentication or role, rather than redirecting.
 *
 * @example
 * ```tsx
 * <AuthGuard requireRole="admin">
 *   {(isAuthorized) => (
 *     <Button disabled={!isAuthorized}>
 *       {isAuthorized ? 'Admin Action' : 'Access Denied'}
 *     </Button>
 *   )}
 * </AuthGuard>
 * ```
 */
interface AuthGuardProps {
  children: (isAuthorized: boolean) => React.ReactNode;
  requireRole?: 'admin' | 'user' | 'readonly' | ('admin' | 'user' | 'readonly')[];
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requireRole,
  fallback = null,
}: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore();

  // Check auth status
  if (!isAuthenticated) {
    return <>{fallback || children(false)}</>;
  }

  // Check role requirements
  if (requireRole && user) {
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    const isAuthorized = allowedRoles.includes(user.role);
    return <>{isAuthorized ? children(true) : fallback || children(false)}</>;
  }

  // No role requirements, just check auth
  return <>{children(true)}</>;
}

/**
 * useAuthGuard - Hook for checking auth status in components
 *
 * @example
 * ```tsx
 * const { isAuthenticated, isAuthorized, user } = useAuthGuard('admin');
 *
 * if (!isAuthenticated) return <LoginPage />;
 * if (!isAuthorized) return <UnauthorizedPage />;
 * ```
 */
export function useAuthGuard(requireRole?: 'admin' | 'user' | 'readonly' | ('admin' | 'user' | 'readonly')[]) {
  const { isAuthenticated, user } = useAuthStore();

  let isAuthorized = isAuthenticated;

  if (requireRole && user) {
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    isAuthorized = isAuthenticated && allowedRoles.includes(user.role);
  }

  return {
    isAuthenticated,
    isAuthorized,
    user,
  };
}