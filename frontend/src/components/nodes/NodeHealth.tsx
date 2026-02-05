import { Node } from '../../stores/nodeStore';
import { Badge } from '../ui/Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { Check, AlertTriangle, X, Wrench, Activity } from 'lucide-react';

interface NodeHealthProps {
  node: Node;
  showDetails?: boolean;
}

export function NodeHealth({ node, showDetails = false }: NodeHealthProps) {
  const getHealthStatus = (node: Node) => {
    if (node.status === 'offline') {
      return { status: 'critical', icon: X, label: 'Offline' };
    }

    const criticalMetrics = node.healthMetrics.filter(
      (m) => m.status === 'critical'
    );
    const warningMetrics = node.healthMetrics.filter(
      (m) => m.status === 'warning'
    );

    if (node.status === 'maintenance') {
      return { status: 'warning', icon: Wrench, label: 'Maintenance' };
    }

    if (criticalMetrics.length > 0) {
      return { status: 'critical', icon: X, label: 'Critical Issues' };
    }

    if (warningMetrics.length > 0 || node.status === 'degraded') {
      return { status: 'warning', icon: AlertTriangle, label: 'Warnings' };
    }

    return { status: 'healthy', icon: Check, label: 'Healthy' };
  };

  const health = getHealthStatus(node);
  const HealthIcon = health.icon;

  const getStatusColor = (status: string) => {
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

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getHealthScore = () => {
    if (node.status === 'offline') return 0;
    if (node.status === 'maintenance') return 50;

    const totalMetrics = node.healthMetrics.length;
    if (totalMetrics === 0) return node.status === 'online' ? 100 : 0;

    const criticalCount = node.healthMetrics.filter((m) => m.status === 'critical').length;
    const warningCount = node.healthMetrics.filter((m) => m.status === 'warning').length;
    const healthyCount = node.healthMetrics.filter((m) => m.status === 'healthy').length;

    const score = Math.round((healthyCount / totalMetrics) * 100);
    return score;
  };

  const healthScore = getHealthScore();

  if (showDetails) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${getStatusBgColor(health.status)}/10`}>
              <HealthIcon className={`h-4 w-4 ${getStatusColor(health.status)}`} />
            </div>
            <div>
              <p className="text-sm font-medium">{health.label}</p>
              <p className="text-xs text-muted-foreground">
                Health Score: {healthScore}%
              </p>
            </div>
          </div>
          <Badge
            variant={
              health.status === 'healthy'
                ? 'success'
                : health.status === 'warning'
                  ? 'warning'
                  : 'destructive'
            }
          >
            {healthScore}%
          </Badge>
        </div>

        {node.healthMetrics.length > 0 && (
          <div className="space-y-2">
            {node.healthMetrics.map((metric, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="flex-1">{metric.name}</span>
                      <span className="font-medium">
                        {metric.value} {metric.unit}
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          metric.status === 'healthy'
                            ? 'bg-green-500'
                            : metric.status === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Last updated: {new Date(metric.timestamp).toLocaleString()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
              <HealthIcon className={`h-3 w-3 ${getStatusColor(health.status)}`} />
            </div>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  health.status === 'healthy'
                    ? 'bg-green-500'
                    : health.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">
              {healthScore}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{health.label}</p>
          <p className="text-xs text-muted-foreground">
            Health Score: {healthScore}%
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}