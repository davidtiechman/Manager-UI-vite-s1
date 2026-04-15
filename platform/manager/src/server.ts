import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.MANAGER_PORT ?? 9000);
const dbUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/managerdb';
const pool = new Pool({ connectionString: dbUrl });

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', service: 'manager', time: new Date().toISOString() });
});

app.post('/api/agents/sync', async (req, res) => {
  const { agentId, status, latencyMs, reliability, queueSize } = req.body as {
    agentId: string;
    status: string;
    latencyMs: number;
    reliability: number;
    queueSize: number;
  };

  if (!agentId) {
    return res.status(400).json({ error: 'agentId is required' });
  }

  await pool.query(
    `INSERT INTO agents (id, status, selected_link, last_sync_at, updated_at)
     VALUES ($1, $2, 'lte', NOW(), NOW())
     ON CONFLICT (id)
     DO UPDATE SET status = EXCLUDED.status, last_sync_at = NOW(), updated_at = NOW()`,
    [agentId, status ?? 'active'],
  );

  await pool.query(
    `INSERT INTO agent_syncs (agent_id, status, latency_ms, reliability, queue_size)
     VALUES ($1, $2, $3, $4, $5)`,
    [agentId, status ?? 'active', latencyMs ?? 0, reliability ?? 0.9, queueSize ?? 0],
  );

  const configResult = await pool.query(
    `SELECT interval_seconds, scheduler_mode, selected_link, max_retries
     FROM agent_configurations
     WHERE agent_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [agentId],
  );

  const configuration =
    configResult.rows[0] ??
    ({ interval_seconds: 15, scheduler_mode: 'interval', selected_link: 'lte', max_retries: 3 } as const);

  return res.json({
    nextSyncInSeconds: configuration.interval_seconds,
    configuration,
    serverTime: new Date().toISOString(),
  });
});

app.post('/api/configurations/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const { intervalSeconds, schedulerMode, selectedLink, maxRetries } = req.body as {
    intervalSeconds?: number;
    schedulerMode?: string;
    selectedLink?: string;
    maxRetries?: number;
  };

  await pool.query(
    `INSERT INTO agent_configurations (agent_id, interval_seconds, scheduler_mode, selected_link, max_retries)
     VALUES ($1, $2, $3, $4, $5)`,
    [agentId, intervalSeconds ?? 15, schedulerMode ?? 'interval', selectedLink ?? 'lte', maxRetries ?? 3],
  );

  res.json({ success: true });
});

app.get('/api/ui/agents', async (_req, res) => {
  const result = await pool.query(
    `SELECT
      a.id,
      a.status,
      a.last_sync_at,
      s.latency_ms,
      s.reliability,
      s.queue_size
    FROM agents a
    LEFT JOIN LATERAL (
      SELECT latency_ms, reliability, queue_size
      FROM agent_syncs
      WHERE agent_id = a.id
      ORDER BY created_at DESC
      LIMIT 1
    ) s ON TRUE
    ORDER BY a.updated_at DESC`,
  );

  res.json(result.rows);
});

app.get('/api/ui/agents/:agentId/history', async (req, res) => {
  const { agentId } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 100), 500);

  const result = await pool.query(
    `SELECT agent_id, status, latency_ms, reliability, queue_size, created_at
     FROM agent_syncs
     WHERE agent_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [agentId, limit],
  );

  res.json(result.rows);
});

app.listen(port, () => {
  console.log(`Manager service listening on :${port}`);
});
