import { useEffect, useState } from 'react';
import { useUserManagementStore } from '../../stores/userManagementStore';
import userManagementService from '../../services/UserManagementService';
import { UserFormDialog } from '../../components/admin/UserFormDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog';
import { Loader2, Plus, Search, Shield, ShieldCheck, Lock, Unlock, Trash2, Edit, UserPlus } from 'lucide-react';
import type { User, UserRole, UserCreateRequest, UserUpdateRequest } from '../../stores/userManagementStore';

export function UserManagementPage() {
  const {
    users,
    isLoadingUsers,
    setUsers,
    addUser,
    updateUser,
    removeUser,
    setSelectedUser,
    getSelectedUser,
    setError,
  } = useUserManagementStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userManagementService.getUsers();
      setUsers(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load users');
    }
  };

  const handleCreateUser = async (data: UserCreateRequest) => {
    setIsLoadingAction(true);
    setActionError(null);

    try {
      const newUser = await userManagementService.createUser(data);
      addUser(newUser);
      setIsFormOpen(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to create user');
      throw error;
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleUpdateUser = async (data: UserUpdateRequest) => {
    if (!editingUser) return;

    setIsLoadingAction(true);
    setActionError(null);

    try {
      const updatedUser = await userManagementService.updateUser(editingUser.id, data);
      updateUser(editingUser.id, updatedUser);
      setIsFormOpen(false);
      setEditingUser(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update user');
      throw error;
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      await userManagementService.deleteUser(userToDelete.id);
      removeUser(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLockUser = async (user: User) => {
    setIsLoadingAction(true);
    setActionError(null);

    try {
      const updatedUser = await userManagementService.lockUser(user.id);
      updateUser(user.id, updatedUser);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to lock user');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleUnlockUser = async (user: User) => {
    setIsLoadingAction(true);
    setActionError(null);

    try {
      const updatedUser = await userManagementService.unlockUser(user.id);
      updateUser(user.id, updatedUser);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to unlock user');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
    setActionError(null);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    setActionError(null);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setIsFormOpen(true);
    setActionError(null);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingUser) {
      await handleUpdateUser(data as UserUpdateRequest);
    } else {
      await handleCreateUser(data as UserCreateRequest);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive) ||
      (filterStatus === 'locked' && user.isLocked);
    const matchesSearch = searchQuery === '' ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesRole && matchesStatus && matchesSearch;
  });

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'operator':
        return 'default';
      case 'user':
        return 'secondary';
      case 'readonly':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'operator':
        return 'Operator';
      case 'user':
        return 'User';
      case 'readonly':
        return 'Read Only';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions for your VyOS network.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {users.length} total users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search users by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="readonly">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {actionError && (
            <Alert variant="destructive">
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}

          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {users.length === 0
                  ? 'Get started by adding your first user to the system.'
                  : 'No users match your current filters.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>2FA</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.fullName || user.username}</div>
                          <div className="text-sm text-muted-foreground">
                            @{user.username} · {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                          {user.isLocked && (
                            <Lock className="h-3 w-3 text-destructive" title="Locked" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.twoFactorEnabled ? (
                          <ShieldCheck className="h-4 w-4 text-green-500" title="2FA Enabled" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground" title="2FA Disabled" />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.isLocked ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUnlockUser(user)}
                              disabled={isLoadingAction}
                              title="Unlock user"
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleLockUser(user)}
                              disabled={isLoadingAction}
                              title="Lock user"
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(user)}
                            disabled={isLoadingAction}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        user={editingUser}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user <strong>@{userToDelete?.username}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}