import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Role, Permission } from '../../stores/userManagementStore';
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
import { Alert, AlertDescription } from '../ui/Alert';
import { Loader2, Shield } from 'lucide-react';

const roleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(50, 'Role name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, underscores, and hyphens'),
  description: z.string()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormDialogProps {
  role?: Role | null;
  availablePermissions: Permission[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoleFormData) => Promise<void>;
}

export function RoleFormDialog({
  role,
  availablePermissions,
  open,
  onOpenChange,
  onSubmit,
}: RoleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  useEffect(() => {
    if (role) {
      setValue('name', role.name);
      setValue('description', role.description);
      const rolePermissionIds = role.permissions.map(p => p.id);
      setValue('permissions', rolePermissionIds);
      setSelectedPermissions(new Set(rolePermissionIds));
    } else {
      reset({
        name: '',
        description: '',
        permissions: [],
      });
      setSelectedPermissions(new Set());
    }
    setError(null);
  }, [role, open, setValue, reset]);

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
    setValue('permissions', Array.from(newSelected));
  };

  const handleSelectAllInCategory = (category: Permission['category']) => {
    const categoryPermissions = availablePermissions.filter(p => p.category === category);
    const categoryIds = categoryPermissions.map(p => p.id);
    const allSelected = categoryIds.every(id => selectedPermissions.has(id));

    const newSelected = new Set(selectedPermissions);
    if (allSelected) {
      categoryIds.forEach(id => newSelected.delete(id));
    } else {
      categoryIds.forEach(id => newSelected.add(id));
    }
    setSelectedPermissions(newSelected);
    setValue('permissions', Array.from(newSelected));
  };

  const handleFormSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(data);
      onOpenChange(false);
      reset();
      setSelectedPermissions(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setSelectedPermissions(new Set());
      setError(null);
    }
    onOpenChange(newOpen);
  };

  const groupedPermissions: Record<Permission['category'], Permission[]> = {
    user: availablePermissions.filter(p => p.category === 'user'),
    node: availablePermissions.filter(p => p.category === 'node'),
    network: availablePermissions.filter(p => p.category === 'network'),
    system: availablePermissions.filter(p => p.category === 'system'),
    dashboard: availablePermissions.filter(p => p.category === 'dashboard'),
  };

  const categoryLabels: Record<Permission['category'], string> = {
    user: 'User Management',
    node: 'Node Management',
    network: 'Network Configuration',
    system: 'System Management',
    dashboard: 'Dashboard & Monitoring',
  };

  const categoryIcons: Record<Permission['category'], string> = {
    user: '👤',
    node: '🌐',
    network: '🔌',
    system: '⚙️',
    dashboard: '📊',
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {role
              ? 'Update role configuration and permissions.'
              : 'Create a new role with specific permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                placeholder="e.g., network_operator"
                disabled={role?.isSystemRole || isSubmitting}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
              {role?.isSystemRole && (
                <p className="text-xs text-muted-foreground">
                  System roles cannot be renamed.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="Brief role description"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Permissions *</Label>
              <span className="text-sm text-muted-foreground">
                {selectedPermissions.size} selected
              </span>
            </div>

            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      {categoryIcons[category as Permission['category']]} {categoryLabels[category as Permission['category']]}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAllInCategory(category as Permission['category'])}
                      className="h-7 text-xs"
                    >
                      {permissions.every(p => selectedPermissions.has(p.id))
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          selectedPermissions.has(permission.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.has(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          disabled={isSubmitting}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{permission.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {permission.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {errors.permissions && (
              <p className="text-sm text-destructive">{errors.permissions.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid || !isDirty}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  {role ? 'Update' : 'Create'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}