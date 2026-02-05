import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Loader2, Plus, Edit, Trash2, RefreshCw, Save, ArrowLeft, Route, Globe, Network, CheckCircle, XCircle, ArrowUpDown } from 'lucide-react';
import { useConfigStore } from '../../stores/configStore';
import { configService } from '../../services/ConfigService';
import { useToast } from '../../components/ui/Toast';

export interface StaticRoute {
  id: string;
  destination: string;
  nextHop: string;
  distance?: number;
  interface?: string;
  description?: string;
  enabled: boolean;
}

export interface OSPFConfig {
  enabled: boolean;
  routerId?: string;
  areas: OSPFArea[];
}

export interface OSPFArea {
  id: string;
  type: 'normal' | 'stub' | 'nssa';
  networks: OSPFNetwork[];
}

export interface OSPFNetwork {
  network: string;
  area: string;
}

export interface BGPConfig {
  enabled: boolean;
  asNumber: number;
  routerId?: string;
  neighbors: BGPNeighbor[];
}

export interface BGPNeighbor {
  id: string;
  address: string;
  remoteAs: number;
  description?: string;
  enabled: boolean;
}

export function RoutingConfigPage() {
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

  const [staticRoutes, setStaticRoutes] = useState<StaticRoute[]>([]);
  const [ospfConfig, setOspfConfig] = useState<OSPFConfig>({ enabled: false, areas: [] });
  const [bgpConfig, setBgpConfig] = useState<BGPConfig>({ enabled: false, asNumber: 0, neighbors: [] });
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<StaticRoute | null>(null);

  // Fetch configuration on mount
  useEffect(() => {
    fetchRoutingConfig();
  }, []);

  const fetchRoutingConfig = async () => {
    setLoadingConfig(true);
    setError(null);
    try {
      const data = await configService.getConfig({ section: 'routing' });
      setConfig(data.config);
      const parsed = parseRoutingConfig(data.config);
      setStaticRoutes(parsed.staticRoutes);
      setOspfConfig(parsed.ospfConfig);
      setBgpConfig(parsed.bgpConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load routing configuration');
      toast({
        title: 'Error',
        description: 'Failed to load routing configuration',
        variant: 'destructive',
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const parseRoutingConfig = (config: any[]): {
    staticRoutes: StaticRoute[];
    ospfConfig: OSPFConfig;
    bgpConfig: BGPConfig;
  } => {
    const routingNode = config.find((node) => node.name === 'protocols') || config.find((node) => node.name === 'static');

    const staticRoutes: StaticRoute[] = [];
    const ospfConfig: OSPFConfig = { enabled: false, areas: [] };
    const bgpConfig: BGPConfig = { enabled: false, asNumber: 0, neighbors: [] };

    // Parse static routes
    config.forEach((node) => {
      if (node.name === 'static') {
        node.children?.forEach((route: any) => {
          if (route.name === 'route') {
            route.children?.forEach((r: any) => {
              staticRoutes.push({
                id: `${r.name}-${Date.now()}`,
                destination: r.name,
                nextHop: r.children?.find((c: any) => c.name === 'next-hop')?.value || '',
                distance: r.children?.find((c: any) => c.name === 'distance')?.value,
                interface: r.children?.find((c: any) => c.name === 'interface')?.value,
                enabled: !r.children?.find((c: any) => c.name === 'disable'),
              });
            });
          }
        });
      }
    });

    // Parse OSPF
    const ospfNode = config.find((node) => node.name === 'ospf');
    if (ospfNode) {
      ospfConfig.enabled = true;
      ospfConfig.routerId = ospfNode.children?.find((c: any) => c.name === 'router-id')?.value;

      ospfNode.children?.forEach((areaNode: any) => {
        if (areaNode.name === 'area') {
          ospfConfig.areas.push({
            id: areaNode.value as string,
            type: areaNode.children?.find((c: any) => c.name === 'type')?.value || 'normal',
            networks: areaNode.children
              ?.filter((c: any) => c.name === 'network')
              .map((n: any) => ({
                network: n.value,
                area: areaNode.value,
              })) || [],
          });
        }
      });
    }

    // Parse BGP
    const bgpNode = config.find((node) => node.name === 'bgp');
    if (bgpNode) {
      bgpConfig.enabled = true;
      bgpConfig.asNumber = bgpNode.children?.find((c: any) => c.name === 'as-number')?.value || 0;
      bgpConfig.routerId = bgpNode.children?.find((c: any) => c.name === 'router-id')?.value;

      bgpNode.children?.forEach((neighborNode: any) => {
        if (neighborNode.name === 'neighbor') {
          bgpConfig.neighbors.push({
            id: neighborNode.value as string,
            address: neighborNode.value as string,
            remoteAs: neighborNode.children?.find((c: any) => c.name === 'remote-as')?.value || 0,
            description: neighborNode.children?.find((c: any) => c.name === 'description')?.value,
            enabled: !neighborNode.children?.find((c: any) => c.name === 'disable'),
          });
        }
      });
    }

    return { staticRoutes, ospfConfig, bgpConfig };
  };

  const handleSaveConfig = async () => {
    setApplyingConfig(true);
    setError(null);
    try {
      const result = await configService.applyConfig({
        config,
        comment: 'Routing configuration update from Web UI',
        validate: true,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Configuration applied successfully. Version: ${result.version}`,
        });
        setUnsavedChanges(false);
        fetchRoutingConfig();
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

  const handleCreateRoute = (route: StaticRoute) => {
    setStaticRoutes([...staticRoutes, route]);
    setUnsavedChanges(true);
    setIsRouteDialogOpen(false);
    toast({
      title: 'Route Created',
      description: `Route to ${route.destination} has been added`,
    });
  };

  const handleUpdateRoute = (route: StaticRoute) => {
    setStaticRoutes(staticRoutes.map((r) => (r.id === route.id ? route : r)));
    setUnsavedChanges(true);
    setEditingRoute(null);
    setIsRouteDialogOpen(false);
    toast({
      title: 'Route Updated',
      description: `Route to ${route.destination} has been updated`,
    });
  };

  const handleDeleteRoute = (id: string) => {
    setStaticRoutes(staticRoutes.filter((r) => r.id !== id));
    setUnsavedChanges(true);
    toast({
      title: 'Route Deleted',
      description: 'Route has been removed',
    });
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
            <h1 className="text-3xl font-bold tracking-tight">Routing Configuration</h1>
            <p className="text-muted-foreground">
              Configure static routes, dynamic routing protocols (OSPF, BGP)
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
          <Button variant="outline" size="sm" onClick={fetchRoutingConfig} disabled={isLoadingConfig}>
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
        <Tabs defaultValue="static" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="static">Static Routes</TabsTrigger>
            <TabsTrigger value="ospf">OSPF</TabsTrigger>
            <TabsTrigger value="bgp">BGP</TabsTrigger>
          </TabsList>

          <TabsContent value="static" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Static Routes</CardTitle>
                    <CardDescription>
                      Define static routing table entries
                    </CardDescription>
                  </div>
                  <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Route
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingRoute ? 'Edit Static Route' : 'Add Static Route'}
                        </DialogTitle>
                        <DialogDescription>
                          Configure a static route entry
                        </DialogDescription>
                      </DialogHeader>
                      <StaticRouteForm
                        route={editingRoute || undefined}
                        onSave={editingRoute ? handleUpdateRoute : handleCreateRoute}
                        onCancel={() => {
                          setIsRouteDialogOpen(false);
                          setEditingRoute(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {staticRoutes.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Route className="h-8 w-8 mr-2" />
                      No static routes configured
                    </div>
                  ) : (
                    staticRoutes.map((route) => (
                      <div
                        key={route.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-4">
                          <Route className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{route.destination}</p>
                            <p className="text-sm text-muted-foreground">
                              via {route.nextHop}
                              {route.interface && ` on ${route.interface}`}
                              {route.distance && ` (distance: ${route.distance})`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={route.enabled ? 'default' : 'secondary'}>
                            {route.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingRoute(route);
                              setIsRouteDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRoute(route.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ospf" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>OSPF Configuration</CardTitle>
                <CardDescription>
                  Configure Open Shortest Path First routing protocol
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ospf-enabled"
                    checked={ospfConfig.enabled}
                    onCheckedChange={(checked) => {
                      setOspfConfig({ ...ospfConfig, enabled: checked });
                      setUnsavedChanges(true);
                    }}
                  />
                  <Label htmlFor="ospf-enabled">Enable OSPF</Label>
                </div>

                {ospfConfig.enabled && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ospf-router-id">Router ID</Label>
                        <Input
                          id="ospf-router-id"
                          value={ospfConfig.routerId || ''}
                          onChange={(e) => {
                            setOspfConfig({ ...ospfConfig, routerId: e.target.value });
                            setUnsavedChanges(true);
                          }}
                          placeholder="1.1.1.1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Areas</Label>
                      <div className="mt-2 space-y-2">
                        {ospfConfig.areas.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No OSPF areas configured</p>
                        ) : (
                          ospfConfig.areas.map((area) => (
                            <div key={area.id} className="rounded-lg border p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Area {area.id}</span>
                                <Badge variant="outline">{area.type}</Badge>
                              </div>
                              {area.networks.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  Networks: {area.networks.map((n) => n.network).join(', ')}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setOspfConfig({
                          ...ospfConfig,
                          areas: [
                            ...ospfConfig.areas,
                            { id: '0', type: 'normal', networks: [] },
                          ],
                        });
                        setUnsavedChanges(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Area
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bgp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>BGP Configuration</CardTitle>
                <CardDescription>
                  Configure Border Gateway Protocol
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bgp-enabled"
                    checked={bgpConfig.enabled}
                    onCheckedChange={(checked) => {
                      setBgpConfig({ ...bgpConfig, enabled: checked });
                      setUnsavedChanges(true);
                    }}
                  />
                  <Label htmlFor="bgp-enabled">Enable BGP</Label>
                </div>

                {bgpConfig.enabled && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="bgp-as">AS Number</Label>
                        <Input
                          id="bgp-as"
                          type="number"
                          value={bgpConfig.asNumber || ''}
                          onChange={(e) => {
                            setBgpConfig({ ...bgpConfig, asNumber: parseInt(e.target.value) || 0 });
                            setUnsavedChanges(true);
                          }}
                          placeholder="65001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bgp-router-id">Router ID</Label>
                        <Input
                          id="bgp-router-id"
                          value={bgpConfig.routerId || ''}
                          onChange={(e) => {
                            setBgpConfig({ ...bgpConfig, routerId: e.target.value });
                            setUnsavedChanges(true);
                          }}
                          placeholder="1.1.1.1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Neighbors</Label>
                      <div className="mt-2 space-y-2">
                        {bgpConfig.neighbors.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No BGP neighbors configured</p>
                        ) : (
                          bgpConfig.neighbors.map((neighbor) => (
                            <div
                              key={neighbor.id}
                              className="flex items-center justify-between rounded-lg border p-4"
                            >
                              <div className="flex items-center gap-4">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{neighbor.address}</p>
                                  <p className="text-sm text-muted-foreground">
                                    AS {neighbor.remoteAs}
                                    {neighbor.description && ` - ${neighbor.description}`}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={neighbor.enabled ? 'default' : 'secondary'}>
                                {neighbor.enabled ? 'Active' : 'Disabled'}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setBgpConfig({
                          ...bgpConfig,
                          neighbors: [
                            ...bgpConfig.neighbors,
                            { id: Date.now().toString(), address: '', remoteAs: 0, enabled: true },
                          ],
                        });
                        setUnsavedChanges(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Neighbor
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

interface StaticRouteFormProps {
  route?: StaticRoute;
  onSave: (route: StaticRoute) => void;
  onCancel: () => void;
}

function StaticRouteForm({ route, onSave, onCancel }: StaticRouteFormProps) {
  const [formData, setFormData] = useState<StaticRoute>(
    route || {
      id: Date.now().toString(),
      destination: '',
      nextHop: '',
      enabled: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="destination">Destination Network</Label>
          <Input
            id="destination"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            placeholder="0.0.0.0/0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextHop">Next Hop (Gateway)</Label>
          <Input
            id="nextHop"
            value={formData.nextHop}
            onChange={(e) => setFormData({ ...formData, nextHop: e.target.value })}
            placeholder="192.168.1.254"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="interface">Interface (Optional)</Label>
          <Input
            id="interface"
            value={formData.interface || ''}
            onChange={(e) => setFormData({ ...formData, interface: e.target.value })}
            placeholder="eth0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="distance">Administrative Distance (Optional)</Label>
          <Input
            id="distance"
            type="number"
            value={formData.distance || ''}
            onChange={(e) =>
              setFormData({ ...formData, distance: parseInt(e.target.value) || undefined })
            }
            placeholder="1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Default route"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <Label htmlFor="enabled">Enable route</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.destination || !formData.nextHop}>
          {route ? 'Update' : 'Add'}
        </Button>
      </DialogFooter>
    </form>
  );
}