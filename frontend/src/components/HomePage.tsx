import { useEffect, useMemo, useState } from 'react';
import type { AgentStatus } from '../types';
import Details from './Details';

type UiAgentResponse = {
  id: string;
  status: string;
  selected_link: string | null;
  scheduler_mode: string | null;
  interval_seconds: number | null;
  last_sync_at: string | null;
  latency_ms: number | null;
  reliability: number | null;
  queue_size: number | null;
};

const MANAGER_BASE_URL =
  (import.meta.env.VITE_MANAGER_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:9000';

function normalizeStatus(status: string): AgentStatus['status'] {
  if (status === 'online' || status === 'warning' || status === 'offline') {
    return status;
  }

  if (status === 'active') {
    return 'online';
  }

  return 'warning';
}

function toAgentStatus(row: UiAgentResponse): AgentStatus {
  const lastSeen = row.last_sync_at ? new Date(row.last_sync_at) : new Date();
  const intervalMs = (row.interval_seconds ?? 15) * 1000;

  return {
    id: row.id,
    lastSeen,
    status: normalizeStatus(row.status),
    schedulerMode: row.scheduler_mode ?? 'interval',
    selectedLink: row.selected_link ?? 'lte',
    messagesInQueue: row.queue_size ?? 0,
    nextDeliveryTime: new Date(lastSeen.getTime() + intervalMs),
    serverLut: new Date(),
    linkType: row.selected_link ?? 'lte',
    linkAvailable: true,
    linkQuality: row.reliability ?? 0,
    unit: '-',
    unit_code: '-',
    zayad_id: '-',
    call_sign: row.id,
    platformId: 'spark',
    platformName: 'Spark Manager',
  };
}

export default function HomePage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchAgents = async () => {
      try {
        const response = await fetch(`${MANAGER_BASE_URL}/api/ui/agents`, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = (await response.json()) as UiAgentResponse[];
        setAgents(data.map(toAgentStatus));
        setError(null);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    void fetchAgents();
    const intervalId = window.setInterval(() => {
      void fetchAgents();
    }, 5000);

    return () => {
      abortController.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [agents, selectedAgentId],
  );

  function getAgentLabel(agent: AgentStatus) {
    return agent.call_sign || agent.zayad_id || agent.unit_code;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>ניטור סוכנים בזמן אמת</h1>
        <p className="muted">לחץ על אייקון כדי לראות פרטים</p>
      </div>

      {loading && <p className="muted">טוען נתונים...</p>}
      {error && <p className="muted">שגיאה בטעינת נתונים: {error}</p>}

      <div className="agents-grid">
        {agents.map((agent) => (
          <button
            key={agent.id}
            className={`agent-card ${agent.status}`}
            onClick={() => setSelectedAgentId(agent.id)}
          >
            <div className="tank-icon">🛡️</div>
            <div className="agent-label">{getAgentLabel(agent)}</div>
          </button>
        ))}
      </div>

      {selectedAgent && <Details agent={selectedAgent} onClose={() => setSelectedAgentId(null)} />}
    </div>
  );
}
