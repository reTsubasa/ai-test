/**
 * Utility functions for authentication and authorization
 */

import AuthService from '../services/authService';

/**
 * Check if user has access to a specific route based on roles
 */
export const canAccessRoute = (requiredRoles: string[] | string): boolean => {
  if (!AuthService.isAuthenticated()) {
    return false;
  }

  // If no roles required, allow access
  if (!requiredRoles || (Array.isArray(requiredRoles) && requiredRoles.length === 0)) {
    return true;
  }

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return AuthService.hasRole(roles);
};

/**
 * Get user's role permissions
 */
export const getUserPermissions = (): string[] => {
  return AuthService.getUserRoles();
};

/**
 * Check if current user is admin
 */
export const isAdmin = (): boolean => {
  return AuthService.hasRole('admin');
};

/**
 * Check if current user has a specific role
 */
export const hasUserRole = (role: string): boolean => {
  return AuthService.hasRole(role);
};

/**
 * Format user roles for display
 */
export const formatUserRoles = (roles: string[]): string => {
  return roles.join(', ');
};

/**
 * Get user's full name
 */
export const getUserFullName = (): string | null => {
  const user = AuthService.getCurrentUser();
  if (!user) return null;

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  return user.username;
};

/**
 * Refresh authentication token if needed
 */
export const refreshAuthToken = async (): Promise<string | null> => {
  return AuthService.refreshAuthToken();
};