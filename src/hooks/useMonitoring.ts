import { useState, useEffect } from 'react';
import { monitoringService, MonitoringService } from '../services/monitoring/monitoringService';

// Define types for monitoring data
export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: string;
  loadAverage: [number, number, number];
}

export interface NetworkTraffic {
  incoming: number;
  outgoing: number;
  total: number;
  interfaces: Array<{
    name: string;
    rx: number;
    tx: number;
  }>;
}

export interface Alert {
  id: number;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export interface MonitoringState {
  metrics: SystemMetrics | null;
  traffic: NetworkTraffic | null;
  alerts: Alert[];
  isMonitoring: boolean;
}

// Custom hook for monitoring data
export const useMonitoring = () => {
  const [monitoringState, setMonitoringState] = useState<MonitoringState>({
    metrics: null,
    traffic: null,
    alerts: [],
    isMonitoring: false
  });

  useEffect(() => {
    // Set up listeners for real-time updates
    const handleMetricsUpdate = (data: any) => {
      if (data.type === 'metrics') {
        setMonitoringState(prev => ({
          ...prev,
          metrics: data.data
        }));
      }
    };

    const handleTrafficUpdate = (data: any) => {
      if (data.type === 'traffic') {
        setMonitoringState(prev => ({
          ...prev,
          traffic: data.data
        }));
      }
    };

    const handleAlertUpdate = (data: any) => {
      if (data.type === 'alert') {
        setMonitoringState(prev => ({
          ...prev,
          alerts: [data.data, ...prev.alerts]
        }));
      }
    };

    // Add listeners to monitoring service
    monitoringService.addListener(handleMetricsUpdate);
    monitoringService.addListener(handleTrafficUpdate);
    monitoringService.addListener(handleAlertUpdate);

    // Set initial monitoring status
    setMonitoringState(prev => ({
      ...prev,
      isMonitoring: monitoringService.getMonitoringStatus()
    }));

    // Clean up listeners on unmount
    return () => {
      monitoringService.removeListener(handleMetricsUpdate);
      monitoringService.removeListener(handleTrafficUpdate);
      monitoringService.removeListener(handleAlertUpdate);
    };
  }, []);

  const startMonitoring = () => {
    monitoringService.startMonitoring();
    setMonitoringState(prev => ({
      ...prev,
      isMonitoring: true
    }));
  };

  const stopMonitoring = () => {
    monitoringService.stopMonitoring();
    setMonitoringState(prev => ({
      ...prev,
      isMonitoring: false
    }));
  };

  return {
    ...monitoringState,
    startMonitoring,
    stopMonitoring
  };
};