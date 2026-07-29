import { useState } from "react";
import { FiActivity, FiGlobe, FiLock, FiRefreshCw, FiShield, FiShieldOff, FiServer, FiHardDrive } from "react-icons/fi";

const INITIAL_NODES = [
  { id: "NODE-01", name: "SERVER-FIN-DC01", ip: "10.0.4.12", zone: "Corporate AD Domain", status: "COMPROMISED", threatLevel: "CRITICAL", isolated: false },
  { id: "NODE-02", name: "WS-FINANCE-104", ip: "10.0.12.89", zone: "Finance Subnet", status: "SUSPICIOUS", threatLevel: "HIGH", isolated: false },
  { id: "NODE-03", name: "GW-PERIMETER-01", ip: "192.168.1.1", zone: "DMZ Edge", status: "HEALTHY", threatLevel: "LOW", isolated: false },
  { id: "NODE-04", name: "STORAGE-S3-BLOB", ip: "10.0.88.4", zone: "Cloud Backup", status: "MONITORING", threatLevel: "MEDIUM", isolated: false },
  { id: "NODE-05", name: "WS-EXEC-LAPT-02", ip: "10.0.14.33", zone: "Executive Workstation", status: "HEALTHY", threatLevel: "LOW", isolated: false },
  { id: "NODE-06", name: "KUBE-PROD-WORKER-09", ip: "10.244.2.18", zone: "Production Clusters", status: "HEALTHY", threatLevel: "LOW", isolated: false },
];

export default function ThreatMatrix() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const toggleIsolate = (id) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === id) {
          const nextState = !node.isolated;
          return {
            ...node,
            isolated: nextState,
            status: nextState ? "ISOLATED" : "SUSPICIOUS",
          };
        }
        return node;
      })
    );
  };

  const filteredNodes = nodes.filter((n) => {
    if (activeFilter === "CRITICAL") return n.threatLevel === "CRITICAL" || n.threatLevel === "HIGH";
    if (activeFilter === "ISOLATED") return n.isolated;
    return true;
  });

  return (
    <div className="threat-matrix-card">
      <div className="threat-matrix-card__header">
        <div>
          <div className="threat-matrix-card__kicker">Host Security Topology</div>
          <h3 className="threat-matrix-card__title">Endpoint & Perimeter Threat Matrix</h3>
        </div>

        <div className="threat-matrix-filters">
          <button
            type="button"
            className={`filter-chip ${activeFilter === "ALL" ? "filter-chip--active" : ""}`}
            onClick={() => setActiveFilter("ALL")}
          >
            All Nodes ({nodes.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeFilter === "CRITICAL" ? "filter-chip--active" : ""}`}
            onClick={() => setActiveFilter("CRITICAL")}
          >
            Threat Alerts (2)
          </button>
          <button
            type="button"
            className={`filter-chip ${activeFilter === "ISOLATED" ? "filter-chip--active" : ""}`}
            onClick={() => setActiveFilter("ISOLATED")}
          >
            Quarantined ({nodes.filter((n) => n.isolated).length})
          </button>
        </div>
      </div>

      <div className="threat-nodes-grid">
        {filteredNodes.map((node) => (
          <div
            key={node.id}
            className={`node-card node-card--${node.status.toLowerCase()} ${node.isolated ? "node-card--quarantined" : ""}`}
          >
            <div className="node-card__header">
              <span className="node-card__id">{node.id}</span>
              <span className={`node-badge node-badge--${node.threatLevel.toLowerCase()}`}>
                {node.threatLevel}
              </span>
            </div>

            <div className="node-card__body">
              <div className="node-card__title-group">
                <FiServer className="node-icon" />
                <div>
                  <h4 className="node-name">{node.name}</h4>
                  <span className="node-ip">{node.ip}</span>
                </div>
              </div>
              <p className="node-zone">{node.zone}</p>
            </div>

            <div className="node-card__footer">
              <span className={`node-status-indicator node-status-indicator--${node.status.toLowerCase()}`}>
                <span className="dot" /> {node.status}
              </span>

              <button
                type="button"
                className={`node-isolate-btn ${node.isolated ? "node-isolate-btn--active" : ""}`}
                onClick={() => toggleIsolate(node.id)}
                title={node.isolated ? "Release Quarantine" : "Isolate Host Network"}
              >
                {node.isolated ? <FiShieldOff /> : <FiLock />}
                <span>{node.isolated ? "Unquarantine" : "Isolate"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
