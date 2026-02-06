import axios, { AxiosError } from 'axios';
import type {
  ConfigNode,
  ConfigSection,
  ConfigHistoryEntry,
  ConfigDiff,
  ConfigApplyResult,
  ConfigValidationError,
} from '../stores/configStore';

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

// Request/Response types
export interface GetConfigRequest {
  node?: string;
  depth?: number;
  section?: string;
  includeDescription?: boolean;
}

export interface GetConfigResponse {
  data: {
    config: ConfigNode[];
    sections: ConfigSection[];
    version: string;
    timestamp: string;
  };
}

export interface SetConfigRequest {
  path: string[];
  value: string | number | boolean | null;
  comment?: string;
}

export interface SetConfigResponse {
  data: {
    success: boolean;
    version: string;
    pendingChanges: number;
  };
}

export interface DeleteConfigRequest {
  path: string[];
  comment?: string;
}

export interface GenerateConfigRequest {
  comment?: string;
  dryRun?: boolean;
}

export interface GenerateConfigResponse {
  data: {
    success: boolean;
    config: string;
    version: string;
    warnings?: string[];
  };
}

export interface CommitConfigRequest {
  comment?: string;
  saveFile?: boolean;
}

export interface CommitConfigResponse {
  data: {
    success: boolean;
    version: string;
    timestamp: string;
    message: string;
  };
}

export interface GetConfigHistoryRequest {
  node?: string;
  limit?: number;
  offset?: number;
  since?: string;
  until?: string;
}

export interface GetConfigHistoryResponse {
  data: {
    entries: ConfigHistoryEntry[];
    total: number;
    hasMore: boolean;
  };
}

export interface GetConfigDiffRequest {
  versionFrom: string;
  versionTo?: string;
  format?: 'json' | 'unified' | 'side-by-side';
}

export interface GetConfigDiffResponse {
  data: {
    diff: ConfigDiff;
    formattedDiff?: string;
  };
}

export interface RollbackConfigRequest {
  version: string;
  node?: string;
  comment?: string;
}

export interface RollbackConfigResponse {
  data: {
    success: boolean;
    version: string;
    message: string;
  };
}

export interface ValidateConfigRequest {
  config?: ConfigNode[];
}

export interface ValidateConfigResponse {
  data: {
    valid: boolean;
    errors: ConfigValidationError[];
    warnings: ConfigValidationError[];
  };
}

export interface ApplyConfigRequest {
  config: ConfigNode[];
  comment?: string;
  validate?: boolean;
}

export interface ApplyConfigResponse {
  data: ConfigApplyResult;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
  path?: string;
}

class ConfigService {
  /**
   * Get the current configuration
   */
  async getConfig(params?: GetConfigRequest): Promise<{
    config: ConfigNode[];
    sections: ConfigSection[];
    version: string;
    timestamp: string;
  }> {
    try {
      const response = await apiClient.get<GetConfigResponse>('/config', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch configuration');
    }
  }

  /**
   * Get configuration by section
   */
  async getConfigSection(sectionId: string): Promise<ConfigSection> {
    try {
      const response = await apiClient.get<{ data: ConfigSection }>(`/config/sections/${sectionId}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to fetch configuration section ${sectionId}`);
    }
  }

  /**
   * Set a configuration value
   */
  async setConfig(request: SetConfigRequest): Promise<{
    success: boolean;
    version: string;
    pendingChanges: number;
  }> {
    try {
      const response = await apiClient.post<SetConfigResponse>('/config', request);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to set configuration value');
    }
  }

  /**
   * Delete a configuration node
   */
  async deleteConfig(request: DeleteConfigRequest): Promise<{
    success: boolean;
    version: string;
    pendingChanges: number;
  }> {
    try {
      const response = await apiClient.delete<SetConfigResponse>('/config', { data: request });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete configuration value');
    }
  }

  /**
   * Generate configuration from pending changes
   */
  async generateConfig(request?: GenerateConfigRequest): Promise<{
    success: boolean;
    config: string;
    version: string;
    warnings?: string[];
  }> {
    try {
      const response = await apiClient.post<GenerateConfigResponse>('/config/generate', request);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to generate configuration');
    }
  }

  /**
   * Commit pending configuration changes
   */
  async commitConfig(request?: CommitConfigRequest): Promise<{
    success: boolean;
    version: string;
    timestamp: string;
    message: string;
  }> {
    try {
      const response = await apiClient.post<CommitConfigResponse>('/config/commit', request);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to commit configuration');
    }
  }

  /**
   * Get configuration history
   */
  async getConfigHistory(params?: GetConfigHistoryRequest): Promise<{
    entries: ConfigHistoryEntry[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await apiClient.get<GetConfigHistoryResponse>('/config/history', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch configuration history');
    }
  }

  /**
   * Get configuration diff between versions
   */
  async getConfigDiff(request: GetConfigDiffRequest): Promise<{
    diff: ConfigDiff;
    formattedDiff?: string;
  }> {
    try {
      const response = await apiClient.post<GetConfigDiffResponse>('/config/diff', request);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch configuration diff');
    }
  }

  /**
   * Rollback configuration to a previous version
   */
  async rollbackConfig(request: RollbackConfigRequest): Promise<{
    success: boolean;
    version: string;
    message: string;
  }> {
    try {
      const response = await apiClient.post<RollbackConfigResponse>('/config/rollback', request);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to rollback configuration');
    }
  }

  /**
   * Validate configuration
   */
  async validateConfig(request?: ValidateConfigRequest): Promise<{
    valid: boolean;
    errors: ConfigValidationError[];
    warnings: ConfigValidationError[];
  }> {
    try {
      const response = await apiClient.post<ValidateConfigResponse>('/config/validate', request);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to validate configuration');
    }
  }

  /**
   * Apply configuration changes
   */
  async applyConfig(request: ApplyConfigRequest): Promise<ConfigApplyResult> {
    try {
      const response = await apiClient.post<ApplyConfigResponse>('/config/apply', request);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to apply configuration');
    }
  }

  /**
   * Discard pending configuration changes
   */
  async discardConfig(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await apiClient.post<{ data: { success: boolean; message: string } }>(
        '/config/discard'
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to discard configuration changes');
    }
  }

  /**
   * Get configuration tree for a specific node
   */
  async getConfigTree(nodePath: string[]): Promise<ConfigNode> {
    try {
      const response = await apiClient.get<{ data: ConfigNode }>(
        `/config/tree/${nodePath.join('/')}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to fetch config tree for ${nodePath.join('/')}`);
    }
  }

  /**
   * Search configuration
   */
  async searchConfig(query: string, options?: {
    caseSensitive?: boolean;
    includeValues?: boolean;
    maxResults?: number;
  }): Promise<ConfigNode[]> {
    try {
      const response = await apiClient.post<{ data: ConfigNode[] }>('/config/search', {
        query,
        ...options,
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to search configuration');
    }
  }

  /**
   * Export configuration
   */
  async exportConfig(format: 'json' | 'yaml' | 'cli' = 'json'): Promise<Blob> {
    try {
      const response = await apiClient.get(`/config/export?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to export configuration');
    }
  }

  /**
   * Import configuration
   */
  async importConfig(
    file: File,
    format: 'json' | 'yaml' | 'cli',
    options?: {
      dryRun?: boolean;
      merge?: boolean;
    }
  ): Promise<{
    success: boolean;
    importedCount: number;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);
      if (options?.dryRun) formData.append('dryRun', 'true');
      if (options?.merge) formData.append('merge', 'true');

      const response = await apiClient.post<{
        data: {
          success: boolean;
          importedCount: number;
          errors?: string[];
          warnings?: string[];
        };
      }>('/config/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to import configuration');
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      const apiError = axiosError.response?.data;

      if (apiError) {
        throw new Error(
          apiError.details || apiError.message || defaultMessage
        );
      }

      if (axiosError.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }

      if (axiosError.response?.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      }

      if (axiosError.response?.status === 404) {
        throw new Error('Configuration or section not found.');
      }

      if (axiosError.response?.status === 409) {
        throw new Error('Configuration conflict. Changes may have been made by another user.');
      }

      if (axiosError.response?.status === 422) {
        throw new Error('Invalid configuration data.');
      }

      throw new Error(defaultMessage);
    }

    if (error instanceof Error) {
      if (error.message.includes('NetworkError')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
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
export const configService = new ConfigService();
export default configService;