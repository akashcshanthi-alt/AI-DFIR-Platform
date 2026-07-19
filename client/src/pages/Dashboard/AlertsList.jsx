const SEVERITY_LABELS = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

function formatAlertTimestamp(timestamp) {
  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return timestamp;
  }

  return parsedDate.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlertsList({ alerts = [], loading = false, error = "" }) {
  if (loading) {
    return <p className="dashboard-empty-state">Loading alerts...</p>;
  }

  if (error) {
    return <p className="dashboard-empty-state">{error}</p>;
  }

  if (!alerts.length) {
    return <p className="dashboard-empty-state">No active alerts</p>;
  }

  return (
    <ul className="alerts-list" aria-label="Critical IOC alerts">
      {alerts.map((alert) => (
        <li key={alert.id} className={`alert-item alert-item--${SEVERITY_LABELS[alert.severity] ?? "low"}`}>
          <div className="alert-item__header">
            <span className={`alert-item__severity alert-item__severity--${SEVERITY_LABELS[alert.severity] ?? "low"}`}>
              {alert.severity}
            </span>
            <span className="alert-item__timestamp">{formatAlertTimestamp(alert.timestamp)}</span>
          </div>

          <h3 className="alert-item__title">{alert.title}</h3>
          <p className="alert-item__description">{alert.description}</p>
        </li>
      ))}
    </ul>
  );
}
