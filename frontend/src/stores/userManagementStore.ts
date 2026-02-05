import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'user' | 'readonly' | 'operator';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  role: UserRole;
  isActive: boolean;
  isLocked: boolean;
  twoFactorEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  avatarUrl?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  category: 'user' | 'node' | 'network' | 'system' | 'dashboard';
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface UserManagementState {
  // State
  users: User[];
  roles: Role[];
  permissions: Permission[];
  selectedUserId: string | null;
  selectedRoleId: string | null;
  isLoadingUsers: boolean;
  isLoadingRoles: boolean;
  isLoadingPermissions: boolean;
  error: string | null;

  // Actions
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  removeUser: (id: string) => void;
  setRoles: (roles: Role[]) => void;
  addRole: (role: Role) => void;
  updateRole: (id: string, role: Partial<Role>) => void;
  removeRole: (id: string) => void;
  setPermissions: (permissions: Permission[]) => void;
  setSelectedUser: (id: string | null) => void;
  setSelectedRole: (id: string | null) => void;
  setLoadingUsers: (isLoading: boolean) => void;
  setLoadingRoles: (isLoading: boolean) => void;
  setLoadingPermissions: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getSelectedUser: () => User | null;
  getSelectedRole: () => Role | null;
  getUsersByRole: (role: UserRole) => User[];
  getActiveUsers: () => User[];
  getInactiveUsers: () => User[];
  getUsersWith2FA: () => User[];
  getPermissionsByCategory: (category: Permission['category']) => Permission[];
  getRolePermissions: (roleId: string) => Permission[];
}

export const useUserManagementStore = create<UserManagementState>()(
  persist(
    (set, get) => ({
      // Initial state
      users: [],
      roles: [],
      permissions: [],
      selectedUserId: null,
      selectedRoleId: null,
      isLoadingUsers: false,
      isLoadingRoles: false,
      isLoadingPermissions: false,
      error: null,

      // Actions
      setUsers: (users) => set({ users }),

      addUser: (user) =>
        set((state) => ({
          users: [...state.users, user],
        })),

      updateUser: (id, updatedUser) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...updatedUser, updatedAt: new Date() } : user,
          ),
        })),

      removeUser: (id) =>
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
          selectedUserId: state.selectedUserId === id ? null : state.selectedUserId,
        })),

      setRoles: (roles) => set({ roles }),

      addRole: (role) =>
        set((state) => ({
          roles: [...state.roles, role],
        })),

      updateRole: (id, updatedRole) =>
        set((state) => ({
          roles: state.roles.map((role) =>
            role.id === id ? { ...role, ...updatedRole, updatedAt: new Date() } : role,
          ),
        })),

      removeRole: (id) =>
        set((state) => ({
          roles: state.roles.filter((role) => role.id !== id),
          selectedRoleId: state.selectedRoleId === id ? null : state.selectedRoleId,
        })),

      setPermissions: (permissions) => set({ permissions }),

      setSelectedUser: (id) => set({ selectedUserId: id }),

      setSelectedRole: (id) => set({ selectedRoleId: id }),

      setLoadingUsers: (isLoadingUsers) => set({ isLoadingUsers }),

      setLoadingRoles: (isLoadingRoles) => set({ isLoadingRoles }),

      setLoadingPermissions: (isLoadingPermissions) => set({ isLoadingPermissions }),

      setError: (error) => set({ error }),

      // Computed
      getSelectedUser: () => {
        const { users, selectedUserId } = get();
        return users.find((user) => user.id === selectedUserId) || null;
      },

      getSelectedRole: () => {
        const { roles, selectedRoleId } = get();
        return roles.find((role) => role.id === selectedRoleId) || null;
      },

      getUsersByRole: (role) => {
        const { users } = get();
        return users.filter((user) => user.role === role);
      },

      getActiveUsers: () => {
        const { users } = get();
        return users.filter((user) => user.isActive);
      },

      getInactiveUsers: () => {
        const { users } = get();
        return users.filter((user) => !user.isActive);
      },

      getUsersWith2FA: () => {
        const { users } = get();
        return users.filter((user) => user.twoFactorEnabled);
      },

      getPermissionsByCategory: (category) => {
        const { permissions } = get();
        return permissions.filter((permission) => permission.category === category);
      },

      getRolePermissions: (roleId) => {
        const { roles, permissions } = get();
        const role = roles.find((r) => r.id === roleId);
        return role?.permissions || [];
      },
    }),
    {
      name: 'user-management-storage',
      partialize: (state) => ({
        users: state.users,
        roles: state.roles,
        permissions: state.permissions,
        selectedUserId: state.selectedUserId,
        selectedRoleId: state.selectedRoleId,
      }),
    },
  ),
);