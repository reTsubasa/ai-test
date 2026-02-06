import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Switch } from '../../components/ui/Switch';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/Dialog';
import { Loader2, Plus, Edit, Trash2, RefreshCw, Save, ArrowLeft, Network, Wifi, Shield, Globe, Lock, CheckCircle, XCircle } from 'lucide-react';
import { useConfigStore } from '../../stores/configStore';
import { configService } from '../../services/ConfigService';
import { useToast } from '../../components/ui/Toast';
import type { ConfigNode } from '../../stores/configStore';

export interface InterfaceConfig {
  name: string;
  type: 'ethernet' | 'bonding' | 'bridge' | 'vlan' | 'loopback' | 'veth' | 'wireguard';
  description?: string;
  enabled: boolean;
  address?: string;
  gateway?: string;
  mtu?: number;
  vlanId?: number;
  members?: string[];
  parentInterface?: string;
}

export function InterfacesConfigPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    config,
    unsavedChanges,
    isLoadingConfig,
    isApplyingConfig,
    error,
    setConfig,
    setUnsavedChanges,
    setLoadingConfig,
    setApplyingConfig,
    setError,
    updateNode,
    validateConfig,
  } = useConfigStore();

  const [interfaces, setInterfaces] = useState<InterfaceConfig[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<InterfaceConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInterface, setEditingInterface] = useState<InterfaceConfig | null>(null);

  // Fetch configuration on mount
  useEffect(() => {
    fetchInterfaces();
  }, []);

  const fetchInterfaces = async () => {
    setLoadingConfig(true);
    setError(null);
    try {
      const data = await configService.getConfig({ section: 'interfaces' });
      setConfig(data.config);
      // Parse interfaces from config
      const parsedInterfaces = parseInterfacesFromConfig(data.config);
      setInterfaces(parsedInterfaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interfaces');
      toast({
        title: 'Error',
        description: 'Failed to load interfaces',
        variant: 'destructive',
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const parseInterfacesFromConfig = (config: ConfigNode[]): InterfaceConfig[] => {
    const interfacesNode = config.find((node) => node.name === 'interfaces');
    if (!interfacesNode?.children) return [];

    return interfacesNode.children
      .filter((child) => child.type === 'object')
      .map((child) => {
        const iface: InterfaceConfig = {
          name: child.name,
          type: detectInterfaceType(child.name, child.children || []),
          enabled: true,
        };

        child.children?.forEach((prop) => {
          switch (prop.name) {
            case 'address':
              iface.address = prop.value as string;
              break;
            case 'gateway':
              iface.gateway = prop.value as string;
              break;
            case 'description':
              iface.description = prop.value as string;
              break;
            case 'mtu':
              iface.mtu = prop.value as number;
              break;
            case 'disabled':
              iface.enabled = !(prop.value as boolean);
              break;
            case 'vlan-id':
              iface.vlanId = prop.value as number;
              break;
            case 'bond-group':
              // Parse bonded interfaces
              iface.members = prop.children?.map((m) => m.name);
              break;
            case 'bridge-group':
              // Parse bridged interfaces
              iface.members = prop.children?.map((m) => m.name);
              break;
          }
        });

        return iface;
      });
  };

  const detectInterfaceType = (name: string, children: ConfigNode[]): InterfaceConfig['type'] => {
    if (name.startsWith('lo')) return 'loopback';
    if (name.startsWith('bond')) return 'bonding';
    if (name.startsWith('br')) return 'bridge';
    if (name.startsWith('vti') || name.includes('vti')) return 'veth';
    if (name.startsWith('wg')) return 'wireguard';
    if (children.some((c) => c.name === 'vlan-id')) return 'vlan';
    if (children.some((c) => c.name === 'bond-group')) return 'bonding';
    if (children.some((c) => c.name === 'bridge-group')) return 'bridge';
    return 'ethernet';
  };

  const getInterfaceIcon = (type: InterfaceConfig['type']) => {
    switch (type) {
      case 'wireless':
      case 'wireguard':
        return <Wifi className="h-4 w-4" />;
      case 'bonding':
      case 'bridge':
        return <Network className="h-4 w-4" />;
      case 'vlan':
        return <Globe className="h-4 w-4" />;
      default:
        return <Network className="h-4 w-4" />;
    }
  };

  const getInterfaceTypeLabel = (type: InterfaceConfig['type']) => {
    const labels: Record<InterfaceConfig['type'], string> = {
      ethernet: 'Ethernet',
      bonding: 'Bonding',
      bridge: 'Bridge',
      vlan: 'VLAN',
      loopback: 'Loopback',
      veth: 'Virtual',
      wireguard: 'WireGuard',
    };
    return labels[type];
  };

  const handleSaveConfig = async () => {
    setApplyingConfig(true);
    setError(null);
    try {
      const result = await configService.applyConfig({
        config,
        comment: 'Interface configuration update from Web UI',
        validate: true,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Configuration applied successfully. Version: ${result.version}`,
        });
        setUnsavedChanges(false);
        fetchInterfaces();
      } else {
        throw new Error(result.errors?.join(', ') || 'Failed to apply configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply configuration');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to apply configuration',
        variant: 'destructive',
      });
    } finally {
      setApplyingConfig(false);
    }
  };

  const handleCreateInterface = (newInterface: InterfaceConfig) => {
    setInterfaces([...interfaces, newInterface]);
    setUnsavedChanges(true);
    setIsDialogOpen(false);
    toast({
      title: 'Interface Created',
      description: `${newInterface.name} has been created`,
    });
  };

  const handleUpdateInterface = (updatedInterface: InterfaceConfig) => {
    setInterfaces(interfaces.map((i) => (i.name === updatedInterface.name ? updatedInterface : i)));
    setUnsavedChanges(true);
    setEditingInterface(null);
    setIsDialogOpen(false);
    toast({
      title: 'Interface Updated',
      description: `${updatedInterface.name} has been updated`,
    });
  };

  const handleDeleteInterface = (name: string) => {
    setInterfaces(interfaces.filter((i) => i.name !== name));
    setUnsavedChanges(true);
    toast({
      title: 'Interface Deleted',
      description: `${name} has been deleted`,
    });
  };

  const handleToggleInterface = (name: string, enabled: boolean) => {
    setInterfaces(interfaces.map((i) => (i.name === name ? { ...i, enabled } : i)));
    setUnsavedChanges(true);
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
            <h1 className="text-3xl font-bold tracking-tight">Interface Configuration</h1>
            <p className="text-muted-foreground">
              Configure network interfaces, addresses, and link settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unsavedChanges && (
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchInterfaces} disabled={isLoadingConfig}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingConfig ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleSaveConfig}
            disabled={isApplyingConfig || !unsavedChanges}
          >
            {isApplyingConfig ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Apply Changes
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      )}

      {isLoadingConfig ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {interfaces.map((iface) => (
            <Card
              key={iface.name}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedInterface?.name === iface.name ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedInterface(iface)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getInterfaceIcon(iface.type)}
                    <CardTitle className="text-lg">{iface.name}</CardTitle>
                  </div>
                  <Switch
                    checked={iface.enabled}
                    onCheckedChange={(checked) => handleToggleInterface(iface.name, checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <CardDescription>
                  {iface.description || getInterfaceTypeLabel(iface.type)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {iface.address && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Address</span>
                    <Badge variant="secondary">{iface.address}</Badge>
                  </div>
                )}
                {iface.gateway && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gateway</span>
                    <Badge variant="secondary">{iface.gateway}</Badge>
                  </div>
                )}
                {iface.mtu && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">MTU</span>
                    <Badge variant="outline">{iface.mtu}</Badge>
                  </div>
                )}
                {iface.vlanId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">VLAN ID</span>
                    <Badge variant="outline">{iface.vlanId}</Badge>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={iface.enabled ? 'default' : 'secondary'} className="gap-1">
                    {iface.enabled ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Disabled
                      </>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card className="flex cursor-pointer items-center justify-center border-dashed transition-all hover:border-primary">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-muted-foreground">Add Interface</span>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingInterface ? 'Edit Interface' : 'Add New Interface'}
                </DialogTitle>
                <DialogDescription>
                  Configure a new network interface or edit existing settings
                </DialogDescription>
              </DialogHeader>
              <InterfaceForm
                interface={editingInterface || undefined}
                onSave={editingInterface ? handleUpdateInterface : handleCreateInterface}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingInterface(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {selectedInterface && (
        <InterfaceDetailPanel
          interface={selectedInterface}
          onClose={() => setSelectedInterface(null)}
          onEdit={() => {
            setEditingInterface(selectedInterface);
            setIsDialogOpen(true);
            setSelectedInterface(null);
          }}
          onDelete={() => {
            handleDeleteInterface(selectedInterface.name);
            setSelectedInterface(null);
          }}
        />
      )}
    </div>
  );
}

interface InterfaceFormProps {
  interface?: InterfaceConfig;
  onSave: (iface: InterfaceConfig) => void;
  onCancel: () => void;
}

function InterfaceForm({ interface: iface, onSave, onCancel }: InterfaceFormProps) {
  const [formData, setFormData] = useState<InterfaceConfig>(
    iface || {
      name: '',
      type: 'ethernet',
      enabled: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEditing = !!iface;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Interface Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="eth0, br0, bond0..."
            disabled={isEditing}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as InterfaceConfig['type'] })}
            disabled={isEditing}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ethernet">Ethernet</SelectItem>
              <SelectItem value="bonding">Bonding</SelectItem>
              <SelectItem value="bridge">Bridge</SelectItem>
              <SelectItem value="vlan">VLAN</SelectItem>
              <SelectItem value="loopback">Loopback</SelectItem>
              <SelectItem value="veth">Virtual (veth)</SelectItem>
              <SelectItem value="wireguard">WireGuard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description for this interface"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="address">IP Address</Label>
          <Input
            id="address"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="192.168.1.1/24"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gateway">Gateway</Label>
          <Input
            id="gateway"
            value={formData.gateway || ''}
            onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
            placeholder="192.168.1.254"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mtu">MTU</Label>
          <Input
            id="mtu"
            type="number"
            value={formData.mtu || ''}
            onChange={(e) => setFormData({ ...formData, mtu: parseInt(e.target.value) || undefined })}
            placeholder="1500"
          />
        </div>
        {(formData.type === 'vlan' || formData.type === 'bonding') && (
          <div className="space-y-2">
            <Label htmlFor="vlanId">
              {formData.type === 'vlan' ? 'VLAN ID' : 'Bond Group ID'}
            </Label>
            <Input
              id="vlanId"
              type="number"
              value={formData.vlanId || ''}
              onChange={(e) => setFormData({ ...formData, vlanId: parseInt(e.target.value) || undefined })}
              placeholder="100"
            />
          </div>
        )}
      </div>

      {formData.type === 'bonding' && (
        <div className="space-y-2">
          <Label htmlFor="members">Member Interfaces</Label>
          <Textarea
            id="members"
            value={formData.members?.join(', ') || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                members: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder="eth0, eth1, eth2"
            rows={2}
          />
        </div>
      )}

      {formData.type === 'vlan' && (
        <div className="space-y-2">
          <Label htmlFor="parentInterface">Parent Interface</Label>
          <Input
            id="parentInterface"
            value={formData.parentInterface || ''}
            onChange={(e) => setFormData({ ...formData, parentInterface: e.target.value })}
            placeholder="eth0"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <Label htmlFor="enabled">Enable interface on startup</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name}>
          {isEditing ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface InterfaceDetailPanelProps {
  interface: InterfaceConfig;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function InterfaceDetailPanel({ interface: iface, onClose, onEdit, onDelete }: InterfaceDetailPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Interface Details: {iface.name}</CardTitle>
            <CardDescription>
              {iface.description || getInterfaceTypeLabel(iface.type)}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Type</Label>
            <p className="text-sm mt-1">{getInterfaceTypeLabel(iface.type)}</p>
          </div>
          <div>
            <Label>Status</Label>
            <p className="text-sm mt-1">{iface.enabled ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div>
            <Label>IP Address</Label>
            <p className="text-sm mt-1">{iface.address || 'Not configured'}</p>
          </div>
          <div>
            <Label>Gateway</Label>
            <p className="text-sm mt-1">{iface.gateway || 'Not configured'}</p>
          </div>
          {iface.mtu && (
            <div>
              <Label>MTU</Label>
              <p className="text-sm mt-1">{iface.mtu}</p>
            </div>
          )}
          {iface.vlanId && (
            <div>
              <Label>VLAN ID</Label>
              <p className="text-sm mt-1">{iface.vlanId}</p>
            </div>
          )}
          {iface.parentInterface && (
            <div>
              <Label>Parent Interface</Label>
              <p className="text-sm mt-1">{iface.parentInterface}</p>
            </div>
          )}
        </div>

        {iface.members && iface.members.length > 0 && (
          <div>
            <Label>Member Interfaces</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {iface.members.map((member) => (
                <Badge key={member} variant="secondary">
                  {member}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getInterfaceTypeLabel(type: InterfaceConfig['type']): string {
  const labels: Record<InterfaceConfig['type'], string> = {
    ethernet: 'Ethernet',
    bonding: 'Bonding',
    bridge: 'Bridge',
    vlan: 'VLAN',
    loopback: 'Loopback',
    veth: 'Virtual (veth)',
    wireguard: 'WireGuard',
  };
  return labels[type];
}