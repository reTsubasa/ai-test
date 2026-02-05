import AuthService from '../services/authService';
import apiClient from '../services/apiClient';

// Mock axios client
jest.mock('../services/apiClient');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should be able to initialize', () => {
    expect(AuthService).toBeDefined();
  });

  describe('login', () => {
    it('should authenticate user successfully and store tokens', async () => {
      const mockResponse = {
        data: {
          token: 'mock-auth-token',
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            roles: ['user']
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await AuthService.login({
        username: 'testuser',
        password: 'password123'
      });

      expect(result).toEqual({
        token: 'mock-auth-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user']
        }
      });

      expect(localStorage.getItem('authToken')).toBe('mock-auth-token');
      expect(localStorage.getItem('currentUser')).toBe(JSON.stringify({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user']
      }));
    });

    it('should handle authentication failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Authentication failed'));

      await expect(AuthService.login({
        username: 'invalid',
        password: 'wrong'
      })).rejects.toThrow('Authentication failed. Please check your credentials.');
    });
  });

  describe('logout', () => {
    it('should clear authentication tokens and redirect', () => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('currentUser', JSON.stringify({ id: '1', username: 'testuser' }));

      AuthService.logout();

      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });
  });

  describe('authentication state', () => {
    it('should return correct authentication state when authenticated', () => {
      localStorage.setItem('authToken', 'mock-token');

      expect(AuthService.isAuthenticated()).toBe(true);
    });

    it('should return correct authentication state when not authenticated', () => {
      localStorage.removeItem('authToken');

      expect(AuthService.isAuthenticated()).toBe(false);
    });

    it('should return current user when available', () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user'] };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));

      expect(AuthService.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null when no user is available', () => {
      localStorage.removeItem('currentUser');

      expect(AuthService.getCurrentUser()).toBeNull();
    });
  });

  describe('role checking', () => {
    it('should check single role correctly', () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user', 'admin'] };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));

      expect(AuthService.hasRole('user')).toBe(true);
      expect(AuthService.hasRole('admin')).toBe(true);
      expect(AuthService.hasRole('monitoring')).toBe(false);
    });

    it('should check multiple roles correctly', () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user', 'admin'] };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));

      expect(AuthService.hasRole(['user', 'monitoring'])).toBe(true);
      expect(AuthService.hasRole(['monitoring', 'read-only'])).toBe(false);
    });
  });

  describe('token management', () => {
    it('should get auth token correctly', () => {
      localStorage.setItem('authToken', 'mock-token');

      expect(AuthService.getAuthToken()).toBe('mock-token');
    });

    it('should return null when no token exists', () => {
      localStorage.removeItem('authToken');

      expect(AuthService.getAuthToken()).toBeNull();
    });

    it('should get user roles correctly', () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user', 'admin'] };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));

      expect(AuthService.getUserRoles()).toEqual(['user', 'admin']);
    });

    it('should return empty array when no user exists', () => {
      localStorage.removeItem('currentUser');

      expect(AuthService.getUserRoles()).toEqual([]);
    });
  });

  describe('refresh token', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        data: { token: 'new-refreshed-token' }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await AuthService.refreshAuthToken();

      expect(result).toBe('new-refreshed-token');
      expect(localStorage.getItem('authToken')).toBe('new-refreshed-token');
    });

    it('should logout user on refresh failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Refresh failed'));

      const logoutSpy = jest.spyOn(AuthService, 'logout');

      const result = await AuthService.refreshAuthToken();

      expect(result).toBeNull();
      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  describe('user management', () => {
    it('should register a new user successfully', async () => {
      const mockResponse = {
        data: {
          id: '2',
          username: 'newuser',
          email: 'new@example.com',
          roles: ['user']
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await AuthService.registerUser({
        username: 'newuser',
        email: 'new@example.com',
        roles: ['user']
      });

      expect(result).toEqual({
        id: '2',
        username: 'newuser',
        email: 'new@example.com',
        roles: ['user']
      });
    });

    it('should handle registration failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Registration failed'));

      await expect(AuthService.registerUser({
        username: 'newuser',
        email: 'new@example.com',
        roles: ['user']
      })).rejects.toThrow('Failed to register user');
    });

    it('should update user profile successfully', async () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user'] };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));

      const mockResponse = {
        data: {
          id: '1',
          username: 'testuser',
          email: 'updated@example.com',
          roles: ['user']
        }
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await AuthService.updateUserProfile({
        email: 'updated@example.com'
      });

      expect(result).toEqual({
        id: '1',
        username: 'testuser',
        email: 'updated@example.com',
        roles: ['user']
      });

      // Verify updated user is stored in localStorage
      expect(localStorage.getItem('currentUser')).toBe(JSON.stringify({
        id: '1',
        username: 'testuser',
        email: 'updated@example.com',
        roles: ['user']
      }));
    });

    it('should handle profile update failure', async () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user'] };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));

      (apiClient.put as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(AuthService.updateUserProfile({
        email: 'updated@example.com'
      })).rejects.toThrow('Failed to update profile');
    });
  });
});