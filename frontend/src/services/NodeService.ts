import axios, { AxiosError } from 'axios';
import type { Node, NodeStatus, NodeType, NodeHealthMetric, TestConnectionResult } from '../stores/nodeStore';

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
        if (auth?.state?.token) {
          config.headers.Authorization = `Bearer ${auth.state.token}`;
        }
      } catch {
        // Ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export interface NodeCreateRequest {
  name: string;
  hostname: string;
  ipAddress: string;
  port: number;
  type: NodeType;
  description?: string;
  location?: string;
  tags?: string[];
}

export interface NodeUpdateRequest {
  name?: string;
  hostname?: string;
  ipAddress?: string;
  port?: number;
  type?: NodeType;
  description?: string;
  location?: string;
  tags?: string[];
}

export interface NodeApiResponse {
  data: Node;
  message?: string;
}

export interface NodesApiResponse {
  data: Node[];
  total: number;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

class NodeService {
  /**
   * Get all nodes
   */
  async getNodes(): Promise<Node[]> {
    try {
      const response = await apiClient.get<NodesApiResponse>('/nodes');
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch nodes');
      throw error;
    }
  }

  /**
   * Get node by ID
   */
  async getNodeById(id: string): Promise<Node> {
    try {
      const response = await apiClient.get<NodeApiResponse>(`/nodes/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch node ${id}`);
      throw error;
    }
  }

  /**
   * Add a new node
   */
  async addNode(node: NodeCreateRequest): Promise<Node> {
    try {
      const response = await apiClient.post<NodeApiResponse>('/nodes', node);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'Failed to create node');
      throw error;
    }
  }

  /**
   * Update an existing node
   */
  async updateNode(id: string, node: NodeUpdateRequest): Promise<Node> {
    try {
      const response = await apiClient.put<NodeApiResponse>(`/nodes/${id}`, node);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to update node ${id}`);
      throw error;
    }
  }

  /**
   * Delete a node
   */
  async deleteNode(id: string): Promise<void> {
    try {
      await apiClient.delete(`/nodes/${id}`);
    } catch (error) {
      this.handleError(error, `Failed to delete node ${id}`);
      throw error;
    }
  }

  /**
   * Test connection to a node
   */
  async testConnection(id: string): Promise<TestConnectionResult> {
    try {
      const response = await apiClient.post<TestConnectionResult>(`/nodes/${id}/test-connection`);
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to test connection to node ${id}`);
      throw error;
    }
  }

  /**
   * Test connection with new node credentials
   */
  async testNewConnection(ipAddress: string, port: number, hostname?: string): Promise<TestConnectionResult> {
    try {
      const response = await apiClient.post<TestConnectionResult>('/nodes/test-connection', {
        ipAddress,
        port,
        hostname,
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to test connection');
      throw error;
    }
  }

  /**
   * Get node health metrics
   */
  async getNodeMetrics(id: string): Promise<NodeHealthMetric[]> {
    try {
      const response = await apiClient.get<{ data: NodeHealthMetric[] }>(`/nodes/${id}/metrics`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch metrics for node ${id}`);
      throw error;
    }
  }

  /**
   * Update node status
   */
  async updateNodeStatus(id: string, status: NodeStatus): Promise<Node> {
    try {
      const response = await apiClient.patch<NodeApiResponse>(`/nodes/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      this.handleError(error, `Failed to update status for node ${id}`);
      throw error;
    }
  }

  /**
   * Batch import nodes
   */
  async importNodes(nodes: NodeCreateRequest[]): Promise<Node[]> {
    try {
      const response = await apiClient.post<{ data: Node[] }>('/nodes/import', { nodes });
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'Failed to import nodes');
      throw error;
    }
  }

  /**
   * Export nodes configuration
   */
  async exportNodes(format: 'json' | 'yaml' = 'json'): Promise<Blob> {
    try {
      const response = await apiClient.get(`/nodes/export?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to export nodes');
      throw error;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      const errorMessage = axiosError.response?.data?.message || errorMessage || defaultMessage;
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
export const nodeService = new NodeService();
export default nodeService;