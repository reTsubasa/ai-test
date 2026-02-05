import { useEffect, useCallback, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { useSystemStore } from '../../stores/systemStore';
import { systemService } from '../../services/SystemService';
import { LogViewer } from '../../components/system/LogViewer';
import {
  FileText,
  RefreshCw,
  Download,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

export function SystemLogsPage() {
  const {
    logs,
    isLoadingLogs,
    setLogs,
    setLoadingLogs,
    setError,
  } = useSystemStore();

  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [maxLines, setMaxLines] = useState(1000);
  const [error, setErrorState] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load logs on mount
  useEffect(() => {
    loadLogs();
  }, []);

  // Auto refresh logs
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshIntervalRef.current = setInterval(() => {
        loadLogs();
      }, 5000); // Refresh every 5 seconds
    } else if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  const loadLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const logsData = await systemService.getSystemLogs({
        level: filterLevel === 'all' ? undefined : filterLevel as any,
        lines: maxLines,
      });
      setLogs(logsData);
      setErrorState(null);
    } catch (error) {
      setErrorState(error instanceof Error ? error.message : 'Failed to load system logs');
    } finally {
      setLoadingLogs(false);
    }
  }, [filterLevel, maxLines, setLoadingLogs, setLogs]);

  const handleRefresh = () => {
    loadLogs();
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all system logs?')) {
      return;
    }

    try {
      await systemService.clearSystemLogs();
      setSuccessMessage('System logs cleared successfully');
      setLogs([]);
    } catch (error) {
      setErrorState(error instanceof Error ? error.message : 'Failed to clear system logs');
    }
  };

  const handleExportLogs = async () => {
    try {
      setIsExporting(true);
      const blob = await systemService.exportSystemLogs({
        level: filterLevel === 'all' ? undefined : filterLevel as any,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vyos-logs-${new Date().toISOString().slice(0, 10)}.log`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage('Logs exported successfully');
    } catch (error) {
      setErrorState(error instanceof Error ? error.message : 'Failed to export logs');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.message.toLowerCase().includes(searchLower) ||
        log.facility.toLowerCase().includes(searchLower) ||
        (log.process && log.process.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const getLogCountByLevel = (level: string) => {
    return logs.filter((log) => log.level === level).length;
  };

  const logLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'debug', label: 'Debug' },
    { value: 'info', label: 'Info' },
    { value: 'notice', label: 'Notice' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'critical', label: 'Critical' },
  ];

  const maxLinesOptions = [
    { value: '100', label: '100 lines' },
    { value: '500', label: '500 lines' },
    { value: '1000', label: '1000 lines' },
    { value: '5000', label: '5000 lines' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground">
            View and monitor system activity logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            disabled={isLoadingLogs}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refreshing' : 'Auto-refresh'}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportLogs}
            disabled={isExporting || logs.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="destructive"
            onClick={handleClearLogs}
            disabled={isLoadingLogs}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Logs
          </Button>
          <Button onClick={handleRefresh} disabled={isLoadingLogs}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Level:</span>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {logLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Lines:</span>
              <Select value={String(maxLines)} onValueChange={(v) => setMaxLines(parseInt(v))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {maxLinesOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">Showing {filteredLogs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <Badge variant="destructive">
              {getLogCountByLevel('error')}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{getLogCountByLevel('error')}</div>
            <p className="text-xs text-muted-foreground">{getLogCountByLevel('critical')} critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <Badge variant="outline">
              {getLogCountByLevel('warning')}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{getLogCountByLevel('warning')}</div>
            <p className="text-xs text-muted-foreground">{getLogCountByLevel('notice')} notices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <Badge variant="default">
              {getLogCountByLevel('info')}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getLogCountByLevel('info')}</div>
            <p className="text-xs text-muted-foreground">{getLogCountByLevel('debug')} debug</p>
          </CardContent>
        </Card>
      </div>

      {/* Log Viewer */}
      <LogViewer
        logs={filteredLogs}
        isLoading={isLoadingLogs}
        searchTerm={searchTerm}
      />
    </div>
  );
}