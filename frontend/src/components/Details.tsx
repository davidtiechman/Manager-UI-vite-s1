import type { AgentStatus } from '../types';

interface Props {
  agent: AgentStatus;
  onClose: () => void;
}

function formatDate(value: Date) {
  return new Date(value).toLocaleString('he-IL');
}

function boolLabel(value: boolean) {
  return value ? 'TRUE' : 'FALSE';
}

export default function Details({ agent, onClose }: Props) {
  return (
    <div className="details-panel">
      <div className="details-header">
        <h2>פרטי סוכן</h2>
        <button onClick={onClose}>סגור</button>
      </div>

      <table className="details-table">
        <tbody>
          <tr><td>ID</td><td>{agent.id}</td></tr>
          <tr><td>Call Sign</td><td>{agent.call_sign}</td></tr>
          <tr><td>Unit</td><td>{agent.unit}</td></tr>
          <tr><td>Unit Code</td><td>{agent.unit_code}</td></tr>
          <tr><td>Zayad ID</td><td>{agent.zayad_id}</td></tr>
          <tr><td>Status</td><td>{agent.status}</td></tr>
          <tr><td>Scheduler Mode</td><td>{agent.schedulerMode}</td></tr>
          <tr><td>Selected Link</td><td>{agent.selectedLink}</td></tr>
          <tr><td>Messages In Queue</td><td>{agent.messagesInQueue}</td></tr>
          <tr><td>Next Delivery Time</td><td>{formatDate(agent.nextDeliveryTime)}</td></tr>
          <tr><td>Server LUT</td><td>{formatDate(agent.serverLut)}</td></tr>
          <tr><td>Last Seen</td><td>{formatDate(agent.lastSeen)}</td></tr>
          <tr><td>Link Type</td><td>{agent.linkType}</td></tr>
          <tr><td>Link Available</td><td>{boolLabel(agent.linkAvailable)}</td></tr>
          <tr><td>Link Quality</td><td>{agent.linkQuality}</td></tr>
          <tr><td>Platform ID</td><td>{agent.platformId}</td></tr>
          <tr><td>Platform Name</td><td>{agent.platformName}</td></tr>
        </tbody>
      </table>
    </div>
  );
}