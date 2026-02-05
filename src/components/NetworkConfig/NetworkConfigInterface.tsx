import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoutingComponent from './RoutingComponent';
import FirewallComponent from './FirewallComponent';
import InterfacesComponent from './InterfacesComponent';
import SystemSettingsComponent from './SystemSettingsComponent';

const NetworkConfigInterface: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('routing');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Network Configuration Management</h1>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('routing')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'routing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Routing
          </button>
          <button
            onClick={() => setActiveTab('firewall')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'firewall'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Firewall Rules
          </button>
          <button
            onClick={() => setActiveTab('interfaces')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'interfaces'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Interfaces
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'system'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            System Settings
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'routing' && (
          <RoutingComponent />
        )}

        {activeTab === 'firewall' && (
          <FirewallComponent />
        )}

        {activeTab === 'interfaces' && (
          <InterfacesComponent />
        )}

        {activeTab === 'system' && (
          <SystemSettingsComponent />
        )}
      </div>
    </div>
  );
};

export default NetworkConfigInterface;