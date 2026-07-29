import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, 
  FiFolder, 
  FiAlertOctagon, 
  FiDatabase, 
  FiActivity, 
  FiUpload, 
  FiCpu, 
  FiPlusCircle, 
  FiFileText 
} from 'react-icons/fi';

import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import StatusBadge from '../../components/common/StatusBadge';

// Mock Data for Threat Activity (last 7 days of alerts/incidents)
const THREAT_ACTIVITY_DATA = [
  { day: 'Mon', value: 12 },
  { day: 'Tue', value: 18 },
  { day: 'Wed', value: 14 },
  { day: 'Thu', value: 27 },
  { day: 'Fri', value: 21 },
  { day: 'Sat', value: 16 },
  { day: 'Sun', value: 23 },
];

// Mock Data for Recent Cases (representative enterprise security cases)
const RECENT_CASES = [
  {
    caseId: 'TRC-2026-0042',
    title: 'Suspicious Account Activity',
    severity: 'High',
    status: 'Investigating',
  },
  {
    caseId: 'TRC-2026-0041',
    title: 'Unauthorized PowerShell Execution',
    severity: 'Critical',
    status: 'Open',
  },
  {
    caseId: 'TRC-2026-0040',
    title: 'External Network Connection',
    severity: 'Medium',
    status: 'Investigating',
  },
  {
    caseId: 'TRC-2026-0039',
    title: 'Authentication Anomaly',
    severity: 'Low',
    status: 'Closed',
  },
];

// Mock Data for Recent Activity Log Feed
const RECENT_ACTIVITIES = [
  {
    id: 1,
    time: '09:42',
    icon: FiUpload,
    description: <>Evidence uploaded to <span className="highlight">TRC-2026-0042</span></>,
  },
  {
    id: 2,
    time: '09:31',
    icon: FiCpu,
    description: <>AI analysis completed for <span className="highlight">TRC-2026-0041</span></>,
  },
  {
    id: 3,
    time: '09:18',
    icon: FiPlusCircle,
    description: <>New investigation <span className="highlight">TRC-2026-0040</span> created</>,
  },
  {
    id: 4,
    time: '08:54',
    icon: FiFileText,
    description: <>Report generated for <span className="highlight">TRC-2026-0039</span></>,
  },
];

/**
 * Dashboard Component
 * Serves as the system-wide overview command center for the TRACE AI DFIR platform.
 * Integrates layout structure with stats grid, activity line graphs, cases, and logs.
 */
export default function Dashboard() {
  const navigate = useNavigate();

  // Auth Guard: check developer session active token
  const hasSession = sessionStorage.getItem('arclight-dev-session') === 'active';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  if (!hasSession) return null;

  const handleLogout = () => {
    sessionStorage.removeItem('arclight-dev-session');
    navigate('/login', { replace: true });
  };

  // SVG Chart calculation parameters
  const svgWidth = 600;
  const svgHeight = 160;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const maxValue = 30;

  // Map 7-day values to exact grid points
  const points = THREAT_ACTIVITY_DATA.map((d, i) => {
    const x = paddingLeft + (i * chartWidth) / (THREAT_ACTIVITY_DATA.length - 1);
    const y = svgHeight - paddingBottom - (d.value / maxValue) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(svgHeight - paddingBottom).toFixed(1)} L ${points[0].x.toFixed(1)} ${(svgHeight - paddingBottom).toFixed(1)} Z`;

  return (
    <div className="trace-dashboard-layout">
      {/* Self-contained styling module block */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-dashboard-layout {
            display: flex;
            min-height: 100vh;
            background-color: var(--bg-main, #060913);
            color: var(--text-primary, #f8fafc);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            width: 100%;
            box-sizing: border-box;
          }

          .trace-dashboard-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            height: 100vh;
            overflow: hidden;
            box-sizing: border-box;
          }

          .trace-dashboard-content {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 24px;
            box-sizing: border-box;
          }

          /* Content Header Panel */
          .trace-dashboard-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            box-sizing: border-box;
          }

          .trace-dashboard-welcome {
            display: flex;
            flex-direction: column;
          }

          .trace-dashboard-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            line-height: 1.2;
          }

          .trace-dashboard-subtitle {
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 4px 0 0 0;
            line-height: 1.4;
          }

          .trace-dashboard-action-btn {
            background-color: var(--color-primary, #3b82f6);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-sm, 4px);
            padding: 8px 16px;
            font-size: 0.875rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: background-color var(--transition-speed, 200ms) ease;
            outline: none;
            height: 38px;
            box-sizing: border-box;
            user-select: none;
          }

          .trace-dashboard-action-btn:hover {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-dashboard-action-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
          }

          /* Statistics Summary Row Grid */
          .trace-dashboard-stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            box-sizing: border-box;
          }

          .trace-dashboard-stat-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 16px;
            display: flex;
            align-items: flex-start;
            gap: 14px;
            box-shadow: var(--shadow-sm);
            transition: all var(--transition-speed, 200ms) ease;
            box-sizing: border-box;
          }

          .trace-dashboard-stat-card:hover {
            border-color: var(--border-color-hover, rgba(255, 255, 255, 0.15));
            transform: translateY(-1px);
          }

          .trace-dashboard-stat-icon-wrap {
            width: 40px;
            height: 40px;
            border-radius: var(--radius-sm, 4px);
            background-color: var(--bg-surface-elevated, #162035);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            color: var(--color-primary, #3b82f6);
            flex-shrink: 0;
          }

          .trace-dashboard-stat-icon-wrap.alert-critical {
            color: var(--status-critical, #ef4444);
            background-color: var(--status-critical-bg, rgba(239, 68, 68, 0.1));
          }

          .trace-dashboard-stat-icon-wrap.status-green {
            color: var(--status-low, #22c55e);
            background-color: var(--status-low-bg, rgba(34, 197, 94, 0.1));
          }

          .trace-dashboard-stat-info {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .trace-dashboard-stat-label {
            font-size: 0.725rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--text-muted, #64748b);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .trace-dashboard-stat-value {
            font-size: 1.45rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            line-height: 1.25;
            margin: 3px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .trace-dashboard-stat-subtext {
            font-size: 0.75rem;
            color: var(--text-secondary, #cbd5e1);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* 7-Day Threat Activity Visualization */
          .trace-dashboard-chart-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 20px;
            box-shadow: var(--shadow-sm);
            box-sizing: border-box;
          }

          .trace-dashboard-section-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0 0 16px 0;
            display: flex;
            align-items: center;
            gap: 8px;
            user-select: none;
          }

          .trace-dashboard-chart-container {
            position: relative;
            width: 100%;
            height: 160px;
          }

          .trace-dashboard-svg-chart {
            width: 100%;
            height: 100%;
            display: block;
          }

          /* SVG Chart styling classes */
          .trace-chart-grid-line {
            stroke: rgba(255, 255, 255, 0.04);
            stroke-width: 1;
          }

          .trace-chart-axis-line {
            stroke: rgba(255, 255, 255, 0.08);
            stroke-width: 1;
          }

          .trace-chart-axis-text {
            fill: var(--text-muted, #64748b);
            font-size: 10px;
            font-family: monospace;
            text-anchor: middle;
          }

          .trace-chart-axis-text-y {
            fill: var(--text-muted, #64748b);
            font-size: 10px;
            font-family: monospace;
            text-anchor: end;
          }

          .trace-chart-series-line {
            stroke: var(--color-primary, #3b82f6);
            stroke-width: 2.25;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .trace-chart-series-area {
            fill: url(#chartGrad);
            opacity: 0.12;
          }

          .trace-chart-node {
            fill: var(--bg-surface, #0e1626);
            stroke: var(--color-secondary, #06b6d4);
            stroke-width: 2;
            cursor: pointer;
            transition: r var(--transition-speed, 200ms) ease;
          }

          .trace-chart-node:hover {
            r: 5;
          }

          /* Main Two Column Layout Details */
          .trace-dashboard-main-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 16px;
            box-sizing: border-box;
          }

          .trace-dashboard-main-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 20px;
            box-shadow: var(--shadow-sm);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          /* Cases Table Styling */
          .trace-dashboard-table-container {
            width: 100%;
            overflow-x: auto;
          }

          .trace-dashboard-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            min-width: 500px;
          }

          .trace-dashboard-table th {
            padding: 10px 12px;
            font-size: 0.725rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted, #64748b);
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-dashboard-table-row {
            cursor: pointer;
            transition: background-color var(--transition-speed, 200ms) ease;
            outline: none;
          }

          .trace-dashboard-table-row:hover {
            background-color: rgba(255, 255, 255, 0.015);
          }

          .trace-dashboard-table-row:focus-visible {
            background-color: rgba(255, 255, 255, 0.03);
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: -2px;
          }

          .trace-dashboard-table td {
            padding: 11px 12px;
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.02);
            vertical-align: middle;
          }

          .trace-dashboard-case-id {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-weight: 600;
            color: var(--color-secondary, #06b6d4);
            font-size: 0.8125rem;
          }

          .trace-dashboard-case-title {
            font-weight: 500;
            color: var(--text-primary, #f8fafc);
            max-width: 250px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* Activities Ticker Stream */
          .trace-dashboard-activity-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-sizing: border-box;
          }

          .trace-dashboard-activity-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            box-sizing: border-box;
          }

          .trace-dashboard-activity-time {
            font-family: 'SFMono-Regular', Consolas, monospace;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-muted, #64748b);
            padding-top: 3px;
            width: 40px;
            flex-shrink: 0;
          }

          .trace-dashboard-activity-icon-wrap {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: var(--bg-surface-elevated, #162035);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            color: var(--color-secondary, #06b6d4);
            flex-shrink: 0;
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-dashboard-activity-desc {
            font-size: 0.8125rem;
            color: var(--text-secondary, #cbd5e1);
            line-height: 1.4;
            min-width: 0;
            word-wrap: break-word;
          }

          .trace-dashboard-activity-desc .highlight {
            font-family: monospace;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            background: rgba(255, 255, 255, 0.04);
            padding: 1px 4px;
            border-radius: 3px;
          }

          /* Responsive Layout Breakpoints */
          @media (max-width: 1024px) {
            .trace-dashboard-stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 768px) {
            .trace-dashboard-main-grid {
              grid-template-columns: 1fr;
            }
            .trace-dashboard-content {
              padding: 16px;
              gap: 16px;
            }
          }

          @media (max-width: 576px) {
            .trace-dashboard-stats-grid {
              grid-template-columns: 1fr;
            }
            .trace-dashboard-header-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }
            .trace-dashboard-action-btn {
              width: 100%;
              justify-content: center;
            }
          }
        `
      }} />

      {/* Main Persistent Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Right Column Layout wrapper */}
      <div className="trace-dashboard-main">
        {/* Top persistent header */}
        <Header 
          title="Dashboard" 
          userName="Security Analyst" 
          userRole="Investigator" 
        />

        {/* Scrollable Dashboard view areas */}
        <main className="trace-dashboard-content">
          
          {/* Header Panel */}
          <div className="trace-dashboard-header-row">
            <div className="trace-dashboard-welcome">
              <h2 className="trace-dashboard-title">Dashboard</h2>
              <p className="trace-dashboard-subtitle">
                Security operations overview and investigation status.
              </p>
            </div>
            <button
              type="button"
              className="trace-dashboard-action-btn"
              onClick={() => navigate('/cases/new')}
              title="Create a new case workspace"
            >
              <FiPlus aria-hidden="true" />
              <span>New Case</span>
            </button>
          </div>

          {/* Stats Summary Cards Row */}
          <div className="trace-dashboard-stats-grid" role="region" aria-label="Key telemetry stats">
            
            {/* Card 1: Active Cases */}
            <div className="trace-dashboard-stat-card">
              <div className="trace-dashboard-stat-icon-wrap" aria-hidden="true">
                <FiFolder />
              </div>
              <div className="trace-dashboard-stat-info">
                <span className="trace-dashboard-stat-label">Active Cases</span>
                <span className="trace-dashboard-stat-value">12</span>
                <span className="trace-dashboard-stat-subtext">3 updated today</span>
              </div>
            </div>

            {/* Card 2: Critical Alerts */}
            <div className="trace-dashboard-stat-card">
              <div className="trace-dashboard-stat-icon-wrap alert-critical" aria-hidden="true">
                <FiAlertOctagon />
              </div>
              <div className="trace-dashboard-stat-info">
                <span className="trace-dashboard-stat-label">Critical Alerts</span>
                <span className="trace-dashboard-stat-value">4</span>
                <span className="trace-dashboard-stat-subtext">Requires attention</span>
              </div>
            </div>

            {/* Card 3: Evidence Analysed */}
            <div className="trace-dashboard-stat-card">
              <div className="trace-dashboard-stat-icon-wrap" aria-hidden="true">
                <FiDatabase />
              </div>
              <div className="trace-dashboard-stat-info">
                <span className="trace-dashboard-stat-label">Evidence Analysed</span>
                <span className="trace-dashboard-stat-value">147</span>
                <span className="trace-dashboard-stat-subtext">24 in last 24h</span>
              </div>
            </div>

            {/* Card 4: System Status */}
            <div className="trace-dashboard-stat-card">
              <div className="trace-dashboard-stat-icon-wrap status-green" aria-hidden="true">
                <FiActivity />
              </div>
              <div className="trace-dashboard-stat-info">
                <span className="trace-dashboard-stat-label">System Status</span>
                <span className="trace-dashboard-stat-value">Operational</span>
                <span className="trace-dashboard-stat-subtext">All services healthy</span>
              </div>
            </div>

          </div>

          {/* Threat Activity Section */}
          <div className="trace-dashboard-chart-card" role="region" aria-label="Incident volume graph">
            <h3 className="trace-dashboard-section-title">
              <FiActivity aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
              Threat Activity
            </h3>
            <div className="trace-dashboard-chart-container">
              <svg 
                className="trace-dashboard-svg-chart" 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Linear gradient overlay for area chart */}
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary, #3b82f6)" />
                    <stop offset="100%" stopColor="var(--color-primary, #3b82f6)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                {[0, 10, 20, 30].map((val) => {
                  const yVal = svgHeight - paddingBottom - (val / maxValue) * chartHeight;
                  return (
                    <g key={val}>
                      <line 
                        x1={paddingLeft} 
                        y1={yVal} 
                        x2={svgWidth - paddingRight} 
                        y2={yVal} 
                        className="trace-chart-grid-line"
                      />
                      <text x={paddingLeft - 8} y={yVal + 3} className="trace-chart-axis-text-y">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Labels */}
                {points.map((p) => (
                  <text key={p.day} x={p.x} y={svgHeight - 10} className="trace-chart-axis-text">
                    {p.day}
                  </text>
                ))}

                {/* X and Y Axis Borders */}
                <line 
                  x1={paddingLeft} 
                  y1={svgHeight - paddingBottom} 
                  x2={svgWidth - paddingRight} 
                  y2={svgHeight - paddingBottom} 
                  className="trace-chart-axis-line" 
                />
                <line 
                  x1={paddingLeft} 
                  y1={paddingTop} 
                  x2={paddingLeft} 
                  y2={svgHeight - paddingBottom} 
                  className="trace-chart-axis-line" 
                />

                {/* Area Fill */}
                <path d={areaPath} className="trace-chart-series-area" />

                {/* Line Path */}
                <path d={linePath} className="trace-chart-series-line" fill="none" />

                {/* Interactive Node Circles */}
                {points.map((p) => (
                  <circle
                    key={p.day}
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    className="trace-chart-node"
                    title={`Day: ${p.day}, Incidents: ${p.value}`}
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* Bottom Grid: Recent Cases & Recent Activity */}
          <div className="trace-dashboard-main-grid">
            
            {/* Recent Cases */}
            <div className="trace-dashboard-main-card" role="region" aria-label="Recent incident cases table">
              <h3 className="trace-dashboard-section-title">Recent Cases</h3>
              <div className="trace-dashboard-table-container">
                <table className="trace-dashboard-table">
                  <thead>
                    <tr>
                      <th scope="col">Case ID</th>
                      <th scope="col">Title</th>
                      <th scope="col">Severity</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_CASES.map((item) => (
                      <tr 
                        key={item.caseId} 
                        className="trace-dashboard-table-row"
                        onClick={() => navigate(`/cases/${item.caseId}`)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/cases/${item.caseId}`);
                          }
                        }}
                        aria-label={`Open case details for ${item.caseId}: ${item.title}`}
                      >
                        <td className="trace-dashboard-case-id">{item.caseId}</td>
                        <td className="trace-dashboard-case-title" title={item.title}>
                          {item.title}
                        </td>
                        <td>
                          <StatusBadge status={item.severity} />
                        </td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity Ticker */}
            <div className="trace-dashboard-main-card" role="region" aria-label="Recent activity log stream">
              <h3 className="trace-dashboard-section-title">Recent Activity</h3>
              <div className="trace-dashboard-activity-list">
                {RECENT_ACTIVITIES.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="trace-dashboard-activity-item">
                      <span className="trace-dashboard-activity-time">{activity.time}</span>
                      <div className="trace-dashboard-activity-icon-wrap" aria-hidden="true">
                        <Icon />
                      </div>
                      <span className="trace-dashboard-activity-desc">
                        {activity.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
