import { useState } from 'react';
import type { AgentStatus } from '../types';
import Details from "../components/Details";
import { initialAgents } from '../mockData';
import TankIcon from '../components/TankIcon';

export default function HomePage() {
  const [agents] = useState<AgentStatus[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<AgentStatus | null>(null);

  function getAgentLabel(agent: AgentStatus) {
    return agent.call_sign || agent.zayad_id || agent.unit_code;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>ניטור סוכנים בזמן אמת</h1>
        <p className="muted">לחץ על אייקון כדי לראות פרטים</p>
      </div>

      <div className="agents-grid">
        {agents.map((agent) => (
          <button
            key={agent.id}
            className={`agent-card ${agent.status}`}
            onClick={() => setSelectedAgent(agent)}
          >
            <div className="tank-icon">
              <TankIcon status={agent.status} />
            </div>
            <div className="agent-label">{getAgentLabel(agent)}</div>
            <div className="agent-info">
              <div className="info-item">יחידה: {agent.unit}</div>
              <div className="info-item">קוד יחידה: {agent.unit_code}</div>
              <div className="info-item">ציד ID: {agent.zayad_id}</div>
            </div>
          </button>
        ))}
      </div>

      {selectedAgent && (
        <Details
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}