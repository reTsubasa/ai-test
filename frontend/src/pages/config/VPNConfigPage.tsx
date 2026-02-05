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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Loader2, Plus, Edit, Trash2, RefreshCw, Save, ArrowLeft, Lock, Key, Shield, Globe, Wifi, Copy, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useConfigStore } from '../../stores/configStore';
import { configService } from '../../services/ConfigService';
import { useToast } from '../../components/ui/Toast';

export interface WireGuardPeer {
  id: string;
  publicKey: string;
  presharedKey?: string;
  allowedIPs: string[];
  endpoint?: string;
  description?: string;
  enabled: boolean;
}

export interface WireGuardInterface {
  name: string;
  privateKey: string;
  publicKey?: string;
  port?: number;
  listenPort?: number;
  mtu?: number;
  peers: WireGuardPeer[];
  enabled: boolean;
}

export interface OpenVPNServer {
  id: string;
  name: string;
  protocol: 'udp' | 'tcp';
  port: number;
  device: string;
  subnet: string;
  localAddress?: string;
  pushRoutes?: string[];
  dnsServers?: string[];
  enabled: boolean;
}

export interface OpenVPNClient {
  id: string;
  name: string;
  remoteHost: string;
  remotePort: number;
  protocol: 'udp' | 'tcp';
  dev: string;
  auth: 'none' | 'secret' | 'tls';
  credentials?: {
    username?: string;
    password?: string;
  };
  caCert?: string;
  cert?: string;
  key?: string;
  enabled: boolean;
}

export interface IPsecTunnel {
  id: string;
  name: string;
  localAddress: string;
  remoteAddress: string;
  localSubnets: string[];
  remoteSubnets: string[];
  authMethod: 'pre-shared-key' | 'rsa-signature';
  preSharedKey?: string;
  ikeProposal?: string;
  espProposal?: string;
  enabled: boolean;
}

export function VPNConfigPage() {
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
  } = useConfigStore();

  const [wireGuardInterfaces, setWireGuardInterfaces] = useState<WireGuardInterface[]>([]);
  const [openvpnServers, setOpenvpnServers] = useState<OpenVPNServer[]>([]);
  const [openvpnClients, setOpenvpnClients] = useState<OpenVPNClient[]>([]);
  const [ipsecTunnels, setIpsecTunnels] = useState<IPsecTunnel[]>([]);
  const [isWireGuardDialogOpen, setIsWireGuardDialogOpen] = useState(false);
  const [isPeerDialogOpen, setIsPeerDialogOpen] = useState(false);
  const [isOvpnServerDialogOpen, setIsOvpnServerDialogOpen] = useState(false);
  const [isOvpnClientDialogOpen, setIsOvpnClientDialogOpen] = useState(false);
  const [isIpsecDialogOpen, setIsIpsecDialogOpen] = useState(false);
  const [editingInterface, setEditingInterface] = useState<WireGuardInterface | null>(null);
  const [editingPeer, setEditingPeer] = useState<WireGuardPeer | null>(null);
  const [selectedInterface, setSelectedInterface] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState(false);

  // Fetch configuration on mount
  useEffect(() => {
    fetchVPNConfig();
  }, []);

  const fetchVPNConfig = async () => {
    setLoadingConfig(true);
    setError(null);
    try {
      const data = await configService.getConfig({ section: 'vpn' });
      setConfig(data.config);
      const parsed = parseVPNConfig(data.config);
      setWireGuardInterfaces(parsed.wireGuardInterfaces);
      setOpenvpnServers(parsed.openvpnServers);
      setOpenvpnClients(parsed.openvpnClients);
      setIpsecTunnels(parsed.ipsecTunnels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load VPN configuration');
      toast({
        title: 'Error',
        description: 'Failed to load VPN configuration',
        variant: 'destructive',
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const parseVPNConfig = (config: any[]): {
    wireGuardInterfaces: WireGuardInterface[];
    openvpnServers: OpenVPNServer[];
    openvpnClients: OpenVPNClient[];
    ipsecTunnels: IPsecTunnel[];
  } => {
    const wireGuardInterfaces: WireGuardInterface[] = [];
    const openvpnServers: OpenVPNServer[] = [];
    const openvpnClients: OpenVPNClient[] = [];
    const ipsecTunnels: IPsecTunnel[] = [];

    const vpnNode = config.find((node) => node.name === 'interfaces');
    if (!vpnNode) return { wireGuardInterfaces, openvpnServers, openvpnClients, ipsecTunnels };

    // Parse WireGuard interfaces
    vpnNode.children?.forEach((node: any) => {
      if (node.name.startsWith('wg')) {
        const iface: WireGuardInterface = {
          name: node.name,
          privateKey: node.children?.find((c: any) => c.name === 'private-key')?.value || '',
          publicKey: node.children?.find((c: any) => c.name === 'public-key')?.value,
          port: node.children?.find((c: any) => c.name === 'port')?.value,
          listenPort: node.children?.find((c: any) => c.name === 'listen-port')?.value,
          mtu: node.children?.find((c: any) => c.name === 'mtu')?.value,
          peers: [],
          enabled: !node.children?.find((c: any) => c.name === 'disable'),
        };

        const peersNode = node.children?.find((c: any) => c.name === 'peer');
        if (peersNode) {
          peersNode.children?.forEach((peerNode: any) => {
            const peer: WireGuardPeer = {
              id: `${iface.name}-${peerNode.name}`,
              publicKey: peerNode.value || '',
              presharedKey: peerNode.children?.find((c: any) => c.name === 'preshared-key')?.value,
              endpoint: peerNode.children?.find((c: any) => c.name === 'endpoint')?.value,
              allowedIPs: peerNode.children
                ?.filter((c: any) => c.name === 'allowed-ips')
                .map((a: any) => a.value) || [],
              enabled: !peerNode.children?.find((c: any) => c.name === 'disable'),
            };
            iface.peers.push(peer);
          });
        }

        wireGuardInterfaces.push(iface);
      }
    });

    // Parse OpenVPN servers
    const openvpnNode = config.find((node) => node.name === 'openvpn');
    if (openvpnNode) {
      openvpnNode.children?.forEach((node: any) => {
        if (node.name === 'server') {
          node.children?.forEach((serverNode: any) => {
            const server: OpenVPNServer = {
              id: serverNode.name,
              name: serverNode.name,
              protocol: serverNode.children?.find((c: any) => c.name === 'protocol')?.value || 'udp',
              port: serverNode.children?.find((c: any) => c.name === 'port')?.value || 1194,
              device: serverNode.children?.find((c: any) => c.name === 'dev')?.value || 'tun0',
              subnet: serverNode.children?.find((c: any) => c.name === 'subnet')?.value || '10.8.0.0/24',
              localAddress: serverNode.children?.find((c: any) => c.name === 'local-address')?.value,
              pushRoutes: serverNode.children
                ?.filter((c: any) => c.name === 'push-route')
                .map((r: any) => r.value) || [],
              dnsServers: serverNode.children
                ?.filter((c: any) => c.name === 'dns-server')
                .map((d: any) => d.value) || [],
              enabled: !serverNode.children?.find((c: any) => c.name === 'disable'),
            };
            openvpnServers.push(server);
          });
        }
      });
    }

    return { wireGuardInterfaces, openvpnServers, openvpnClients, ipsecTunnels };
  };

  const handleSaveConfig = async () => {
    setApplyingConfig(true);
    setError(null);
    try {
      const result = await configService.applyConfig({
        config,
        comment: 'VPN configuration update from Web UI',
        validate: true,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Configuration applied successfully. Version: ${result.version}`,
        });
        setUnsavedChanges(false);
        fetchVPNConfig();
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

  const handleCreateInterface = (iface: WireGuardInterface) => {
    setWireGuardInterfaces([...wireGuardInterfaces, iface]);
    setUnsavedChanges(true);
    setIsWireGuardDialogOpen(false);
    toast({
      title: 'Interface Created',
      description: `WireGuard interface ${iface.name} has been added`,
    });
  };

  const handleAddPeer = (peer: WireGuardPeer) => {
    if (!selectedInterface) return;

    setWireGuardInterfaces(
      wireGuardInterfaces.map((iface) =>
        iface.name === selectedInterface
          ? { ...iface, peers: [...iface.peers, peer] }
          : iface
      )
    );
    setUnsavedChanges(true);
    setIsPeerDialogOpen(false);
    toast({
      title: 'Peer Added',
      description: 'WireGuard peer has been added',
    });
  };

  const handleDeletePeer = (ifaceName: string, peerId: string) => {
    setWireGuardInterfaces(
      wireGuardInterfaces.map((iface) =>
        iface.name === ifaceName
          ? { ...iface, peers: iface.peers.filter((p) => p.id !== peerId) }
          : iface
      )
    );
    setUnsavedChanges(true);
    toast({
      title: 'Peer Removed',
      description: 'WireGuard peer has been removed',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Key copied to clipboard',
    });
  };

  const maskKey = (key: string, show: boolean) => {
    if (!key) return '-';
    if (show) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
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
            <h1 className="text-3xl font-bold tracking-tight">VPN Configuration</h1>
            <p className="text-muted-foreground">
              Configure WireGuard, OpenVPN, and IPsec VPN connections
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
          <Button variant="outline" size="sm" onClick={fetchVPNConfig} disabled={isLoadingConfig}>
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
        <Tabs defaultValue="wireguard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wireguard">WireGuard</TabsTrigger>
            <TabsTrigger value="openvpn-server">OpenVPN Server</TabsTrigger>
            <TabsTrigger value="openvpn-client">OpenVPN Client</TabsTrigger>
            <TabsTrigger value="ipsec">IPsec</TabsTrigger>
          </TabsList>

          <TabsContent value="wireguard" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>WireGuard VPN</CardTitle>
                    <CardDescription>
                      Configure WireGuard VPN interfaces and peers
                    </CardDescription>
                  </div>
                  <Dialog open={isWireGuardDialogOpen} onOpenChange={setIsWireGuardDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Interface
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create WireGuard Interface</DialogTitle>
                        <DialogDescription>
                          Configure a new WireGuard VPN interface
                        </DialogDescription>
                      </DialogHeader>
                      <WireGuardInterfaceForm
                        onSave={handleCreateInterface}
                        onCancel={() => setIsWireGuardDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wireGuardInterfaces.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Shield className="h-8 w-8 mr-2" />
                      No WireGuard interfaces configured
                    </div>
                  ) : (
                    wireGuardInterfaces.map((iface) => (
                      <div key={iface.name} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Wifi className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{iface.name}</h3>
                              <Badge variant={iface.enabled ? 'default' : 'secondary'}>
                                {iface.enabled ? 'Active' : 'Disabled'}
                              </Badge>
                            </div>
                            {iface.listenPort && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Listening on port {iface.listenPort}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Private Key</span>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {maskKey(iface.privateKey, showKeys)}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setShowKeys(!showKeys)}
                              >
                                {showKeys ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(iface.privateKey)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {iface.publicKey && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Public Key</span>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded max-w-[300px] truncate">
                                  {maskKey(iface.publicKey, true)}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(iface.publicKey!)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Peers</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedInterface(iface.name);
                                setIsPeerDialogOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Peer
                            </Button>
                          </div>
                          {iface.peers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No peers configured</p>
                          ) : (
                            iface.peers.map((peer) => (
                              <div
                                key={peer.id}
                                className="flex items-start justify-between rounded border p-3 text-sm"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Globe className="h-4 w-4" />
                                    <span className="font-medium truncate">{maskKey(peer.publicKey, true)}</span>
                                    {peer.endpoint && (
                                      <Badge variant="outline" className="text-xs">
                                        {peer.endpoint}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Allowed IPs: {peer.allowedIPs.join(', ')}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePeer(iface.name, peer.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="openvpn-server" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>OpenVPN Server</CardTitle>
                    <CardDescription>
                      Configure OpenVPN server instances
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsOvpnServerDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Server
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {openvpnServers.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Lock className="h-8 w-8 mr-2" />
                      No OpenVPN servers configured
                    </div>
                  ) : (
                    openvpnServers.map((server) => (
                      <div key={server.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{server.name}</h3>
                              <Badge variant={server.enabled ? 'default' : 'secondary'}>
                                {server.enabled ? 'Running' : 'Stopped'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>
                                Protocol: {server.protocol.toUpperCase()} / Port: {server.port}
                              </p>
                              <p>Device: {server.device}</p>
                              <p>Subnet: {server.subnet}</p>
                              {server.pushRoutes.length > 0 && (
                                <p>Push Routes: {server.pushRoutes.join(', ')}</p>
                              )}
                              {server.dnsServers.length > 0 && (
                                <p>DNS: {server.dnsServers.join(', ')}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="openvpn-client" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>OpenVPN Client</CardTitle>
                    <CardDescription>
                      Configure OpenVPN client connections
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsOvpnClientDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Globe className="h-8 w-8 mr-2" />
                  No OpenVPN clients configured
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ipsec" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>IPsec VPN</CardTitle>
                    <CardDescription>
                      Configure IPsec site-to-site and client VPN tunnels
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsIpsecDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tunnel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Lock className="h-8 w-8 mr-2" />
                  No IPsec tunnels configured
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

interface WireGuardInterfaceFormProps {
  onSave: (iface: WireGuardInterface) => void;
  onCancel: () => void;
}

function WireGuardInterfaceForm({ onSave, onCancel }: WireGuardInterfaceFormProps) {
  const [formData, setFormData] = useState<WireGuardInterface>({
    name: 'wg0',
    privateKey: '',
    port: 51820,
    peers: [],
    enabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="wg-name">Interface Name</Label>
          <Input
            id="wg-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="wg0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wg-port">Listen Port</Label>
          <Input
            id="wg-port"
            type="number"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
            placeholder="51820"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wg-private-key">Private Key</Label>
        <div className="flex gap-2">
          <Input
            id="wg-private-key"
            type={showKeys ? 'text' : 'password'}
            value={formData.privateKey}
            onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
            placeholder="Generate or paste private key"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const key = generateKey();
              setFormData({ ...formData, privateKey: key });
            }}
          >
            <Key className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="wg-enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <Label htmlFor="wg-enabled">Enable interface</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name || !formData.privateKey}>
          Create
        </Button>
      </DialogFooter>
    </form>
  );
}

const [showKeys, setShowKeys] = useState(false);

// Simple key generation for demo (in production, use proper crypto)
function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}