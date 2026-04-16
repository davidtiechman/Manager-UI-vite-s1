CREATE TABLE IF NOT EXISTS agents_status (
  id TEXT PRIMARY KEY,

  -- AGENT (GET)
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL,
  scheduler_mode TEXT NOT NULL,
  selected_link TEXT NOT NULL,

  messages_in_queue INTEGER NOT NULL DEFAULT 0,
  next_delivery_time TIMESTAMPTZ NOT NULL,
  server_lut TIMESTAMPTZ NOT NULL,

  link_type TEXT NOT NULL DEFAULT 'lte',
  link_available BOOLEAN NOT NULL DEFAULT true,
  link_quality NUMERIC(5,2) NOT NULL DEFAULT 0,

  latency INTEGER NOT NULL DEFAULT 0,
  reliability NUMERIC(5,2) NOT NULL DEFAULT 0,
  link_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  unit TEXT NOT NULL DEFAULT '',
  unit_code TEXT NOT NULL DEFAULT '',
  zayad_id TEXT NOT NULL DEFAULT '',
  call_sign TEXT NOT NULL DEFAULT '',

  platform_id TEXT NOT NULL DEFAULT '',
  platform_name TEXT NOT NULL DEFAULT '',

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_configurations (
  id BIGSERIAL PRIMARY KEY,

  agent_id TEXT NOT NULL REFERENCES agents_status(id) ON DELETE CASCADE,

  -- CONFIGURATION (MANAGER)
  scheduler_mode TEXT NOT NULL,
  selected_link TEXT NOT NULL,

  interval_ms INTEGER NOT NULL DEFAULT 5000,
  max_retries INTEGER NOT NULL DEFAULT 3,

  spark_proxy_url TEXT NOT NULL,
  token TEXT NOT NULL,

  batch_size INTEGER NOT NULL DEFAULT 20,
  is_manual_mode BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_sync_history (
  id BIGSERIAL PRIMARY KEY,

  agent_id TEXT NOT NULL REFERENCES agents_status(id) ON DELETE CASCADE,

  latency INTEGER NOT NULL,
  reliability NUMERIC(5,2) NOT NULL,
  link_quality NUMERIC(5,2) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_sync_history_agent_time
ON agent_sync_history(agent_id, created_at DESC);