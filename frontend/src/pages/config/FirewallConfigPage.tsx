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
import { Loader2, Plus, Edit, Trash2, RefreshCw, Save, ArrowLeft, Shield, ShieldAlert, Globe, Lock, ArrowUpRight, ArrowDownLeft, Copy, FileText, Eye, EyeOff } from 'lucide-react';
import { useConfigStore } from '../../stores/configStore';
import { configService } from '../../services/ConfigService';
import { useToast } from '../../components/ui/Toast';

export interface FirewallRule {
  id: string;
  name: string;
  direction: 'in' | 'out' | 'local';
  action: 'accept' | 'reject' | 'drop';
  protocol?: 'tcp' | 'udp' | 'icmp' | 'all';
  source?: string;
  destination?: string;
  sourcePort?: string;
  destinationPort?: string;
  description?: string;
  enabled: boolean;
  position?: number;
}

export interface NATRule {
  id: string;
  name: string;
  type: 'source' | 'destination' | 'masquerade';
  protocol?: 'tcp' | 'udp' | 'all';
  source?: string;
  destination?: string;
  outboundInterface?: string;
  translationAddress?: string;
  translationPort?: string;
  description?: string;
  enabled: boolean;
}

export interface FirewallGroup {
  id: string;
  name: string;
  type: 'address' | 'port' | 'network';
  members: string[];
  description?: string;
}

export function FirewallConfigPage() {
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

  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [natRules, setNatRules] = useState<NATRule[]>([]);
  const [groups, setGroups] = useState<FirewallGroup[]>([]);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isNatDialogOpen, setIsNatDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [editingNat, setEditingNat] = useState<NATRule | null>(null);
  const [editingGroup, setEditingGroup] = useState<FirewallGroup | null>(null);

  // Fetch configuration on mount
  useEffect(() => {
    fetchFirewallConfig();
  }, []);

  const fetchFirewallConfig = async () => {
    setLoadingConfig(true);
    setError(null);
    try {
      const data = await configService.getConfig({ section: 'firewall' });
      setConfig(data.config);
      const parsed = parseFirewallConfig(data.config);
      setRules(parsed.rules);
      setNatRules(parsed.natRules);
      setGroups(parsed.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load firewall configuration');
      toast({
        title: 'Error',
        description: 'Failed to load firewall configuration',
        variant: 'destructive',
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const parseFirewallConfig = (config: any[]): {
    rules: FirewallRule[];
    natRules: NATRule[];
    groups: FirewallGroup[];
  } => {
    const firewallNode = config.find((node) => node.name === 'firewall');

    const rules: FirewallRule[] = [];
    const natRules: NATRule[] = [];
    const groups: FirewallGroup[] = [];

    if (!firewallNode) {
      return { rules, natRules, groups };
    }

    // Parse rules from firewall/name/* sections
    firewallNode.children?.forEach((nameNode: any) => {
      if (nameNode.name === 'name') {
        nameNode.children?.forEach((ruleNode: any) => {
          const rule: FirewallRule = {
            id: `${nameNode.value}-${ruleNode.name}`,
            name: ruleNode.name,
            direction: 'in',
            action: 'accept',
            enabled: !ruleNode.children?.find((c: any) => c.name === 'disable'),
          };

          ruleNode.children?.forEach((prop: any) => {
            switch (prop.name) {
              case 'action':
                rule.action = prop.value as FirewallRule['action'];
                break;
              case 'protocol':
                rule.protocol = prop.value as FirewallRule['protocol'];
                break;
              case 'source':
                rule.source = prop.value as string;
                break;
              case 'destination':
                rule.destination = prop.value as string;
                break;
              case 'source-port':
                rule.sourcePort = prop.value as string;
                break;
              case 'destination-port':
                rule.destinationPort = prop.value as string;
                break;
              case 'description':
                rule.description = prop.value as string;
                break;
            }
          });

          rules.push(rule);
        });
      }
    });

    // Parse NAT rules
    const natNode = firewallNode.children?.find((n: any) => n.name === 'nat');
    if (natNode) {
      natNode.children?.forEach((typeNode: any) => {
        if (['source', 'destination', 'masquerade'].includes(typeNode.name)) {
          typeNode.children?.forEach((ruleNode: any) => {
            if (ruleNode.name === 'rule') {
              const natRule: NATRule = {
                id: `${typeNode.name}-${ruleNode.value}`,
                name: ruleNode.value,
                type: typeNode.name as NATRule['type'],
                enabled: !ruleNode.children?.find((c: any) => c.name === 'disable'),
              };

              ruleNode.children?.forEach((prop: any) => {
                switch (prop.name) {
                  case 'protocol':
                    natRule.protocol = prop.value as NATRule['protocol'];
                    break;
                  case 'source':
                    natRule.source = prop.value as string;
                    break;
                  case 'destination':
                    natRule.destination = prop.value as string;
                    break;
                  case 'outbound-interface':
                    natRule.outboundInterface = prop.value as string;
                    break;
                  case 'translation-address':
                    natRule.translationAddress = prop.value as string;
                    break;
                  case 'translation-port':
                    natRule.translationPort = prop.value as string;
                    break;
                  case 'description':
                    natRule.description = prop.value as string;
                    break;
                }
              });

              natRules.push(natRule);
            }
          });
        }
      });
    }

    // Parse groups
    const groupNode = firewallNode.children?.find((n: any) => n.name === 'group');
    if (groupNode) {
      groupNode.children?.forEach((typeNode: any) => {
        if (['address-group', 'port-group', 'network-group'].includes(typeNode.name)) {
          const groupType = typeNode.name.replace('-group', '') as FirewallGroup['type'];
          typeNode.children?.forEach((g: any) => {
            groups.push({
              id: `${groupType}-${g.name}`,
              name: g.name,
              type: groupType,
              members: g.children?.map((m: any) => m.value) || [],
              description: g.children?.find((c: any) => c.name === 'description')?.value,
            });
          });
        }
      });
    }

    return { rules, natRules, groups };
  };

  const handleSaveConfig = async () => {
    setApplyingConfig(true);
    setError(null);
    try {
      const result = await configService.applyConfig({
        config,
        comment: 'Firewall configuration update from Web UI',
        validate: true,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Configuration applied successfully. Version: ${result.version}`,
        });
        setUnsavedChanges(false);
        fetchFirewallConfig();
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

  const handleCreateRule = (rule: FirewallRule) => {
    setRules([...rules, rule]);
    setUnsavedChanges(true);
    setIsRuleDialogOpen(false);
    toast({
      title: 'Rule Created',
      description: `Firewall rule ${rule.name} has been added`,
    });
  };

  const handleUpdateRule = (rule: FirewallRule) => {
    setRules(rules.map((r) => (r.id === rule.id ? rule : r)));
    setUnsavedChanges(true);
    setEditingRule(null);
    setIsRuleDialogOpen(false);
    toast({
      title: 'Rule Updated',
      description: `Firewall rule ${rule.name} has been updated`,
    });
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    setUnsavedChanges(true);
    toast({
      title: 'Rule Deleted',
      description: 'Firewall rule has been removed',
    });
  };

  const handleToggleRule = (id: string, enabled: boolean) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled } : r)));
    setUnsavedChanges(true);
  };

  const handleCreateNat = (rule: NATRule) => {
    setNatRules([...natRules, rule]);
    setUnsavedChanges(true);
    setIsNatDialogOpen(false);
    toast({
      title: 'NAT Rule Created',
      description: `NAT rule ${rule.name} has been added`,
    });
  };

  const handleUpdateNat = (rule: NATRule) => {
    setNatRules(natRules.map((r) => (r.id === rule.id ? rule : r)));
    setUnsavedChanges(true);
    setEditingNat(null);
    setIsNatDialogOpen(false);
    toast({
      title: 'NAT Rule Updated',
      description: `NAT rule ${rule.name} has been updated`,
    });
  };

  const handleDeleteNat = (id: string) => {
    setNatRules(natRules.filter((r) => r.id !== id));
    setUnsavedChanges(true);
    toast({
      title: 'NAT Rule Deleted',
      description: 'NAT rule has been removed',
    });
  };

  const getActionIcon = (action: FirewallRule['action'] | NATRule['type']) => {
    switch (action) {
      case 'accept':
      case 'source':
      case 'masquerade':
        return <Eye className="h-4 w-4 text-green-500" />;
      case 'reject':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case 'drop':
        return <Shield className="h-4 w-4 text-orange-500" />;
      case 'destination':
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getActionColor = (action: FirewallRule['action']) => {
    switch (action) {
      case 'accept':
        return 'bg-green-500/10 text-green-500';
      case 'reject':
        return 'bg-red-500/10 text-red-500';
      case 'drop':
        return 'bg-orange-500/10 text-orange-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
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
            <h1 className="text-3xl font-bold tracking-tight">Firewall Configuration</h1>
            <p className="text-muted-foreground">
              Configure firewall rules, NAT, and security groups
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
          <Button variant="outline" size="sm" onClick={fetchFirewallConfig} disabled={isLoadingConfig}>
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
          <ShieldAlert className="h-4 w-4" />
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
        <Tabs defaultValue="rules" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rules">Firewall Rules</TabsTrigger>
            <TabsTrigger value="nat">NAT Rules</TabsTrigger>
            <TabsTrigger value="groups">Address Groups</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Firewall Rules</CardTitle>
                    <CardDescription>
                      Configure inbound, outbound, and local firewall rules
                    </CardDescription>
                  </div>
                  <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingRule ? 'Edit Firewall Rule' : 'Add Firewall Rule'}
                        </DialogTitle>
                        <DialogDescription>
                          Configure a new firewall rule
                        </DialogDescription>
                      </DialogHeader>
                      <FirewallRuleForm
                        rule={editingRule || undefined}
                        onSave={editingRule ? handleUpdateRule : handleCreateRule}
                        onCancel={() => {
                          setIsRuleDialogOpen(false);
                          setEditingRule(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rules.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Shield className="h-8 w-8 mr-2" />
                      No firewall rules configured
                    </div>
                  ) : (
                    rules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`flex items-center justify-between rounded-lg border p-4 ${!rule.enabled ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {getActionIcon(rule.action)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{rule.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {rule.direction.toUpperCase()}
                              </Badge>
                              <Badge className={getActionColor(rule.action)}>
                                {rule.action.toUpperCase()}
                              </Badge>
                              {rule.protocol && (
                                <Badge variant="secondary" className="text-xs">
                                  {rule.protocol.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {rule.source && `src: ${rule.source}`}
                              {rule.source && rule.destination && ' | '}
                              {rule.destination && `dst: ${rule.destination}`}
                              {rule.destination && rule.destinationPort && ' | '}
                              {rule.destinationPort && `port: ${rule.destinationPort}`}
                              {rule.description && ` - ${rule.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingRule(rule);
                              setIsRuleDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
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

          <TabsContent value="nat" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>NAT Rules</CardTitle>
                    <CardDescription>
                      Configure source, destination, and masquerade NAT
                    </CardDescription>
                  </div>
                  <Dialog open={isNatDialogOpen} onOpenChange={setIsNatDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add NAT Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingNat ? 'Edit NAT Rule' : 'Add NAT Rule'}
                        </DialogTitle>
                        <DialogDescription>
                          Configure a new NAT rule
                        </DialogDescription>
                      </DialogHeader>
                      <NATRuleForm
                        rule={editingNat || undefined}
                        onSave={editingNat ? handleUpdateNat : handleCreateNat}
                        onCancel={() => {
                          setIsNatDialogOpen(false);
                          setEditingNat(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {natRules.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Globe className="h-8 w-8 mr-2" />
                      No NAT rules configured
                    </div>
                  ) : (
                    natRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {getActionIcon(rule.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{rule.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {rule.type.toUpperCase()}
                              </Badge>
                              {rule.protocol && (
                                <Badge variant="secondary" className="text-xs">
                                  {rule.protocol.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {rule.source && `src: ${rule.source}`}
                              {rule.source && rule.destination && ' | '}
                              {rule.destination && `dst: ${rule.destination}`}
                              {rule.destination && rule.translationAddress && ' | '}
                              {rule.translationAddress && `-> ${rule.translationAddress}`}
                              {rule.translationAddress && rule.translationPort && `:${rule.translationPort}`}
                              {rule.description && ` - ${rule.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingNat(rule);
                              setIsNatDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNat(rule.id)}
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

          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Address & Port Groups</CardTitle>
                    <CardDescription>
                      Create reusable address, network, and port groups
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsGroupDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Group
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {groups.length === 0 ? (
                    <div className="col-span-2 flex items-center justify-center py-8 text-muted-foreground">
                      <Copy className="h-8 w-8 mr-2" />
                      No address groups configured
                    </div>
                  ) : (
                    groups.map((group) => (
                      <Card key={group.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <Badge variant="outline">{group.type}</Badge>
                          </div>
                          {group.description && (
                            <CardDescription>{group.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {group.members.map((member, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {member}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Firewall Settings</CardTitle>
                <CardDescription>
                  Global firewall configuration options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable Firewall</p>
                    <p className="text-sm text-muted-foreground">
                      Enable the firewall on all interfaces
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Stateful Firewall</p>
                    <p className="text-sm text-muted-foreground">
                      Enable stateful packet inspection
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Log Dropped Packets</p>
                    <p className="text-sm text-muted-foreground">
                      Log packets that are dropped by firewall rules
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable Ping Responses</p>
                    <p className="text-sm text-muted-foreground">
                      Allow ICMP echo requests (ping) to the router
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Default Policy</p>
                    <p className="text-sm text-muted-foreground">
                      Set the default action for unmatched packets
                    </p>
                  </div>
                  <Select defaultValue="drop">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drop">Drop</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="accept">Accept</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

interface FirewallRuleFormProps {
  rule?: FirewallRule;
  onSave: (rule: FirewallRule) => void;
  onCancel: () => void;
}

function FirewallRuleForm({ rule, onSave, onCancel }: FirewallRuleFormProps) {
  const [formData, setFormData] = useState<FirewallRule>(
    rule || {
      id: Date.now().toString(),
      name: '',
      direction: 'in',
      action: 'accept',
      enabled: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="name">Rule Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Allow-SSH"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="direction">Direction</Label>
          <Select
            value={formData.direction}
            onValueChange={(value) => setFormData({ ...formData, direction: value as FirewallRule['direction'] })}
          >
            <SelectTrigger id="direction">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">Inbound</SelectItem>
              <SelectItem value="out">Outbound</SelectItem>
              <SelectItem value="local">Local</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="action">Action</Label>
          <Select
            value={formData.action}
            onValueChange={(value) => setFormData({ ...formData, action: value as FirewallRule['action'] })}
          >
            <SelectTrigger id="action">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="accept">Accept</SelectItem>
              <SelectItem value="reject">Reject</SelectItem>
              <SelectItem value="drop">Drop</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="protocol">Protocol</Label>
          <Select
            value={formData.protocol || 'all'}
            onValueChange={(value) =>
              setFormData({ ...formData, protocol: value === 'all' ? undefined : value as FirewallRule['protocol'] })
            }
          >
            <SelectTrigger id="protocol">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="tcp">TCP</SelectItem>
              <SelectItem value="udp">UDP</SelectItem>
              <SelectItem value="icmp">ICMP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source Address (Optional)</Label>
          <Input
            id="source"
            value={formData.source || ''}
            onChange={(e) => setFormData({ ...formData, source: e.target.value || undefined })}
            placeholder="192.168.1.0/24"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="destination">Destination Address (Optional)</Label>
          <Input
            id="destination"
            value={formData.destination || ''}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value || undefined })}
            placeholder="10.0.0.1/32"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="destinationPort">Destination Port (Optional)</Label>
          <Input
            id="destinationPort"
            value={formData.destinationPort || ''}
            onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value || undefined })}
            placeholder="22, 80, 443"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Allow SSH access from internal network"
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <Label htmlFor="enabled">Enable rule</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name}>
          {rule ? 'Update' : 'Add'}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface NATRuleFormProps {
  rule?: NATRule;
  onSave: (rule: NATRule) => void;
  onCancel: () => void;
}

function NATRuleForm({ rule, onSave, onCancel }: NATRuleFormProps) {
  const [formData, setFormData] = useState<NATRule>(
    rule || {
      id: Date.now().toString(),
      name: '',
      type: 'source',
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
          <Label htmlFor="name">Rule Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="NAT-100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">NAT Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as NATRule['type'] })}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="source">Source NAT (SNAT)</SelectItem>
              <SelectItem value="destination">Destination NAT (DNAT)</SelectItem>
              <SelectItem value="masquerade">Masquerade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nat-protocol">Protocol</Label>
          <Select
            value={formData.protocol || 'all'}
            onValueChange={(value) =>
              setFormData({ ...formData, protocol: value === 'all' ? undefined : value as NATRule['protocol'] })
            }
          >
            <SelectTrigger id="nat-protocol">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="tcp">TCP</SelectItem>
              <SelectItem value="udp">UDP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nat-source">Source Address (Optional)</Label>
          <Input
            id="nat-source"
            value={formData.source || ''}
            onChange={(e) => setFormData({ ...formData, source: e.target.value || undefined })}
            placeholder="192.168.1.0/24"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nat-destination">Destination Address (Optional)</Label>
          <Input
            id="nat-destination"
            value={formData.destination || ''}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value || undefined })}
            placeholder="203.0.113.1/32"
          />
        </div>
        {formData.type !== 'masquerade' && (
          <div className="space-y-2">
            <Label htmlFor="translation-address">Translation Address</Label>
            <Input
              id="translation-address"
              value={formData.translationAddress || ''}
              onChange={(e) => setFormData({ ...formData, translationAddress: e.target.value })}
              placeholder="203.0.113.1"
            />
          </div>
        )}
      </div>

      {formData.type === 'destination' && (
        <div className="space-y-2">
          <Label htmlFor="translation-port">Translation Port (Optional)</Label>
          <Input
            id="translation-port"
            value={formData.translationPort || ''}
            onChange={(e) => setFormData({ ...formData, translationPort: e.target.value })}
            placeholder="8080"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nat-description">Description (Optional)</Label>
        <Textarea
          id="nat-description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Forward external port 80 to internal server"
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="nat-enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <Label htmlFor="nat-enabled">Enable rule</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name}>
          {rule ? 'Update' : 'Add'}
        </Button>
      </DialogFooter>
    </form>
  );
}