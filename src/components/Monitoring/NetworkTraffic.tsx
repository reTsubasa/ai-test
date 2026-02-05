import React from 'react';
import { useMonitoring } from '../../hooks/useMonitoring';

const NetworkTraffic: React.FC = () => {
  const { traffic } = useMonitoring();

  // Handle case where traffic data is not yet available
  if (!traffic) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading network traffic data...</p>
      </div>
    );
  }

  const TrafficCard = ({ title, value, unit, color }: {
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
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Network Traffic</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <TrafficCard
          title="Incoming Traffic"
          value={traffic.incoming}
          unit="Mbps"
          color="text-blue-600"
        />
        <TrafficCard
          title="Outgoing Traffic"
          value={traffic.outgoing}
          unit="Mbps"
          color="text-green-600"
        />
        <TrafficCard
          title="Total Traffic"
          value={traffic.total}
          unit="Mbps"
          color="text-purple-600"
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Interface Traffic</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interface</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RX (Mbps)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TX (Mbps)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {traffic.interfaces.map((iface, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{iface.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{iface.rx}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{iface.tx}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className="text-blue-600">{(iface.rx + iface.tx).toFixed(1)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Traffic Visualization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Incoming Traffic Trend</h4>
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
            <h4 className="font-medium text-green-800 mb-2">Outgoing Traffic Trend</h4>
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

export default NetworkTraffic;