import axios, { AxiosResponse } from 'axios';

interface LoginCredentials {
  username: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

interface LoginResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    user: User;
  };
  message?: string;
}

class AuthService {
  private apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    timeout: 10000,
  });

  constructor() {
    // Request interceptor to add auth header
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token expiration
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  async login(username: string, password: string): Promise<User | null> {
    try {
      const response: AxiosResponse<LoginResponse> = await this.apiClient.post('/auth/login', {
        username,
        password
      });

      if (response.data.success && response.data.data) {
        const { access_token, refresh_token, user } = response.data.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        return user;
      }

      return null;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getCurrentSession(): Promise<User | null> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return null;
    }

    try {
      const response = await this.apiClient.get('/auth/me');
      return response.data.data;
    } catch (error) {
      console.error('Session check error:', error);
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await this.apiClient.post('/auth/refresh', {
        refresh_token: refreshToken
      });

      if (response.data.success) {
        localStorage.setItem('access_token', response.data.data.access_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
}

export const authService = new AuthService();

export default AuthService;