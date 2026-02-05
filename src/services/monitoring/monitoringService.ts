// Monitoring service for collecting system metrics, network traffic, and alert data
import { vyosMonitoringService } from './vyosMonitoringService';

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

export class MonitoringService {
  private static instance: MonitoringService;
  private isMonitoring = false;
  private listeners: Array<(data: any) => void> = [];
  private intervalIds: number[] = [];

  private constructor() {}

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Start monitoring
  startMonitoring() {
    this.isMonitoring = true;
    this.startDataCollection();
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    // Clear all intervals
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];
  }

  // Add listener for real-time updates
  addListener(listener: (data: any) => void) {
    this.listeners.push(listener);
  }

  // Remove listener
  removeListener(listener: (data: any) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Simulate data collection (in a real implementation, this would connect to VyOS APIs)
  private startDataCollection() {
    if (!this.isMonitoring) return;

    // Clear existing intervals
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];

    // Simulate system metrics from VyOS
    const metricsInterval = setInterval(async () => {
      try {
        const vyosMetrics = await vyosMonitoringService.getSystemMetrics();
        const metrics: SystemMetrics = {
          cpuUsage: vyosMetrics.cpu.usage,
          memoryUsage: vyosMetrics.memory.percentage,
          diskUsage: vyosMetrics.disk.percentage,
          uptime: vyosMetrics.uptime,
          loadAverage: vyosMetrics.load_average
        };

        this.notifyListeners({ type: 'metrics', data: metrics });
      } catch (error) {
        console.error('Error fetching system metrics:', error);
      }
    }, 3000);

    // Simulate network traffic from VyOS
    const trafficInterval = setInterval(async () => {
      try {
        const vyosNetworkStats = await vyosMonitoringService.getNetworkStats();
        const traffic: NetworkTraffic = {
          incoming: vyosNetworkStats.traffic.incoming,
          outgoing: vyosNetworkStats.traffic.outgoing,
          total: vyosNetworkStats.traffic.total,
          interfaces: vyosNetworkStats.interfaces.map(iface => ({
            name: iface.name,
            rx: Math.floor(iface.rx_bytes / 1024), // Convert bytes to KB
            tx: Math.floor(iface.tx_bytes / 1024)  // Convert bytes to KB
          }))
        };

        this.notifyListeners({ type: 'traffic', data: traffic });
      } catch (error) {
        console.error('Error fetching network stats:', error);
      }
    }, 4000);

    // Simulate alerts from VyOS
    const alertInterval = setInterval(async () => {
      try {
        const vyosAlerts = await vyosMonitoringService.getAlerts();
        // Convert VyOS alerts to our Alert format
        const alerts = vyosAlerts.map(alert => ({
          id: parseInt(alert.id),
          type: alert.severity as 'info' | 'warning' | 'error',
          message: alert.message,
          timestamp: alert.timestamp
        }));

        // Send all alerts to listeners (in real implementation, you might want to process these differently)
        alerts.forEach(alert => {
          this.notifyListeners({ type: 'alert', data: alert });
        });
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    }, 6000);

    // Store interval IDs for cleanup
    this.intervalIds.push(metricsInterval, trafficInterval, alertInterval);
  }

  // Notify all listeners of new data
  private notifyListeners(data: { type: string; data: any }) {
    this.listeners.forEach(listener => listener(data));
  }

  // Get current monitoring status
  getMonitoringStatus(): boolean {
    return this.isMonitoring;
  }
}

// Export singleton instance for easy access
export const monitoringService = MonitoringService.getInstance();