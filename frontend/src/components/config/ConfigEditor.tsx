import { useState, useCallback, useMemo } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Switch } from '../ui/Switch';
import { Alert } from '../ui/Alert';
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, Search, FileJson, Settings, Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';
import type { ConfigNode } from '../../stores/configStore';
import { cn } from '../../utils/cn';

export interface ConfigEditorProps {
  config: ConfigNode[];
  expandedPaths?: Set<string>;
  onNodeExpand?: (path: string[]) => void;
  onNodeCollapse?: (path: string[]) => void;
  onNodeUpdate?: (path: string[], value: string | number | boolean | null) => void;
  onNodeAdd?: (parentPath: string[], node: ConfigNode) => void;
  onNodeRemove?: (path: string[]) => void;
  readOnly?: boolean;
  showValidation?: boolean;
  validationErrors?: Array<{ path: string; message: string }>;
}

export function ConfigEditor({
  config,
  expandedPaths = new Set(),
  onNodeExpand,
  onNodeCollapse,
  onNodeUpdate,
  onNodeAdd,
  onNodeRemove,
  readOnly = false,
  showValidation = true,
  validationErrors = [],
}: ConfigEditorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNode, setEditingNode] = useState<{ path: string[]; node: ConfigNode } | null>(null);
  const [addingTo, setAddingTo] = useState<string[] | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'json'>('tree');

  const toggleExpanded = useCallback((path: string[]) => {
    const pathStr = path.join('.');
    if (expandedPaths.has(pathStr)) {
      onNodeCollapse?.(path);
    } else {
      onNodeExpand?.(path);
    }
  }, [expandedPaths, onNodeExpand, onNodeCollapse]);

  const isExpanded = useCallback((path: string[]) => {
    return expandedPaths.has(path.join('.'));
  }, [expandedPaths]);

  const getNodeValidation = useCallback((path: string[]) => {
    const pathStr = path.join('.');
    return validationErrors.find((e) => e.path === pathStr);
  }, [validationErrors]);

  const filteredConfig = useMemo(() => {
    if (!searchQuery) return config;

    const filterNodes = (nodes: ConfigNode[]): ConfigNode[] => {
      const result: ConfigNode[] = [];
      const query = searchQuery.toLowerCase();

      for (const node of nodes) {
        const matchesSearch =
          node.name.toLowerCase().includes(query) ||
          String(node.value).toLowerCase().includes(query) ||
          node.description?.toLowerCase().includes(query);

        if (matchesSearch || (node.children && filterNodes(node.children).length > 0)) {
          result.push({
            ...node,
            children: node.children ? filterNodes(node.children) : undefined,
          });
        }
      }

      return result;
    };

    return filterNodes(config);
  }, [config, searchQuery]);

  const rawConfig = useMemo(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  const renderNode = (node: ConfigNode, path: string[] = [], depth: number = 0) => {
    const nodePath = [...path, node.name];
    const pathStr = nodePath.join('.');
    const hasChildren = node.children && node.children.length > 0;
    const expanded = isExpanded(nodePath);
    const validation = getNodeValidation(nodePath);
    const isEditing = editingNode?.path.join('.') === pathStr;
    const isAdding = addingTo?.join('.') === pathStr;

    return (
      <div key={pathStr} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors',
            validation && 'bg-red-500/5 border border-red-500/20',
            isEditing && 'bg-primary/10',
            'hover:bg-muted/50'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {/* Expand/collapse button */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 shrink-0"
              onClick={() => toggleExpanded(nodePath)}
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="h-5 w-5 shrink-0" />
          )}

          {/* Node type icon */}
          <div className="shrink-0">
            {node.type === 'object' && <FileJson className="h-4 w-4 text-muted-foreground" />}
            {node.type === 'array' && <FileJson className="h-4 w-4 text-blue-500" />}
            {node.type === 'boolean' && <Settings className="h-4 w-4 text-purple-500" />}
            {node.type === 'number' && <Settings className="h-4 w-4 text-green-500" />}
          </div>

          {/* Node name */}
          <span
            className={cn(
              'font-medium text-sm',
              node.isRequired && 'after:content-["*"] after:text-red-500 after:ml-0.5'
            )}
          >
            {node.name}
          </span>

          {/* Validation error indicator */}
          {validation && (
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          )}

          {/* Value */}
          {node.type !== 'object' && node.type !== 'array' && (
            <>
              <span className="text-muted-foreground text-xs">:</span>
              <span className={cn(
                'text-sm font-mono',
                node.type === 'boolean' && node.value && 'text-green-600',
                node.type === 'boolean' && !node.value && 'text-red-600'
              )}>
                {node.value === null ? 'null' : String(node.value)}
              </span>
            </>
          )}

          {/* Description */}
          {node.description && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {node.description}
            </span>
          )}

          {/* Actions */}
          {!readOnly && (
            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              {node.type === 'object' || node.type === 'array' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setAddingTo(nodePath)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setEditingNode({ path: nodePath, node })}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-500"
                onClick={() => onNodeRemove?.(nodePath)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Validation error message */}
        {validation && showValidation && (
          <div
            className="ml-8 mb-1 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600"
          >
            {validation.message}
          </div>
        )}

        {/* Child nodes */}
        {hasChildren && expanded && node.children && (
          <div className="mt-1">
            {node.children.map((child) => renderNode(child, nodePath, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleSaveEdit = (path: string[], value: string | number | boolean | null) => {
    onNodeUpdate?.(path, value);
    setEditingNode(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search configuration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'tree' | 'json')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tree">Tree View</SelectItem>
              <SelectItem value="json">JSON View</SelectItem>
            </SelectContent>
          </Select>
          {viewMode === 'tree' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedNodes(new Set<string>())}
            >
              Collapse All
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'tree' ? (
        <div className="rounded-lg border bg-background">
          {filteredConfig.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? 'No results found' : 'No configuration available'}
            </div>
          ) : (
            <div className="p-2">
              {filteredConfig.map((node) => renderNode(node))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-background">
          <div className="relative">
            <Textarea
              value={rawConfig}
              readOnly
              className="font-mono text-sm resize-none min-h-[400px]"
            />
          </div>
        </div>
      )}

      {/* Edit node dialog */}
      {editingNode && (
        <EditNodeDialog
          node={editingNode.node}
          onSave={(value) => handleSaveEdit(editingNode.path, value)}
          onCancel={() => setEditingNode(null)}
        />
      )}

      {/* Add node dialog */}
      {addingTo && (
        <AddNodeDialog
          onSave={(node) => onNodeAdd?.(addingTo, node)}
          onCancel={() => setAddingTo(null)}
        />
      )}

      {/* Validation summary */}
      {showValidation && validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <Alert.Description>
            {validationErrors.length} validation error(s) found
          </Alert.Description>
        </Alert>
      )}
    </div>
  );
}

interface EditNodeDialogProps {
  node: ConfigNode;
  onSave: (value: string | number | boolean | null) => void;
  onCancel: () => void;
}

function EditNodeDialog({ node, onSave, onCancel }: EditNodeDialogProps) {
  const [value, setValue] = useState<string>(String(node.value ?? ''));
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedValue: string | number | boolean | null = value;

    if (value === 'null' || value === '') {
      parsedValue = null;
    } else if (value === 'true') {
      parsedValue = true;
    } else if (value === 'false') {
      parsedValue = false;
    } else if (node.type === 'number' && !isNaN(Number(value))) {
      parsedValue = Number(value);
    }

    onSave(parsedValue);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {node.name}</DialogTitle>
          <DialogDescription>
            {node.description || `Enter a new value for ${node.name}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Value</Label>
              {node.type === 'boolean' ? (
                <Select
                  value={value}
                  onValueChange={(v) => setValue(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <Input
                    type={
                      node.name.toLowerCase().includes('password') ||
                      node.name.toLowerCase().includes('secret') ||
                      node.name.toLowerCase().includes('key')
                        ? showPassword
                          ? 'text'
                          : 'password'
                        : 'text'
                    }
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={node.defaultValue ? `Default: ${node.defaultValue}` : ''}
                  />
                  {(node.name.toLowerCase().includes('password') ||
                    node.name.toLowerCase().includes('secret') ||
                    node.name.toLowerCase().includes('key')) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              )}
              {node.validation && (
                <div className="text-xs text-muted-foreground">
                  {node.validation.min !== undefined && `Min: ${node.validation.min}`}
                  {node.validation.max !== undefined && `Max: ${node.validation.max}`}
                  {node.validation.options && `Options: ${node.validation.options.join(', ')}`}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AddNodeDialogProps {
  onSave: (node: ConfigNode) => void;
  onCancel: () => void;
}

function AddNodeDialog({ onSave, onCancel }: AddNodeDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ConfigNode['type']>('string');
  const [value, setValue] = useState<string>('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedValue: string | number | boolean | null = value;

    if (type === 'boolean') {
      parsedValue = value === 'true';
    } else if (type === 'number') {
      parsedValue = value ? Number(value) : 0;
    } else if (value === 'null' || value === '') {
      parsedValue = null;
    }

    onSave({
      name,
      type,
      value: parsedValue,
      description: description || undefined,
      children: type === 'object' || type === 'array' ? [] : undefined,
    });

    // Reset form
    setName('');
    setType('string');
    setValue('');
    setDescription('');
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Node</DialogTitle>
          <DialogDescription>
            Create a new configuration node
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="node-name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ConfigNode['type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {type !== 'object' && type !== 'array' && (
              <div className="space-y-2">
                <Label>Value</Label>
                {type === 'boolean' ? (
                  <Select value={value} onValueChange={setValue}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={type === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === 'number' ? '0' : 'value'}
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this configuration node"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper to set all paths as expanded
function setExpandedNodes(paths: Set<string>) {
  // This would be implemented by the parent component
}