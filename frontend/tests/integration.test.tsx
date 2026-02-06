/**
 * Integration Tests for VyOS Web UI
 *
 * This file contains integration tests that verify the interaction between
 * components, stores, services, and the routing system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';

// ============================================================================
// Test Setup
// ============================================================================

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

// ============================================================================
// Mock Services
// ============================================================================

const mockAuthService = {
  login: vi.fn(),
  logout: vi.fn(),
  getProfile: vi.fn(),
  refreshToken: vi.fn(),
};

const mockNodeService = {
  getNodes: vi.fn(),
  getNodeById: vi.fn(),
  addNode: vi.fn(),
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  testConnection: vi.fn(),
};

const mockMonitoringService = {
  getDashboardSummary: vi.fn(),
  getNodeMetrics: vi.fn(),
  getTrafficData: vi.fn(),
  getActivityLog: vi.fn(),
  getAlerts: vi.fn(),
};

const mockConfigService = {
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  commitConfig: vi.fn(),
  getConfigHistory: vi.fn(),
  validateConfig: vi.fn(),
};

vi.mock('../src/services/AuthService', () => ({
  authService: mockAuthService,
}));

vi.mock('../src/services/NodeService', () => ({
  nodeService: mockNodeService,
}));

vi.mock('../src/services/MonitoringService', () => ({
  monitoringService: mockMonitoringService,
}));

vi.mock('../src/services/ConfigService', () => ({
  configService: mockConfigService,
}));

// ============================================================================
// Mock Stores
// ============================================================================

vi.mock('../src/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isInitialized: false,
    logout: vi.fn(),
  })),
}));

vi.mock('../src/stores/nodeStore', () => ({
  useNodeStore: vi.fn(() => ({
    nodes: [],
    selectedNodeId: null,
    isLoading: false,
    setNodes: vi.fn(),
    addNode: vi.fn(),
    updateNode: vi.fn(),
    removeNode: vi.fn(),
    setSelectedNode: vi.fn(),
  })),
}));

vi.mock('../src/stores/dashboardStore', () => ({
  useDashboardStore: vi.fn(() => ({
    summary: null,
    nodeStatuses: [],
    trafficData: [],
    activityLog: [],
    alerts: [],
    isLoadingSummary: false,
    setSummary: vi.fn(),
    setNodeStatuses: vi.fn(),
    addAlert: vi.fn(),
  })),
}));

vi.mock('../src/stores/configStore', () => ({
  useConfigStore: vi.fn(() => ({
    config: [],
    unsavedChanges: false,
    isLoadingConfig: false,
    setConfig: vi.fn(),
    setUnsavedChanges: vi.fn(),
  })),
}));

// ============================================================================
// Authentication Flow Integration Tests
// ============================================================================

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('completes login flow successfully', async () => {
    const { LoginPage } = require('../src/pages/auth/LoginPage');

    mockAuthService.login.mockResolvedValueOnce({
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin' as const,
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Date.now() + 3600000,
      },
    });

    const useAuthStore = require('../src/stores/authStore').useAuthStore;
    let setAuthMock = vi.fn();
    useAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      setAuth: setAuthMock,
      logout: vi.fn(),
    });

    renderWithProviders(<LoginPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });

    expect(setAuthMock).toHaveBeenCalled();
  });

  it('displays error on failed login', async () => {
    const { LoginPage } = require('../src/pages/auth/LoginPage');

    mockAuthService.login.mockRejectedValueOnce(
      new Error('Invalid credentials')
    );

    renderWithProviders(<LoginPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(usernameInput, 'wronguser');
    await userEvent.type(passwordInput, 'wrongpass');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('logs out and redirects to login', async () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
      BrowserRouter: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }));

    const { Header } = require('../src/components/layout/Header');

    const logoutMock = vi.fn();
    const useAuthStore = require('../src/stores/authStore').useAuthStore;
    useAuthStore.mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'admin' as const },
      isAuthenticated: true,
      logout: logoutMock,
    });

    render(<Header />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await userEvent.click(logoutButton);

    expect(logoutMock).toHaveBeenCalled();
  });
});

// ============================================================================
// Node Management Integration Tests
// ============================================================================

describe('Node Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays nodes', async () => {
    const mockNodes = [
      {
        id: '1',
        name: 'Node 1',
        hostname: 'router1.example.com',
        ipAddress: '192.168.1.1',
        port: 22,
        type: 'router' as const,
        status: 'online' as const,
        version: '1.0.0',
        description: 'Main router',
        location: 'Datacenter A',
        tags: ['production'],
        healthMetrics: [],
        lastConnected: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockNodeService.getNodes.mockResolvedValueOnce(mockNodes);

    const useNodeStore = require('../src/stores/nodeStore').useNodeStore;
    const setNodesMock = vi.fn();
    useNodeStore.mockReturnValue({
      nodes: mockNodes,
      selectedNodeId: null,
      isLoading: false,
      setNodes: setNodesMock,
      addNode: vi.fn(),
      updateNode: vi.fn(),
      removeNode: vi.fn(),
      setSelectedNode: vi.fn(),
    });

    const { NodesPage } = require('../src/pages/nodes/NodesPage');

    renderWithProviders(<NodesPage />);

    await waitFor(() => {
      expect(screen.getByText('Node 1')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });
  });

  it('adds a new node', async () => {
    const newNode = {
      name: 'New Node',
      hostname: 'newnode.example.com',
      ipAddress: '192.168.1.100',
      port: 22,
      type: 'switch' as const,
    };

    mockNodeService.addNode.mockResolvedValueOnce({
      id: '2',
      ...newNode,
      status: 'online' as const,
      version: '1.0.0',
      description: undefined,
      location: undefined,
      tags: [],
      healthMetrics: [],
      lastConnected: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const addNodeMock = vi.fn();
    const useNodeStore = require('../src/stores/nodeStore').useNodeStore;
    useNodeStore.mockReturnValue({
      nodes: [],
      selectedNodeId: null,
      isLoading: false,
      setNodes: vi.fn(),
      addNode: addNodeMock,
      updateNode: vi.fn(),
      removeNode: vi.fn(),
      setSelectedNode: vi.fn(),
    });

    const { NodesPage } = require('../src/pages/nodes/NodesPage');

    renderWithProviders(<NodesPage />);

    // Click add button
    const addButton = screen.getByRole('button', { name: /add node/i });
    await userEvent.click(addButton);

    // Fill form
    const nameInput = screen.getByLabelText(/name/i);
    const hostnameInput = screen.getByLabelText(/hostname/i);
    const ipAddressInput = screen.getByLabelText(/ip address/i);

    await userEvent.type(nameInput, newNode.name);
    await userEvent.type(hostnameInput, newNode.hostname);
    await userEvent.type(ipAddressInput, newNode.ipAddress);

    // Submit
    const submitButton = screen.getByRole('button', { name: /create/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNodeService.addNode).toHaveBeenCalledWith(newNode);
      expect(addNodeMock).toHaveBeenCalled();
    });
  });

  it('deletes a node', async () => {
    const existingNode = {
      id: '1',
      name: 'Node 1',
      hostname: 'router1.example.com',
      ipAddress: '192.168.1.1',
      port: 22,
      type: 'router' as const,
      status: 'online' as const,
      version: '1.0.0',
      description: undefined,
      location: undefined,
      tags: [],
      healthMetrics: [],
      lastConnected: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockNodeService.deleteNode.mockResolvedValueOnce(undefined);

    const removeNodeMock = vi.fn();
    const useNodeStore = require('../src/stores/nodeStore').useNodeStore;
    useNodeStore.mockReturnValue({
      nodes: [existingNode],
      selectedNodeId: null,
      isLoading: false,
      setNodes: vi.fn(),
      addNode: vi.fn(),
      updateNode: vi.fn(),
      removeNode: removeNodeMock,
      setSelectedNode: vi.fn(),
    });

    const { NodesPage } = require('../src/pages/nodes/NodesPage');

    renderWithProviders(<NodesPage />);

    await waitFor(() => {
      expect(screen.getByText('Node 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockNodeService.deleteNode).toHaveBeenCalledWith('1');
      expect(removeNodeMock).toHaveBeenCalledWith('1');
    });
  });
});

// ============================================================================
// Dashboard Integration Tests
// ============================================================================

describe('Dashboard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads dashboard summary', async () => {
    const mockSummary = {
      totalNodes: 10,
      onlineNodes: 8,
      offlineNodes: 2,
      degradedNodes: 0,
      activeInterfaces: 25,
      totalBandwidth: 1000,
      bandwidthUnit: 'Mbps',
      systemStatus: 'healthy' as const,
    };

    mockMonitoringService.getDashboardSummary.mockResolvedValueOnce(mockSummary);

    const setSummaryMock = vi.fn();
    const useDashboardStore = require('../src/stores/dashboardStore').useDashboardStore;
    useDashboardStore.mockReturnValue({
      summary: mockSummary,
      nodeStatuses: [],
      trafficData: [],
      activityLog: [],
      alerts: [],
      isLoadingSummary: false,
      setSummary: setSummaryMock,
      setNodeStatuses: vi.fn(),
      addAlert: vi.fn(),
    });

    const { DashboardPage } = require('../src/pages/dashboard/DashboardPage');

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  it('displays alerts', async () => {
    const mockAlerts = [
      {
        id: '1',
        severity: 'critical' as const,
        title: 'High CPU Usage',
        message: 'CPU usage above 90%',
        timestamp: new Date().toISOString(),
        node: 'Node 1',
        acknowledged: false,
      },
    ];

    mockMonitoringService.getAlerts.mockResolvedValueOnce(mockAlerts);

    const useDashboardStore = require('../src/stores/dashboardStore').useDashboardStore;
    useDashboardStore.mockReturnValue({
      summary: null,
      nodeStatuses: [],
      trafficData: [],
      activityLog: [],
      alerts: mockAlerts,
      isLoadingSummary: false,
      setSummary: vi.fn(),
      setNodeStatuses: vi.fn(),
      addAlert: vi.fn(),
    });

    const { DashboardPage } = require('../src/pages/dashboard/DashboardPage');

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('High CPU Usage')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Configuration Management Integration Tests
// ============================================================================

describe('Configuration Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays configuration', async () => {
    const mockConfig = [
      {
        path: ['interfaces'],
        name: 'interfaces',
        value: null,
        type: 'object' as const,
        children: [
          {
            path: ['interfaces', 'eth0'],
            name: 'eth0',
            value: null,
            type: 'object' as const,
            children: [
              {
                path: ['interfaces', 'eth0', 'address'],
                name: 'address',
                value: '192.168.1.1/24',
                type: 'string' as const,
              },
            ],
          },
        ],
      },
    ];

    mockConfigService.getConfig.mockResolvedValueOnce({
      config: mockConfig,
      sections: [],
      version: 'v1',
      timestamp: new Date().toISOString(),
    });

    const setConfigMock = vi.fn();
    const useConfigStore = require('../src/stores/configStore').useConfigStore;
    useConfigStore.mockReturnValue({
      config: mockConfig,
      unsavedChanges: false,
      isLoadingConfig: false,
      setConfig: setConfigMock,
      setUnsavedChanges: vi.fn(),
    });

    const { NetworkConfigPage } = require('../src/pages/network/NetworkConfigPage');

    renderWithProviders(<NetworkConfigPage />);

    await waitFor(() => {
      expect(screen.getByText('interfaces')).toBeInTheDocument();
    });
  });

  it('commits configuration changes', async () => {
    mockConfigService.commitConfig.mockResolvedValueOnce({
      success: true,
      version: 'v2',
      timestamp: new Date().toISOString(),
      message: 'Configuration committed',
    });

    const setUnsavedChangesMock = vi.fn();
    const useConfigStore = require('../src/stores/configStore').useConfigStore;
    useConfigStore.mockReturnValue({
      config: [],
      unsavedChanges: true,
      isLoadingConfig: false,
      setConfig: vi.fn(),
      setUnsavedChanges: setUnsavedChangesMock,
    });

    const { NetworkConfigPage } = require('../src/pages/network/NetworkConfigPage');

    renderWithProviders(<NetworkConfigPage />);

    const applyButton = screen.getByRole('button', { name: /apply changes/i });
    await userEvent.click(applyButton);

    await waitFor(() => {
      expect(mockConfigService.commitConfig).toHaveBeenCalled();
      expect(setUnsavedChangesMock).toHaveBeenCalledWith(false);
    });
  });
});

// ============================================================================
// WebSocket Integration Tests
// ============================================================================

describe('WebSocket Integration', () => {
  it('connects to WebSocket for real-time updates', async () => {
    const mockWebSocket = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    };

    global.WebSocket = vi.fn(() => mockWebSocket) as any;

    const { useWebSocket } = require('../src/hooks/useWebSocket');

    const onMessage = vi.fn();

    renderHook(() => useWebSocket('ws://localhost:8080/ws', onMessage));

    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8080/ws');
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function)
    );
  });
});

// ============================================================================
// Routing Integration Tests
// ============================================================================

describe('Routing Integration', () => {
  it('navigates between pages correctly', async () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
      MemoryRouter: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      Routes,
      Route,
    }));

    const { App } = require('../src/App');

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Should be redirected to login if not authenticated
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('loads correct page based on route', async () => {
    vi.mock('../src/stores/authStore', () => ({
      useAuthStore: () => ({
        user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'admin' as const },
        isAuthenticated: true,
        isInitialized: true,
      }),
    }));

    const { ProtectedRoute } = require('../src/components/common/ProtectedRoute');
    const { DashboardPage } = require('../src/pages/dashboard/DashboardPage');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/*" element={<ProtectedRoute><div>Protected</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Export Test Utilities
// ============================================================================

export {
  renderWithProviders,
  createTestQueryClient,
  mockAuthService,
  mockNodeService,
  mockMonitoringService,
  mockConfigService,
};