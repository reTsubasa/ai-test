/**
 * TypeScript interfaces for VyOS API communication
 */

export interface VyOSConfig {
  version: string;
  interfaces: InterfaceConfig[];
  routing: RoutingConfig;
  firewall: FirewallConfig;
  system: SystemConfig;
}

export interface InterfaceConfig {
  name: string;
  type: 'ethernet' | 'vlan' | 'bridge' | 'tunnel';
  ip: string;
  subnet: number;
  status: 'up' | 'down';
  description?: string;
}

export interface RoutingConfig {
  protocols: ProtocolConfig[];
  staticRoutes: StaticRoute[];
}

export interface ProtocolConfig {
  name: 'ospf' | 'bgp' | 'rip';
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface StaticRoute {
  destination: string;
  gateway: string;
  metric?: number;
}

export interface FirewallConfig {
  rules: RuleConfig[];
  zones: ZoneConfig[];
}

export interface RuleConfig {
  name: string;
  action: 'accept' | 'reject' | 'drop';
  protocol: string;
  source: string;
  destination: string;
  port?: string;
}

export interface ZoneConfig {
  name: string;
  interfaces: string[];
  rules: string[];
}

export interface SystemConfig {
  hostname: string;
  dns: DnsConfig;
  ntp: NtpConfig;
  logging: LoggingConfig;
}

export interface DnsConfig {
  servers: string[];
  search: string[];
}

export interface NtpConfig {
  servers: string[];
  enabled: boolean;
}

export interface LoggingConfig {
  level: 'info' | 'debug' | 'warn' | 'error';
  destinations: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}