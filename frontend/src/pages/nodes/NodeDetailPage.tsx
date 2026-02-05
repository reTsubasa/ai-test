import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNodeStore, Node } from '../../stores/nodeStore';
import { nodeService } from '../../services/NodeService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { NodeHealth } from '../../components/nodes/NodeHealth';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { Progress } from '../../components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { ArrowLeft, Edit, Trash2, RefreshCw, Server, MapPin, Clock, Calendar, Hash, Activity, Cpu, HardDrive, Network, Shield } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type MetricDataPoint = {
  timestamp: string;
  cpu: number;
  memory: number;
  bandwidthIn: number;
  bandwidthOut: number;
};

export function NodeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const nodes = useNodeStore((state) => state.nodes);
  const updateNode = useNodeStore((state) => state.updateNode);
  const removeNode = useNodeStore((state) => state.removeNode);

  const [node, setNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; latency?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metricHistory, setMetricHistory] = useState<MetricDataPoint[]>([]);

  useEffect(() => {
    loadNode();
  }, [id]);

  useEffect(() => {
    if (node) {
      generateMetricHistory();
    }
  }, [node]);

  const loadNode = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await nodeService.getNodeById(id);
      setNode(data);
    } catch (err) {
      // For development, find node from store
      const foundNode = nodes.find((n) => n.id === id);
      if (foundNode) {
        setNode(foundNode);
      } else {
        setError('Node not found');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateMetricHistory = () => {
    const history: MetricDataPoint[] = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 3600000);
      history.push({
        timestamp: timestamp.getHours().toString().padStart(2, '0') + ':00',
        cpu: Math.floor(Math.random() * 40) + 30,
        memory: Math.floor(Math.random() * 30) + 40,
        bandwidthIn: Math.floor(Math.random() * 100) + 50,
        bandwidthOut: Math.floor(Math.random() * 80) + 30,
      });
    }
    setMetricHistory(history);
  };

  const handleTestConnection = async () => {
    if (!node) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await nodeService.testConnection(node.id);
      setTestResult(result);
      if (result.success) {
        updateNode(node.id, { status: 'online', lastConnected: new Date() });
        setNode((prev) => prev ? { ...prev, status: 'online', lastConnected: new Date() } : null);
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!node || !confirm(`Are you sure you want to delete "${node.name}"?`)) return;
    try {
      await nodeService.deleteNode(node.id);
      removeNode(node.id);
      navigate('/nodes');
    } catch (err) {
      // For development, delete from store
      removeNode(node.id);
      navigate('/nodes');
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getStatusVariant = (status: Node['status']) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'destructive';
      case 'degraded':
        return 'warning';
      case 'maintenance':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading node details...</p>
      </div>
    );
  }

  if (error || !node) {
    return (
      <Alert variant="destructive">
        <p className="font-medium">Error</p>
        <AlertDescription>{error || 'Node not found'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/nodes')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{node.name}</h1>
              <Badge variant={getStatusVariant(node.status)}>
                {node.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{node.hostname}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/nodes/${node.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult.success ? 'success' : 'destructive'}>
          <AlertDescription>
            {testResult.success
              ? `Connection successful! Latency: ${testResult.latency}ms`
              : testResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusVariant(node.status)} className="text-base px-3 py-1">
              {node.status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Last seen: {formatDate(node.lastConnected)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {node.healthMetrics.length > 0
                ? Math.round(
                    (node.healthMetrics.filter((m) => m.status === 'healthy').length / node.healthMetrics.length) * 100
                  )
                : node.status === 'online' ? 100 : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {node.healthMetrics.length} metrics monitored
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{node.type.replace('-', ' ')}</div>
            <p className="text-xs text-muted-foreground mt-2">VyOS {node.version}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{node.location || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {node.ipAddress}:{node.port}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Node Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono">{node.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Hostname:</span>
                    <span>{node.hostname}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Network className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">IP Address:</span>
                    <span className="font-mono">{node.ipAddress}:{node.port}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Connected:</span>
                    <span>{formatDate(node.lastConnected)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(node.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{formatDate(node.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {node.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">{node.description}</p>
                </div>
              )}

              {node.tags.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {node.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <NodeHealth node={node} showDetails />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CPU & Memory Usage (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metricHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="cpu" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="CPU %" />
                  <Area type="monotone" dataKey="memory" stackId="2" stroke="#10b981" fill="#10b981" name="Memory %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network Bandwidth (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metricHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="bandwidthIn" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="In (Mbps)" />
                  <Area type="monotone" dataKey="bandwidthOut" stackId="2" stroke="#f59e0b" fill="#f59e0b" name="Out (Mbps)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interfaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Interfaces</CardTitle>
              <CardDescription>Active network interfaces on this node</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInterfaces.map((iface) => (
                  <div key={iface.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{iface.name}</span>
                        <Badge variant={iface.status === 'up' ? 'success' : 'destructive'}>
                          {iface.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {iface.ip} / {iface.mac}
                      </p>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <p className="text-sm text-muted-foreground">In</p>
                        <p className="font-medium">{iface.trafficIn}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Out</p>
                        <p className="font-medium">{iface.trafficOut}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Current node configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{mockConfig}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const mockInterfaces = [
  {
    name: 'eth0',
    ip: '192.168.1.1/24',
    mac: '00:11:22:33:44:55',
    status: 'up',
    trafficIn: '1.2 GB',
    trafficOut: '0.8 GB',
  },
  {
    name: 'eth1',
    ip: '10.0.0.1/24',
    mac: '00:11:22:33:44:56',
    status: 'up',
    trafficIn: '2.5 GB',
    trafficOut: '3.1 GB',
  },
  {
    name: 'eth2',
    ip: '172.16.0.1/24',
    mac: '00:11:22:33:44:57',
    status: 'down',
    trafficIn: '0 B',
    trafficOut: '0 B',
  },
];

const mockConfig = `
interfaces {
    ethernet eth0 {
        address 192.168.1.1/24
        description "LAN Interface"
        duplex auto
        hw-id 00:11:22:33:44:55
        speed auto
    }
    ethernet eth1 {
        address 10.0.0.1/24
        description "WAN Interface"
        duplex auto
        hw-id 00:11:22:33:44:56
        speed auto
    }
}
system {
    host-name vyos-router-01
    time-zone UTC
}
service {
    ssh {
        port 22
    }
}
`;