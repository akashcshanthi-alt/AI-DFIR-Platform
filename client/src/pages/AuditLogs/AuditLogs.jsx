import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiShield, 
  FiSearch, 
  FiFilter, 
  FiFileText, 
  FiAlertCircle 
} from 'react-icons/fi';

import StatusBadge from '../../components/common/StatusBadge';

// Coherent initial mock audit log timeline data
const INITIAL_AUDIT_LOGS = [
  {
    eventId: 'AUD-2026-00842',
    timestamp: 'Jul 29, 2026 10:42:18',
    user: 'Analyst01',
    action: 'Generated Investigation Report',
    resource: 'TRC-2026-0042',
    status: 'Success',
  },
  {
    eventId: 'AUD-2026-00841',
    timestamp: 'Jul 29, 2026 10:38:10',
    user: 'Analyst01',
    action: 'Completed AI Analysis',
    resource: 'TRC-2026-0042',
    status: 'Success',
  },
  {
    eventId: 'AUD-2026-00840',
    timestamp: 'Jul 29, 2026 10:36:52',
    user: 'System',
    action: 'Correlated Threat Indicators',
    resource: 'TRC-2026-0042',
    status: 'Success',
  },
  {
    eventId: 'AUD-2026-00839',
    timestamp: 'Jul 29, 2026 09:42:31',
    user: 'Analyst01',
    action: 'Uploaded Evidence',
    resource: 'security.evtx',
    status: 'Success',
  },
  {
    eventId: 'AUD-2026-00838',
    timestamp: 'Jul 29, 2026 09:37:14',
    user: 'Analyst01',
    action: 'Uploaded Evidence',
    resource: 'memory.raw',
    status: 'Success',
  },
  {
    eventId: 'AUD-2026-00837',
    timestamp: 'Jul 29, 2026 09:31:08',
    user: 'Investigator02',
    action: 'Created Investigation',
    resource: 'TRC-2026-0042',
    status: 'Success',
  },
  {
    eventId: 'AUD-2026-00836',
    timestamp: 'Jul 28, 2026 16:22:44',
    user: 'Investigator02',
    action: 'Viewed Evidence',
    resource: 'TRC-2026-0041',
    status: 'Success',
  },
  {
    eventId: 'AUD-2026-00835',
    timestamp: 'Jul 28, 2026 15:58:21',
    user: 'Analyst01',
    action: 'Evidence Verification Warning',
    resource: 'network-capture.pcap',
    status: 'Warning',
  },
];

/**
 * AuditLogs Component
 * View-only enterprise security activity logs panel showing analyst
 * and automated system triangulation actions.
 */
export default function AuditLogs() {
  const navigate = useNavigate();

  // Auth Guard check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Local state managers
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedEvent, setExpandedEvent] = useState(null);

  if (!hasSession) return null;

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login', { replace: true });
  };

  // Toggle expand / collapse drawer for details view
  const toggleEventDetails = (eventId) => {
    setExpandedEvent((prev) => (prev === eventId ? null : eventId));
  };

  // Filter and search logic combined locally
  const filteredLogs = INITIAL_AUDIT_LOGS.filter((log) => {
    // 1. Search Query check
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = 
      !query ||
      log.user.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.resource.toLowerCase().includes(query);

    // 2. User dropdown filter
    const matchesUser = 
      userFilter === 'All' || 
      log.user.toLowerCase() === userFilter.toLowerCase();

    // 3. Status dropdown filter
    const matchesStatus = 
      statusFilter === 'All' || 
      log.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesUser && matchesStatus;
  });

  return (
    <div className="trace-audit-layout">
      {/* Page inline CSS styling block */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-audit-layout {
            display: flex;
            min-height: 100vh;
            background-color: var(--bg-main, #060913);
            color: var(--text-primary, #f8fafc);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            width: 100%;
            box-sizing: border-box;
          }

          .trace-audit-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            height: 100vh;
            overflow: hidden;
            box-sizing: border-box;
          }

          .trace-audit-content {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-sizing: border-box;
          }

          /* Header style template */
          .trace-audit-page-header {
            display: flex;
            flex-direction: column;
          }

          .trace-audit-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            line-height: 1.2;
          }

          .trace-audit-subtitle {
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 4px 0 0 0;
            line-height: 1.45;
          }

          /* Summary indicators grid */
          .trace-audit-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            width: 100%;
            box-sizing: border-box;
          }

          .trace-audit-summary-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-sizing: border-box;
            box-shadow: var(--shadow-sm);
            user-select: none;
          }

          .trace-audit-summary-label {
            font-size: 0.725rem;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--text-muted, #64748b);
            letter-spacing: 0.05em;
          }

          .trace-audit-summary-val {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            line-height: 1.1;
          }

          .trace-audit-summary-val.warning {
            color: var(--status-high, #f97316);
          }

          /* Filters toolbar row */
          .trace-audit-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 16px;
            box-sizing: border-box;
          }

          .trace-audit-search-wrap {
            position: relative;
            flex: 1;
            min-width: 260px;
            display: flex;
            align-items: center;
          }

          .trace-audit-search-icon {
            position: absolute;
            left: 12px;
            color: var(--text-muted, #64748b);
            display: flex;
            align-items: center;
            font-size: 0.95rem;
          }

          .trace-audit-search-input {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 8px 12px 8px 36px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            height: 38px;
            box-sizing: border-box;
            transition: border-color var(--transition-speed, 200ms) ease;
          }

          .trace-audit-search-input:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.1));
          }

          .trace-audit-filters {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
          }

          .trace-audit-filter-field {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.8125rem;
          }

          .trace-audit-filter-label {
            color: var(--text-muted, #64748b);
            font-weight: 600;
            white-space: nowrap;
          }

          .trace-audit-select {
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            padding: 6px 28px 6px 12px;
            height: 38px;
            outline: none;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
            background-repeat: no-repeat;
            background-position: right 10px center;
            background-size: 12px;
            box-sizing: border-box;
            min-width: 140px;
          }

          .trace-audit-select:focus {
            border-color: var(--color-primary, #3b82f6);
          }

          /* Log directory data cards */
          .trace-audit-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 20px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-sizing: border-box;
            min-height: 240px;
          }

          .trace-audit-table-container {
            width: 100%;
            overflow-x: auto;
          }

          .trace-audit-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            min-width: 780px;
          }

          .trace-audit-table th {
            padding: 10px 12px;
            font-size: 0.725rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted, #64748b);
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            user-select: none;
          }

          .trace-audit-table td {
            padding: 12px;
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.02);
            vertical-align: middle;
          }

          .trace-audit-row {
            transition: background-color var(--transition-speed, 200ms) ease;
          }

          .trace-audit-row:hover {
            background-color: rgba(255, 255, 255, 0.015);
          }

          .trace-audit-row.expanded {
            background-color: rgba(255, 255, 255, 0.02);
          }

          .trace-audit-time-cell {
            font-family: 'SFMono-Regular', Consolas, monospace;
            font-size: 0.8125rem;
            color: var(--text-muted, #64748b);
            white-space: nowrap;
          }

          .trace-audit-user-cell {
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
          }

          .trace-audit-resource-cell {
            font-family: 'SFMono-Regular', Consolas, monospace;
            font-size: 0.8125rem;
            color: var(--color-secondary, #06b6d4);
          }

          .trace-audit-row-btn {
            background: transparent;
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            color: var(--color-primary, #3b82f6);
            padding: 4px 10px;
            font-size: 0.725rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
            height: 28px;
            box-sizing: border-box;
            user-select: none;
          }

          .trace-audit-row-btn:hover {
            border-color: var(--color-primary, #3b82f6);
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.1));
            color: var(--text-primary, #f8fafc);
          }

          .trace-audit-row-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 1px;
          }

          /* Expanded Row Drawer styling */
          .trace-audit-details-row td {
            padding: 14px 20px;
            background-color: rgba(0, 0, 0, 0.14);
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-audit-details-panel {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: 0.8125rem;
          }

          .trace-audit-details-item {
            display: flex;
            gap: 8px;
            line-height: 1.4;
          }

          .trace-audit-details-label {
            font-weight: 600;
            color: var(--text-muted, #64748b);
            width: 110px;
            flex-shrink: 0;
          }

          .trace-audit-details-val {
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-audit-details-val.monospace {
            font-family: 'SFMono-Regular', Consolas, monospace;
            color: var(--color-secondary, #06b6d4);
            font-size: 0.75rem;
          }

          .trace-audit-details-tag {
            background-color: rgba(6, 182, 212, 0.08);
            border: 1px solid rgba(6, 182, 212, 0.15);
            color: var(--color-secondary, #06b6d4);
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 2px 6px;
            border-radius: 3px;
            width: fit-content;
            margin-top: 4px;
            user-select: none;
          }

          /* Polished empty state card */
          .trace-audit-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 48px 24px;
            text-align: center;
            gap: 12px;
            border: 1.5px dashed var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            box-sizing: border-box;
            user-select: none;
          }

          .trace-audit-empty-icon {
            font-size: 2.5rem;
            color: var(--text-muted, #64748b);
            opacity: 0.5;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-audit-empty-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0;
          }

          .trace-audit-empty-desc {
            font-size: 0.8125rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 0;
            max-width: 320px;
            line-height: 1.45;
          }

          /* Responsive Breakpoints */
          @media (max-width: 992px) {
            .trace-audit-summary-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 768px) {
            .trace-audit-summary-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            .trace-audit-toolbar {
              flex-direction: column;
              align-items: stretch;
              gap: 12px;
            }
            .trace-audit-search-wrap {
              min-width: 100%;
            }
            .trace-audit-filters {
              flex-direction: column;
              align-items: stretch;
              gap: 12px;
            }
            .trace-audit-filter-field {
              flex-direction: column;
              align-items: flex-start;
              gap: 6px;
            }
            .trace-audit-select {
              width: 100%;
            }
            .trace-audit-content {
              padding: 16px;
              gap: 16px;
            }
          }
        `
      }} />

      {/* Main Workspace Frame */}
      <div className="trace-audit-main">

        {/* Scrollable logs contents */}
        <main className="trace-audit-content">
          
          {/* Header Title section */}
          <div className="trace-audit-page-header" role="region" aria-label="Logs profile summary">
            <h2 className="trace-audit-title">Audit Logs</h2>
            <p className="trace-audit-subtitle">
              Review security and investigation activity across TRACE AI DFIR.
            </p>
          </div>

          {/* Metrics summary grid */}
          <section className="trace-audit-summary-grid" aria-label="Activity statistics counters">
            <div className="trace-audit-summary-card">
              <span className="trace-audit-summary-label">Total Events</span>
              <span className="trace-audit-summary-val">8</span>
            </div>
            <div className="trace-audit-summary-card">
              <span className="trace-audit-summary-label">Today</span>
              <span className="trace-audit-summary-val">6</span>
            </div>
            <div className="trace-audit-summary-card">
              <span className="trace-audit-summary-label">Successful</span>
              <span className="trace-audit-summary-val">7</span>
            </div>
            <div className="trace-audit-summary-card">
              <span className="trace-audit-summary-label">Attention Required</span>
              <span className="trace-audit-summary-val warning">1</span>
            </div>
          </section>

          {/* Filtering Toolbar */}
          <div className="trace-audit-toolbar">
            
            {/* Search Input field */}
            <div className="trace-audit-search-wrap">
              <span className="trace-audit-search-icon" aria-hidden="true">
                <FiSearch />
              </span>
              <input
                id="trace-audit-search-field"
                type="text"
                className="trace-audit-search-input"
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search audit logs by user, action, or resource"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="trace-audit-filters">
              
              {/* Filter 1: User */}
              <div className="trace-audit-filter-field">
                <label htmlFor="trace-audit-user-filter" className="trace-audit-filter-label">
                  User:
                </label>
                <select
                  id="trace-audit-user-filter"
                  className="trace-audit-select"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                >
                  <option value="All">All Users</option>
                  <option value="Analyst01">Analyst01</option>
                  <option value="Investigator02">Investigator02</option>
                  <option value="System">System</option>
                </select>
              </div>

              {/* Filter 2: Status */}
              <div className="trace-audit-filter-field">
                <label htmlFor="trace-audit-status-filter" className="trace-audit-filter-label">
                  Status:
                </label>
                <select
                  id="trace-audit-status-filter"
                  className="trace-audit-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Success">Success</option>
                  <option value="Warning">Warning</option>
                </select>
              </div>

            </div>

          </div>

          {/* Logs Data grid card */}
          <section className="trace-audit-card" aria-label="Activity logs trail">
            {filteredLogs.length > 0 ? (
              <div className="trace-audit-table-container">
                <table className="trace-audit-table">
                  <thead>
                    <tr>
                      <th scope="col">Timestamp</th>
                      <th scope="col">User</th>
                      <th scope="col">Action</th>
                      <th scope="col">Resource</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const isExpanded = expandedEvent === log.eventId;
                      return (
                        <React.Fragment key={log.eventId}>
                          {/* Row Summary Data */}
                          <tr className={`trace-audit-row ${isExpanded ? 'expanded' : ''}`}>
                            <td className="trace-audit-time-cell">{log.timestamp}</td>
                            <td className="trace-audit-user-cell">{log.user}</td>
                            <td>{log.action}</td>
                            <td className="trace-audit-resource-cell">{log.resource}</td>
                            <td>
                              <StatusBadge status={log.status} />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="trace-audit-row-btn"
                                onClick={() => toggleEventDetails(log.eventId)}
                                aria-expanded={isExpanded}
                                title={`Toggle details drawer for event ${log.eventId}`}
                              >
                                {isExpanded ? 'Hide' : 'Details'}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Details Drawer */}
                          {isExpanded && (
                            <tr className="trace-audit-details-row">
                              <td colSpan={6}>
                                <div className="trace-audit-details-panel">
                                  <div className="trace-audit-details-item">
                                    <span className="trace-audit-details-label">Event ID:</span>
                                    <span className="trace-audit-details-val monospace">{log.eventId}</span>
                                  </div>
                                  <div className="trace-audit-details-item">
                                    <span className="trace-audit-details-label">Timestamp:</span>
                                    <span className="trace-audit-details-val">{log.timestamp}</span>
                                  </div>
                                  <div className="trace-audit-details-item">
                                    <span className="trace-audit-details-label">User:</span>
                                    <span className="trace-audit-details-val">{log.user}</span>
                                  </div>
                                  <div className="trace-audit-details-item">
                                    <span className="trace-audit-details-label">Action Performed:</span>
                                    <span className="trace-audit-details-val">{log.action}</span>
                                  </div>
                                  <div className="trace-audit-details-item">
                                    <span className="trace-audit-details-label">Associated Resource:</span>
                                    <span className="trace-audit-details-val monospace">{log.resource}</span>
                                  </div>
                                  <div className="trace-audit-details-item">
                                    <span className="trace-audit-details-label">Completion Status:</span>
                                    <span className="trace-audit-details-val">{log.status}</span>
                                  </div>
                                  <span className="trace-audit-details-tag">
                                    Prototype audit event
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Empty state block if filters yield no logs */
              <div className="trace-audit-empty-state" role="region" aria-label="No audit logs match current search">
                <div className="trace-audit-empty-icon" aria-hidden="true">
                  <FiShield />
                </div>
                <p className="trace-audit-empty-title">No matching logs found</p>
                <p className="trace-audit-empty-desc">
                  No audit events match your current search terms or filter constraints. Try expanding criteria parameters.
                </p>
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}
