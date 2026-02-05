import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface NetworkInterface {
  id: string;
  name: string;
  type: string;
  ipAddress?: string;
  status: string;
  enabled: boolean;
  description?: string;
}

const NetworkConfigPage: React.FC = () => {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulate fetching network interfaces
  useEffect(() => {
    const fetchInterfaces = async () => {
      // Simulate API call
      setTimeout(() => {
        setInterfaces([
          {
            id: '1',
            name: 'eth0',
            type: 'ethernet',
            ipAddress: '192.168.1.100',
            status: 'up',
            enabled: true,
            description: 'Primary network interface',
          },
          {
            id: '2',
            name: 'eth1',
            type: 'ethernet',
            ipAddress: '10.0.0.1',
            status: 'down',
            enabled: false,
            description: 'Secondary network interface',
          },
          {
            id: '3',
            name: 'lo',
            type: 'loopback',
            ipAddress: '127.0.0.1',
            status: 'up',
            enabled: true,
            description: 'Loopback interface',
          },
        ]);
        setLoading(false);
      }, 1000);
    };

    fetchInterfaces();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Network Configuration</h1>
        <p className="mt-2 text-gray-600">Manage your network interfaces and configurations</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Add Interface
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Apply Config
          </button>
        </div>
        <div>
          <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option>All Types</option>
            <option>Ethernet</option>
            <option>VLAN</option>
            <option>Bond</option>
            <option>Loopback</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {interfaces.map((iface) => (
            <Card key={iface.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {iface.name}
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      iface.status === 'up'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {iface.status}
                    </span>
                  </CardTitle>
                  <div className="flex items-center">
                    <span className={`relative inline-flex ${
                      iface.enabled ? 'h-3 w-3 bg-green-500' : 'h-3 w-3 bg-gray-400'
                    } rounded-full`}></span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="text-sm font-medium">{iface.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">IP Address</p>
                    <p className="text-sm font-medium">{iface.ipAddress || 'DHCP'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-sm font-medium">{iface.description}</p>
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Edit
                    </button>
                    <button className="text-sm font-medium text-red-600 hover:text-red-500">
                      Delete
                    </button>
                    <button className={`text-sm font-medium ${
                      iface.enabled ? 'text-yellow-600 hover:text-yellow-500' : 'text-green-600 hover:text-green-500'
                    }`}>
                      {iface.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkConfigPage;