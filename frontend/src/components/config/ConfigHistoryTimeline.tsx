import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { Clock, User, FileDiff, Undo, ChevronDown, ChevronRight, CheckCircle, AlertCircle, Plus, Minus } from 'lucide-react';
import type { ConfigHistoryEntry, ConfigChange } from '../../stores/configStore';
import { cn } from '../../utils/cn';

interface ConfigHistoryTimelineProps {
  entries: ConfigHistoryEntry[];
  currentVersion?: string | null;
  onViewDiff: (entry: ConfigHistoryEntry) => void;
  onRollback: (entry: ConfigHistoryEntry) => void;
  onCompare: (version1: string, version2?: string) => void;
  isRollingBack?: boolean;
}

export function ConfigHistoryTimeline({
  entries,
  currentVersion,
  onViewDiff,
  onRollback,
  onCompare,
  isRollingBack = false,
}: ConfigHistoryTimelineProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [compareStart, setCompareStart] = useState<string | null>(null);

  const toggleExpanded = (entryId: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleCompareClick = (entry: ConfigHistoryEntry) => {
    if (!compareMode) {
      setCompareMode(true);
      setCompareStart(entry.version);
    } else if (compareStart) {
      onCompare(compareStart, entry.version);
      setCompareMode(false);
      setCompareStart(null);
    }
  };

  const handleCancelCompare = () => {
    setCompareMode(false);
    setCompareStart(null);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFullDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChangeIcon = (change: ConfigChange) => {
    switch (change.action) {
      case 'added':
        return <Plus className="h-3 w-3 text-green-500" />;
      case 'removed':
        return <Minus className="h-3 w-3 text-red-500" />;
      case 'modified':
        return <FileDiff className="h-3 w-3 text-blue-500" />;
    }
  };

  const getChangeColor = (action: ConfigChange['action']) => {
    switch (action) {
      case 'added':
        return 'text-green-600 dark:text-green-400';
      case 'removed':
        return 'text-red-600 dark:text-red-400';
      case 'modified':
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Clock className="h-8 w-8 mr-2" />
        No configuration history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {compareMode && (
        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <FileDiff className="h-4 w-4 text-blue-500" />
            <span>
              Compare mode active: Select another version to compare with {compareStart}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancelCompare}>
            Cancel
          </Button>
        </div>
      )}

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

        {entries.map((entry, index) => {
          const isExpanded = expandedEntries.has(entry.id);
          const isCompareTarget = compareStart === entry.version;
          const isLatest = index === 0;

          return (
            <div key={entry.id} className="relative pl-14 pb-6 last:pb-0">
              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute left-4 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center',
                  entry.isCurrent
                    ? 'bg-green-500 border-green-500'
                    : isCompareTarget
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-muted border-border'
                )}
              >
                {entry.isCurrent && <CheckCircle className="h-3 w-3 text-background" />}
              </div>

              <Card
                className={cn(
                  'transition-all',
                  isCompareTarget && 'ring-2 ring-blue-500 border-blue-500/50'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {entry.isCurrent && (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Current
                          </Badge>
                        )}
                        {isLatest && !entry.isCurrent && (
                          <Badge variant="outline" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Latest
                          </Badge>
                        )}
                        <Badge variant="secondary" className="font-mono text-xs">
                          {entry.version}
                        </Badge>
                        {entry.changes.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {entry.changes.length} change{entry.changes.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold mb-1">{entry.description}</h3>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <time title={formatFullDate(entry.timestamp)}>
                            {formatDate(entry.timestamp)}
                          </time>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{entry.user}</span>
                        </div>
                        {entry.node && (
                          <Badge variant="outline" className="text-xs">
                            {entry.node}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(entry.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && entry.changes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Separator />
                      <div className="space-y-2 pt-2">
                        {entry.changes.map((change, changeIndex) => (
                          <div
                            key={changeIndex}
                            className="flex items-start gap-3 p-2 rounded bg-muted/50"
                          >
                            <span className="mt-0.5">{getChangeIcon(change)}</span>
                            <div className="flex-1 min-w-0">
                              <code className={cn('text-xs font-mono block truncate', getChangeColor(change.action))}>
                                {change.path}
                              </code>
                              <div className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium capitalize">{change.action}:</span>
                                {change.oldValue !== undefined && (
                                  <span className="ml-1 line-through opacity-60">
                                    {String(change.oldValue)}
                                  </span>
                                )}
                                {change.newValue !== undefined && (
                                  <span className="ml-1">
                                    {String(change.newValue)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDiff(entry)}
                    >
                      <FileDiff className="h-4 w-4 mr-2" />
                      View Diff
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompareClick(entry)}
                      disabled={compareMode && compareStart === entry.version}
                    >
                      {compareMode && compareStart === entry.version ? (
                        'Selected'
                      ) : (
                        <>
                          <FileDiff className="h-4 w-4 mr-2" />
                          Compare
                        </>
                      )}
                    </Button>
                    {!entry.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRollback(entry)}
                        disabled={isRollingBack}
                      >
                        <Undo className="h-4 w-4 mr-2" />
                        Rollback
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}