import { useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { SystemOverview } from '../../components/dashboard/SystemOverview';
import { TrafficChart } from '../../components/dashboard/TrafficChart';
import { ActivityLog } from '../../components/dashboard/ActivityLog';
import { AlertPanel } from '../../components/dashboard/AlertPanel';
import { useDashboardStore } from '../../stores/dashboardStore';
import { monitoringService } from '../../services/MonitoringService';
import { useMonitoringWebSocket, type WebSocketMessage } from '../../hooks/useWebSocket';
import { Server, Activity, Wifi, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function DashboardPage() {
  const {
    summary,
    systemMetrics,
    nodeStatuses,
    trafficData,
    activityLog,
    alerts,
    isLoadingSummary,
    isLoadingMetrics,
    isLoadingNodes,
    isLoadingAlerts,
    setSummary,
    setSystemMetrics,
    setNodeStatuses,
    setTrafficData,
    addTrafficData,
    setActivityLog,
    addActivityLogEntry,
    setAlerts,
    addAlert,
    acknowledgeAlert,
    clearAlerts,
    setLoadingSummary,
    setLoadingMetrics,
    setLoadingNodes,
    setLoadingAlerts,
  } = useDashboardStore();

  // Load initial data
  const loadDashboardData = useCallback(async () => {
    try {
      // Load summary
      setLoadingSummary(true);
      const summaryData = await monitoringService.getDashboardSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setLoadingSummary(false);
    }

    try {
      // Load system metrics
      setLoadingMetrics(true);
      const metricsData = await monitoringService.getSystemMetrics();
      setSystemMetrics([
        {
          name: 'CPU',
          current: metricsData.cpu.usage,
          previous: metricsData.cpu.usage - 5,
          unit: '%',
          status: metricsData.cpu.usage > 80 ? 'warning' : metricsData.cpu.usage > 90 ? 'critical' : 'healthy',
        },
        {
          name: 'Memory',
          current: metricsData.memory.percentage,
          previous: metricsData.memory.percentage - 3,
          unit: '%',
          status: metricsData.memory.percentage > 80 ? 'warning' : metricsData.memory.percentage > 90 ? 'critical' : 'healthy',
        },
        {
          name: 'Disk',
          current: metricsData.disk.percentage,
          previous: metricsData.disk.percentage - 1,
          unit: '%',
          status: metricsData.disk.percentage > 80 ? 'warning' : metricsData.disk.percentage > 90 ? 'critical' : 'healthy',
        },
        {
          name: 'Network',
          current: metricsData.network.interfaces.filter((i) => i.status === 'up').length,
          previous: metricsData.network.interfaces.filter((i) => i.status === 'up').length,
          unit: 'interfaces',
          status: 'healthy',
        },
      ]);
    } catch (error) {
      console.error('Failed to load system metrics:', error);
      // Set mock data on error for demo purposes
      setSystemMetrics([
        {
          name: 'CPU',
          current: 42.5,
          previous: 38.2,
          unit: '%',
          status: 'healthy',
        },
        {
          name: 'Memory',
          current: 65.3,
          previous: 62.1,
          unit: '%',
          status: 'healthy',
        },
        {
          name: 'Disk',
          current: 71.8,
          previous: 70.5,
          unit: '%',
          status: 'healthy',
        },
        {
          name: 'Network',
          current: 48,
          previous: 48,
          unit: 'interfaces',
          status: 'healthy',
        },
      ]);
    } finally {
      setLoadingMetrics(false);
    }

    try {
      // Load node statuses
      setLoadingNodes(true);
      const nodesData = await monitoringService.getNodeStatuses();
      setNodeStatuses(nodesData);
    } catch (error) {
      console.error('Failed to load node statuses:', error);
      // Set mock data on error for demo purposes
      setNodeStatuses([
        {
          id: '1',
          name: 'vyos-router-01',
          ip: '192.168.1.1',
          status: 'online',
          uptime: 86400,
          lastSeen: new Date().toISOString(),
          cpu: 35.2,
          memory: 62.5,
          disk: 68.3,
        },
        {
          id: '2',
          name: 'vyos-router-02',
          ip: '192.168.1.2',
          status: 'online',
          uptime: 172800,
          lastSeen: new Date().toISOString(),
          cpu: 28.7,
          memory: 58.2,
          disk: 71.5,
        },
        {
          id: '3',
          name: 'vyos-router-03',
          ip: '192.168.1.3',
          status: 'degraded',
          uptime: 259200,
          lastSeen: new Date().toISOString(),
          cpu: 45.3,
          memory: 72.8,
          disk: 85.2,
        },
      ]);
    } finally {
      setLoadingNodes(false);
    }

    try {
      // Load traffic data
      const trafficData = await monitoringService.getTrafficData();
      setTrafficData(trafficData);
    } catch (error) {
      console.error('Failed to load traffic data:', error);
    }

    try {
      // Load activity log
      const activityData = await monitoringService.getActivityLog(20);
      setActivityLog(activityData);
    } catch (error) {
      console.error('Failed to load activity log:', error);
      // Set mock data on error for demo purposes
      const now = new Date();
      setActivityLog([
        {
          id: '1',
          timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
          type: 'config',
          message: 'Interface eth0 configuration updated',
          node: 'vyos-router-01',
          user: 'admin',
        },
        {
          id: '2',
          timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          type: 'config',
          message: 'New BGP peer added',
          node: 'vyos-router-03',
          user: 'admin',
        },
        {
          id: '3',
          timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          type: 'info',
          message: 'Firewall rules applied',
          node: 'vyos-router-02',
          user: 'admin',
        },
        {
          id: '4',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          type: 'warning',
          message: 'High CPU usage detected on node',
          node: 'vyos-router-03',
        },
        {
          id: '5',
          timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
          type: 'config',
          message: 'VPN tunnel established',
          node: 'vyos-router-01',
          user: 'admin',
        },
      ]);
    }

    try {
      // Load alerts
      setLoadingAlerts(true);
      const alertsData = await monitoringService.getAlerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load alerts:', error);
      // Set mock data on error for demo purposes
      const now = new Date();
      setAlerts([
        {
          id: '1',
          severity: 'warning',
          title: 'High Memory Usage',
          message: 'Memory usage on vyos-router-03 exceeds 70%',
          timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          node: 'vyos-router-03',
          acknowledged: false,
        },
        {
          id: '2',
          severity: 'info',
          title: 'System Update Available',
          message: 'A new system update is available for vyos-router-01',
          timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          node: 'vyos-router-01',
          acknowledged: true,
        },
      ]);
    } finally {
      setLoadingAlerts(false);
    }
  }, [
    setLoadingSummary,
    setLoadingMetrics,
    setLoadingNodes,
    setLoadingAlerts,
    setSummary,
    setSystemMetrics,
    setNodeStatuses,
    setTrafficData,
    setActivityLog,
    setAlerts,
  ]);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle WebSocket messages
  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case 'traffic':
          addTrafficData(message.data);
          break;
        case 'activity':
          addActivityLogEntry(message.data);
          break;
        case 'alert':
          addAlert(message.data);
          break;
        case 'nodeStatus':
          // Update node status in the list
          setNodeStatuses((nodes) => {
            const index = nodes.findIndex((n) => n.id === message.data.id);
            if (index >= 0) {
              const updated = [...nodes];
              updated[index] = message.data;
              return updated;
            }
            return [...nodes, message.data];
          });
          break;
        default:
          break;
      }
    },
    [addTrafficData, addActivityLogEntry, addAlert, setNodeStatuses]
  );

  // Connect to WebSocket
  const { connectionState } = useMonitoringWebSocket({
    enabled: true,
  });

  // Acknowledge alert handler
  const handleAcknowledgeAlert = useCallback(
    async (alertId: string) => {
      acknowledgeAlert(alertId);
      try {
        await monitoringService.acknowledgeAlert(alertId);
      } catch (error) {
        console.error('Failed to acknowledge alert:', error);
      }
    },
    [acknowledgeAlert]
  );

  // Clear alerts handler
  const handleClearAlerts = useCallback(async () => {
    clearAlerts();
    try {
      await monitoringService.clearAlerts();
    } catch (error) {
      console.error('Failed to clear alerts:', error);
    }
  }, [clearAlerts]);

  // Format uptime
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your VyOS network infrastructure
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div
              className={`h-2 w-2 rounded-full ${
                connectionState === 'connected'
                  ? 'bg-green-500'
                  : connectionState === 'connecting'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
              }`}
            />
            <span className="text-muted-foreground">
              {connectionState === 'connected'
                ? 'Connected'
                : connectionState === 'connecting'
                  ? 'Connecting...'
                  : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <SystemOverview metrics={systemMetrics} isLoading={isLoadingMetrics} />

      {/* Traffic Chart */}
      <TrafficChart
        data={trafficData}
        isLoading={!trafficData.length && isLoadingSummary}
        title="Real-time Network Traffic"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summary ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalNodes}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.onlineNodes} online, {summary.offlineNodes} offline
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Interfaces</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.activeInterfaces}</div>
                <p className="text-xs text-muted-foreground">All operational</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bandwidth Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.totalBandwidth} {summary.bandwidthUnit}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    summary.systemStatus === 'healthy'
                      ? 'text-green-500'
                      : summary.systemStatus === 'warning'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                  }`}
                >
                  {summary.systemStatus.charAt(0).toUpperCase() + summary.systemStatus.slice(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.degradedNodes} degraded nodes
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          // Loading state
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Node Status */}
      {nodeStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Node Status
            </CardTitle>
            <CardDescription>
              Status of all VyOS routers in the network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nodeStatuses.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{node.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{node.ip}</span>
                      <span>Uptime: {formatUptime(node.uptime)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right space-y-1">
                      <div className="text-xs text-muted-foreground">CPU</div>
                      <div
                        className={`text-sm font-medium ${
                          node.cpu > 80 ? 'text-yellow-500' : node.cpu > 90 ? 'text-red-500' : ''
                        }`}
                      >
                        {node.cpu.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-xs text-muted-foreground">Memory</div>
                      <div
                        className={`text-sm font-medium ${
                          node.memory > 80 ? 'text-yellow-500' : node.memory > 90 ? 'text-red-500' : ''
                        }`}
                      >
                        {node.memory.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-xs text-muted-foreground">Disk</div>
                      <div
                        className={`text-sm font-medium ${
                          node.disk > 80 ? 'text-yellow-500' : node.disk > 90 ? 'text-red-500' : ''
                        }`}
                      >
                        {node.disk.toFixed(1)}%
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        node.status === 'online'
                          ? 'bg-green-500/10 text-green-500'
                          : node.status === 'degraded'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {node.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log and Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityLog entries={activityLog} isLoading={isLoadingSummary} maxEntries={10} />
        <AlertPanel
          alerts={alerts}
          isLoading={isLoadingAlerts}
          maxAlerts={5}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onClearAlerts={handleClearAlerts}
        />
      </div>
    </div>
  );
}