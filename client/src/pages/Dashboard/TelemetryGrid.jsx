import { FiActivity, FiAlertTriangle, FiCpu, FiShield, FiWifi } from "react-icons/fi";

const ICONS = {
  alerts: FiAlertTriangle,
  network: FiWifi,
  memory: FiCpu,
  integrity: FiShield,
};

export default function TelemetryGrid({ items = [], flashIds = [] }) {
  return (
    <div className="telemetry-grid">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? FiActivity;

        return (
          <article
            key={item.id}
            className={`telemetry-card telemetry-card--${item.trendTone} ${flashIds.includes(item.id) ? "telemetry-card--flash" : ""}`}
          >
            <div className="telemetry-card__icon-wrap" aria-hidden="true">
              <Icon className="telemetry-card__icon" />
            </div>

            <div className="telemetry-card__body">
              <p className="telemetry-card__label">{item.label}</p>
              <p className="telemetry-card__value">{item.value}</p>
              <div className="telemetry-card__meta">
                <span className={`telemetry-card__trend telemetry-card__trend--${item.trendTone}`}>{item.trend}</span>
                <span className="telemetry-card__status">{item.status}</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
