import React, { useState, useEffect } from 'react';
import { InterfaceConfig } from '../../services/networkConfigService';
import networkConfigService from '../../services/networkConfigService';

interface InterfacesComponentProps {
  onInterfaceAdded?: (iface: InterfaceConfig) => void;
  onInterfaceUpdated?: (iface: InterfaceConfig) => void;
  onInterfaceDeleted?: (id: number) => void;
}

const InterfacesComponent: React.FC<InterfacesComponentProps> = ({
  onInterfaceAdded,
  onInterfaceUpdated,
  onInterfaceDeleted
}) => {
  const [interfaces, setInterfaces] = useState<InterfaceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInterfaces();
  }, []);

  const fetchInterfaces = async () => {
    try {
      setLoading(true);
      const data = await networkConfigService.getInterfaces();
      setInterfaces(data);
      setError(null);
    } catch (err) {
      setError('Failed to load interfaces configurations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterface = async (iface: Omit<InterfaceConfig, 'id'>) => {
    try {
      const newInterface = await networkConfigService.addInterface(iface);
      setInterfaces([...interfaces, newInterface]);
      if (onInterfaceAdded) {
        onInterfaceAdded(newInterface);
      }
    } catch (err) {
      setError('Failed to add interface');
      console.error(err);
    }
  };

  const handleUpdateInterface = async (id: number, iface: Partial<InterfaceConfig>) => {
    try {
      const updatedInterface = await networkConfigService.updateInterface(id, iface);
      setInterfaces(interfaces.map(i => i.id === id ? updatedInterface : i));
      if (onInterfaceUpdated) {
        onInterfaceUpdated(updatedInterface);
      }
    } catch (err) {
      setError('Failed to update interface');
      console.error(err);
    }
  };

  const handleDeleteInterface = async (id: number) => {
    try {
      await networkConfigService.deleteInterface(id);
      setInterfaces(interfaces.filter(iface => iface.id !== id));
      if (onInterfaceDeleted) {
        onInterfaceDeleted(id);
      }
    } catch (err) {
      setError('Failed to delete interface');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading interfaces configurations...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Interfaces Configuration</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {interfaces.map((iface) => (
              <tr key={iface.id}>
                <td className="px-6 py-4 whitespace-nowrap">{iface.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{iface.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{iface.ip || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    iface.status === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {iface.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleUpdateInterface(iface.id!, { name: iface.name })}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteInterface(iface.id!)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        Add New Interface
      </button>
    </div>
  );
};

export default InterfacesComponent;