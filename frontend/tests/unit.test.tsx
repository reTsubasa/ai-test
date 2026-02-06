/**
 * Unit Tests for React Components
 *
 * This file contains example unit tests for various React components.
 * These tests use Vitest and React Testing Library.
 *
 * To run these tests:
 * npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
 * npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// ============================================================================
// Tests for UI Components
// ============================================================================

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    const Button = require('../src/components/ui/Button').Button;
    const { container } = render(<Button>Click me</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with variant prop', () => {
    const Button = require('../src/components/ui/Button').Button;
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-destructive');
  });

  it('renders disabled state', () => {
    const Button = require('../src/components/ui/Button').Button;
    const { getByRole } = render(<Button disabled>Disabled</Button>);
    expect(getByRole('button')).toBeDisabled();
  });

  it('calls onClick handler when clicked', async () => {
    const Button = require('../src/components/ui/Button').Button;
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('Input Component', () => {
  it('renders correctly', () => {
    const Input = require('../src/components/ui/Input').Input;
    const { getByRole } = render(<Input placeholder="Enter text" />);
    const input = getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  it('handles value changes', async () => {
    const Input = require('../src/components/ui/Input').Input;
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'hello');
    expect(handleChange).toHaveBeenCalled();
  });
});

describe('Card Component', () => {
  it('renders card with header and content', () => {
    const { Card, CardHeader, CardTitle, CardContent } =
      require('../src/components/ui/Card');

    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>Card content</CardContent>
      </Card>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });
});

describe('Alert Component', () => {
  it('renders destructive variant', () => {
    const { Alert, AlertDescription } = require('../src/components/ui/Alert');

    render(
      <Alert variant="destructive">
        <AlertDescription>Error message</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-destructive');
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});

describe('Dialog Component', () => {
  it('renders when open', () => {
    const { Dialog, DialogContent, DialogHeader, DialogTitle } =
      require('../src/components/ui/Dialog');

    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
  });
});

// ============================================================================
// Tests for Layout Components
// ============================================================================

describe('Header Component', () => {
  beforeEach(() => {
    // Mock the auth store
    vi.mock('../src/stores/authStore', () => ({
      useAuthStore: () => ({
        user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'admin' },
        isAuthenticated: true,
        logout: vi.fn(),
      }),
    }));
  });

  it('renders user information when authenticated', () => {
    const { Header } = require('../src/components/layout/Header');

    render(<Header />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
  });
});

describe('Sidebar Component', () => {
  it('renders navigation links', () => {
    const { Sidebar } = require('../src/components/layout/Sidebar');

    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Nodes')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
  });
});

// ============================================================================
// Tests for ProtectedRoute
// ============================================================================

describe('ProtectedRoute Component', () => {
  it('renders children when authenticated', () => {
    vi.mock('../src/stores/authStore', () => ({
      useAuthStore: () => ({
        isAuthenticated: true,
        isInitialized: true,
      }),
    }));

    const { ProtectedRoute } = require('../src/components/common/ProtectedRoute');

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
    }));

    vi.mock('../src/stores/authStore', () => ({
      useAuthStore: () => ({
        isAuthenticated: false,
        isInitialized: true,
      }),
    }));

    const { ProtectedRoute } = require('../src/components/common/ProtectedRoute');

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

// ============================================================================
// Tests for Utility Functions
// ============================================================================

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const cn = require('../src/utils/cn').cn;

    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('foo', false, 'bar')).toBe('foo bar');
    expect(cn('foo', null, 'bar', undefined)).toBe('foo bar');
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });
});

// ============================================================================
// Tests for ThemeContext
// ============================================================================

describe('ThemeProvider', () => {
  it('provides default theme', () => {
    const { ThemeProvider } = require('../src/contexts/ThemeContext');

    render(
      <ThemeProvider defaultTheme="dark">
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});

// ============================================================================
// Test Helper Functions
// ============================================================================

export const createMockStore = <T,>(initialState: T) => ({
  getState: () => initialState,
  setState: vi.fn(),
  subscribe: vi.fn(),
});

export const mockApiResponse = <T,>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
});

export const waitForElement = async (selector: string) => {
  return await waitFor(() => screen.querySelector(selector));
};

// ============================================================================
// Snapshot Tests
// ============================================================================

describe('Component Snapshots', () => {
  it('Button matches snapshot', () => {
    const Button = require('../src/components/ui/Button').Button;
    const { container } = render(<Button>Button</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('Input matches snapshot', () => {
    const Input = require('../src/components/ui/Input').Input;
    const { container } = render(<Input />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('Card matches snapshot', () => {
    const { Card, CardHeader, CardTitle, CardContent } =
      require('../src/components/ui/Card');
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Test</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});