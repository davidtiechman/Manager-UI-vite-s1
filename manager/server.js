const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const agents = {};
const agentHistory = {};
const agentConfigs = {};
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'manager',
    password: process.env.DB_PASSWORD || 'manager_password',
    database: process.env.DB_NAME || 'manager',
});

function defaultConfig(agentId) {
    return {
        agentId,
        schedulerMode: 'auto',
        selectedLink: 'satcom',
        intervalMs: 15000,
        maxRetries: 3,
        sparkProxyUrl: '',
        token: '',
        batchSize: 10,
        isManualMode: false,
        updatedAt: new Date().toISOString(),
    };
}

async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS agent_syncs (
            id BIGSERIAL PRIMARY KEY,
            agent_id TEXT NOT NULL,
            status TEXT,
            selected_link TEXT,
            payload JSONB NOT NULL,
            received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS agent_configs (
            agent_id TEXT PRIMARY KEY,
            config JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

async function saveAgentSync(agent) {
    await pool.query(
        `INSERT INTO agent_syncs (agent_id, status, selected_link, payload, received_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
            agent.id,
            agent.status || null,
            agent.selectedLink || null,
            agent,
            agent.lastSeen,
        ],
    );
}

async function getAgentConfig(agentId) {
    if (agentConfigs[agentId]) {
        return agentConfigs[agentId];
    }

    const result = await pool.query(
        'SELECT config FROM agent_configs WHERE agent_id = $1',
        [agentId],
    );

    if (result.rows[0]) {
        agentConfigs[agentId] = result.rows[0].config;
        return agentConfigs[agentId];
    }

    const config = defaultConfig(agentId);
    await saveAgentConfig(agentId, config);
    return config;
}

async function saveAgentConfig(agentId, config) {
    const nextConfig = {
        ...defaultConfig(agentId),
        ...config,
        agentId,
        intervalMs: Number(config.intervalMs || 15000),
        maxRetries: Number(config.maxRetries || 3),
        batchSize: Number(config.batchSize || 10),
        isManualMode: Boolean(config.isManualMode),
        updatedAt: new Date().toISOString(),
    };

    await pool.query(
        `INSERT INTO agent_configs (agent_id, config, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (agent_id)
         DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()`,
        [agentId, nextConfig],
    );

    agentConfigs[agentId] = nextConfig;
    return nextConfig;
}

function createHistoryPoint() {
    const now = new Date();
    return {
        time: now.toISOString(),
        latency: Math.round(50 + Math.random() * 250),
        reliability: Number((0.7 + Math.random() * 0.3).toFixed(2)),
    };
}

app.get('/api/ui/agents', (req, res) => {
    const list = Object.values(agents).map((agent) => ({
        ...agent,
        lastSeen: agent.lastSeen,
        nextDeliveryTime: agent.nextDeliveryTime,
        serverLut: agent.serverLut,
        linkTimestamp: agent.linkTimestamp,
    }));
    res.json(list);
});

app.get('/api/ui/agents/:id/history', (req, res) => {
    const { id } = req.params;
    const history = agentHistory[id] || [];
    res.json(history.slice(-Number(req.query.limit || 20)).reverse());
});

app.get('/api/ui/agents/:id/config', async (req, res) => {
    try {
        const config = await getAgentConfig(req.params.id);
        res.json(config);
    } catch (error) {
        console.error('Failed to load agent config:', error);
        res.status(500).json({ error: 'Failed to load config' });
    }
});

app.put('/api/ui/agents/:id/config', async (req, res) => {
    try {
        const config = await saveAgentConfig(req.params.id, req.body || {});
        res.json(config);
    } catch (error) {
        console.error('Failed to save agent config:', error);
        res.status(500).json({ error: 'Failed to save config' });
    }
});

app.get('/api/agents/:id/config', async (req, res) => {
    try {
        const config = await getAgentConfig(req.params.id);
        res.json(config);
    } catch (error) {
        console.error('Failed to send agent config:', error);
        res.status(500).json({ error: 'Failed to load config' });
    }
});

app.post('/api/agents/sync', async (req, res) => {
    const payload = req.body;
    if (!payload || !payload.id) {
        return res.status(400).json({ error: 'Missing agent id' });
    }

    const now = new Date().toISOString();
    const agent = {
        ...payload,
        lastSeen: now,
        serverLut: payload.serverLut || now,
        nextDeliveryTime: payload.nextDeliveryTime || now,
        linkTimestamp: payload.linkTimestamp || now,
    };

    agents[payload.id] = agent;
    agentHistory[payload.id] = agentHistory[payload.id] || [];
    agentHistory[payload.id].push(createHistoryPoint());
    if (agentHistory[payload.id].length > 50) {
        agentHistory[payload.id].shift();
    }

    try {
        await saveAgentSync(agent);
    } catch (error) {
        console.error('Failed to save agent sync:', error);
        return res.status(500).json({ error: 'Failed to save sync' });
    }

    res.json({ ok: true });
});

app.get('/health', (req, res) => res.send('ok'));

const port = process.env.PORT || 9000;
initDb()
    .then(() => {
        app.listen(port, () => {
            console.log(`Manager service listening on port ${port}`);
        });
    })
    .catch((error) => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });
