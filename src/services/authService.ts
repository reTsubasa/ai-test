/**
 * Authentication Service for VyOS Web UI
 */
import apiClient from './apiClient';

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  /**
   * Authenticate user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));

      return { token, user };
    } catch (error) {
      throw new Error('Authentication failed. Please check your credentials.');
    }
  }

  /**
   * Logout user and clear session
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  /**
   * Get auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Check if user has required role(s)
   */
  hasRole(requiredRoles: string | string[]): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return currentUser.roles.some(role => roles.includes(role));
  }

  /**
   * Get user roles
   */
  getUserRoles(): string[] {
    const currentUser = this.getCurrentUser();
    return currentUser ? currentUser.roles : [];
  }

  /**
   * Refresh authentication token if needed
   */
  async refreshAuthToken(): Promise<string | null> {
    try {
      const response = await apiClient.post<{ token: string }>('/auth/refresh');
      const newToken = response.data.token;

      localStorage.setItem('authToken', newToken);
      return newToken;
    } catch (error) {
      // If refresh fails, logout user
      this.logout();
      return null;
    }
  }

  /**
   * Register a new user (admin only)
   */
  async registerUser(userData: Omit<User, 'id'>): Promise<User> {
    try {
      const response = await apiClient.post<User>('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to register user');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>('/auth/profile', userData);
      // Update cached user data
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      return response.data;
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  }
}

export default new AuthService();