import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiFolder, FiFolderMinus } from 'react-icons/fi';

import StatusBadge from '../../components/common/StatusBadge';

// Hardcoded mock cases representing realistic digital forensics data
const MOCK_CASES = [
  {
    caseId: 'TRC-2026-0042',
    title: 'Suspicious Account Activity',
    incidentType: 'Account Compromise',
    severity: 'High',
    investigator: 'Analyst01',
    status: 'Investigating',
    createdDate: 'Jul 29, 2026',
  },
  {
    caseId: 'TRC-2026-0041',
    title: 'Unauthorized PowerShell Execution',
    incidentType: 'Malware Activity',
    severity: 'Critical',
    investigator: 'Investigator02',
    status: 'Open',
    createdDate: 'Jul 28, 2026',
  },
  {
    caseId: 'TRC-2026-0040',
    title: 'External Network Connection',
    incidentType: 'Network Intrusion',
    severity: 'Medium',
    investigator: 'Analyst01',
    status: 'Investigating',
    createdDate: 'Jul 27, 2026',
  },
  {
    caseId: 'TRC-2026-0039',
    title: 'Authentication Anomaly',
    incidentType: 'Unauthorized Access',
    severity: 'Low',
    investigator: 'Investigator02',
    status: 'Closed',
    createdDate: 'Jul 26, 2026',
  },
  {
    caseId: 'TRC-2026-0038',
    title: 'Data Exfiltration Attempt',
    incidentType: 'Data Leakage',
    severity: 'High',
    investigator: 'Analyst01',
    status: 'Investigating',
    createdDate: 'Jul 25, 2026',
  },
  {
    caseId: 'TRC-2026-0037',
    title: 'Phishing Email Campaign',
    incidentType: 'Social Engineering',
    severity: 'Low',
    investigator: 'Investigator02',
    status: 'Closed',
    createdDate: 'Jul 24, 2026',
  },
];

/**
 * Cases Component
 * Renders the central incidents case list repository for security analysts.
 * Integrates layout grids with active stats trackers, multi-field local search,
 * status filters, and robust responsive tables.
 */
export default function Cases() {
  const navigate = useNavigate();

  // Auth Guard validation
  const hasSession = sessionStorage.getItem('arclight-dev-session') === 'active';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Local state controls for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  if (!hasSession) return null;

  const handleLogout = () => {
    sessionStorage.removeItem('arclight-dev-session');
    navigate('/login', { replace: true });
  };

  // Pre-calculate summary statistics dynamically from the base mock data array
  const totalCases = MOCK_CASES.length;
  const activeCount = MOCK_CASES.filter((c) => c.status.toLowerCase() !== 'closed').length;
  const criticalCount = MOCK_CASES.filter((c) => c.severity.toLowerCase() === 'critical').length;
  const closedCount = MOCK_CASES.filter((c) => c.status.toLowerCase() === 'closed').length;

  // Local filtering engine
  const filteredCases = MOCK_CASES.filter((item) => {
    const searchVal = searchQuery.trim().toLowerCase();
    
    // Check if query matches Case ID, Title, Incident Type, or Investigator
    const matchesSearch = !searchVal || 
      item.caseId.toLowerCase().includes(searchVal) ||
      item.title.toLowerCase().includes(searchVal) ||
      item.incidentType.toLowerCase().includes(searchVal) ||
      item.investigator.toLowerCase().includes(searchVal);

    // Check if matches selected severity option
    const matchesSeverity = severityFilter === 'All' || 
      item.severity.toLowerCase() === severityFilter.toLowerCase();

    // Check if matches selected status option
    const matchesStatus = statusFilter === 'All' || 
      item.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="trace-cases-layout">
      {/* Scope CSS details inside this component */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-cases-layout {
            display: flex;
            min-height: 100vh;
            background-color: var(--bg-main, #060913);
            color: var(--text-primary, #f8fafc);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            width: 100%;
            box-sizing: border-box;
          }

          .trace-cases-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            height: 100vh;
            overflow: hidden;
            box-sizing: border-box;
          }

          .trace-cases-content {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-sizing: border-box;
          }

          /* Header Section */
          .trace-cases-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            box-sizing: border-box;
          }

          .trace-cases-title-wrap {
            display: flex;
            flex-direction: column;
          }

          .trace-cases-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            line-height: 1.2;
          }

          .trace-cases-subtitle {
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 4px 0 0 0;
            line-height: 1.4;
          }

          .trace-cases-new-btn {
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
            height: 38px;
            outline: none;
            box-sizing: border-box;
            user-select: none;
          }

          .trace-cases-new-btn:hover {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-cases-new-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
          }

          /* Summary Metric Cards */
          .trace-cases-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            box-sizing: border-box;
            user-select: none;
          }

          .trace-cases-summary-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-sizing: border-box;
          }

          .trace-cases-summary-label {
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--text-muted, #64748b);
          }

          .trace-cases-summary-value {
            font-size: 1.35rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            line-height: 1.2;
          }

          /* Filtering Toolbar */
          .trace-cases-filter-bar {
            display: flex;
            align-items: center;
            gap: 16px;
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 14px 16px;
            box-shadow: var(--shadow-sm);
            flex-wrap: wrap;
            box-sizing: border-box;
          }

          .trace-cases-search-container {
            position: relative;
            display: flex;
            align-items: center;
            flex: 1;
            min-width: 220px;
          }

          .trace-cases-search-icon {
            position: absolute;
            left: 12px;
            color: var(--text-muted, #64748b);
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-cases-search-input {
            width: 100%;
            background-color: var(--bg-main, #060913);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 8px 12px 8px 36px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            transition: border-color var(--transition-speed, 200ms) ease;
            height: 38px;
            box-sizing: border-box;
          }

          .trace-cases-search-input:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.1));
          }

          .trace-cases-filter-group {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .trace-cases-filter-label {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--text-muted, #64748b);
            white-space: nowrap;
          }

          .trace-cases-filter-select {
            background-color: var(--bg-main, #060913);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            padding: 8px 24px 8px 12px;
            height: 38px;
            outline: none;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
            background-repeat: no-repeat;
            background-position: right 8px center;
            background-size: 14px;
            min-width: 130px;
            box-sizing: border-box;
          }

          .trace-cases-filter-select:focus {
            border-color: var(--color-primary, #3b82f6);
          }

          /* Main Cases Data Table Card */
          .trace-cases-table-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 6px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
          }

          .trace-cases-table-wrapper {
            width: 100%;
            overflow-x: auto;
          }

          .trace-cases-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            min-width: 860px;
          }

          .trace-cases-table th {
            padding: 12px 14px;
            font-size: 0.725rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted, #64748b);
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            user-select: none;
          }

          .trace-cases-table td {
            padding: 12px 14px;
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.02);
            vertical-align: middle;
          }

          .trace-cases-row-clickable {
            cursor: pointer;
            transition: background-color var(--transition-speed, 200ms) ease;
            outline: none;
          }

          .trace-cases-row-clickable:hover {
            background-color: rgba(255, 255, 255, 0.015);
          }

          .trace-cases-row-clickable:focus-visible {
            background-color: rgba(255, 255, 255, 0.03);
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: -2px;
          }

          .trace-cases-cell-id {
            font-family: 'SFMono-Regular', Consolas, monospace;
            font-weight: 600;
            color: var(--color-secondary, #06b6d4);
            font-size: 0.8125rem;
          }

          .trace-cases-cell-title {
            font-weight: 500;
            color: var(--text-primary, #f8fafc);
            max-width: 220px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .trace-cases-action-btn {
            background: transparent;
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            color: var(--color-primary, #3b82f6);
            padding: 5px 12px;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            outline: none;
            box-sizing: border-box;
          }

          .trace-cases-action-btn:hover {
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.1));
            border-color: var(--color-primary, #3b82f6);
            color: var(--text-primary, #f8fafc);
          }

          .trace-cases-action-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 1px;
          }

          /* Empty State Dashboard Card */
          .trace-cases-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 64px 32px;
            text-align: center;
            gap: 16px;
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            box-sizing: border-box;
            user-select: none;
          }

          .trace-cases-empty-icon {
            font-size: 2.8rem;
            color: var(--text-muted, #64748b);
            opacity: 0.6;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-cases-empty-text {
            font-size: 0.95rem;
            font-weight: 500;
            color: var(--text-secondary, #cbd5e1);
            margin: 0;
            line-height: 1.4;
          }

          /* Responsive Grid Breakpoints */
          @media (max-width: 1024px) {
            .trace-cases-summary-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 768px) {
            .trace-cases-filter-bar {
              flex-direction: column;
              align-items: stretch;
              gap: 12px;
            }
            .trace-cases-filter-group {
              justify-content: space-between;
            }
            .trace-cases-filter-select {
              flex: 1;
            }
            .trace-cases-content {
              padding: 16px;
              gap: 16px;
            }
          }

          @media (max-width: 576px) {
            .trace-cases-summary-grid {
              grid-template-columns: 1fr;
            }
            .trace-cases-header-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }
            .trace-cases-new-btn {
              width: 100%;
              justify-content: center;
            }
          }
        `
      }} />

      {/* Content wrapper */}
      <div className="trace-cases-main">

        {/* Scrollable Cases view areas */}
        <main className="trace-cases-content">
          
          {/* Header Panel */}
          <div className="trace-cases-header-row">
            <div className="trace-cases-title-wrap">
              <h2 className="trace-cases-title">Cases</h2>
              <p className="trace-cases-subtitle">
                Manage and track digital forensic investigations.
              </p>
            </div>
            <button
              type="button"
              className="trace-cases-new-btn"
              onClick={() => navigate('/cases/new')}
              title="Create a new case workspace"
            >
              <FiPlus aria-hidden="true" />
              <span>New Case</span>
            </button>
          </div>

          {/* Cases Summary Counters Panel */}
          <div className="trace-cases-summary-grid" role="region" aria-label="Incident summary telemetry">
            <div className="trace-cases-summary-card">
              <span className="trace-cases-summary-label">Total Cases</span>
              <span className="trace-cases-summary-value">{totalCases}</span>
            </div>
            <div className="trace-cases-summary-card">
              <span className="trace-cases-summary-label">Active</span>
              <span className="trace-cases-summary-value">{activeCount}</span>
            </div>
            <div className="trace-cases-summary-card">
              <span className="trace-cases-summary-label">Critical</span>
              <span className="trace-cases-summary-value">{criticalCount}</span>
            </div>
            <div className="trace-cases-summary-card">
              <span className="trace-cases-summary-label">Closed</span>
              <span className="trace-cases-summary-value">{closedCount}</span>
            </div>
          </div>

          {/* Local Search and Filtering Controls Bar */}
          <div className="trace-cases-filter-bar" role="search" aria-label="Search and filter cases">
            {/* Local text search */}
            <div className="trace-cases-search-container">
              <span className="trace-cases-search-icon" aria-hidden="true">
                <FiSearch />
              </span>
              <input
                type="text"
                className="trace-cases-search-input"
                placeholder="Search cases..."
                aria-label="Search cases text field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Severity Filter Dropdown */}
            <div className="trace-cases-filter-group">
              <label htmlFor="trace-severity-select" className="trace-cases-filter-label">
                Severity
              </label>
              <select
                id="trace-severity-select"
                className="trace-cases-filter-select"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status Filter Dropdown */}
            <div className="trace-cases-filter-group">
              <label htmlFor="trace-status-select" className="trace-cases-filter-label">
                Status
              </label>
              <select
                id="trace-status-select"
                className="trace-cases-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Investigating">Investigating</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Cases Main Content (Table OR Empty State) */}
          {filteredCases.length > 0 ? (
            <div className="trace-cases-table-card">
              <div className="trace-cases-table-wrapper">
                <table className="trace-cases-table">
                  <thead>
                    <tr>
                      <th scope="col">Case ID</th>
                      <th scope="col">Title</th>
                      <th scope="col">Incident Type</th>
                      <th scope="col">Severity</th>
                      <th scope="col">Investigator</th>
                      <th scope="col">Status</th>
                      <th scope="col">Created Date</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((item) => (
                      <tr
                        key={item.caseId}
                        className="trace-cases-row-clickable"
                        onClick={() => navigate(`/cases/${item.caseId}`)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/cases/${item.caseId}`);
                          }
                        }}
                        aria-label={`Case ${item.caseId}: ${item.title}`}
                      >
                        <td className="trace-cases-cell-id">{item.caseId}</td>
                        <td className="trace-cases-cell-title" title={item.title}>
                          {item.title}
                        </td>
                        <td>{item.incidentType}</td>
                        <td>
                          <StatusBadge status={item.severity} />
                        </td>
                        <td>{item.investigator}</td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                        <td>{item.createdDate}</td>
                        <td>
                          <button
                            type="button"
                            className="trace-cases-action-btn"
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid double navigation triggers
                              navigate(`/cases/${item.caseId}`);
                            }}
                            title={`Open case details for ${item.caseId}`}
                          >
                            View Case
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Empty State block if filteredCases is empty */
            <div className="trace-cases-empty-state" role="region" aria-label="No cases matches">
              <div className="trace-cases-empty-icon" aria-hidden="true">
                <FiFolderMinus />
              </div>
              <p className="trace-cases-empty-text">
                {totalCases === 0 
                  ? 'All clear — no active investigations.' 
                  : 'No cases match your current search or filters.'}
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
