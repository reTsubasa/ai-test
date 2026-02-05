import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LogoutButton from '../Auth/LogoutButton';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null; // Should not be reached due to ProtectedRoute
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard</h2>

        <div className="mb-6">
          <p className="text-gray-600">
            Welcome back, <span className="font-semibold">{user?.firstName || user?.username}</span>!
          </p>
          <p className="text-gray-600 mt-2">
            You are currently logged in with the roles:
            <span className="font-semibold ml-1">{user?.roles.join(', ')}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Network Status</h3>
            <p className="text-blue-600">All systems operational</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Firewall Rules</h3>
            <p className="text-green-600">12 active rules</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800">Monitoring</h3>
            <p className="text-yellow-600">2 alerts active</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
              View Network Configuration
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md">
              Add Firewall Rule
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md">
              View System Logs
            </button>
            <LogoutButton className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;