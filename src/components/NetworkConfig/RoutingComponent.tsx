import React, { useState, useEffect } from 'react';
import { Route } from '../../services/networkConfigService';
import networkConfigService from '../../services/networkConfigService';

interface RoutingComponentProps {
  onRouteAdded?: (route: Route) => void;
  onRouteUpdated?: (route: Route) => void;
  onRouteDeleted?: (id: number) => void;
}

const RoutingComponent: React.FC<RoutingComponentProps> = ({
  onRouteAdded,
  onRouteUpdated,
  onRouteDeleted
}) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const data = await networkConfigService.getRoutes();
      setRoutes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load routing configurations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async (route: Omit<Route, 'id'>) => {
    try {
      const newRoute = await networkConfigService.addRoute(route);
      setRoutes([...routes, newRoute]);
      if (onRouteAdded) {
        onRouteAdded(newRoute);
      }
    } catch (err) {
      setError('Failed to add route');
      console.error(err);
    }
  };

  const handleUpdateRoute = async (id: number, route: Partial<Route>) => {
    try {
      const updatedRoute = await networkConfigService.updateRoute(id, route);
      setRoutes(routes.map(r => r.id === id ? updatedRoute : r));
      if (onRouteUpdated) {
        onRouteUpdated(updatedRoute);
      }
    } catch (err) {
      setError('Failed to update route');
      console.error(err);
    }
  };

  const handleDeleteRoute = async (id: number) => {
    try {
      await networkConfigService.deleteRoute(id);
      setRoutes(routes.filter(route => route.id !== id));
      if (onRouteDeleted) {
        onRouteDeleted(id);
      }
    } catch (err) {
      setError('Failed to delete route');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading routing configurations...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Routing Configuration</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gateway</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routes.map((route) => (
              <tr key={route.id}>
                <td className="px-6 py-4 whitespace-nowrap">{route.destination}</td>
                <td className="px-6 py-4 whitespace-nowrap">{route.gateway}</td>
                <td className="px-6 py-4 whitespace-nowrap">{route.metric}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleUpdateRoute(route.id!, { destination: route.destination })}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(route.id!)}
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
        Add New Route
      </button>
    </div>
  );
};

export default RoutingComponent;