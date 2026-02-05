import React from 'react';
import SystemMetrics from './SystemMetrics';
import NetworkTraffic from './NetworkTraffic';
import AlertManager from './AlertManager';
import { useMonitoring } from '../../hooks/useMonitoring';

const MonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'traffic' | 'alerts'>('metrics');
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
          <h2 className="text-xl font-semibold text-gray-800">System Monitoring & Analytics</h2>
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
          </nav>
        </div>

        <div>
          {activeTab === 'metrics' && <SystemMetrics />}
          {activeTab === 'traffic' && <NetworkTraffic />}
          {activeTab === 'alerts' && <AlertManager />}
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;