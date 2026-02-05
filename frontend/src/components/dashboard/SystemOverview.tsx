import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import type { SystemMetric } from '../../stores/dashboardStore';

interface SystemOverviewProps {
  metrics: SystemMetric[];
  isLoading?: boolean;
}

export function SystemOverview({ metrics, isLoading }: SystemOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
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
        ))}
      </div>
    );
  }

  const getMetricIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'cpu':
        return <Cpu className="h-4 w-4 text-muted-foreground" />;
      case 'memory':
        return <MemoryStick className="h-4 w-4 text-muted-foreground" />;
      case 'disk':
        return <HardDrive className="h-4 w-4 text-muted-foreground" />;
      case 'network':
        return <Network className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: SystemMetric['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff > 0) {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    } else if (diff < 0) {
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    }
    return null;
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'GB') {
      return `${value.toFixed(1)} GB`;
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'Mbps') {
      return `${value.toFixed(1)} Mbps`;
    } else if (unit === 'ms') {
      return `${value.toFixed(0)} ms`;
    }
    return `${value} ${unit}`;
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return '+0%';
    const diff = ((current - previous) / previous) * 100;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
            {getMetricIcon(metric.name)}
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {formatValue(metric.current, metric.unit)}
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(metric.current, metric.previous)}
                <p className="text-xs text-muted-foreground">
                  {calculateTrend(metric.current, metric.previous)} from previous
                </p>
              </div>
              {metric.status !== 'healthy' && (
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle className={`h-3 w-3 ${getStatusColor(metric.status)}`} />
                  <span className={`text-xs ${getStatusColor(metric.status)}`}>
                    {metric.status === 'warning' ? 'Warning' : 'Critical'}
                  </span>
                </div>
              )}
            </div>
            {/* Progress bar for percentage-based metrics */}
            {metric.unit === '%' && (
              <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    metric.status === 'critical'
                      ? 'bg-red-500'
                      : metric.status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(metric.current, 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}