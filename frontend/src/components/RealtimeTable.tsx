import type { AgentRow } from '../types';

interface Props {
  agents: AgentRow[];
}

export function RealtimeTable({ agents }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Real-Time Agents Monitor</h2>
        <span className="muted">Default view on page load</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Agent</th>
            <th>Status</th>
            <th>Link</th>
            <th>Scheduler</th>
            <th>Latency</th>
            <th>Reliability</th>
            <th>Queue</th>
            <th>Last Sync</th>
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
                <span className={`badge ${agent.status}`}>{agent.status}</span>
              </td>
              <td>{agent.selectedLink}</td>
              <td>{agent.schedulerMode}</td>
              <td>{agent.latencyMs} ms</td>
              <td>{Math.round(agent.reliability * 100)}%</td>
              <td>{agent.queue}</td>
              <td>{agent.updatedSecondsAgo}s ago</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
