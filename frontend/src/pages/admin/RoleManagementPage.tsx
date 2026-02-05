import { useEffect, useState } from 'react';
import { useUserManagementStore } from '../../stores/userManagementStore';
import userManagementService from '../../services/UserManagementService';
import { RoleFormDialog } from '../../components/admin/RoleFormDialog';
import { PermissionTable } from '../../components/admin/PermissionTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog';
import { Loader2, Plus, Shield, ShieldCheck, Edit, Trash2, Settings, Users } from 'lucide-react';
import type { Role, RoleCreateRequest, RoleUpdateRequest } from '../../stores/userManagementStore';

export function RoleManagementPage() {
  const {
    roles,
    permissions,
    isLoadingRoles,
    isLoadingPermissions,
    setRoles,
    addRole,
    updateRole,
    removeRole,
    setSelectedRole,
    setError,
  } = useUserManagementStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [permissionEditMode, setPermissionEditMode] = useState(false);

  // Load roles and permissions on mount
  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      const data = await userManagementService.getRoles();
      setRoles(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load roles');
    }
  };

  const loadPermissions = async () => {
    try {
      const data = await userManagementService.getPermissions();
      useUserManagementStore.setState({ permissions: data });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load permissions');
    }
  };

  const handleCreateRole = async (data: RoleCreateRequest) => {
    setIsLoadingAction(true);
    setActionError(null);

    try {
      const newRole = await userManagementService.createRole(data);
      addRole(newRole);
      setIsFormOpen(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to create role');
      throw error;
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleUpdateRole = async (data: RoleUpdateRequest) => {
    if (!editingRole) return;

    setIsLoadingAction(true);
    setActionError(null);

    try {
      const updatedRole = await userManagementService.updateRole(editingRole.id, data);
      updateRole(editingRole.id, updatedRole);
      setIsFormOpen(false);
      setEditingRole(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update role');
      throw error;
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      await userManagementService.deleteRole(roleToDelete.id);
      removeRole(roleToDelete.id);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermissionToggle = async (roleId: string, permissionId: string, granted: boolean) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    setIsLoadingAction(true);
    setActionError(null);

    try {
      const currentPermissions = role.permissions.map(p => p.id);
      const newPermissions = granted
        ? [...currentPermissions, permissionId]
        : currentPermissions.filter(id => id !== permissionId);

      const updatedRole = await userManagementService.updateRolePermissions(roleId, {
        permissions: newPermissions,
      });

      updateRole(roleId, updatedRole);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update permissions');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setIsFormOpen(true);
    setActionError(null);
  };

  const openDeleteDialog = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
    setActionError(null);
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    setIsFormOpen(true);
    setActionError(null);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingRole) {
      await handleUpdateRole(data as RoleUpdateRequest);
    } else {
      await handleCreateRole(data as RoleCreateRequest);
    }
  };

  const getSystemRoleBadge = (role: Role) => {
    if (role.isSystemRole) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3 w-3" />
          System
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role & Permission Management</h1>
          <p className="text-muted-foreground">
            Configure roles and their associated permissions for access control.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">
            <Settings className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="mr-2 h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                {roles.length} roles configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionError && (
                <Alert variant="destructive">
                  <AlertDescription>{actionError}</AlertDescription>
                </Alert>
              )}

              {isLoadingRoles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : roles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Roles Found</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Create your first role to start defining access levels in the system.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-start justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{role.name}</h3>
                          {getSystemRoleBadge(role)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {role.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {role.userCount} users
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <ShieldCheck className="h-3 w-3" />
                            {role.permissions.length} permissions
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedRole(role.id);
                            setPermissionEditMode(!permissionEditMode);
                          }}
                          title="Configure permissions"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        {!role.isSystemRole && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(role)}
                              title="Edit role"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(role)}
                              disabled={isLoadingAction}
                              title="Delete role"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                View and manage permissions for all roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {actionError && (
                <Alert variant="destructive">
                  <AlertDescription>{actionError}</AlertDescription>
                </Alert>
              )}

              {isLoadingPermissions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <PermissionTable
                  roles={roles}
                  permissions={permissions}
                  onPermissionToggle={handlePermissionToggle}
                  readonly={isLoadingAction}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RoleFormDialog
        role={editingRole}
        availablePermissions={permissions}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role <strong>{roleToDelete?.name}</strong>?
              {roleToDelete?.userCount && roleToDelete.userCount > 0 && (
                <>
                  {' '}
                  This role is currently assigned to{' '}
                  <strong>{roleToDelete.userCount} user(s)</strong>. Users will need to be reassigned
                  to another role.
                </>
              )}
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setRoleToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}