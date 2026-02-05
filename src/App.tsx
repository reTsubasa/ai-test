import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import { AuthProvider } from './contexts/AuthContext';
import SessionManager from './components/Auth/SessionManager';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './components/Dashboard/Dashboard';
import UserManager from './components/UserManagement/UserManager';
import UnauthorizedPage from './components/UnauthorizedPage';
import NetworkConfigPage from './pages/NetworkConfigPage';
import MonitoringPage from './pages/MonitoringPage';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AuthProvider>
      <SessionManager>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <div className="flex h-screen bg-gray-50">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header title="VyOS Web UI" subtitle="Network Configuration Management" />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <Dashboard />
                  </main>
                </div>
              </div>
            }
          />

          <Route
            path="/dashboard"
            element={
              <div className="flex h-screen bg-gray-50">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header title="VyOS Web UI" subtitle="Network Configuration Management" />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <Dashboard />
                  </main>
                </div>
              </div>
            }
          />

          <Route
            path="/users"
            element={
              <div className="flex h-screen bg-gray-50">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header title="VyOS Web UI" subtitle="User Management" />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <UserManager />
                  </main>
                </div>
              </div>
            }
          />

          <Route
            path="/network-config"
            element={
              <div className="flex h-screen bg-gray-50">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header title="VyOS Web UI" subtitle="Network Configuration Management" />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <NetworkConfigPage />
                  </main>
                </div>
              </div>
            }
          />

          <Route
            path="/monitoring"
            element={
              <div className="flex h-screen bg-gray-50">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header title="VyOS Web UI" subtitle="Monitoring & Analytics" />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <MonitoringPage />
                  </main>
                </div>
              </div>
            }
          />

          {/* Unauthorized route */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Redirect all other routes to login if not authenticated */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </SessionManager>
    </AuthProvider>
  );
};

export default App;