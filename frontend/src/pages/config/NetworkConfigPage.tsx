import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Loader2, Save, RefreshCw, FileText, History, Download, Upload, CheckCircle, XCircle } from 'lucide-react';
import { useConfigStore } from '../../stores/configStore';
import { configService } from '../../services/ConfigService';
import { useToast } from '../../components/ui/Toast';

export function NetworkConfigPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    config,
    configSections,
    unsavedChanges,
    validationErrors,
    isLoadingConfig,
    isApplyingConfig,
    error,
    setConfig,
    setConfigSections,
    resetUnsavedChanges,
    setLoadingConfig,
    setApplyingConfig,
    setError,
    validateConfig,
    reset,
  } = useConfigStore();

  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  // Fetch configuration on mount
  useEffect(() => {
    fetchConfig();

    return () => {
      reset();
    };
  }, []);

  // Validate config when it changes
  useEffect(() => {
    if (config.length > 0) {
      const errors = validateConfig();
      setHasValidationErrors(errors.length > 0);
    }
  }, [config, validateConfig]);

  const fetchConfig = async () => {
    setLoadingConfig(true);
    setError(null);
    try {
      const data = await configService.getConfig({
        includeDescription: true,
      });
      setConfig(data.config);
      setConfigSections(data.sections);
      resetUnsavedChanges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
      toast({
        title: 'Error',
        description: 'Failed to load configuration',
        variant: 'destructive',
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveConfig = async () => {
    // First validate
    const errors = validateConfig();
    if (errors.length > 0) {
      toast({
        title: 'Validation Failed',
        description: `Please fix ${errors.length} error(s) before saving.`,
        variant: 'destructive',
      });
      return;
    }

    setApplyingConfig(true);
    setError(null);
    try {
      const result = await configService.applyConfig({
        config,
        comment: 'Configuration update from Web UI',
        validate: true,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Configuration applied successfully. Version: ${result.version}`,
        });
        resetUnsavedChanges();
        fetchConfig();
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

  const handleDiscardChanges = async () => {
    try {
      await configService.discardConfig();
      toast({
        title: 'Changes Discarded',
        description: 'All pending changes have been discarded.',
      });
      resetUnsavedChanges();
      fetchConfig();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to discard changes',
        variant: 'destructive',
      });
    }
  };

  const handleExportConfig = async (format: 'json' | 'yaml' | 'cli' = 'json') => {
    try {
      const blob = await configService.exportConfig(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vyos-config-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Export Successful',
        description: `Configuration exported as ${format.toUpperCase()}`,
      });
    } catch (err) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export configuration',
        variant: 'destructive',
      });
    }
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.yaml,.cfg';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const format = file.name.endsWith('.json') ? 'json' : file.name.endsWith('.yaml') ? 'yaml' : 'cli';

      try {
        const result = await configService.importConfig(file, format, { dryRun: true });
        toast({
          title: 'Import Preview',
          description: `Would import ${result.importedCount} items`,
        });
      } catch (err) {
        toast({
          title: 'Import Failed',
          description: 'Failed to preview import',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Configuration</h1>
          <p className="text-muted-foreground">
            Configure interfaces, routing, firewall, and VPN settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unsavedChanges && (
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/config/history')}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportConfig}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportConfig('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchConfig} disabled={isLoadingConfig}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingConfig ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unsavedChanges && (
            <>
              <Button variant="ghost" size="sm" onClick={handleDiscardChanges}>
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSaveConfig}
                disabled={isApplyingConfig || hasValidationErrors}
              >
                {isApplyingConfig ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Apply Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <Alert.Description>
            Found {validationErrors.length} validation error(s). Please fix them before applying.
          </Alert.Description>
        </Alert>
      )}

      {isLoadingConfig ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="interfaces" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
            <TabsTrigger value="routing">Routing</TabsTrigger>
            <TabsTrigger value="firewall">Firewall</TabsTrigger>
            <TabsTrigger value="vpn">VPN</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="interfaces" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Network Interfaces</CardTitle>
                <CardDescription>
                  Configure physical and virtual network interfaces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <Button onClick={() => navigate('/config/interfaces')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Open Interface Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Routing Configuration</CardTitle>
                <CardDescription>
                  Configure static routes, OSPF, BGP, and other routing protocols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <Button onClick={() => navigate('/config/routing')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Open Routing Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="firewall" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Firewall Configuration</CardTitle>
                <CardDescription>
                  Configure firewall rules, NAT, and security policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <Button onClick={() => navigate('/config/firewall')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Open Firewall Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vpn" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>VPN Configuration</CardTitle>
                <CardDescription>
                  Configure VPN connections (WireGuard, OpenVPN, IPsec, L2TP)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <Button onClick={() => navigate('/config/vpn')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Open VPN Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Services</CardTitle>
                <CardDescription>
                  Configure system services (DHCP, DNS, NTP, SSH, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <Button disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Open Services Configuration (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Configure system settings, users, and host information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <Button disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Open System Configuration (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}