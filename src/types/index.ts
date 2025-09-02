export interface Message {
  id: string;
  content: string;
  priority: MessagePriority;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export enum MessagePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export enum LinkType {
  LAN = 'lan',
  WIFI = 'wifi',
  MOBILE = 'mobile'
}

export enum SchedulerMode {
  CONTINUOUS = 'continuous',
  INTERVAL = 'interval'
}

export interface LinkQuality {
  type: LinkType;
  available: boolean;
  bandwidth: number;
  latency: number;
  reliability: number;
  timestamp: number;
}

export interface Configuration {
  schedulerMode: SchedulerMode;
  selectedLink: LinkType;
  intervalMs: number;
  maxRetries: number;
  sparkProxyUrl: string;
  token: string;
}

export interface AgentStatus {
  id: string;
  status: 'active' | 'inactive' | 'slow';
  selectedLink: LinkType;
  schedulerMode: SchedulerMode;
  messagesInQueue: number;
  linkQualities: LinkQuality[];
  timestamp: number;
}
