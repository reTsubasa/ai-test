import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Separator } from '../ui/Separator';
import { FileDiff, Plus, Minus, ArrowRight, Eye, EyeOff, Download } from 'lucide-react';
import type { ConfigDiff } from '../../stores/configStore';
import { cn } from '../../utils/cn';

interface ConfigDiffViewProps {
  diff: ConfigDiff;
  onExport?: () => void;
}

export function ConfigDiffView({ diff, onExport }: ConfigDiffViewProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'side-by-side'>('unified');
  const [showFullConfig, setShowFullConfig] = useState(false);

  const changesByPath = diff.changes.reduce((acc, change) => {
    const path = change.path.split('.')[0];
    if (!acc[path]) {
      acc[path] = [];
    }
    acc[path].push(change);
    return acc;
  }, {} as Record<string, typeof diff.changes>);

  const getChangeCount = () => {
    return {
      added: diff.changes.filter((c) => c.action === 'added').length,
      removed: diff.changes.filter((c) => c.action === 'removed').length,
      modified: diff.changes.filter((c) => c.action === 'modified').length,
    };
  };

  const changeCount = getChangeCount();

  const renderChange = (change: any, index: number) => {
    return (
      <div key={index} className="flex items-start gap-3 py-2 px-3 rounded bg-muted/50">
        <span className="mt-0.5 shrink-0">
          {change.action === 'added' && <Plus className="h-4 w-4 text-green-500" />}
          {change.action === 'removed' && <Minus className="h-4 w-4 text-red-500" />}
          {change.action === 'modified' && <FileDiff className="h-4 w-4 text-blue-500" />}
        </span>
        <div className="flex-1 min-w-0">
          <code className="text-xs font-mono block text-muted-foreground">
            {change.path}
          </code>
          <div className="flex items-center gap-2 mt-1">
            {change.oldValue !== undefined && (
              <span className="text-sm line-through text-red-500/60 font-mono">
                {String(change.oldValue)}
              </span>
            )}
            {change.newValue !== undefined && change.oldValue !== undefined && (
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            )}
            {change.newValue !== undefined && (
              <span className="text-sm text-green-600 dark:text-green-400 font-mono">
                {String(change.newValue)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSideBySide = () => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Minus className="h-4 w-4 text-red-500" />
            Removed ({changeCount.removed})
          </h4>
          <div className="space-y-1">
            {diff.changes
              .filter((c) => c.action === 'removed' || c.action === 'modified')
              .map((change, index) => (
                <div key={index} className="p-2 rounded bg-red-500/10 border border-red-500/20">
                  <code className="text-xs font-mono block text-muted-foreground mb-1">
                    {change.path}
                  </code>
                  <span className="text-sm text-red-500 line-through font-mono">
                    {String(change.oldValue || 'N/A')}
                  </span>
                </div>
              ))}
            {changeCount.removed === 0 && (
              <p className="text-sm text-muted-foreground p-2">No items removed</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Plus className="h-4 w-4 text-green-500" />
            Added ({changeCount.added})
          </h4>
          <div className="space-y-1">
            {diff.changes
              .filter((c) => c.action === 'added' || c.action === 'modified')
              .map((change, index) => (
                <div key={index} className="p-2 rounded bg-green-500/10 border border-green-500/20">
                  <code className="text-xs font-mono block text-muted-foreground mb-1">
                    {change.path}
                  </code>
                  <span className="text-sm text-green-600 dark:text-green-400 font-mono">
                    {String(change.newValue || 'N/A')}
                  </span>
                </div>
              ))}
            {changeCount.added === 0 && (
              <p className="text-sm text-muted-foreground p-2">No items added</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUnified = () => {
    return (
      <div className="space-y-2">
        {Object.entries(changesByPath).map(([section, changes]) => (
          <div key={section}>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileDiff className="h-4 w-4" />
              {section}
              <Badge variant="outline" className="text-xs">
                {changes.length}
              </Badge>
            </h4>
            <div className="space-y-1">
              {changes.map((change, index) => renderChange(change, index))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRawDiff = () => {
    const lines: string[] = [];
    lines.push(`# Configuration Diff`);
    lines.push(`# From: ${diff.versionFrom}`);
    lines.push(`# To: ${diff.versionTo}`);
    lines.push(`# Total Changes: ${diff.changes.length}`);
    lines.push('');

    diff.changes.forEach((change) => {
      const actionChar = change.action === 'added' ? '+' : change.action === 'removed' ? '-' : '~';
      lines.push(`${actionChar} ${change.path}`);
      if (change.oldValue !== undefined) {
        lines.push(`  - ${change.oldValue}`);
      }
      if (change.newValue !== undefined) {
        lines.push(`  + ${change.newValue}`);
      }
      lines.push('');
    });

    return lines.join('\n');
  };

  const handleExport = () => {
    const content = renderRawDiff();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config-diff-${diff.versionFrom}-to-${diff.versionTo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onExport?.();
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">From Version</p>
            <p className="font-mono font-medium">{diff.versionFrom}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">To Version</p>
            <p className="font-mono font-medium">{diff.versionTo || 'current'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Plus className="h-3 w-3 text-green-500" />
            {changeCount.added} added
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Minus className="h-3 w-3 text-red-500" />
            {changeCount.removed} removed
          </Badge>
          <Badge variant="outline" className="gap-1">
            <FileDiff className="h-3 w-3 text-blue-500" />
            {changeCount.modified} modified
          </Badge>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* View controls */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'unified' | 'side-by-side')}>
          <TabsList>
            <TabsTrigger value="unified">Unified</TabsTrigger>
            <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFullConfig(!showFullConfig)}
        >
          {showFullConfig ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Condensed
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Full
            </>
          )}
        </Button>
      </div>

      {/* Diff content */}
      <div className={cn('rounded-lg border bg-background', showFullConfig ? 'max-h-[800px]' : 'max-h-[500px]')}>
        <div className="overflow-auto p-4">
          {viewMode === 'unified' && renderUnified()}
          {viewMode === 'side-by-side' && renderSideBySide()}
          {viewMode === 'raw' && (
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {renderRawDiff()}
            </pre>
          )}
        </div>
      </div>

      {/* Summary by section */}
      <div>
        <h3 className="font-semibold mb-3">Changes by Section</h3>
        <div className="grid gap-2 md:grid-cols-3">
          {Object.entries(changesByPath).map(([section, changes]) => (
            <div
              key={section}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-2">
                <FileDiff className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{section}</span>
              </div>
              <div className="flex items-center gap-2">
                {changes.some((c) => c.action === 'added') && (
                  <Badge variant="outline" className="text-xs text-green-500">
                    {changes.filter((c) => c.action === 'added').length}+
                  </Badge>
                )}
                {changes.some((c) => c.action === 'removed') && (
                  <Badge variant="outline" className="text-xs text-red-500">
                    {changes.filter((c) => c.action === 'removed').length}-
                  </Badge>
                )}
                {changes.some((c) => c.action === 'modified') && (
                  <Badge variant="outline" className="text-xs text-blue-500">
                    {changes.filter((c) => c.action === 'modified').length}~
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}