export interface NetworkPacket {
  id: string;
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  length: number;
  info: string;
  prediction: 'Normal' | 'DoS' | 'Portscan' | 'BruteForce' | 'Probe' | 'R2L' | 'U2R';
  confidence: number;
}

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertStatus = 'Active' | 'Mitigated' | 'Ignored';

export interface SecurityAlert {
  id: string;
  timestamp: string;
  message: string;
  sourceIp: string;
  severity: AlertSeverity;
  status: AlertStatus;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  bandwidthIn: number; // in Mbps
  bandwidthOut: number; // in Mbps
  activeThreats: number;
  firewallStatus: 'Active' | 'Disabled';
}
