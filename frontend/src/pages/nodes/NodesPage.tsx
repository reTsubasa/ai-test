import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNodeStore, Node, NodeStatus, NodeType } from '../../stores/nodeStore';
import { nodeService } from '../../services/NodeService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { NodeCard } from '../../components/nodes/NodeCard';
import { NodeListTable } from '../../components/nodes/NodeListTable';
import { NodeFormDialog } from '../../components/nodes/NodeFormDialog';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { AlertCircle, Plus, Search, Grid3X3, List, Filter, MoreHorizontal, Trash2 } from 'lucide-react';
import type { NodeFormData } from '../../components/nodes/NodeFormDialog';

type ViewMode = 'card' | 'table';

export function NodesPage() {
  const navigate = useNavigate();
  const nodes = useNodeStore((state) => state.nodes);
  const setNodes = useNodeStore((state) => state.setNodes);
  const addNode = useNodeStore((state) => state.addNode);
  const updateNode = useNodeStore((state) => state.updateNode);
  const removeNode = useNodeStore((state) => state.removeNode);
  const isLoading = useNodeStore((state) => state.isLoading);
  const setLoading = useNodeStore((state) => state.setLoading);

  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<NodeStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<NodeType | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await nodeService.getNodes();
      setNodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nodes');
      // Use mock data for development
      setNodes(mockNodes);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = async (data: NodeFormData) => {
    try {
      const nodeData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      const newNode = await nodeService.addNode(nodeData);
      addNode(newNode);
    } catch (err) {
      // For development, add a mock node
      const newNode: Node = {
        id: `node-${Date.now()}`,
        name: data.name,
        hostname: data.hostname,
        ipAddress: data.ipAddress,
        port: data.port,
        type: data.type,
        status: 'online',
        version: '1.4.0',
        description: data.description,
        location: data.location,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        healthMetrics: [],
        lastConnected: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addNode(newNode);
    }
  };

  const handleUpdateNode = async (data: NodeFormData) => {
    if (!editingNode) return;
    try {
      const nodeData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      const updatedNode = await nodeService.updateNode(editingNode.id, nodeData);
      updateNode(editingNode.id, updatedNode);
      setEditingNode(null);
    } catch (err) {
      // For development, update the node locally
      updateNode(editingNode.id, {
        name: data.name,
        hostname: data.hostname,
        ipAddress: data.ipAddress,
        port: data.port,
        type: data.type,
        description: data.description,
        location: data.location,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      });
      setEditingNode(null);
    }
  };

  const handleDeleteNode = async (node: Node) => {
    if (!confirm(`Are you sure you want to delete "${node.name}"?`)) return;
    try {
      await nodeService.deleteNode(node.id);
      removeNode(node.id);
    } catch (err) {
      // For development, remove the node locally
      removeNode(node.id);
    }
  };

  const handleTestConnection = async (data: { ipAddress: string; port: number; hostname: string }) => {
    try {
      const result = await nodeService.testNewConnection(data.ipAddress, data.port, data.hostname);
      return result.success;
    } catch (err) {
      return false;
    }
  };

  const handleViewNode = (node: Node) => {
    navigate(`/nodes/${node.id}`);
  };

  const handleEditNode = (node: Node) => {
    setEditingNode(node);
    setIsFormOpen(true);
  };

  const handleToggleSelect = (nodeId: string) => {
    setSelectedNodeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.ipAddress.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || node.status === statusFilter;
    const matchesType = typeFilter === 'all' || node.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const nodeStats = {
    total: nodes.length,
    online: nodes.filter((n) => n.status === 'online').length,
    offline: nodes.filter((n) => n.status === 'offline').length,
    degraded: nodes.filter((n) => n.status === 'degraded').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nodes</h1>
          <p className="text-muted-foreground">
            Manage your VyOS network nodes and infrastructure
          </p>
        </div>
        <Button onClick={() => { setEditingNode(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Node
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodeStats.total}</div>
            <p className="text-xs text-muted-foreground">All registered nodes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{nodeStats.online}</div>
            <p className="text-xs text-muted-foreground">
              {nodeStats.total > 0 ? `${Math.round((nodeStats.online / nodeStats.total) * 100)}%` : '0%'} of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{nodeStats.offline}</div>
            <p className="text-xs text-muted-foreground">Unavailable nodes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Degraded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{nodeStats.degraded}</div>
            <p className="text-xs text-muted-foreground">Nodes with warnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as NodeStatus | 'all')}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="degraded">Degraded</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as NodeType | 'all')}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Types</option>
                <option value="router">Router</option>
                <option value="switch">Switch</option>
                <option value="firewall">Firewall</option>
                <option value="load-balancer">Load Balancer</option>
                <option value="other">Other</option>
              </select>
              <div className="flex rounded-md border border-input">
                <Button
                  variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('card')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading nodes...</p>
          </CardContent>
        </Card>
      ) : filteredNodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No nodes found</p>
            <p className="text-sm text-muted-foreground/70">
              {nodes.length === 0 ? 'Add your first node to get started' : 'Try adjusting your filters'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onView={handleViewNode}
              onEdit={handleEditNode}
              onDelete={handleDeleteNode}
              onTestConnection={() => nodeService.testConnection(node.id).catch(() => {})}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Node List</CardTitle>
            <CardDescription>
              {filteredNodes.length} node{filteredNodes.length !== 1 ? 's' : ''} displayed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NodeListTable
              nodes={filteredNodes}
              onView={handleViewNode}
              onEdit={handleEditNode}
              onDelete={handleDeleteNode}
              onTestConnection={(node) => nodeService.testConnection(node.id).catch(() => {})}
            />
          </CardContent>
        </Card>
      )}

      <NodeFormDialog
        node={editingNode}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingNode(null);
        }}
        onSubmit={editingNode ? handleUpdateNode : handleAddNode}
        onTestConnection={handleTestConnection}
      />
    </div>
  );
}

// Mock data for development
const mockNodes: Node[] = [
  {
    id: 'node-1',
    name: 'vyos-router-01',
    hostname: 'router01.example.com',
    ipAddress: '192.168.1.1',
    port: 22,
    type: 'router',
    status: 'online',
    version: '1.4.0',
    description: 'Main edge router',
    location: 'Data Center A',
    tags: ['production', 'edge'],
    healthMetrics: [
      { name: 'CPU', value: 45, unit: '%', status: 'healthy', timestamp: new Date() },
      { name: 'Memory', value: 62, unit: '%', status: 'healthy', timestamp: new Date() },
    ],
    lastConnected: new Date(Date.now() - 60000),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'node-2',
    name: 'vyos-switch-01',
    hostname: 'switch01.example.com',
    ipAddress: '192.168.1.10',
    port: 22,
    type: 'switch',
    status: 'online',
    version: '1.4.0',
    description: 'Core switch',
    location: 'Data Center A',
    tags: ['production', 'core'],
    healthMetrics: [
      { name: 'CPU', value: 12, unit: '%', status: 'healthy', timestamp: new Date() },
      { name: 'Memory', value: 38, unit: '%', status: 'healthy', timestamp: new Date() },
    ],
    lastConnected: new Date(Date.now() - 120000),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date(),
  },
  {
    id: 'node-3',
    name: 'vyos-firewall-01',
    hostname: 'firewall01.example.com',
    ipAddress: '192.168.1.20',
    port: 22,
    type: 'firewall',
    status: 'degraded',
    version: '1.3.5',
    description: 'Perimeter firewall',
    location: 'Data Center B',
    tags: ['production', 'perimeter'],
    healthMetrics: [
      { name: 'CPU', value: 89, unit: '%', status: 'warning', timestamp: new Date() },
      { name: 'Memory', value: 92, unit: '%', status: 'warning', timestamp: new Date() },
    ],
    lastConnected: new Date(Date.now() - 300000),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
  {
    id: 'node-4',
    name: 'vyos-router-02',
    hostname: 'router02.example.com',
    ipAddress: '192.168.1.2',
    port: 22,
    type: 'router',
    status: 'offline',
    version: '1.4.0',
    description: 'Backup router',
    location: 'Data Center B',
    tags: ['backup', 'standby'],
    healthMetrics: [],
    lastConnected: new Date(Date.now() - 3600000),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
];