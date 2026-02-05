import axios, { AxiosError } from 'axios';
import type {
  SystemInfo,
  VyOSImage,
  SystemLogEntry,
  LogLevel,
} from '../stores/systemStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Axios instance for API calls
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
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

export interface SystemRebootRequest {
  delay?: number;
}

export interface ImageUploadRequest {
  file: File;
}

export interface ImageUploadResponse {
  name: string;
  version: string;
  size: number;
  message: string;
}

export interface SystemLogsRequest {
  level?: LogLevel;
  lines?: number;
  since?: string;
  facility?: string;
}

export interface SystemLogsResponse {
  logs: SystemLogEntry[];
  total: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

class SystemService {
  /**
   * Get system information
   */
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const response = await apiClient.get<SystemInfo>('/system/info');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get system information');
    }
  }

  /**
   * Reboot the system
   */
  async rebootSystem(delay?: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/system/reboot', {
        delay,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to reboot system');
    }
  }

  /**
   * Power off the system
   */
  async poweroffSystem(delay?: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/system/poweroff', {
        delay,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to power off system');
    }
  }

  /**
   * Get list of VyOS images
   */
  async getImages(): Promise<VyOSImage[]> {
    try {
      const response = await apiClient.get<VyOSImage[]>('/system/images');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get system images');
    }
  }

  /**
   * Add a new VyOS image
   */
  async addImage(file: File, onProgress?: (progress: number) => void): Promise<ImageUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post<ImageUploadResponse>('/system/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to upload image');
    }
  }

  /**
   * Set an image as the default boot image
   */
  async setDefaultImage(imageName: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<{ message: string }>(`/system/images/${imageName}/default`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to set default image');
    }
  }

  /**
   * Delete a VyOS image
   */
  async deleteImage(imageName: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/system/images/${imageName}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete image');
    }
  }

  /**
   * Get system logs
   */
  async getSystemLogs(params?: SystemLogsRequest): Promise<SystemLogEntry[]> {
    try {
      const response = await apiClient.get<SystemLogsResponse>('/system/logs', {
        params: {
          level: params?.level,
          lines: params?.lines || 1000,
          since: params?.since,
          facility: params?.facility,
        },
      });
      return response.data.logs;
    } catch (error) {
      throw this.handleError(error, 'Failed to get system logs');
    }
  }

  /**
   * Clear system logs
   */
  async clearSystemLogs(): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>('/system/logs');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to clear system logs');
    }
  }

  /**
   * Export system logs
   */
  async exportSystemLogs(params?: SystemLogsRequest): Promise<Blob> {
    try {
      const response = await apiClient.get('/system/logs/export', {
        params: {
          level: params?.level,
          since: params?.since,
          facility: params?.facility,
        },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to export system logs');
    }
  }

  /**
   * Get disk usage information
   */
  async getDiskUsage(): Promise<{ path: string; total: number; used: number; available: number; percentage: number }[]> {
    try {
      const response = await apiClient.get<{ path: string; total: number; used: number; available: number; percentage: number }[]>('/system/disk');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get disk usage');
    }
  }

  /**
   * Run system diagnostic
   */
  async runDiagnostic(): Promise<{ status: string; results: Array<{ name: string; status: string; message: string }> }> {
    try {
      const response = await apiClient.post<{ status: string; results: Array<{ name: string; status: string; message: string }> }>('/system/diagnostic');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to run diagnostic');
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.details || defaultMessage;
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
export const systemService = new SystemService();
export default systemService;