import type { HistoryPoint } from '../types';

interface Props {
  data: HistoryPoint[];
}

export function HistoryPanel({ data }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>היסטוריית נתונים (מצב משני)</h2>
        <span className="muted">ניתוח מגמות לאורך זמן</span>
      </div>
      <div className="history-grid">
        {data.map((point) => (
          <article key={point.time} className="history-card">
            <h4>{point.time}</h4>
            <p>זמן שיהוי: {point.latencyMs} ms</p>
            <p>אמינות: {Math.round(point.reliability * 100)}%</p>
          </article>
        ))}
      </div>
    </section>
  );
}
