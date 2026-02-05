import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import NetworkConfigPage from './pages/network/NetworkConfigPage';
import MonitoringPage from './pages/monitoring/MonitoringPage';
import UserManagementPage from './pages/users/UserManagementPage';
import Layout from './components/layout/Layout';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/network-config" element={
            <ProtectedRoute>
              <Layout>
                <NetworkConfigPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/monitoring" element={
            <ProtectedRoute>
              <Layout>
                <MonitoringPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              <Layout>
                <UserManagementPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;