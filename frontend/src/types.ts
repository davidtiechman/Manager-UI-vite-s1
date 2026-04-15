export type SyncStatus = 'online' | 'warning' | 'offline';

export interface AgentRow {
  id: string;
  unit: string;
  callSign: string;
  status: SyncStatus;
  selectedLink: string;
  schedulerMode: string;
  latencyMs: number;
  reliability: number;
  queue: number;
  updatedSecondsAgo: number;
}

export interface HistoryPoint {
  time: string;
  latencyMs: number;
  reliability: number;
}
