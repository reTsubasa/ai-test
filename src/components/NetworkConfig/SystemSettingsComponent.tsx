import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../../services/networkConfigService';
import networkConfigService from '../../services/networkConfigService';

interface SystemSettingsComponentProps {
  onSettingsUpdated?: (settings: SystemSettings) => void;
}

const SystemSettingsComponent: React.FC<SystemSettingsComponentProps> = ({
  onSettingsUpdated
}) => {
  const [settings, setSettings] = useState<SystemSettings>({
    hostname: '',
    domain: '',
    timezone: 'UTC',
    dnsServers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await networkConfigService.getSystemSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError('Failed to load system settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const updatedSettings = await networkConfigService.updateSystemSettings(settings);
      setSettings(updatedSettings);
      if (onSettingsUpdated) {
        onSettingsUpdated(updatedSettings);
      }
      setError(null);
    } catch (err) {
      setError('Failed to save system settings');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: string | string[]) => {
    setSettings({
      ...settings,
      [field]: value
    });
  };

  if (loading) {
    return <div className="text-center py-4">Loading system settings...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">System Settings</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
            <input
              type="text"
              value={settings.hostname}
              onChange={(e) => handleInputChange('hostname', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <input
              type="text"
              value={settings.domain}
              onChange={(e) => handleInputChange('domain', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNS Servers</label>
            <input
              type="text"
              value={settings.dnsServers.join(', ')}
              onChange={(e) => handleInputChange('dnsServers', e.target.value.split(',').map(s => s.trim()))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="comma separated IPs"
            />
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={`px-4 py-2 rounded-md transition-colors ${
              isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsComponent;