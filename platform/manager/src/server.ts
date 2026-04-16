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
  const {
    agentId,
    status,
    latencyMs,
    reliability,
    queueSize,
    unit,
    unitCode,
    zayadId,
    callSign,
    platformId,
    platformName,
    linkType,
    linkAvailable,
    linkQuality,
    schedulerMode
  } = req.body as {
    agentId: string;
    status: string;
    latencyMs: number;
    reliability: number;
    queueSize: number;
    unit?: string;
    unitCode?: string;
    zayadId?: string;
    callSign?: string;
    platformId?: string;
    platformName?: string;
    linkType?: string;
    linkAvailable?: boolean;
    linkQuality?: number;
    schedulerMode?: string;
  };

  if (!agentId) {
    return res.status(400).json({ error: 'agentId is required' });
  }

  await pool.query(
    `INSERT INTO agents_status (
      id, status, selected_link, last_seen, updated_at, scheduler_mode,
      unit, unit_code, zayad_id, call_sign, platform_id, platform_name,
      messages_in_queue, link_type, link_available, link_quality,
      latency, reliability, link_timestamp, next_delivery_time, server_lut
     )
     VALUES ($1, $2, 'lte', NOW(), NOW(), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW(), NOW())
     ON CONFLICT (id)
     DO UPDATE SET
       status = EXCLUDED.status,
       last_seen = NOW(),
       updated_at = NOW(),
       scheduler_mode = EXCLUDED.scheduler_mode,
       unit = EXCLUDED.unit,
       unit_code = EXCLUDED.unit_code,
       zayad_id = EXCLUDED.zayad_id,
       call_sign = EXCLUDED.call_sign,
       platform_id = EXCLUDED.platform_id,
       platform_name = EXCLUDED.platform_name,
       messages_in_queue = EXCLUDED.messages_in_queue,
       link_type = EXCLUDED.link_type,
       link_available = EXCLUDED.link_available,
       link_quality = EXCLUDED.link_quality,
       latency = EXCLUDED.latency,
       reliability = EXCLUDED.reliability,
       link_timestamp = NOW(),
       next_delivery_time = NOW(),
       server_lut = NOW()`,
    [
      agentId,
      status ?? 'online',
      schedulerMode ?? 'auto',
      unit ?? '',
      unitCode ?? '',
      zayadId ?? '',
      callSign ?? '',
      platformId ?? '',
      platformName ?? '',
      queueSize ?? 0,
      linkType ?? 'lte',
      linkAvailable ?? true,
      linkQuality ?? 0.9,
      latencyMs ?? 0,
      reliability ?? 0.9
    ],
  );

  await pool.query(
    `INSERT INTO agent_sync_history (agent_id, latency, reliability, link_quality)
     VALUES ($1, $2, $3, $4)`,
    [agentId, latencyMs ?? 0, reliability ?? 0.9, linkQuality ?? 0.9],
  );

  const configResult = await pool.query(
    `SELECT interval_ms, scheduler_mode, selected_link, max_retries
     FROM agent_configurations
     WHERE agent_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [agentId],
  );

  const configuration =
    configResult.rows[0] ??
    ({ interval_ms: 15, scheduler_mode: 'interval', selected_link: 'lte', max_retries: 3 } as const);

  return res.json({
    nextSyncInSeconds: configuration.interval_ms,
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
    `INSERT INTO agent_configurations (agent_id, interval_ms, scheduler_mode, selected_link, max_retries, spark_proxy_url, token, batch_size, is_manual_mode)
     VALUES ($1, $2, $3, $4, $5, '', '', 20, false)`,
    [agentId, intervalSeconds ?? 5000, schedulerMode ?? 'interval', selectedLink ?? 'lte', maxRetries ?? 3],
  );

  res.json({ success: true });
});

app.get('/api/ui/agents', async (_req, res) => {
  const result = await pool.query(
    `SELECT
      a.id,
      a.status,
      a.last_seen as "lastSeen",
      a.selected_link as "selectedLink",
      a.unit,
      a.unit_code,
      a.zayad_id,
      a.call_sign,
      a.platform_id as "platformId",
      a.platform_name as "platformName",
      a.messages_in_queue as "messagesInQueue",
      a.next_delivery_time as "nextDeliveryTime",
      a.server_lut as "serverLut",
      a.link_type as "linkType",
      a.link_available as "linkAvailable",
      a.link_quality as "linkQuality",
      a.latency,
      a.reliability,
      a.link_timestamp as "linkTimestamp"
    FROM agents_status a
    ORDER BY a.updated_at DESC`,
  );

  res.json(result.rows);
});

app.get('/api/ui/agents/:agentId/history', async (req, res) => {
  const { agentId } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 100), 500);

  const result = await pool.query(
    `SELECT agent_id, latency, reliability, link_quality as "linkQuality", created_at as "linkTimestamp"
     FROM agent_sync_history
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
