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
    { label: 'מחוברים', value: online, tone: 'good' },
    { label: 'אזהרות', value: warning, tone: 'warn' },
    { label: 'מנותקים', value: offline, tone: 'bad' },
    { label: 'זמן שיהוי ממוצע', value: `${avgLatency} ms`, tone: 'neutral' },
    { label: 'אמינות ממוצעת', value: `${avgReliability}%`, tone: 'neutral' },
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
