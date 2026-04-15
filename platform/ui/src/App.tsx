import { useEffect, useState } from 'react';

type AgentRow = {
  id: string;
  status: string;
  last_sync_at: string;
  latency_ms: number | null;
  reliability: number | null;
  queue_size: number | null;
};

const managerUrl = import.meta.env.VITE_MANAGER_URL ?? 'http://localhost:9000';

export default function App() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [history, setHistory] = useState<AgentRow[]>([]);

  const handleBack = () => {
    setSelectedAgent(null);
  };

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${managerUrl}/api/ui/agents`);
      const data = (await res.json()) as AgentRow[];
      setAgents(data);
    };

    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedAgent) {
      setHistory([]);
      return;
    }

    const loadHistory = async () => {
      const res = await fetch(`${managerUrl}/api/ui/agents/${selectedAgent}/history?limit=20`);
      const data = (await res.json()) as AgentRow[];
      setHistory(data);
    };

    void loadHistory();
  }, [selectedAgent]);

  return (
    <div className="layout">
      <h1>Manager UI - Real Time</h1>
      <p>ה־UI מבצע polling לשרת Manager ומציג נתונים בזמן אמת + היסטוריה.</p>

      <table>
        <thead>
          <tr>
            <th>Agent ID</th>
            <th>סטטוס</th>
            <th>Latency</th>
            <th>Reliability</th>
            <th>Queue</th>
            <th>Last Sync</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.id} onClick={() => setSelectedAgent(a.id)}>
              <td>{a.id}</td>
              <td>{a.status}</td>
              <td>{a.latency_ms ?? '-'}</td>
              <td>{a.reliability ?? '-'}</td>
              <td>{a.queue_size ?? '-'}</td>
              <td>{new Date(a.last_sync_at).toLocaleString('he-IL')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="history-header">
        <h2>History: {selectedAgent ?? 'בחר Agent'}</h2>
        {selectedAgent && (
          <button className="back-button" onClick={handleBack} aria-label="חזרה">
            <span className="back-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            חזרה
          </button>
        )}
      </div>
      <ul>
        {history.map((h, idx) => (
          <li key={idx}>
            {new Date(h.last_sync_at).toLocaleTimeString('he-IL')} | latency={h.latency_ms} | reliability={h.reliability} |
            queue={h.queue_size}
          </li>
        ))}
      </ul>
    </div>
  );
}
