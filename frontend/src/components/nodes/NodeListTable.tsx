import { Node } from '../../stores/nodeStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';
import { Badge } from '../ui/Badge';
import { NodeHealth } from './NodeHealth';
import { Button } from '../ui/Button';
import { MoreVertical, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';

interface NodeListTableProps {
  nodes: Node[];
  onView?: (node: Node) => void;
  onEdit?: (node: Node) => void;
  onDelete?: (node: Node) => void;
  onTestConnection?: (node: Node) => void;
}

export function NodeListTable({
  nodes,
  onView,
  onEdit,
  onDelete,
  onTestConnection,
}: NodeListTableProps) {
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

  const getTypeLabel = (type: Node['type']) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatLastConnected = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MoreVertical className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No nodes found</p>
        <p className="text-sm text-muted-foreground/70">
          Add your first node to get started
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Health</TableHead>
          <TableHead>Last Connected</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {nodes.map((node) => (
          <TableRow key={node.id}>
            <TableCell>
              <div>
                <p className="font-medium">{node.name}</p>
                <p className="text-sm text-muted-foreground">{node.hostname}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{getTypeLabel(node.type)}</Badge>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{node.ipAddress}</p>
                <p className="text-sm text-muted-foreground">:{node.port}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(node.status)}>
                {node.status}
              </Badge>
            </TableCell>
            <TableCell>
              <NodeHealth node={node} />
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {formatLastConnected(node.lastConnected)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                {onView && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(node)}
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {onTestConnection && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTestConnection(node)}
                    title="Test connection"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(node)}
                    title="Edit node"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(node)}
                    title="Delete node"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}