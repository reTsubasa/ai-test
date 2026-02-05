import React from 'react';
import { useMonitoring } from '../../hooks/useMonitoring';

const AlertManager: React.FC = () => {
  const { alerts } = useMonitoring();

  const getAlertClass = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 border-l-red-500 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border-l-yellow-500 text-yellow-700';
      case 'info':
        return 'bg-blue-100 border-l-blue-500 text-blue-700';
      default:
        return 'bg-gray-100 border-l-gray-500 text-gray-700';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  // Handle case where alerts are not yet available
  if (!alerts) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading alert data...</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Alerts & Notifications</h3>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-700">Active Alerts ({alerts.length})</h4>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Clear All
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
            No active alerts
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className={`border-l-4 p-4 rounded ${getAlertClass(alert.type)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <span className="text-lg mr-2">{getAlertIcon(alert.type)}</span>
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-600 mt-1">{alert.timestamp}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => console.log(`Clearing alert ${alert.id}`)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Alert Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Create New Alert Rule</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>CPU Usage</option>
                  <option>Memory Usage</option>
                  <option>Disk Usage</option>
                  <option>Network Traffic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter threshold value"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Method</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Email</option>
                  <option>Slack</option>
                  <option>Webhook</option>
                </select>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                Create Rule
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Alert Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Critical Alerts</span>
                <span className="text-sm font-semibold">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Warning Alerts</span>
                <span className="text-sm font-semibold">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Info Alerts</span>
                <span className="text-sm font-semibold">3</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium">Total Active Alerts</span>
                <span className="text-sm font-semibold">{alerts.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertManager;