import type { AgentRow } from '../types';

interface Props {
  agents: AgentRow[];
}

export function KpiCards({ agents }: Props) {
  const online = agents.filter((a) => a.status === 'online').length;
  const warning = agents.filter((a) => a.status === 'warning').length;
  const offline = agents.filter((a) => a.status === 'offline').length;
  const avgLatency = Math.round(agents.reduce((sum, a) => sum + a.latencyMs, 0) / agents.length);
  const avgReliability = Math.round((agents.reduce((sum, a) => sum + a.reliability, 0) / agents.length) * 100);

  const cards = [
    { label: 'Online', value: online, tone: 'good' },
    { label: 'Warning', value: warning, tone: 'warn' },
    { label: 'Offline', value: offline, tone: 'bad' },
    { label: 'Avg Latency', value: `${avgLatency} ms`, tone: 'neutral' },
    { label: 'Avg Reliability', value: `${avgReliability}%`, tone: 'neutral' },
  ];

  return (
    <section className="kpi-grid">
      {cards.map((card) => (
        <article key={card.label} className={`kpi-card ${card.tone}`}>
          <h3>{card.label}</h3>
          <p>{card.value}</p>
        </article>
      ))}
    </section>
  );
}
