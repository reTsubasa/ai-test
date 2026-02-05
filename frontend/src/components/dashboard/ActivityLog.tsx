import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Clock, Settings, AlertCircle, Info, AlertTriangle, Server } from 'lucide-react';
import type { ActivityLogEntry } from '../../stores/dashboardStore';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityLogProps {
  entries: ActivityLogEntry[];
  isLoading?: boolean;
  maxEntries?: number;
}

export function ActivityLog({ entries, isLoading, maxEntries = 10 }: ActivityLogProps) {
  const getIconForType = (type: ActivityLogEntry['type']) => {
    switch (type) {
      case 'config':
        return <Settings className="h-4 w-4" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getColorForType = (type: ActivityLogEntry['type']) => {
    switch (type) {
      case 'config':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'alert':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'info':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getLabelForType = (type: ActivityLogEntry['type']) => {
    switch (type) {
      case 'config':
        return 'Configuration';
      case 'alert':
        return 'Alert';
      case 'info':
        return 'Information';
      case 'warning':
        return 'Warning';
      default:
        return 'Activity';
    }
  };

  const displayEntries = entries.slice(0, maxEntries);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest configuration changes and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-64 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-3 w-20 bg-muted animate-pulse rounded flex-shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest configuration changes and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest configuration changes and events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {/* Icon */}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center border flex-shrink-0 ${getColorForType(
                  entry.type
                )}`}
              >
                {getIconForType(entry.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-medium truncate">{entry.message}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Server className="h-3 w-3" />
                        {entry.node}
                      </span>
                      {entry.user && (
                        <>
                          <span>•</span>
                          <span>{entry.user}</span>
                        </>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getColorForType(
                        entry.type
                      )}`}>
                        {getLabelForType(entry.type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time */}
              <div className="text-xs text-muted-foreground flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(entry.timestamp), 'MMM d, HH:mm')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more indicator */}
        {entries.length > maxEntries && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              +{entries.length - maxEntries} more entries
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}