import 'dotenv/config';
import axios from 'axios';

const managerUrl = process.env.MANAGER_URL ?? 'http://localhost:9000';
const agentId = process.env.AGENT_ID ?? 'agent-001';

function randomMetrics() {
  return {
    latencyMs: Math.max(30, Math.round(50 + Math.random() * 180)),
    reliability: Number((0.8 + Math.random() * 0.2).toFixed(2)),
    queueSize: Math.max(0, Math.round(Math.random() * 20)),
    status: 'active',
    schedulerMode: 'auto', // Add scheduler_mode
  };
}

async function syncLoop(nextSeconds = 15): Promise<void> {
  try {
    const metrics = randomMetrics();
    const response = await axios.post(`${managerUrl}/api/agents/sync`, {
      agentId,
      ...metrics,
    });

    const fromServer = Number(response.data?.nextSyncInSeconds ?? 15);
    const interval = Number.isFinite(fromServer) && fromServer > 0 ? fromServer : 15;

    console.log(`[${new Date().toISOString()}] sync ok`, { agentId, interval, config: response.data.configuration });
    setTimeout(() => void syncLoop(interval), interval * 1000);
  } catch (error) {
    console.error('sync failed, retry in 15s', error);
    setTimeout(() => void syncLoop(15), 15000);
  }
}

void syncLoop();
