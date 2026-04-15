import type { AgentRow } from '../types';

interface Props {
  agents: AgentRow[];
}

function statusLabel(status: AgentRow['status']) {
  if (status === 'online') return 'מחובר';
  if (status === 'warning') return 'אזהרה';
  return 'מנותק';
}

export function RealtimeTable({ agents }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>ניטור סוכנים בזמן אמת</h2>
        <span className="muted">זוהי התצוגה הראשית בעת טעינת הדף</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>סוכן</th>
            <th>סטטוס</th>
            <th>קישור פעיל</th>
            <th>מצב מתזמן</th>
            <th>Latency</th>
            <th>אמינות</th>
            <th>תור הודעות</th>
            <th>סנכרון אחרון</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id}>
              <td>
                <strong>{agent.callSign}</strong>
                <div className="muted">{agent.unit}</div>
              </td>
              <td>
                <span className={`badge ${agent.status}`}>{statusLabel(agent.status)}</span>
              </td>
              <td>{agent.selectedLink}</td>
              <td>{agent.schedulerMode}</td>
              <td>{agent.latencyMs} ms</td>
              <td>{Math.round(agent.reliability * 100)}%</td>
              <td>{agent.queue}</td>
              <td>לפני {agent.updatedSecondsAgo} שניות</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
