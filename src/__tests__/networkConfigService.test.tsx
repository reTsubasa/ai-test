import NetworkConfigService from '../services/networkConfigService';
import apiClient from '../services/apiClient';

// Mock axios client
jest.mock('../services/apiClient');

describe('NetworkConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to initialize', () => {
    expect(NetworkConfigService).toBeDefined();
  });

  describe('routing operations', () => {
    it('should get routes successfully', async () => {
      const mockRoutes = [
        { id: 1, destination: '10.0.0.0/8', gateway: '192.168.1.1', metric: 10 },
        { id: 2, destination: '172.16.0.0/12', gateway: '192.168.1.254', metric: 20 }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockRoutes });

      const result = await NetworkConfigService.getRoutes();

      expect(result).toEqual(mockRoutes);
      expect(apiClient.get).toHaveBeenCalledWith('/network/routing');
    });

    it('should handle get routes failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Failed to fetch routing configurations'));

      await expect(NetworkConfigService.getRoutes()).rejects.toThrow('Failed to fetch routing configurations');
    });

    it('should add route successfully', async () => {
      const newRoute = { destination: '192.168.2.0/24', gateway: '192.168.1.1', metric: 15 };
      const mockResponse = { id: 3, ...newRoute };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await NetworkConfigService.addRoute(newRoute);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/network/routing', newRoute);
    });

    it('should handle add route failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Failed to add routing configuration'));

      await expect(NetworkConfigService.addRoute({
        destination: '192.168.2.0/24',
        gateway: '192.168.1.1',
        metric: 15
      })).rejects.toThrow('Failed to add routing configuration');
    });

    it('should update route successfully', async () => {
      const updatedRoute = { destination: '192.168.2.0/24', gateway: '192.168.1.10' };
      const mockResponse = { id: 1, ...updatedRoute };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await NetworkConfigService.updateRoute(1, updatedRoute);

      expect(result).toEqual(mockResponse);
      expect(apiClient.put).toHaveBeenCalledWith('/network/routing/1', updatedRoute);
    });

    it('should handle update route failure', async () => {
      (apiClient.put as jest.Mock).mockRejectedValue(new Error('Failed to update routing configuration'));

      await expect(NetworkConfigService.updateRoute(1, {
        destination: '192.168.2.0/24',
        gateway: '192.168.1.10'
      })).rejects.toThrow('Failed to update routing configuration');
    });

    it('should delete route successfully', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await NetworkConfigService.deleteRoute(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/network/routing/1');
    });

    it('should handle delete route failure', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Failed to delete routing configuration'));

      await expect(NetworkConfigService.deleteRoute(1)).rejects.toThrow('Failed to delete routing configuration');
    });
  });

  describe('firewall operations', () => {
    it('should get firewall rules successfully', async () => {
      const mockRules = [
        { id: 1, name: 'allow-http', action: 'accept', protocol: 'tcp', port: 80 },
        { id: 2, name: 'allow-https', action: 'accept', protocol: 'tcp', port: 443 }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockRules });

      const result = await NetworkConfigService.getFirewallRules();

      expect(result).toEqual(mockRules);
      expect(apiClient.get).toHaveBeenCalledWith('/network/firewall');
    });

    it('should handle get firewall rules failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Failed to fetch firewall rules'));

      await expect(NetworkConfigService.getFirewallRules()).rejects.toThrow('Failed to fetch firewall rules');
    });

    it('should add firewall rule successfully', async () => {
      const newRule = { name: 'allow-ssh', action: 'accept', protocol: 'tcp', port: 22 };
      const mockResponse = { id: 3, ...newRule };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await NetworkConfigService.addFirewallRule(newRule);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/network/firewall', newRule);
    });

    it('should handle add firewall rule failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Failed to add firewall rule'));

      await expect(NetworkConfigService.addFirewallRule({
        name: 'allow-ssh',
        action: 'accept',
        protocol: 'tcp',
        port: 22
      })).rejects.toThrow('Failed to add firewall rule');
    });

    it('should update firewall rule successfully', async () => {
      const updatedRule = { action: 'reject' };
      const mockResponse = { id: 1, name: 'allow-http', action: 'reject', protocol: 'tcp', port: 80 };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await NetworkConfigService.updateFirewallRule(1, updatedRule);

      expect(result).toEqual(mockResponse);
      expect(apiClient.put).toHaveBeenCalledWith('/network/firewall/1', updatedRule);
    });

    it('should handle update firewall rule failure', async () => {
      (apiClient.put as jest.Mock).mockRejectedValue(new Error('Failed to update firewall rule'));

      await expect(NetworkConfigService.updateFirewallRule(1, { action: 'reject' }))
        .rejects.toThrow('Failed to update firewall rule');
    });

    it('should delete firewall rule successfully', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await NetworkConfigService.deleteFirewallRule(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/network/firewall/1');
    });

    it('should handle delete firewall rule failure', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Failed to delete firewall rule'));

      await expect(NetworkConfigService.deleteFirewallRule(1))
        .rejects.toThrow('Failed to delete firewall rule');
    });
  });

  describe('interface operations', () => {
    it('should get interfaces successfully', async () => {
      const mockInterfaces = [
        { id: 1, name: 'eth0', type: 'ethernet', ip: '192.168.1.10/24' },
        { id: 2, name: 'eth1', type: 'ethernet', ip: '10.0.0.1/8' }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockInterfaces });

      const result = await NetworkConfigService.getInterfaces();

      expect(result).toEqual(mockInterfaces);
      expect(apiClient.get).toHaveBeenCalledWith('/network/interfaces');
    });

    it('should handle get interfaces failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Failed to fetch interfaces configurations'));

      await expect(NetworkConfigService.getInterfaces()).rejects.toThrow('Failed to fetch interfaces configurations');
    });

    it('should add interface successfully', async () => {
      const newInterface = { name: 'eth2', type: 'ethernet', ip: '172.16.0.1/12' };
      const mockResponse = { id: 3, ...newInterface };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await NetworkConfigService.addInterface(newInterface);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/network/interfaces', newInterface);
    });

    it('should handle add interface failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Failed to add interface configuration'));

      await expect(NetworkConfigService.addInterface({
        name: 'eth2',
        type: 'ethernet',
        ip: '172.16.0.1/12'
      })).rejects.toThrow('Failed to add interface configuration');
    });

    it('should update interface successfully', async () => {
      const updatedInterface = { ip: '192.168.1.20/24' };
      const mockResponse = { id: 1, name: 'eth0', type: 'ethernet', ip: '192.168.1.20/24' };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await NetworkConfigService.updateInterface(1, updatedInterface);

      expect(result).toEqual(mockResponse);
      expect(apiClient.put).toHaveBeenCalledWith('/network/interfaces/1', updatedInterface);
    });

    it('should handle update interface failure', async () => {
      (apiClient.put as jest.Mock).mockRejectedValue(new Error('Failed to update interface configuration'));

      await expect(NetworkConfigService.updateInterface(1, { ip: '192.168.1.20/24' }))
        .rejects.toThrow('Failed to update interface configuration');
    });

    it('should delete interface successfully', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await NetworkConfigService.deleteInterface(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/network/interfaces/1');
    });

    it('should handle delete interface failure', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Failed to delete interface configuration'));

      await expect(NetworkConfigService.deleteInterface(1))
        .rejects.toThrow('Failed to delete interface configuration');
    });
  });

  describe('system settings operations', () => {
    it('should get system settings successfully', async () => {
      const mockSettings = {
        hostname: 'vyos-router',
        domain: 'example.com',
        timezone: 'UTC',
        dnsServers: ['8.8.8.8', '8.8.4.4']
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockSettings });

      const result = await NetworkConfigService.getSystemSettings();

      expect(result).toEqual(mockSettings);
      expect(apiClient.get).toHaveBeenCalledWith('/network/system/settings');
    });

    it('should handle get system settings failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Failed to fetch system settings'));

      await expect(NetworkConfigService.getSystemSettings()).rejects.toThrow('Failed to fetch system settings');
    });

    it('should update system settings successfully', async () => {
      const updatedSettings = { hostname: 'new-router' };
      const mockResponse = {
        hostname: 'new-router',
        domain: 'example.com',
        timezone: 'UTC',
        dnsServers: ['8.8.8.8', '8.8.4.4']
      };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await NetworkConfigService.updateSystemSettings(updatedSettings);

      expect(result).toEqual(mockResponse);
      expect(apiClient.put).toHaveBeenCalledWith('/network/system/settings', updatedSettings);
    });

    it('should handle update system settings failure', async () => {
      (apiClient.put as jest.Mock).mockRejectedValue(new Error('Failed to update system settings'));

      await expect(NetworkConfigService.updateSystemSettings({ hostname: 'new-router' }))
        .rejects.toThrow('Failed to update system settings');
    });
  });

  describe('configuration operations', () => {
    it('should apply configuration successfully', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await NetworkConfigService.applyConfiguration();

      expect(apiClient.post).toHaveBeenCalledWith('/network/apply');
    });

    it('should handle apply configuration failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Failed to apply configuration changes'));

      await expect(NetworkConfigService.applyConfiguration())
        .rejects.toThrow('Failed to apply configuration changes');
    });

    it('should get configuration status successfully', async () => {
      const mockStatus = { applied: true, lastApplied: '2023-01-01T12:00:00Z' };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockStatus });

      const result = await NetworkConfigService.getConfigurationStatus();

      expect(result).toEqual(mockStatus);
      expect(apiClient.get).toHaveBeenCalledWith('/network/status');
    });

    it('should handle get configuration status failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Failed to fetch configuration status'));

      await expect(NetworkConfigService.getConfigurationStatus())
        .rejects.toThrow('Failed to fetch configuration status');
    });

    it('should revert configuration successfully', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await NetworkConfigService.revertConfiguration();

      expect(apiClient.post).toHaveBeenCalledWith('/network/revert');
    });

    it('should handle revert configuration failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Failed to revert configuration changes'));

      await expect(NetworkConfigService.revertConfiguration())
        .rejects.toThrow('Failed to revert configuration changes');
    });
  });
});