import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { NetworkConfigPage } from './pages/network/NetworkConfigPage';
import { MonitoringPage } from './pages/monitoring/MonitoringPage';
import { UserManagementPage } from './pages/users/UserManagementPage';
import { NodesPage } from './pages/nodes/NodesPage';
import { NodeDetailPage } from './pages/nodes/NodeDetailPage';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vyos-ui-theme">
      <Routes>
        {/* Auth routes - no authentication required */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="nodes" element={<NodesPage />} />
          <Route path="nodes/:id" element={<NodeDetailPage />} />
          <Route path="network" element={<NetworkConfigPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;