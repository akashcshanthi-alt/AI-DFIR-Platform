import { FiCheckCircle, FiClock, FiFolder, FiPlay, FiServer, FiUser } from "react-icons/fi";

const DEFAULT_CASES = [
  {
    caseId: "CASE-1042",
    title: "Ransomware Containment & Forensics",
    status: "In Progress",
    assignedAnalyst: "A. Patel",
    lastUpdated: "8m ago",
  },
  {
    caseId: "CASE-1037",
    title: "Impossible Travel Login Anomaly",
    status: "Open",
    assignedAnalyst: "S. Rivera",
    lastUpdated: "21m ago",
  },
  {
    caseId: "CASE-1029",
    title: "Data Exfiltration Breach Scope",
    status: "In Progress",
    assignedAnalyst: "M. Chen",
    lastUpdated: "1h ago",
  },
  {
    caseId: "CASE-1021",
    title: "Memory Trojan DLL Artifact",
    status: "Closed",
    assignedAnalyst: "J. Okafor",
    lastUpdated: "3h ago",
  },
];

export default function RecentCasesPanel({ cases = [], onCaseSelect }) {
  const list = cases.length > 0 ? cases : DEFAULT_CASES;

  const getStatusBadge = (statusStr) => {
    const s = String(statusStr).toLowerCase();
    if (s.includes("containment") || s.includes("closed")) {
      return <span className="status-pill status-pill--closed"><FiCheckCircle /> Closed</span>;
    }
    if (s.includes("progress") || s.includes("analysis") || s.includes("triage")) {
      return <span className="status-pill status-pill--progress"><FiPlay /> In Progress</span>;
    }
    return <span className="status-pill status-pill--open">Open</span>;
  };

  return (
    <div className="panel-3d cases-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Active DFIR Dossiers</span>
          <h3 className="panel-title">Recent Investigation Cases</h3>
        </div>

        <div className="panel-stat-pill">
          <FiFolder /> {list.length} Investigations Active
        </div>
      </div>

      <div className="cases-table-3d-wrap">
        <table className="cases-table-3d">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Investigation Title</th>
              <th>Status</th>
              <th>Analyst</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr
                key={item.caseId}
                className="case-row-3d"
                onClick={() => onCaseSelect?.(item)}
              >
                <td className="case-id-cell">{item.caseId}</td>
                <td className="case-title-cell">
                  <strong>{item.title}</strong>
                </td>
                <td>{getStatusBadge(item.status)}</td>
                <td className="case-analyst-cell">
                  <FiUser className="cell-icon" /> {item.assignedAnalyst}
                </td>
                <td className="case-time-cell">
                  <FiClock className="cell-icon" /> {item.lastUpdated}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
