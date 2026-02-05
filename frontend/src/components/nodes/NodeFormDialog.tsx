import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Node, NodeType } from '../../stores/nodeStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Alert, AlertDescription } from '../ui/Alert';
import { Loader2, RefreshCw } from 'lucide-react';

const nodeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  hostname: z.string().min(1, 'Hostname is required').max(255, 'Hostname must be less than 255 characters'),
  ipAddress: z.string().min(1, 'IP address is required').ip({ message: 'Invalid IP address' }),
  port: z.number().int().min(1).max(65535).default(22),
  type: z.enum(['router', 'switch', 'firewall', 'load-balancer', 'other']),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  tags: z.string().optional(),
});

type NodeFormData = z.infer<typeof nodeSchema>;

interface NodeFormDialogProps {
  node?: Node | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NodeFormData) => Promise<void>;
  onTestConnection?: (data: { ipAddress: string; port: number; hostname: string }) => Promise<boolean>;
}

export function NodeFormDialog({
  node,
  open,
  onOpenChange,
  onSubmit,
  onTestConnection,
}: NodeFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<NodeFormData>({
    resolver: zodResolver(nodeSchema),
    defaultValues: node ? {
      name: node.name,
      hostname: node.hostname,
      ipAddress: node.ipAddress,
      port: node.port,
      type: node.type,
      description: node.description || '',
      location: node.location || '',
      tags: node.tags.join(', '),
    } : {
      name: '',
      hostname: '',
      ipAddress: '',
      port: 22,
      type: 'router',
      description: '',
      location: '',
      tags: '',
    },
  });

  const watchedType = watch('type');

  const handleFormSubmit = async (data: NodeFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      reset();
      setTestResult(null);
    } catch (error) {
      console.error('Failed to submit node:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!onTestConnection) return;

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const ipAddress = watch('ipAddress');
      const port = watch('port');
      const hostname = watch('hostname');

      const success = await onTestConnection({ ipAddress, port, hostname });
      setTestResult({
        success,
        message: success ? 'Connection successful!' : 'Connection failed. Please check your credentials.',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setTestResult(null);
    }
    onOpenChange(newOpen);
  };

  const nodeTypes: { value: NodeType; label: string }[] = [
    { value: 'router', label: 'Router' },
    { value: 'switch', label: 'Switch' },
    { value: 'firewall', label: 'Firewall' },
    { value: 'load-balancer', label: 'Load Balancer' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{node ? 'Edit Node' : 'Add New Node'}</DialogTitle>
          <DialogDescription>
            {node
              ? 'Update the node configuration. Changes will be saved immediately.'
              : 'Add a new VyOS node to your network infrastructure.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., vyos-router-01"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostname">Hostname *</Label>
            <Input
              id="hostname"
              placeholder="e.g., router01.example.com"
              {...register('hostname')}
            />
            {errors.hostname && (
              <p className="text-sm text-destructive">{errors.hostname.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address *</Label>
              <Input
                id="ipAddress"
                placeholder="192.168.1.1"
                {...register('ipAddress')}
              />
              {errors.ipAddress && (
                <p className="text-sm text-destructive">{errors.ipAddress.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Port *</Label>
              <Input
                id="port"
                type="number"
                placeholder="22"
                {...register('port', { valueAsNumber: true })}
              />
              {errors.port && (
                <p className="text-sm text-destructive">{errors.port.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={watchedType}
              onValueChange={(value) => setValue('type', value as NodeType)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select node type" />
              </SelectTrigger>
              <SelectContent>
                {nodeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Data Center A"
              {...register('location')}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="e.g., production, core"
              {...register('tags')}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated values
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this node..."
              className="resize-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {testResult && (
            <Alert variant={testResult.success ? 'success' : 'destructive'}>
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            {onTestConnection && (
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTestingConnection || isSubmitting}
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                node ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}