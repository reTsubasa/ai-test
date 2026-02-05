import axios, { type AxiosError } from 'axios';
import type { User, AuthTokens } from '../stores/authStore';

// API base URL - should be configured based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance for auth service
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// API Error types
export interface ApiError {
  message: string;
  statusCode?: number;
  field?: string;
}

class AuthService {
  private api: typeof authApi;

  constructor() {
    this.api = authApi;
  }

  /**
   * Login with username and password
   */
  async login(credentials: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await this.api.post<LoginResponse>('/auth/login', credentials);
      const { user, accessToken, refreshToken, expiresIn } = response.data;

      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + expiresIn * 1000,
      };

      return { user, tokens };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await this.api.post<RegisterResponse>('/auth/register', data);
      const { user, accessToken, refreshToken, expiresIn } = response.data;

      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + expiresIn * 1000,
      };

      return { user, tokens };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      // Log the error but don't throw since we want to clear local state anyway
      console.error('Logout error:', error);
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await this.api.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

      return {
        accessToken,
        refreshToken: newRefreshToken || refreshToken,
        expiresAt: Date.now() + expiresIn * 1000,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get the current user's profile
   */
  async getProfile(): Promise<User> {
    try {
      const response = await this.api.get<User>('/auth/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await this.api.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      await this.api.post<ResetPasswordResponse>('/auth/reset-password', data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await this.api.put<User>('/auth/profile', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    try {
      await this.api.post('/auth/change-password', data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and convert to ApiError format
   */
  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        message: string;
        error?: string;
        field?: string;
      }>;

      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      // Handle specific error cases
      switch (status) {
        case 400:
          return {
            message: data?.message || data?.error || 'Invalid request',
            statusCode: status,
            field: data?.field,
          };
        case 401:
          return {
            message: 'Authentication required',
            statusCode: status,
          };
        case 403:
          return {
            message: 'You do not have permission to perform this action',
            statusCode: status,
          };
        case 404:
          return {
            message: 'Resource not found',
            statusCode: status,
          };
        case 409:
          return {
            message: data?.message || 'Resource already exists',
            statusCode: status,
            field: data?.field,
          };
        case 422:
          return {
            message: data?.message || 'Validation error',
            statusCode: status,
            field: data?.field,
          };
        case 429:
          return {
            message: 'Too many requests, please try again later',
            statusCode: status,
          };
        case 500:
        default:
          return {
            message: data?.message || 'An unexpected error occurred',
            statusCode: status,
          };
      }
    }

    // Handle network errors
    if (error instanceof Error) {
      if (error.name === 'NetworkError' || error.message.includes('NetworkError')) {
        return {
          message: 'Network error. Please check your connection.',
        };
      }
      return {
        message: error.message || 'An unexpected error occurred',
      };
    }

    return {
      message: 'An unexpected error occurred',
    };
  }
}

// Export singleton instance
export const authService = new AuthService();