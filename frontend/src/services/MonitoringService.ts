import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Types
export interface SystemMetricsResponse {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: [number, number, number];
  };
  memory: {
    total: number;
    used: number;
    available: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    available: number;
    percentage: number;
    path: string;
  };
  network: {
    interfaces: Array<{
      name: string;
      status: 'up' | 'down';
      speed: number;
      mtu: number;
    }>;
  };
}

export interface DashboardSummaryResponse {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  degradedNodes: number;
  activeInterfaces: number;
  totalBandwidth: number;
  bandwidthUnit: string;
  systemStatus: 'healthy' | 'warning' | 'critical';
}

export interface NodeStatusResponse {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  lastSeen: string;
  cpu: number;
  memory: number;
  disk: number;
  version: string;
}

export interface TrafficDataResponse {
  timestamp: string;
  inbound: number;
  outbound: number;
  interface: string;
}

export interface ActivityLogResponse {
  id: string;
  timestamp: string;
  type: 'config' | 'alert' | 'info' | 'warning';
  message: string;
  node: string;
  user?: string;
  details?: Record<string, unknown>;
}

export interface AlertResponse {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  node: string;
  acknowledged: boolean;
  details?: Record<string, unknown>;
}

// API Error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const parsed = JSON.parse(token);
        if (parsed?.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`;
        }
      } catch {
        // Ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      window.location.href = '/login';
    }

    const message =
      (error.response?.data as any)?.message ||
      error.message ||
      'An unexpected error occurred';

    throw new ApiError(
      message,
      error.response?.status,
      error.response?.data
    );
  }
);

// Monitoring Service
export class MonitoringService {
  private static instance: MonitoringService;

  private constructor() {}

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Get system metrics for a specific node
   */
  async getNodeMetrics(nodeId: string): Promise<SystemMetricsResponse> {
    const response = await apiClient.get<SystemMetricsResponse>(
      `/monitoring/nodes/${nodeId}/metrics`
    );
    return response.data;
  }

  /**
   * Get aggregate system metrics across all nodes
   */
  async getSystemMetrics(): Promise<SystemMetricsResponse> {
    const response = await apiClient.get<SystemMetricsResponse>(
      '/monitoring/metrics'
    );
    return response.data;
  }

  /**
   * Get dashboard summary statistics
   */
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    const response = await apiClient.get<DashboardSummaryResponse>(
      '/monitoring/summary'
    );
    return response.data;
  }

  /**
   * Get status of all nodes
   */
  async getNodeStatuses(): Promise<NodeStatusResponse[]> {
    const response = await apiClient.get<NodeStatusResponse[]>(
      '/monitoring/nodes/status'
    );
    return response.data;
  }

  /**
   * Get traffic data for a specific time range
   */
  async getTrafficData(
    nodeId?: string,
    interfaceName?: string,
    startTime?: string,
    endTime?: string
  ): Promise<TrafficDataResponse[]> {
    const params: Record<string, string> = {};
    if (nodeId) params.nodeId = nodeId;
    if (interfaceName) params.interface = interfaceName;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    const response = await apiClient.get<TrafficDataResponse[]>(
      '/monitoring/traffic',
      { params }
    );
    return response.data;
  }

  /**
   * Get recent activity log
   */
  async getActivityLog(limit: number = 50): Promise<ActivityLogResponse[]> {
    const response = await apiClient.get<ActivityLogResponse[]>(
      '/monitoring/activity',
      { params: { limit } }
    );
    return response.data;
  }

  /**
   * Get active alerts
   */
  async getAlerts(acknowledged: boolean = false): Promise<AlertResponse[]> {
    const response = await apiClient.get<AlertResponse[]>(
      '/monitoring/alerts',
      { params: { acknowledged } }
    );
    return response.data;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    await apiClient.post(`/monitoring/alerts/${alertId}/acknowledge`);
  }

  /**
   * Acknowledge multiple alerts
   */
  async acknowledgeAlerts(alertIds: string[]): Promise<void> {
    await apiClient.post('/monitoring/alerts/acknowledge', { alertIds });
  }

  /**
   * Clear acknowledged alerts
   */
  async clearAlerts(): Promise<void> {
    await apiClient.delete('/monitoring/alerts/cleared');
  }

  /**
   * Get WebSocket endpoint URL for real-time updates
   */
  getWebSocketUrl(): string {
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = API_BASE_URL.replace(/^https?:/, '');
    return `${wsProtocol}:${baseUrl}/monitoring/stream`;
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();