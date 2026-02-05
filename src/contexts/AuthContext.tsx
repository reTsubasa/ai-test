import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService, { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
  getUserRoles: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const token = AuthService.getAuthToken();
    const currentUser = AuthService.getCurrentUser();

    if (token && currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const { user } = await AuthService.login(credentials);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (roles: string | string[]) => {
    return AuthService.hasRole(roles);
  };

  const getUserRoles = () => {
    return AuthService.getUserRoles();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      hasRole,
      getUserRoles
    }}>
      {children}
    </AuthContext.Provider>
  );
};