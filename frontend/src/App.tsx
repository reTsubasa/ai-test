import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { NetworkConfigPage } from './pages/network/NetworkConfigPage';
import { MonitoringPage } from './pages/monitoring/MonitoringPage';
import { UserManagementPage } from './pages/users/UserManagementPage';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vyos-ui-theme">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          <Route path="network" element={<NetworkConfigPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;