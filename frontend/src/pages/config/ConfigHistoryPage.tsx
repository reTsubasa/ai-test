import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Loader2, RefreshCw, ArrowLeft, History, FileDiff, Undo, Clock, User, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';
import { useConfigStore } from '../../stores/configStore';
import { configService } from '../../services/ConfigService';
import { useToast } from '../../components/ui/Toast';
import { ConfigHistoryTimeline } from '../../components/config/ConfigHistoryTimeline';
import { ConfigDiffView } from '../../components/config/ConfigDiffView';
import type { ConfigHistoryEntry, ConfigDiff } from '../../stores/configStore';

export function ConfigHistoryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    history,
    currentVersion,
    isLoadingHistory,
    isRollingBack,
    error,
    setHistory,
    setSelectedHistoryEntry,
    setLoadingHistory,
    setRollingBack,
    setError,
  } = useConfigStore();

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [diff, setDiff] = useState<ConfigDiff | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'diff'>('timeline');
  const [filter, setFilter] = useState<'all' | 'config' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(50);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, [limit, filter]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    setError(null);
    try {
      const data = await configService.getConfigHistory({
        limit,
      });
      setHistory(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration history');
      toast({
        title: 'Error',
        description: 'Failed to load configuration history',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewDiff = async (entry: ConfigHistoryEntry) => {
    try {
      const diffVersion = entry.version;
      const data = await configService.getConfigDiff({
        versionFrom: diffVersion,
        format: 'json',
      });
      setDiff(data.diff);
      setSelectedVersion(diffVersion);
      setSelectedHistoryEntry(entry);
      setActiveTab('diff');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load configuration diff',
        variant: 'destructive',
      });
    }
  };

  const handleRollback = async (entry: ConfigHistoryEntry) => {
    setRollingBack(true);
    try {
      const result = await configService.rollbackConfig({
        version: entry.version,
        comment: `Rollback to version ${entry.version} from Web UI`,
      });

      if (result.success) {
        toast({
          title: 'Rollback Successful',
          description: `Configuration rolled back to version ${result.version}`,
        });
        fetchHistory();
      } else {
        throw new Error('Failed to rollback configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rollback configuration');
      toast({
        title: 'Error',
        description: 'Failed to rollback configuration',
        variant: 'destructive',
      });
    } finally {
      setRollingBack(false);
    }
  };

  const handleCompare = async (version1: string, version2?: string) => {
    try {
      const data = await configService.getConfigDiff({
        versionFrom: version1,
        versionTo: version2,
        format: 'json',
      });
      setDiff(data.diff);
      setSelectedVersion(version1);
      setActiveTab('diff');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to compare configurations',
        variant: 'destructive',
      });
    }
  };

  const getEntryIcon = (entry: ConfigHistoryEntry) => {
    if (entry.isCurrent) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (entry.changes.some((c) => c.action === 'removed')) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    return <History className="h-4 w-4 text-blue-500" />;
  };

  const getFilteredHistory = () => {
    let filtered = history;

    if (filter !== 'all') {
      filtered = filtered.filter((entry) => {
        // Filter based on entry type (would need type field in ConfigHistoryEntry)
        return true;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) =>
        entry.description.toLowerCase().includes(query) ||
        entry.user.toLowerCase().includes(query) ||
        entry.changes.some((change) =>
          change.path.toLowerCase().includes(query)
        )
      );
    }

    return filtered;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/config')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuration History</h1>
            <p className="text-muted-foreground">
              View and restore previous configuration versions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">Last 20</SelectItem>
              <SelectItem value="50">Last 50</SelectItem>
              <SelectItem value="100">Last 100</SelectItem>
              <SelectItem value="200">Last 200</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchHistory} disabled={isLoadingHistory}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'timeline' | 'diff')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">
            <History className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="diff" disabled={!diff}>
            <FileDiff className="h-4 w-4 mr-2" />
            Diff View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Change History</CardTitle>
                  <CardDescription>
                    Track all configuration changes over time
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search history..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-[250px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ConfigHistoryTimeline
                  entries={getFilteredHistory()}
                  currentVersion={currentVersion}
                  onViewDiff={handleViewDiff}
                  onRollback={handleRollback}
                  onCompare={handleCompare}
                  isRollingBack={isRollingBack}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diff" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configuration Diff</CardTitle>
                  <CardDescription>
                    Compare configuration changes between versions
                  </CardDescription>
                </div>
                {selectedVersion && (
                  <Badge variant="outline">Version {selectedVersion}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {diff ? (
                <ConfigDiffView diff={diff} />
              ) : (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <FileDiff className="h-8 w-8 mr-2" />
                  Select a history entry to view diff
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function Input({ value, onChange, placeholder, className }: InputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    />
  );
}