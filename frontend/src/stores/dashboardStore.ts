import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types for dashboard data
export interface SystemMetric {
  name: string;
  current: number;
  previous: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
}

export interface NodeStatus {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  lastSeen: string;
  cpu: number;
  memory: number;
  disk: number;
}

export interface TrafficData {
  timestamp: string;
  inbound: number;
  outbound: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: 'config' | 'alert' | 'info' | 'warning';
  message: string;
  node: string;
  user?: string;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  node: string;
  acknowledged: boolean;
}

export interface DashboardSummary {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  degradedNodes: number;
  activeInterfaces: number;
  totalBandwidth: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
}

interface DashboardState {
  // Summary metrics
  summary: DashboardSummary | null;
  systemMetrics: SystemMetric[];
  nodeStatuses: NodeStatus[];
  trafficData: TrafficData[];
  activityLog: ActivityLogEntry[];
  alerts: Alert[];

  // Loading states
  isLoadingSummary: boolean;
  isLoadingMetrics: boolean;
  isLoadingNodes: boolean;
  isLoadingAlerts: boolean;

  // Errors
  error: string | null;

  // Actions
  setSummary: (summary: DashboardSummary) => void;
  setSystemMetrics: (metrics: SystemMetric[]) => void;
  setNodeStatuses: (nodes: NodeStatus[]) => void;
  setTrafficData: (data: TrafficData[]) => void;
  addTrafficData: (data: TrafficData) => void;
  setActivityLog: (log: ActivityLogEntry[]) => void;
  addActivityLogEntry: (entry: ActivityLogEntry) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;

  // Loading actions
  setLoadingSummary: (loading: boolean) => void;
  setLoadingMetrics: (loading: boolean) => void;
  setLoadingNodes: (loading: boolean) => void;
  setLoadingAlerts: (loading: boolean) => void;

  // Error actions
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  summary: null,
  systemMetrics: [],
  nodeStatuses: [],
  trafficData: [],
  activityLog: [],
  alerts: [],
  isLoadingSummary: false,
  isLoadingMetrics: false,
  isLoadingNodes: false,
  isLoadingAlerts: false,
  error: null,
};

export const useDashboardStore = create<DashboardState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setSummary: (summary) => set({ summary }),

    setSystemMetrics: (systemMetrics) => set({ systemMetrics }),

    setNodeStatuses: (nodeStatuses) => set({ nodeStatuses }),

    setTrafficData: (trafficData) => set({ trafficData }),

    addTrafficData: (data) => {
      const currentData = get().trafficData;
      // Keep only last 60 data points (5 minutes at 5 second intervals)
      const newData = [...currentData.slice(-59), data];
      set({ trafficData: newData });
    },

    setActivityLog: (activityLog) => set({ activityLog }),

    addActivityLogEntry: (entry) => {
      const currentLog = get().activityLog;
      // Keep only last 50 entries
      const newLog = [entry, ...currentLog].slice(0, 50);
      set({ activityLog: newLog });
    },

    setAlerts: (alerts) => set({ alerts }),

    addAlert: (alert) => {
      const currentAlerts = get().alerts;
      const newAlerts = [alert, ...currentAlerts];
      set({ alerts: newAlerts });
    },

    acknowledgeAlert: (alertId) => {
      const currentAlerts = get().alerts;
      const newAlerts = currentAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      );
      set({ alerts: newAlerts });
    },

    clearAlerts: () => set({ alerts: [] }),

    setLoadingSummary: (isLoadingSummary) => set({ isLoadingSummary }),

    setLoadingMetrics: (isLoadingMetrics) => set({ isLoadingMetrics }),

    setLoadingNodes: (isLoadingNodes) => set({ isLoadingNodes }),

    setLoadingAlerts: (isLoadingAlerts) => set({ isLoadingAlerts }),

    setError: (error) => set({ error }),

    reset: () => set(initialState),
  }))
);