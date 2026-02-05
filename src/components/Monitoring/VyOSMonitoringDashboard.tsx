import React, { useState } from 'react';
import VyOSSystemMetrics from './VyOSSystemMetrics';
import VyOSNetworkTraffic from './VyOSNetworkTraffic';
import AlertManager from './AlertManager';
import VyOSMetricsChart from './VyOSMetricsChart';
import VyOSNetworkTrafficChart from './VyOSNetworkTrafficChart';
import VyOSAlertsChart from './VyOSAlertsChart';
import { useMonitoring } from '../../hooks/useMonitoring';

const VyOSMonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'traffic' | 'alerts' | 'charts'>('metrics');
  const { isMonitoring, startMonitoring, stopMonitoring } = useMonitoring();

  // Handle monitoring toggle
  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">VyOS System Monitoring Dashboard</h2>
          <button
            onClick={toggleMonitoring}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isMonitoring
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isMonitoring ? 'Pause Monitoring' : 'Start Monitoring'}
          </button>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'metrics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              System Metrics
            </button>
            <button
              onClick={() => setActiveTab('traffic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'traffic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Network Traffic
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alerts & Notifications
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'charts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Real-time Charts
            </button>
          </nav>
        </div>

        <div>
          {activeTab === 'metrics' && <VyOSSystemMetrics />}
          {activeTab === 'traffic' && <VyOSNetworkTraffic />}
          {activeTab === 'alerts' && <AlertManager />}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">System Resource Utilization</h3>
                  <VyOSMetricsChart />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Network Traffic Analysis</h3>
                  <VyOSNetworkTrafficChart />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Alert Distribution</h3>
                  <VyOSAlertsChart />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Real-time Metrics Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">CPU Usage</h4>
                    <p className="text-3xl font-bold text-blue-600">{useMonitoring().metrics?.cpuUsage || 0}%</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Memory Usage</h4>
                    <p className="text-3xl font-bold text-green-600">{useMonitoring().metrics?.memoryUsage || 0}%</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Disk Usage</h4>
                    <p className="text-3xl font-bold text-purple-600">{useMonitoring().metrics?.diskUsage || 0}%</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Network Traffic</h4>
                    <p className="text-3xl font-bold text-yellow-600">{useMonitoring().traffic?.total || 0} Mbps</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VyOSMonitoringDashboard;