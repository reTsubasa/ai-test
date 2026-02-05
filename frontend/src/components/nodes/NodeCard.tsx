import { Node } from '../../stores/nodeStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { NodeHealth } from './NodeHealth';
import { MoreVertical, Server, MapPin, Clock } from 'lucide-react';

interface NodeCardProps {
  node: Node;
  onView?: (node: Node) => void;
  onEdit?: (node: Node) => void;
  onDelete?: (node: Node) => void;
  onTestConnection?: (node: Node) => void;
}

export function NodeCard({
  node,
  onView,
  onEdit,
  onDelete,
  onTestConnection,
}: NodeCardProps) {
  const getStatusColor = (status: Node['status']) => {
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
        return 'default';
    }
  };

  const getTypeIcon = (type: Node['type']) => {
    return <Server className="h-4 w-4" />;
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

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="text-muted-foreground">
              {getTypeIcon(node.type)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate" title={node.name}>
                {node.name}
              </CardTitle>
              <CardDescription className="truncate">
                {node.hostname}
              </CardDescription>
            </div>
          </div>
          <Badge variant={getStatusColor(node.status)} className="shrink-0">
            {node.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Server className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium capitalize">{node.type.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Location:</span>
            <span className="font-medium">{node.location || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Last seen:</span>
            <span className="font-medium">{formatLastConnected(node.lastConnected)}</span>
          </div>
        </div>

        <NodeHealth node={node} />

        {node.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {node.description}
          </p>
        )}

        {node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {node.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {node.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{node.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView(node)}
            >
              View
            </Button>
          )}
          {onTestConnection && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTestConnection(node)}
            >
              Test
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(node)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}