
export interface AgentStatus {
  id: string;
  lastSeen: Date;
  status: 'online' | 'warning' | 'offline';
  schedulerMode: string;
  selectedLink: string;
  messagesInQueue: number;
  nextDeliveryTime: Date;
  serverLut: Date;
  linkType: string;
  linkAvailable: boolean;
  linkQuality: number;
  unit: string;
  unit_code: string;
  zayad_id: string;
  call_sign: string;
  platformId: string;
  platformName: string;
}

export interface AgentConfig {
  schedulerMode: string;
  selectedLink: string;
  intervalMs: number;
  maxRetries: number;
  sparkProxyUrl: string;
  token: string;
  batchSize: number;
  isManualMode: boolean;

}

export interface HistoryPoint {
  time: string;
  latencyMs: number;
  reliability: number;
}
