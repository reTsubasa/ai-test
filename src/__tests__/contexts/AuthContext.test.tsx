import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import AuthService from '../../../services/authService';

// Mock the AuthService
jest.mock('../../../services/authService');

// Create a test component that uses the auth context
const TestComponent = () => {
  const { login, logout, isAuthenticated, getCurrentUser } = useAuth();

  return (
    <div>
      <button onClick={() => login({ username: 'test', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
      <span data-testid="is-authenticated">{isAuthenticated() ? 'true' : 'false'}</span>
      <span data-testid="current-user">{getCurrentUser()?.username || 'none'}</span>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should provide authentication context values', () => {
    const { getByRole } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const mockAuthResponse = {
      token: 'mock-token',
      user: { id: '1', username: 'testuser', email: 'test@example.com', roles: ['user'] }
    };

    (AuthService.login as jest.Mock).mockResolvedValue(mockAuthResponse);

    const { getByRole } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = getByRole('button', { name: 'Login' });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(AuthService.login).toHaveBeenCalledWith({
        username: 'test',
        password: 'password'
      });
    });

    // Verify state was updated
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('current-user')).toHaveTextContent('testuser');
  });

  it('should handle login failure', async () => {
    (AuthService.login as jest.Mock).mockRejectedValue(new Error('Authentication failed'));

    const { getByRole } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = getByRole('button', { name: 'Login' });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(AuthService.login).toHaveBeenCalledWith({
        username: 'test',
        password: 'password'
      });
    });

    // Verify state remains unchanged
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('current-user')).toHaveTextContent('none');
  });

  it('should handle logout', async () => {
    // Set up initial authenticated state
    localStorage.setItem('authToken', 'mock-token');
    localStorage.setItem('currentUser', JSON.stringify({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user']
    }));

    const { getByRole } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Verify initial state
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('current-user')).toHaveTextContent('testuser');

    const logoutButton = getByRole('button', { name: 'Logout' });
    fireEvent.click(logoutButton);

    // Verify state was cleared
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('current-user')).toHaveTextContent('none');
  });

  it('should correctly determine authentication state', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially not authenticated
    expect(getByTestId('is-authenticated')).toHaveTextContent('false');

    // Set up authenticated state
    localStorage.setItem('authToken', 'mock-token');
    localStorage.setItem('currentUser', JSON.stringify({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user']
    }));

    // Re-render to pick up the new state
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('is-authenticated')).toHaveTextContent('true');
    expect(getByTestId('current-user')).toHaveTextContent('testuser');
  });
});