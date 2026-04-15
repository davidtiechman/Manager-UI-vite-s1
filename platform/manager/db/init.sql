CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  selected_link TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_configurations (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  interval_seconds INTEGER NOT NULL DEFAULT 15,
  scheduler_mode TEXT NOT NULL DEFAULT 'interval',
  selected_link TEXT NOT NULL DEFAULT 'lte',
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_syncs (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  reliability NUMERIC(5,2) NOT NULL,
  queue_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_syncs_agent_time ON agent_syncs(agent_id, created_at DESC);
