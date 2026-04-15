import { useEffect, useMemo, useState } from 'react';
import { HistoryPanel } from './components/HistoryPanel';
import { KpiCards } from './components/KpiCards';
import { RealtimeTable } from './components/RealtimeTable';
import { history, initialAgents } from './mockData';
import type { AgentRow } from './types';

type Mode = 'realtime' | 'history';

function randomizeAgents(agents: AgentRow[]): AgentRow[] {
  return agents.map((agent) => {
    const latencyShift = Math.round((Math.random() - 0.5) * 22);
    const nextLatency = Math.max(40, agent.latencyMs + latencyShift);
    const reliabilityShift = (Math.random() - 0.5) * 0.04;
    const nextReliability = Math.min(1, Math.max(0.4, agent.reliability + reliabilityShift));

    const status =
      nextReliability < 0.75 || nextLatency > 250
        ? 'offline'
        : nextReliability < 0.9 || nextLatency > 150
          ? 'warning'
          : 'online';

    return {
      ...agent,
      latencyMs: nextLatency,
      reliability: nextReliability,
      status,
      updatedSecondsAgo: Math.floor(Math.random() * 8),
      queue: Math.max(0, agent.queue + Math.round((Math.random() - 0.5) * 4)),
    };
  });
}

export default function App() {
  const [mode, setMode] = useState<Mode>('realtime');
  const [agents, setAgents] = useState<AgentRow[]>(initialAgents);

  useEffect(() => {
    const timer = setInterval(() => {
      setAgents((prev) => randomizeAgents(prev));
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const lastUpdated = useMemo(() => new Date().toLocaleTimeString(), [agents]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Spark Manager</h1>
        <nav>
          <button className={mode === 'realtime' ? 'active' : ''} onClick={() => setMode('realtime')}>
            Real-Time View
          </button>
          <button className={mode === 'history' ? 'active' : ''} onClick={() => setMode('history')}>
            History View
          </button>
        </nav>
        <p className="muted">Sync cadence: every 15 seconds (backend controlled)</p>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>Agent Operations Dashboard</h2>
            <p className="muted">Default landing mode: Real-Time monitoring</p>
          </div>
          <div className="status-chip">Live • updated {lastUpdated}</div>
        </header>

        {mode === 'realtime' ? (
          <>
            <KpiCards agents={agents} />
            <RealtimeTable agents={agents} />
          </>
        ) : (
          <HistoryPanel data={history} />
        )}
      </main>
    </div>
  );
}
