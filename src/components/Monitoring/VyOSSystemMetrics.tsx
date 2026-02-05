import React from 'react';
import { useMonitoring } from '../../hooks/useMonitoring';

const VyOSSystemMetrics: React.FC = () => {
  const { metrics } = useMonitoring();

  // Handle case where metrics are not yet available
  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading system metrics...</p>
      </div>
    );
  }

  const MetricCard = ({ title, value, unit, color }: {
    title: string;
    value: number | string;
    unit: string;
    color: string;
  }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="flex items-end">
        <span className={`text-3xl font-bold ${color}`}>
          {value}
        </span>
        <span className="text-gray-600 ml-1">{unit}</span>
      </div>
    </div>
  );

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">VyOS System Metrics</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="CPU Usage"
          value={metrics.cpuUsage}
          unit="%"
          color="text-blue-600"
        />
        <MetricCard
          title="Memory Usage"
          value={metrics.memoryUsage}
          unit="%"
          color="text-green-600"
        />
        <MetricCard
          title="Disk Usage"
          value={metrics.diskUsage}
          unit="%"
          color="text-purple-600"
        />
        <MetricCard
          title="System Uptime"
          value={metrics.uptime}
          unit=""
          color="text-yellow-600"
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Load Average</h3>
        <div className="flex justify-between">
          <div className="text-center">
            <p className="text-sm text-gray-600">1-min</p>
            <p className="text-xl font-bold text-blue-600">{metrics.loadAverage[0].toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">5-min</p>
            <p className="text-xl font-bold text-green-600">{metrics.loadAverage[1].toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">15-min</p>
            <p className="text-xl font-bold text-purple-600">{metrics.loadAverage[2].toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Real-time Resource Utilization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">CPU Usage</h4>
            <div className="flex items-end h-32 space-x-1">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="bg-blue-500 flex-1 rounded-t"
                  style={{ height: `${Math.random() * 80 + 20}%` }}
                />
              ))}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Memory Usage</h4>
            <div className="flex items-end h-32 space-x-1">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="bg-green-500 flex-1 rounded-t"
                  style={{ height: `${Math.random() * 80 + 20}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VyOSSystemMetrics;