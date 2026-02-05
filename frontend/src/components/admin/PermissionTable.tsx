import { Role, Permission } from '../../stores/userManagementStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { Shield, Lock, Unlock, Info } from 'lucide-react';

interface PermissionTableProps {
  roles: Role[];
  permissions: Permission[];
  onPermissionToggle?: (roleId: string, permissionId: string, granted: boolean) => void;
  readonly?: boolean;
}

export function PermissionTable({
  roles,
  permissions,
  onPermissionToggle,
  readonly = false,
}: PermissionTableProps) {
  const groupedPermissions: Record<Permission['category'], Permission[]> = {
    user: permissions.filter(p => p.category === 'user'),
    node: permissions.filter(p => p.category === 'node'),
    network: permissions.filter(p => p.category === 'network'),
    system: permissions.filter(p => p.category === 'system'),
    dashboard: permissions.filter(p => p.category === 'dashboard'),
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

  const hasPermission = (roleId: string, permissionId: string): boolean => {
    const role = roles.find(r => r.id === roleId);
    return role?.permissions.some(p => p.id === permissionId) ?? false;
  };

  const togglePermission = (roleId: string, permissionId: string) => {
    if (readonly || !onPermissionToggle) return;

    const current = hasPermission(roleId, permissionId);
    onPermissionToggle(roleId, permissionId, !current);
  };

  const getRoleVariant = (role: Role): 'default' | 'secondary' | 'outline' => {
    if (role.isSystemRole) return 'default';
    return 'secondary';
  };

  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Lock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Roles Available</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Create roles first to configure permissions.
        </p>
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Info className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Permissions Available</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Permissions will appear here once they are loaded from the server.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
        if (categoryPermissions.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{categoryIcons[category as Permission['category']]}</span>
              <h3 className="text-lg font-semibold">
                {categoryLabels[category as Permission['category']]}
              </h3>
              <Badge variant="outline" className="ml-2">
                {categoryPermissions.length} permissions
              </Badge>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Permission</TableHead>
                    <TableHead className="w-[200px]">Resource</TableHead>
                    <TableHead className="w-[150px]">Action</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role.id} className="w-[120px] text-center">
                        <div className="flex items-center justify-center gap-1">
                          {role.isSystemRole && <Shield className="h-3 w-3" />}
                          <span className="truncate">{role.name}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{permission.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {permission.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {permission.resource}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={permission.action === 'delete' ? 'destructive' : 'outline'}
                          className="font-mono text-xs"
                        >
                          {permission.action}
                        </Badge>
                      </TableCell>
                      {roles.map((role) => {
                        const hasPerm = hasPermission(role.id, permission.id);

                        return (
                          <TableCell key={role.id} className="text-center">
                            <Switch
                              checked={hasPerm}
                              onCheckedChange={() => togglePermission(role.id, permission.id)}
                              disabled={readonly || role.isSystemRole}
                              className="data-[state=checked]:bg-primary"
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}