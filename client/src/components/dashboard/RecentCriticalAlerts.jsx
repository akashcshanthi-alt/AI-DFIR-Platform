import { FiAlertTriangle, FiClock, FiServer } from "react-icons/fi";

const DEFAULT_ALERTS = [
  {
    id: "ALRT-4921",
    severity: "CRITICAL",
    title: "Suspicious PowerShell execution detected",
    host: "SERVER-FIN-DC01 (10.0.4.12)",
    description: "Encoded PowerShell launched from privileged workstation with script block logging enabled.",
    timestamp: "2m ago",
  },
  {
    id: "ALRT-4918",
    severity: "HIGH",
    title: "Unauthorized privilege escalation attempt",
    host: "WS-FINANCE-104 (10.0.12.89)",
    description: "Local admin token usage observed outside the approved maintenance window.",
    timestamp: "14m ago",
  },
  {
    id: "ALRT-4912",
    severity: "HIGH",
    title: "Malicious outbound network connection",
    host: "VPN-GW-04 (192.168.1.1)",
    description: "Beaconing pattern matches IOC with low-confidence command-and-control overlap.",
    timestamp: "28m ago",
  },
  {
    id: "ALRT-4907",
    severity: "MEDIUM",
    title: "LSASS Process Memory Dump Triggered",
    host: "WS-EDR-209 (10.0.88.4)",
    description: "YARA rule match for mimikatz privilege extraction in process memory block.",
    timestamp: "41m ago",
  },
];

export default function RecentCriticalAlerts({ alerts = [], loading = false, error = "" }) {
  const list = alerts.length > 0 ? alerts : DEFAULT_ALERTS;

  return (
    <div className="panel-3d alerts-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">IOC Telemetry Feed</span>
          <h3 className="panel-title">Recent Critical Alerts</h3>
        </div>

        <span className="alerts-count-badge">{list.length} Realtime Alerts</span>
      </div>

      {error && <div className="alert-error-banner">{error}</div>}

      <div className="alerts-list-3d">
        {list.slice(0, 4).map((alert) => {
          const sevClass = (alert.severity || "HIGH").toLowerCase();
          return (
            <div key={alert.id} className={`alert-card-3d alert-card-3d--${sevClass}`}>
              <div className="alert-card-header">
                <span className={`severity-badge-3d severity-badge-3d--${sevClass}`}>
                  <FiAlertTriangle className="badge-icon" /> {alert.severity}
                </span>
                <span className="alert-time">
                  <FiClock /> {alert.timestamp}
                </span>
              </div>

              <h4 className="alert-card-title">{alert.title}</h4>
              <p className="alert-card-desc">{alert.description}</p>

              <div className="alert-card-footer">
                <span className="alert-host">
                  <FiServer /> {alert.host || alert.targetHost || "Endpoint Host"}
                </span>
                <span className="alert-id">{alert.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
