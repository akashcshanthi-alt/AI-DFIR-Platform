import { useEffect, useMemo, useRef, useState } from "react";
import { FiActivity, FiLogOut, FiShield, FiServer, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AlertsList from "./AlertsList";
import { createDashboardState, dashboardMock, refreshDashboardState } from "./Dashboard.mock";
import RecentCases from "./RecentCases";
import TelemetryGrid from "./TelemetryGrid";
import "./Dashboard.css";

const DEV_SESSION_KEY = "arclight-dev-session";
const TELEMETRY_REFRESH_MS = 15000;
const EVENT_TICKER_MS = 5000;
const CHANGE_FLASH_MS = 700;

export default function Dashboard() {
  const navigate = useNavigate();
  const hasSession = sessionStorage.getItem(DEV_SESSION_KEY) === "active";
  const [dashboardState, setDashboardState] = useState(() => createDashboardState());
  const [flashIds, setFlashIds] = useState([]);
  const [tickerVisible, setTickerVisible] = useState(true);
  const telemetryTimeoutRef = useRef(null);
  const eventTimeoutRef = useRef(null);

  useEffect(() => {
    if (!hasSession) {
      navigate("/login", { replace: true });
    }
  }, [hasSession, navigate]);

  useEffect(() => {
    if (!hasSession) return undefined;

    const nextFlashIds = (nextTelemetry, previousTelemetry) => {
      return nextTelemetry
        .filter((item, index) => String(item.value) !== String(previousTelemetry[index]?.value))
        .map((item) => item.id);
    };

    if (telemetryTimeoutRef.current) {
      window.clearTimeout(telemetryTimeoutRef.current);
    }

    const refreshTelemetry = () => {
      setDashboardState((current) => {
        const nextState = refreshDashboardState(current);
        const changedIds = nextFlashIds(nextState.telemetry, current.telemetry);

        setFlashIds(changedIds);

        if (telemetryTimeoutRef.current) {
          window.clearTimeout(telemetryTimeoutRef.current);
        }

        telemetryTimeoutRef.current = window.setTimeout(() => setFlashIds([]), CHANGE_FLASH_MS);

        return nextState;
      });
    };

    const intervalId = window.setInterval(refreshTelemetry, TELEMETRY_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
      if (telemetryTimeoutRef.current) {
        window.clearTimeout(telemetryTimeoutRef.current);
      }
    };
  }, [hasSession]);

  useEffect(() => {
    if (!hasSession) return undefined;

    if (eventTimeoutRef.current) {
      window.clearTimeout(eventTimeoutRef.current);
    }

    const intervalId = window.setInterval(() => {
      setTickerVisible(false);
      eventTimeoutRef.current = window.setTimeout(() => {
        setDashboardState((current) => ({
          ...current,
          currentEventIndex: (current.currentEventIndex + 1) % dashboardMock.incomingEvents.length,
        }));
        setTickerVisible(true);
      }, 180);
    }, EVENT_TICKER_MS);

    return () => {
      window.clearInterval(intervalId);
      if (eventTimeoutRef.current) {
        window.clearTimeout(eventTimeoutRef.current);
      }
    };
  }, [hasSession]);

  const handleLogout = () => {
    sessionStorage.removeItem(DEV_SESSION_KEY);
    navigate("/login", { replace: true });
  };

  if (!hasSession) {
    return null;
  }

  const { platform, analyst, telemetry, alerts, cases, incomingEvents, alertsTrend, lastSynced, currentEventIndex } = dashboardState;
  const currentEvent = incomingEvents[currentEventIndex] ?? incomingEvents[0];
  const chartStroke = useMemo(() => "#22e1ff", []);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-glow dashboard-glow--left" aria-hidden="true" />
      <div className="dashboard-glow dashboard-glow--right" aria-hidden="true" />

      <header className="dashboard-topbar">
        <div className="dashboard-brand-block">
          <div className="dashboard-brand-mark" aria-hidden="true">
            <FiShield />
          </div>
          <div>
            <p className="dashboard-brand">ARCLIGHT</p>
            <p className="dashboard-subtitle">AI-Driven DFIR Platform</p>
          </div>
        </div>

        <div className="dashboard-topbar-meta">
          <span className="dashboard-version">{platform.version}</span>

          <span className="dashboard-analyst">
            <FiUser aria-hidden="true" />
            {analyst.email}
          </span>

          <span className="dashboard-role-badge">{analyst.role}</span>

          <span className="dashboard-system-status">
            <FiActivity aria-hidden="true" />
            {platform.status}
          </span>

          <button type="button" className="dashboard-logout-btn" onClick={handleLogout}>
            <FiLogOut aria-hidden="true" />
            Terminate Session
          </button>
        </div>
      </header>

      <div className="dashboard-ticker" role="status" aria-live="polite">
        <span className="dashboard-ticker__label">Incoming Events</span>
        <span className={`dashboard-ticker__text ${tickerVisible ? "dashboard-ticker__text--visible" : "dashboard-ticker__text--hidden"}`}>
          {currentEvent}
        </span>
      </div>

      <main className="dashboard-main">
        <section className="dashboard-panel" aria-labelledby="telemetry-heading">
          <div className="dashboard-panel__header">
            <div>
              <p className="dashboard-kicker">Live telemetry overview</p>
              <h1 id="telemetry-heading" className="dashboard-title">
                Node health and case telemetry
              </h1>
              <p className="dashboard-last-synced">Last synced: {lastSynced}</p>
            </div>
            <p className="dashboard-panel__hint">
              Development snapshot only. No backend polling or live events are connected yet.
            </p>
          </div>

          <TelemetryGrid items={telemetry} flashIds={flashIds} />
        </section>

        <div className="dashboard-secondary-grid">
          <section className="dashboard-panel" aria-labelledby="alerts-heading">
            <div className="dashboard-panel__header dashboard-panel__header--compact">
              <div>
                <p className="dashboard-kicker">Critical IOC alerts</p>
                <h2 id="alerts-heading" className="dashboard-section-title">
                  Alerts stream
                </h2>
              </div>
            </div>

            <div className="alerts-trend-card" aria-label="Alerts over last 24h chart">
              <div className="alerts-trend-card__header">
                <span className="alerts-trend-card__title">Alerts over last 24h</span>
                <span className="alerts-trend-card__value">Peak {Math.max(...alertsTrend.map((point) => point.value))}</span>
              </div>

              <div className="alerts-trend-chart" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={alertsTrend} margin={{ top: 5, right: 6, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="alertsTrendStroke" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartStroke} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={chartStroke} stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(34,225,255,0.1)" strokeDasharray="3 6" vertical={false} />
                    <XAxis dataKey="hour" hide />
                    <YAxis hide domain={[0, "dataMax + 2"]} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10, 18, 32, 0.95)",
                        border: "1px solid rgba(34, 225, 255, 0.24)",
                        borderRadius: "12px",
                        color: "#e8f6fb",
                        boxShadow: "0 12px 24px rgba(0, 0, 0, 0.35)",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "#7de9ff" }}
                      itemStyle={{ color: "#e8f6fb" }}
                      cursor={{ stroke: "rgba(34,225,255,0.18)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="url(#alertsTrendStroke)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3.5, fill: "#22e1ff", stroke: "#050910", strokeWidth: 1.5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <AlertsList alerts={alerts} />
          </section>

          <section className="dashboard-panel" aria-labelledby="cases-heading">
            <div className="dashboard-panel__header dashboard-panel__header--compact">
              <div>
                <p className="dashboard-kicker">Recent investigations</p>
                <h2 id="cases-heading" className="dashboard-section-title">
                  Recent cases
                </h2>
              </div>
              <div className="dashboard-panel__stat">
                <FiServer aria-hidden="true" />
                <span>{cases.length} cases in review</span>
              </div>
            </div>

            <RecentCases cases={cases} />
          </section>
        </div>
      </main>
    </div>
  );
}
