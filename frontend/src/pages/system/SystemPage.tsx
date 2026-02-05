import { useEffect, useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { useSystemStore } from '../../stores/systemStore';
import { systemService } from '../../services/SystemService';
import { RebootDialog } from '../../components/system/RebootDialog';
import { PoweroffDialog } from '../../components/system/PoweroffDialog';
import {
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Power,
  PowerOff,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';

export function SystemPage() {
  const {
    systemInfo,
    isLoadingInfo,
    setSystemInfo,
    setLoadingInfo,
    setError,
    isRebooting,
    isPoweringOff,
    setRebooting,
    setPoweringOff,
  } = useSystemStore();

  const [showRebootDialog, setShowRebootDialog] = useState(false);
  const [showPoweroffDialog, setShowPoweroffDialog] = useState(false);

  // Load system info on mount
  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = useCallback(async () => {
    try {
      setLoadingInfo(true);
      const info = await systemService.getSystemInfo();
      setSystemInfo(info);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load system information');
    } finally {
      setLoadingInfo(false);
    }
  }, [setLoadingInfo, setSystemInfo, setError]);

  const handleReboot = async (delay?: number) => {
    try {
      setRebooting(true);
      await systemService.rebootSystem(delay);
      setShowRebootDialog(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reboot system');
      setRebooting(false);
    }
  };

  const handlePoweroff = async (delay?: number) => {
    try {
      setPoweringOff(true);
      await systemService.poweroffSystem(delay);
      setShowPoweroffDialog(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to power off system');
      setPoweringOff(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  const getLoadStatus = (load: number): 'healthy' | 'warning' | 'critical' => {
    if (load > 2) return 'critical';
    if (load > 1) return 'warning';
    return 'healthy';
  };

  const getUsageStatus = (percentage: number): 'healthy' | 'warning' | 'critical' => {
    if (percentage > 90) return 'critical';
    if (percentage > 75) return 'warning';
    return 'healthy';
  };

  if (isRebooting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-12 w-12 text-yellow-500 animate-spin" />
        <h2 className="text-xl font-semibold">System is rebooting...</h2>
        <p className="text-muted-foreground">The system will restart shortly.</p>
      </div>
    );
  }

  if (isPoweringOff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <PowerOff className="h-12 w-12 text-red-500 animate-pulse" />
        <h2 className="text-xl font-semibold">System is shutting down...</h2>
        <p className="text-muted-foreground">The system will power off shortly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage your VyOS system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadSystemInfo} disabled={isLoadingInfo}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingInfo ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="destructive" onClick={() => setShowPoweroffDialog(true)}>
            <PowerOff className="mr-2 h-4 w-4" />
            Power Off
          </Button>
          <Button variant="default" onClick={() => setShowRebootDialog(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reboot
          </Button>
        </div>
      </div>

      {systemInfo ? (
        <>
          {/* System Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>
                Overview of system hardware and software details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Hostname</label>
                    <p className="text-lg font-semibold">{systemInfo.hostname}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">VyOS Version</label>
                    <p className="text-lg font-semibold">{systemInfo.version}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Kernel</label>
                      <p className="text-lg font-semibold">{systemInfo.kernelVersion}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Architecture</label>
                      <p className="text-lg font-semibold">{systemInfo.architecture}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CPU</label>
                      <p className="text-lg font-semibold">{systemInfo.cpuModel}</p>
                      <p className="text-sm text-muted-foreground">{systemInfo.cpuCores} cores</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Load Average</label>
                        <div className="flex gap-2">
                          {systemInfo.loadAverage.map((load, i) => (
                            <Badge key={i} variant={getLoadStatus(load) === 'critical' ? 'destructive' : getLoadStatus(load) === 'warning' ? 'outline' : 'default'}>
                              {load.toFixed(2)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Boot Time</label>
                      <p className="text-lg font-semibold">{format(new Date(systemInfo.bootTime), 'PPpp')}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Uptime</label>
                    <p className="text-lg font-semibold">{formatUptime(systemInfo.uptime)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Memory Usage</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress
                          value={((systemInfo.memoryTotal - systemInfo.memoryAvailable) / systemInfo.memoryTotal) * 100}
                          className="h-2"
                        />
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="text-sm font-semibold">
                          {formatBytes(systemInfo.memoryTotal - systemInfo.memoryAvailable)} / {formatBytes(systemInfo.memoryTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(systemInfo.memoryAvailable)} available
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Disk Usage</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress
                          value={((systemInfo.diskTotal - systemInfo.diskAvailable) / systemInfo.diskTotal) * 100}
                          className="h-2"
                        />
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="text-sm font-semibold">
                          {formatBytes(systemInfo.diskTotal - systemInfo.diskAvailable)} / {formatBytes(systemInfo.diskTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(systemInfo.diskAvailable)} available
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Load</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemInfo.loadAverage[0].toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">1 min average</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(((systemInfo.memoryTotal - systemInfo.memoryAvailable) / systemInfo.memoryTotal) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(systemInfo.memoryAvailable)} free
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(((systemInfo.diskTotal - systemInfo.diskAvailable) / systemInfo.diskTotal) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(systemInfo.diskAvailable)} free
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                {getUsageStatus(((systemInfo.memoryTotal - systemInfo.memoryAvailable) / systemInfo.memoryTotal) * 100) === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">Healthy</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : isLoadingInfo ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <Server className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Unable to load system information</h3>
                <p className="text-muted-foreground">
                  There was an error loading system data. Please try again.
                </p>
              </div>
              <Button onClick={loadSystemInfo}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reboot Dialog */}
      <RebootDialog open={showRebootDialog} onOpenChange={setShowRebootDialog} onReboot={handleReboot} />

      {/* Poweroff Dialog */}
      <PoweroffDialog open={showPoweroffDialog} onOpenChange={setShowPoweroffDialog} onPoweroff={handlePoweroff} />
    </div>
  );
}