import type { AgentStatus, HistoryPoint } from './types';

export const initialAgents: AgentStatus[] = [
  {
    id: 'ag-101',
    unit: 'פיקוד צפון',
    call_sign: 'N-ALPHA',
    unit_code: 'N-01',
    zayad_id: 'Z-101',
    status: 'online',
    selectedLink: 'satcom',
    schedulerMode: 'auto',
    messagesInQueue: 2,
    linkType: 'satcom',
    linkAvailable: true,
    linkQuality: 0.98,
    lastSeen: new Date(),
    nextDeliveryTime: new Date(Date.now() + 15_000),
    serverLut: new Date(),
    platformId: 'spark',
    platformName: 'Spark Manager',
  },
];

export const history: HistoryPoint[] = [
  { time: '10:00', latencyMs: 75, reliability: 0.99 },
  { time: '10:15', latencyMs: 88, reliability: 0.97 },
  { time: '10:30', latencyMs: 95, reliability: 0.95 },
];
