import type { SystemLogEntry } from '../../stores/systemStore';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';

interface LogViewerProps {
  logs: SystemLogEntry[];
  isLoading: boolean;
  searchTerm?: string;
}

export function LogViewer({ logs, isLoading, searchTerm = '' }: LogViewerProps) {
  const getLevelVariant = (level: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (level) {
      case 'critical':
      case 'error':
        return 'destructive';
      case 'warning':
        return 'outline';
      case 'debug':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'text-red-500';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-500';
      case 'notice':
        return 'text-blue-400';
      case 'info':
        return 'text-blue-500';
      case 'debug':
        return 'text-gray-400';
      default:
        return 'text-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const highlightText = (text: string, term: string): React.ReactNode => {
    if (!term) return text;

    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-300 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 p-2 rounded bg-muted/20">
            <div className="h-5 w-24 bg-muted animate-pulse rounded" />
            <div className="h-5 w-16 bg-muted animate-pulse rounded" />
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="flex-1 h-5 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold mb-2">No Logs Found</h3>
        <p className="text-muted-foreground">
          {searchTerm
            ? `No logs matching "${searchTerm}"`
            : 'No system logs available'}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      <ScrollArea className="h-[500px]">
        <div className="font-mono text-sm">
          <div className="sticky top-0 bg-card border-b p-2 flex gap-4 text-xs font-semibold text-muted-foreground">
            <span className="w-24">Timestamp</span>
            <span className="w-16">Level</span>
            <span className="w-20">Facility</span>
            <span className="flex-1">Message</span>
          </div>
          {logs.map((log, index) => {
            const prevDate = index > 0 ? formatDate(logs[index - 1].timestamp) : null;
            const currentDate = formatDate(log.timestamp);
            const showDateHeader = prevDate !== currentDate;

            return (
              <div key={`${log.timestamp}-${index}`}>
                {showDateHeader && (
                  <div className="bg-muted/30 border-b py-1 px-2 text-xs font-semibold text-muted-foreground">
                    {currentDate}
                  </div>
                )}
                <div className="flex gap-4 p-2 hover:bg-muted/20 transition-colors border-b last:border-b-0">
                  <span className="w-24 shrink-0 text-muted-foreground flex items-center">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className={`w-16 shrink-0 flex items-center ${getLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="w-20 shrink-0 text-muted-foreground truncate flex items-center">
                    {log.facility}
                  </span>
                  <span className="flex-1 min-w-0 truncate flex items-center">
                    {highlightText(log.message, searchTerm)}
                  </span>
                  {log.process && (
                    <span className="text-xs text-muted-foreground">
                      [{log.process}{log.pid ? `/${log.pid}` : ''}]
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-2 text-xs text-muted-foreground flex justify-between">
        <span>Showing {logs.length} entries</span>
        <span>Oldest at bottom</span>
      </div>
    </div>
  );
}