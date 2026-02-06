import axios, { AxiosError } from 'axios';
import type { User, UserRole, Role, Permission, TwoFactorSetup } from '../stores/userManagementStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Axios instance for API calls
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const auth = JSON.parse(token);
        if (auth?.state?.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${auth.state.tokens.accessToken}`;
        }
      } catch {
        // Ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem('auth-storage');
        if (token) {
          const auth = JSON.parse(token);
          const refreshToken = auth?.state?.tokens?.refreshToken;

          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken, expiresIn } = response.data;
            const newExpiresAt = Date.now() + expiresIn * 1000;

            // Update stored tokens
            const newAuth = {
              ...auth,
              state: {
                ...auth.state,
                tokens: {
                  ...auth.state.tokens,
                  accessToken,
                  expiresAt: newExpiresAt,
                },
              },
            };
            localStorage.setItem('auth-storage', JSON.stringify(newAuth));

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        // If refresh fails, proceed with error
      }
    }

    return Promise.reject(error);
  },
);

// API Request/Response Types
export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
  isLocked?: boolean;
}

export interface RoleCreateRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface RoleUpdateRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateUserRoleRequest {
  roleId: string;
}

export interface UpdatePermissionsRequest {
  permissions: string[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
  field?: string;
}

export interface TwoFactorVerifyRequest {
  code: string;
}

export interface TwoFactorSetupResponse extends TwoFactorSetup {
  message: string;
}

export interface TwoFactorVerifyResponse {
  verified: boolean;
  backupCode?: string;
  message: string;
}

class UserManagementService {
  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<ApiListResponse<User>>('/users');
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch users');
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch user ${id}`);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(data: UserCreateRequest): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<User>>('/users', data);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'Failed to create user');
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(id: string, data: UserUpdateRequest): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to update user ${id}`);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error) {
      this.handleError(error, `Failed to delete user ${id}`);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(id: string, data: UpdateUserRoleRequest): Promise<User> {
    try {
      const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}/role`, data);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to update role for user ${id}`);
      throw error;
    }
  }

  /**
   * Lock user account
   */
  async lockUser(id: string): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<User>>(`/users/${id}/lock`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to lock user ${id}`);
      throw error;
    }
  }

  /**
   * Unlock user account
   */
  async unlockUser(id: string): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<User>>(`/users/${id}/unlock`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to unlock user ${id}`);
      throw error;
    }
  }

  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get<ApiListResponse<Role>>('/roles');
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch roles');
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role> {
    try {
      const response = await apiClient.get<ApiResponse<Role>>(`/roles/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch role ${id}`);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(data: RoleCreateRequest): Promise<Role> {
    try {
      const response = await apiClient.post<ApiResponse<Role>>('/roles', data);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'Failed to create role');
      throw error;
    }
  }

  /**
   * Update an existing role
   */
  async updateRole(id: string, data: RoleUpdateRequest): Promise<Role> {
    try {
      const response = await apiClient.put<ApiResponse<Role>>(`/roles/${id}`, data);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to update role ${id}`);
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<void> {
    try {
      await apiClient.delete(`/roles/${id}`);
    } catch (error) {
      this.handleError(error, `Failed to delete role ${id}`);
      throw error;
    }
  }

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<Permission[]> {
    try {
      const response = await apiClient.get<ApiListResponse<Permission>>('/permissions');
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch permissions');
      throw error;
    }
  }

  /**
   * Get permissions by category
   */
  async getPermissionsByCategory(category: Permission['category']): Promise<Permission[]> {
    try {
      const response = await apiClient.get<ApiListResponse<Permission>>(`/permissions?category=${category}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch permissions for category ${category}`);
      throw error;
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(id: string, data: UpdatePermissionsRequest): Promise<Role> {
    try {
      const response = await apiClient.put<ApiResponse<Role>>(`/roles/${id}/permissions`, data);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to update permissions for role ${id}`);
      throw error;
    }
  }

  /**
   * Setup two-factor authentication for current user
   */
  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    try {
      const response = await apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup');
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to setup two-factor authentication');
      throw error;
    }
  }

  /**
   * Verify two-factor authentication code
   */
  async verifyTwoFactor(data: TwoFactorVerifyRequest): Promise<TwoFactorVerifyResponse> {
    try {
      const response = await apiClient.post<TwoFactorVerifyResponse>('/auth/2fa/verify', data);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to verify two-factor authentication code');
      throw error;
    }
  }

  /**
   * Disable two-factor authentication for current user
   */
  async disableTwoFactor(): Promise<void> {
    try {
      await apiClient.post('/auth/2fa/disable');
    } catch (error) {
      this.handleError(error, 'Failed to disable two-factor authentication');
      throw error;
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(): Promise<string[]> {
    try {
      const response = await apiClient.post<{ data: { backupCodes: string[] } }>('/auth/2fa/backup-codes');
      return response.data.data.backupCodes;
    } catch (error) {
      this.handleError(error, 'Failed to regenerate backup codes');
      throw error;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      const errorMessage = axiosError.response?.data?.message || defaultMessage;
      throw new Error(errorMessage);
    }
    throw new Error(defaultMessage);
  }

  /**
   * Set auth token for API calls
   */
  setAuthToken(token: string | null): void {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();
export default userManagementService;