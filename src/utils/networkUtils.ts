/**
 * Utility functions for network configuration management
 */

import { Route, FirewallRule, InterfaceConfig, SystemSettings } from '../services/networkConfigService';

/**
 * Validate route configuration
 */
export function validateRoute(route: Omit<Route, 'id'>): string | null {
  // Validate destination CIDR format
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(route.destination)) {
    return 'Invalid destination CIDR format';
  }

  // Validate gateway IP address
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(route.gateway)) {
    return 'Invalid gateway IP address';
  }

  // Validate metric (should be positive integer)
  if (route.metric <= 0 || !Number.isInteger(route.metric)) {
    return 'Metric must be a positive integer';
  }

  return null;
}

/**
 * Validate firewall rule configuration
 */
export function validateFirewallRule(rule: Omit<FirewallRule, 'id'>): string | null {
  // Validate action
  const validActions = ['accept', 'reject', 'drop'];
  if (!validActions.includes(rule.action)) {
    return 'Invalid action. Must be accept, reject, or drop';
  }

  // Validate protocol
  const validProtocols = ['tcp', 'udp', 'icmp', 'any'];
  if (!validProtocols.includes(rule.protocol)) {
    return 'Invalid protocol. Must be tcp, udp, icmp, or any';
  }

  // If port is specified, validate it
  if (rule.port !== undefined) {
    if (rule.port < 1 || rule.port > 65535) {
      return 'Port must be between 1 and 65535';
    }
  }

  return null;
}

/**
 * Validate interface configuration
 */
export function validateInterface(iface: Omit<InterfaceConfig, 'id'>): string | null {
  // Validate interface name (basic validation)
  if (!iface.name || iface.name.length > 15) {
    return 'Invalid interface name';
  }

  // Validate type
  const validTypes = ['ethernet', 'vlan', 'pppoe', 'loopback'];
  if (!validTypes.includes(iface.type)) {
    return 'Invalid interface type';
  }

  // Validate IP address if provided
  if (iface.ip) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(iface.ip)) {
      return 'Invalid IP address format';
    }
  }

  return null;
}

/**
 * Validate system settings
 */
export function validateSystemSettings(settings: Partial<SystemSettings>): string | null {
  // Validate hostname (basic validation)
  if (settings.hostname && settings.hostname.length > 63) {
    return 'Hostname too long (max 63 characters)';
  }

  // Validate domain
  if (settings.domain && settings.domain.length > 255) {
    return 'Domain name too long (max 255 characters)';
  }

  // Validate DNS servers
  if (settings.dnsServers) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    for (const dns of settings.dnsServers) {
      if (!ipRegex.test(dns)) {
        return `Invalid DNS server IP: ${dns}`;
      }
    }
  }

  return null;
}

/**
 * Format IP address with CIDR notation
 */
export function formatIpWithCidr(ip: string): string {
  // If no CIDR specified, default to /32
  if (!ip.includes('/')) {
    return `${ip}/32`;
  }
  return ip;
}

/**
 * Generate a unique ID for network configuration items
 */
export function generateId(): number {
  return Math.floor(Math.random() * 1000000);
}