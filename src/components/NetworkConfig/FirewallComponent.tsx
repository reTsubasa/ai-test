import React, { useState, useEffect } from 'react';
import { FirewallRule } from '../../services/networkConfigService';
import networkConfigService from '../../services/networkConfigService';

interface FirewallComponentProps {
  onRuleAdded?: (rule: FirewallRule) => void;
  onRuleUpdated?: (rule: FirewallRule) => void;
  onRuleDeleted?: (id: number) => void;
}

const FirewallComponent: React.FC<FirewallComponentProps> = ({
  onRuleAdded,
  onRuleUpdated,
  onRuleDeleted
}) => {
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFirewallRules();
  }, []);

  const fetchFirewallRules = async () => {
    try {
      setLoading(true);
      const data = await networkConfigService.getFirewallRules();
      setFirewallRules(data);
      setError(null);
    } catch (err) {
      setError('Failed to load firewall rules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (rule: Omit<FirewallRule, 'id'>) => {
    try {
      const newRule = await networkConfigService.addFirewallRule(rule);
      setFirewallRules([...firewallRules, newRule]);
      if (onRuleAdded) {
        onRuleAdded(newRule);
      }
    } catch (err) {
      setError('Failed to add firewall rule');
      console.error(err);
    }
  };

  const handleUpdateRule = async (id: number, rule: Partial<FirewallRule>) => {
    try {
      const updatedRule = await networkConfigService.updateFirewallRule(id, rule);
      setFirewallRules(firewallRules.map(r => r.id === id ? updatedRule : r));
      if (onRuleUpdated) {
        onRuleUpdated(updatedRule);
      }
    } catch (err) {
      setError('Failed to update firewall rule');
      console.error(err);
    }
  };

  const handleDeleteRule = async (id: number) => {
    try {
      await networkConfigService.deleteFirewallRule(id);
      setFirewallRules(firewallRules.filter(rule => rule.id !== id));
      if (onRuleDeleted) {
        onRuleDeleted(id);
      }
    } catch (err) {
      setError('Failed to delete firewall rule');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading firewall rules...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Firewall Rules</h2>

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Port</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {firewallRules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-6 py-4 whitespace-nowrap">{rule.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{rule.action}</td>
                <td className="px-6 py-4 whitespace-nowrap">{rule.protocol}</td>
                <td className="px-6 py-4 whitespace-nowrap">{rule.port || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleUpdateRule(rule.id!, { name: rule.name })}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id!)}
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
        Add New Rule
      </button>
    </div>
  );
};

export default FirewallComponent;