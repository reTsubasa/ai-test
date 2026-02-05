/**
 * Network Configuration Service for VyOS
 * Handles all network configuration operations including routing, firewall rules, interfaces and system settings
 */

import apiClient from './apiClient';

// Define types for network configuration entities
export interface Route {
  id?: number;
  destination: string;
  gateway: string;
  metric: number;
}

export interface FirewallRule {
  id?: number;
  name: string;
  action: 'accept' | 'reject' | 'drop';
  protocol: string;
  port?: number;
  source?: string;
  destination?: string;
}

export interface InterfaceConfig {
  id?: number;
  name: string;
  type: 'ethernet' | 'vlan' | 'pppoe' | 'loopback';
  ip?: string;
  status?: 'up' | 'down';
  description?: string;
}

export interface SystemSettings {
  hostname: string;
  domain: string;
  timezone: string;
  dnsServers: string[];
}

// Network Configuration Service Class
class NetworkConfigService {
  /**
   * Get all routing configurations
   */
  async getRoutes(): Promise<Route[]> {
    try {
      const response = await apiClient.get<Route[]>('/network/routing');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch routing configurations');
    }
  }

  /**
   * Add a new route
   */
  async addRoute(route: Omit<Route, 'id'>): Promise<Route> {
    try {
      const response = await apiClient.post<Route>('/network/routing', route);
      return response.data;
    } catch (error) {
      throw new Error('Failed to add routing configuration');
    }
  }

  /**
   * Update an existing route
   */
  async updateRoute(id: number, route: Partial<Route>): Promise<Route> {
    try {
      const response = await apiClient.put<Route>(`/network/routing/${id}`, route);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update routing configuration');
    }
  }

  /**
   * Delete a route
   */
  async deleteRoute(id: number): Promise<void> {
    try {
      await apiClient.delete(`/network/routing/${id}`);
    } catch (error) {
      throw new Error('Failed to delete routing configuration');
    }
  }

  /**
   * Get all firewall rules
   */
  async getFirewallRules(): Promise<FirewallRule[]> {
    try {
      const response = await apiClient.get<FirewallRule[]>('/network/firewall');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch firewall rules');
    }
  }

  /**
   * Add a new firewall rule
   */
  async addFirewallRule(rule: Omit<FirewallRule, 'id'>): Promise<FirewallRule> {
    try {
      const response = await apiClient.post<FirewallRule>('/network/firewall', rule);
      return response.data;
    } catch (error) {
      throw new Error('Failed to add firewall rule');
    }
  }

  /**
   * Update an existing firewall rule
   */
  async updateFirewallRule(id: number, rule: Partial<FirewallRule>): Promise<FirewallRule> {
    try {
      const response = await apiClient.put<FirewallRule>(`/network/firewall/${id}`, rule);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update firewall rule');
    }
  }

  /**
   * Delete a firewall rule
   */
  async deleteFirewallRule(id: number): Promise<void> {
    try {
      await apiClient.delete(`/network/firewall/${id}`);
    } catch (error) {
      throw new Error('Failed to delete firewall rule');
    }
  }

  /**
   * Get all interfaces configuration
   */
  async getInterfaces(): Promise<InterfaceConfig[]> {
    try {
      const response = await apiClient.get<InterfaceConfig[]>('/network/interfaces');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch interfaces configurations');
    }
  }

  /**
   * Add a new interface
   */
  async addInterface(iface: Omit<InterfaceConfig, 'id'>): Promise<InterfaceConfig> {
    try {
      const response = await apiClient.post<InterfaceConfig>('/network/interfaces', iface);
      return response.data;
    } catch (error) {
      throw new Error('Failed to add interface configuration');
    }
  }

  /**
   * Update an existing interface
   */
  async updateInterface(id: number, iface: Partial<InterfaceConfig>): Promise<InterfaceConfig> {
    try {
      const response = await apiClient.put<InterfaceConfig>(`/network/interfaces/${id}`, iface);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update interface configuration');
    }
  }

  /**
   * Delete an interface
   */
  async deleteInterface(id: number): Promise<void> {
    try {
      await apiClient.delete(`/network/interfaces/${id}`);
    } catch (error) {
      throw new Error('Failed to delete interface configuration');
    }
  }

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await apiClient.get<SystemSettings>('/network/system/settings');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch system settings');
    }
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      const response = await apiClient.put<SystemSettings>('/network/system/settings', settings);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update system settings');
    }
  }

  /**
   * Apply configuration changes
   */
  async applyConfiguration(): Promise<void> {
    try {
      await apiClient.post('/network/apply');
    } catch (error) {
      throw new Error('Failed to apply configuration changes');
    }
  }

  /**
   * Get configuration status
   */
  async getConfigurationStatus(): Promise<{ applied: boolean; lastApplied?: string }> {
    try {
      const response = await apiClient.get<{ applied: boolean; lastApplied?: string }>('/network/status');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch configuration status');
    }
  }

  /**
   * Revert to previous configuration
   */
  async revertConfiguration(): Promise<void> {
    try {
      await apiClient.post('/network/revert');
    } catch (error) {
      throw new Error('Failed to revert configuration changes');
    }
  }
}

export default new NetworkConfigService();