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

  const lastUpdated = useMemo(() => new Date().toLocaleTimeString('he-IL'), [agents]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>ממשק ניהול סוכנים</h1>
        <nav>
          <button className={mode === 'realtime' ? 'active' : ''} onClick={() => setMode('realtime')}>
            תצוגה בזמן אמת
          </button>
          <button className={mode === 'history' ? 'active' : ''} onClick={() => setMode('history')}>
            תצוגת היסטוריה
          </button>
        </nav>
        <p className="muted">קצב סנכרון: כל 15 שניות (נקבע בצד שרת)</p>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>לוח בקרה תפעולי לסוכנים</h2>
            <p className="muted">מצב ברירת מחדל: ניטור נתונים נוכחיים בזמן אמת</p>
          </div>
          <div className="topbar-actions">
            {mode === 'history' && (
              <button className="back-button" onClick={() => setMode('realtime')} aria-label="חזרה לעמוד הראשי">
                ← חזרה
              </button>
            )}
            <div className="status-chip">שידור חי • עודכן לאחרונה ב־{lastUpdated}</div>
          </div>
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
