import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface MetricData {
  timestamp: string;
  value: number;
}

interface SystemMetrics {
  cpu: MetricData[];
  memory: MetricData[];
  disk: MetricData[];
  network: {
    received: MetricData[];
    transmitted: MetricData[];
  };
}

const MonitoringPage: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: [],
    memory: [],
    disk: [],
    network: {
      received: [],
      transmitted: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Simulate fetching metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      // Simulate API call
      setTimeout(() => {
        const now = new Date();
        const newData: SystemMetrics = {
          cpu: [],
          memory: [],
          disk: [],
          network: {
            received: [],
            transmitted: [],
          },
        };

        // Generate sample data for the last hour
        for (let i = 30; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 2 * 60000); // Every 2 minutes

          newData.cpu.push({
            timestamp: time.toISOString(),
            value: Math.floor(Math.random() * 40) + 20, // 20-60%
          });

          newData.memory.push({
            timestamp: time.toISOString(),
            value: Math.floor(Math.random() * 30) + 40, // 40-70%
          });

          newData.disk.push({
            timestamp: time.toISOString(),
            value: Math.floor(Math.random() * 20) + 60, // 60-80%
          });

          newData.network.received.push({
            timestamp: time.toISOString(),
            value: Math.floor(Math.random() * 50) + 10, // 10-60 MB
          });

          newData.network.transmitted.push({
            timestamp: time.toISOString(),
            value: Math.floor(Math.random() * 30) + 5, // 5-35 MB
          });
        }

        setMetrics(newData);
        setLoading(false);
      }, 1000);
    };

    fetchMetrics();
  }, [selectedTimeRange]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Monitoring</h1>
        <p className="mt-2 text-gray-600">Monitor your system and network performance in real-time</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Start Monitoring
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Export Data
          </button>
        </div>
        <div>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-center mb-4">
              {metrics.cpu.length > 0
                ? `${metrics.cpu[metrics.cpu.length - 1].value}%`
                : '--%'}
            </div>
            <div className="h-32">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded h-full flex items-end">
                  {metrics.cpu.slice(-10).map((data, index) => (
                    <div
                      key={index}
                      className="flex-1 mx-0.5 bg-indigo-500 rounded-t"
                      style={{ height: `${data.value}%` }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-center mb-4">
              {metrics.memory.length > 0
                ? `${metrics.memory[metrics.memory.length - 1].value}%`
                : '--%'}
            </div>
            <div className="h-32">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded h-full flex items-end">
                  {metrics.memory.slice(-10).map((data, index) => (
                    <div
                      key={index}
                      className="flex-1 mx-0.5 bg-green-500 rounded-t"
                      style={{ height: `${data.value}%` }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disk Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-center mb-4">
              {metrics.disk.length > 0
                ? `${metrics.disk[metrics.disk.length - 1].value}%`
                : '--%'}
            </div>
            <div className="h-32">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded h-full flex items-end">
                  {metrics.disk.slice(-10).map((data, index) => (
                    <div
                      key={index}
                      className="flex-1 mx-0.5 bg-yellow-500 rounded-t"
                      style={{ height: `${data.value}%` }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Received</p>
                <p className="text-lg font-semibold">
                  {metrics.network.received.length > 0
                    ? `${metrics.network.received[metrics.network.received.length - 1].value} MB/s`
                    : '-- MB/s'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transmitted</p>
                <p className="text-lg font-semibold">
                  {metrics.network.transmitted.length > 0
                    ? `${metrics.network.transmitted[metrics.network.transmitted.length - 1].value} MB/s`
                    : '-- MB/s'}
                </p>
              </div>
              <div className="h-16">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <div className="flex items-end h-full space-x-1">
                    {metrics.network.received.slice(-10).map((data, index) => (
                      <div
                        key={`rx-${index}`}
                        className="flex-1 bg-blue-500 rounded-t"
                        style={{ height: `${Math.min(data.value, 100)}%` }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    2 min ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    High CPU
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    CPU usage reached 85%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Warning
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    15 min ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Interface Down
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    eth1 interface status changed to down
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Critical
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    1 hour ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    High Memory
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Memory usage reached 80%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Warning
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringPage;