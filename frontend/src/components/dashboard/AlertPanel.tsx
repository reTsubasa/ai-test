import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Server,
  Clock,
  Check,
} from 'lucide-react';
import type { Alert } from '../../stores/dashboardStore';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface AlertPanelProps {
  alerts: Alert[];
  isLoading?: boolean;
  maxAlerts?: number;
  onAcknowledgeAlert?: (alertId: string) => void;
  onClearAlerts?: () => void;
}

export function AlertPanel({
  alerts,
  isLoading,
  maxAlerts = 5,
  onAcknowledgeAlert,
  onClearAlerts,
}: AlertPanelProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const getIconForSeverity = (severity: Alert['severity']) => {
    switch (severity) {
      case 'info':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getColorForSeverity = (severity: Alert['severity']) => {
    switch (severity) {
      case 'info':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'error':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getBorderColorForSeverity = (severity: Alert['severity']) => {
    switch (severity) {
      case 'info':
        return 'border-blue-500/30';
      case 'warning':
        return 'border-yellow-500/30';
      case 'error':
        return 'border-orange-500/30';
      case 'critical':
        return 'border-red-500/30';
      default:
        return 'border-border';
    }
  };

  const getUnacknowledgedCount = () => {
    return alerts.filter((alert) => !alert.acknowledged).length;
  };

  const displayAlerts = alerts.slice(0, maxAlerts);

  const handleAcknowledge = (alertId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onAcknowledgeAlert) {
      onAcknowledgeAlert(alertId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts
          </CardTitle>
          <CardDescription>System notifications and warnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-4 rounded-lg border bg-card">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-64 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unacknowledgedCount = getUnacknowledgedCount();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alerts
              {unacknowledgedCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unacknowledgedCount}
                </span>
              )}
            </CardTitle>
            <CardDescription>System notifications and warnings</CardDescription>
          </div>
          {alerts.length > 0 && onClearAlerts && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAlerts}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-muted-foreground">No active alerts</p>
            <p className="text-xs text-muted-foreground mt-1">
              System is operating normally
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() =>
                  setExpandedAlert(expandedAlert === alert.id ? null : alert.id)
                }
                className={`flex gap-3 p-4 rounded-lg border bg-card cursor-pointer transition-all hover:bg-accent/50 ${alert.acknowledged ? 'opacity-60' : ''} ${getBorderColorForSeverity(
                  alert.severity
                )}`}
              >
                {/* Severity Icon */}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${getColorForSeverity(
                    alert.severity
                  )}`}
                >
                  {getIconForSeverity(alert.severity)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {alert.node}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(alert.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acknowledged badge */}
                  {alert.acknowledged && (
                    <div className="flex items-center gap-1 text-xs text-green-500 mt-2">
                      <Check className="h-3 w-3" />
                      <span>Acknowledged</span>
                    </div>
                  )}
                </div>

                {/* Acknowledge button */}
                {!alert.acknowledged && onAcknowledgeAlert && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-8 w-8"
                    onClick={(e) => handleAcknowledge(alert.id, e)}
                    title="Acknowledge alert"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Show more indicator */}
        {alerts.length > maxAlerts && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              +{alerts.length - maxAlerts} more {alerts.length - maxAlerts === 1 ? 'alert' : 'alerts'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}