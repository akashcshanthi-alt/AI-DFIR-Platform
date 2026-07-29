import React, { useState } from 'react';
import { FiFileText, FiPrinter } from 'react-icons/fi';
import StatusBadge from '../../components/common/StatusBadge';

// Coherent mock evidence items
const REPORT_EVIDENCE = [
  { name: 'security.evtx', type: 'Windows Event Log', status: 'Verified' },
  { name: 'memory.raw', type: 'Memory Dump', status: 'Verified' },
  { name: 'network.pcap', type: 'Network Capture', status: 'Verified' },
  { name: 'auth-log.txt', type: 'Document', status: 'Verified' }
];

// Coherent mock suspicious findings list
const REPORT_INDICATORS = [
  { name: 'Authentication Anomaly', severity: 'High', time: '10:31:14', file: 'security.evtx' },
  { name: 'Suspicious Process Execution', severity: 'Critical', time: '10:34:27', file: 'memory.raw' },
  { name: 'External Network Connection', severity: 'Medium', time: '10:36:52', file: 'network.pcap' }
];

// Coherent mock timeline sequence
const REPORT_TIMELINE = [
  { time: '10:29:48', text: 'Repeated Login Failures' },
  { time: '10:31:14', text: 'Authentication Anomaly' },
  { time: '10:34:27', text: 'Suspicious Process Execution' },
  { time: '10:36:52', text: 'External Network Connection' },
  { time: '10:38:10', text: 'Threat Correlation Triggered' }
];

/**
 * ReportTab Component
 * Renders the consolidated incident summary, forensic tables, AI findings,
 * and print layout controls. Enables operators to append final conclusions
 * and execute native browser print/PDF routines.
 *
 * @param {Object} props
 * @param {string} [props.caseId] - Parent case unique identifier
 */
export default function ReportTab({ caseId = 'TRC-2026-0042' }) {
  // Local state managers
  const [conclusion, setConclusion] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Generate current timestamp on-demand
  const reportGeneratedTime = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const handleSaveConclusion = (e) => {
    e.preventDefault();
    if (!conclusion.trim()) return;

    // Simulate saving conclusion locally
    setSaveFeedback(true);
    setTimeout(() => {
      setSaveFeedback(false);
    }, 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="trace-report-tab">
      {/* Component styling block including screen & print modes */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-report-tab {
            display: flex;
            gap: 24px;
            width: 100%;
            box-sizing: border-box;
          }

          /* Table of Contents left panel */
          .trace-report-toc {
            width: 180px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex-shrink: 0;
            position: sticky;
            top: 20px;
            height: fit-content;
            user-select: none;
          }

          .trace-report-toc-title {
            font-size: 0.725rem;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-muted, #64748b);
            letter-spacing: 0.05em;
            margin-bottom: 6px;
          }

          .trace-report-toc-link {
            color: var(--text-secondary, #cbd5e1);
            text-decoration: none;
            font-size: 0.8125rem;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: var(--radius-sm, 4px);
            transition: all var(--transition-speed, 200ms) ease;
            display: block;
          }

          .trace-report-toc-link:hover {
            background-color: var(--bg-surface, #0e1626);
            color: var(--color-primary, #3b82f6);
          }

          .trace-report-toc-link:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
          }

          /* Document workspace wrapper */
          .trace-report-document-wrap {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .trace-report-document {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 32px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 28px;
            box-sizing: border-box;
          }

          /* Action toolbar */
          .trace-report-actions-row {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            user-select: none;
          }

          .trace-report-print-btn {
            background-color: var(--color-primary, #3b82f6);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-sm, 4px);
            padding: 10px 20px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color var(--transition-speed, 200ms);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            outline: none;
            user-select: none;
            height: 38px;
            box-sizing: border-box;
          }

          .trace-report-print-btn:hover {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-report-print-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
          }

          /* Document Title Header */
          .trace-report-doc-header {
            border-bottom: 2px solid var(--border-color, rgba(255, 255, 255, 0.08));
            padding-bottom: 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .trace-report-brand {
            font-size: 0.8125rem;
            font-weight: 700;
            color: var(--color-secondary, #06b6d4);
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .trace-report-doc-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            line-height: 1.2;
          }

          .trace-report-doc-subtitle {
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 0;
          }

          .trace-report-meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px 24px;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 12px 16px;
            margin-top: 8px;
            font-size: 0.8125rem;
            box-sizing: border-box;
          }

          .trace-report-meta-label {
            color: var(--text-muted, #64748b);
            font-weight: 600;
          }

          .trace-report-meta-val {
            color: var(--text-primary, #f8fafc);
            font-weight: 500;
          }

          /* Section layout blocks */
          .trace-report-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
            scroll-margin-top: 24px;
            box-sizing: border-box;
          }

          .trace-report-section-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .trace-report-text {
            font-size: 0.875rem;
            line-height: 1.55;
            color: var(--text-secondary, #cbd5e1);
            margin: 0;
          }

          /* Info field grids */
          .trace-report-info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px 24px;
            box-sizing: border-box;
          }

          .trace-report-info-item {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.03);
            padding-bottom: 6px;
            font-size: 0.875rem;
          }

          .trace-report-info-label {
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-report-info-val {
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
          }

          .trace-report-info-val.monospace {
            font-family: 'SFMono-Regular', Consolas, monospace;
            color: var(--color-secondary, #06b6d4);
            font-size: 0.8125rem;
          }

          /* Evidence list table */
          .trace-report-table-container {
            width: 100%;
            overflow-x: auto;
          }

          .trace-report-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.875rem;
          }

          .trace-report-table th {
            padding: 8px 12px;
            color: var(--text-muted, #64748b);
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            font-size: 0.725rem;
            font-weight: 600;
            text-transform: uppercase;
            user-select: none;
          }

          .trace-report-table td {
            padding: 10px 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.02);
            color: var(--text-secondary, #cbd5e1);
          }

          /* Indicators row card blocks */
          .trace-report-indicators-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .trace-report-indicator-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 10px 14px;
            font-size: 0.875rem;
            gap: 12px;
            box-sizing: border-box;
          }

          .trace-report-indicator-main {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .trace-report-indicator-title {
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
          }

          .trace-report-indicator-meta {
            font-size: 0.75rem;
            color: var(--text-muted, #64748b);
            font-family: monospace;
          }

          /* AI findings label badge */
          .trace-report-ai-badge {
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
            user-select: none;
          }

          /* Risk values breakdown */
          .trace-report-risk-item {
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.03);
            padding-bottom: 6px;
          }

          /* Timeline rows */
          .trace-report-timeline-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .trace-report-timeline-row {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            font-size: 0.875rem;
          }

          .trace-report-timeline-time {
            font-family: 'SFMono-Regular', Consolas, monospace;
            font-weight: 700;
            color: var(--color-secondary, #06b6d4);
            width: 70px;
            flex-shrink: 0;
            user-select: none;
          }

          .trace-report-timeline-text {
            color: var(--text-secondary, #cbd5e1);
          }

          /* Analyst Conclusion Form styling */
          .trace-conclusion-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-sizing: border-box;
          }

          .trace-conclusion-textarea {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 12px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            transition: border-color var(--transition-speed, 200ms) ease;
            height: 110px;
            box-sizing: border-box;
            resize: vertical;
            line-height: 1.45;
            font-family: inherit;
          }

          .trace-conclusion-textarea:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.1));
          }

          .trace-conclusion-action-row {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            user-select: none;
          }

          .trace-conclusion-save-btn {
            background-color: var(--bg-surface-elevated, #162035);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            color: var(--text-primary, #f8fafc);
            border-radius: var(--radius-sm, 4px);
            padding: 8px 16px;
            font-size: 0.8125rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
            height: 34px;
            box-sizing: border-box;
          }

          .trace-conclusion-save-btn:hover {
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.1));
            border-color: var(--color-primary, #3b82f6);
          }

          .trace-conclusion-save-btn:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
          }

          .trace-conclusion-feedback {
            font-size: 0.75rem;
            color: var(--status-low, #22c55e);
            font-weight: 600;
            animation: trace-report-fadeIn 300ms ease;
          }

          @keyframes trace-report-fadeIn {
            from { opacity: 0; transform: translateX(-4px); }
            to { opacity: 1; transform: translateX(0); }
          }

          /* PRINT MEDIA STYLE SHEET OVERRIDES */
          @media print {
            body {
              background-color: #ffffff !important;
              color: #1e293b !important;
            }

            .trace-report-tab {
              display: block !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .trace-report-toc,
            .trace-report-actions-row,
            .trace-conclusion-action-row {
              display: none !important; /* Hide navigation and action button rows during print */
            }

            .trace-report-document {
              background-color: #ffffff !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              color: #1e293b !important;
              display: flex !important;
              flex-direction: column !important;
              gap: 24px !important;
            }

            .trace-report-meta-grid {
              background-color: #f8fafc !important;
              border: 1px solid #e2e8f0 !important;
              color: #1e293b !important;
            }

            .trace-report-brand {
              color: #0284c7 !important;
            }

            .trace-report-doc-title {
              color: #0f172a !important;
            }

            .trace-report-doc-subtitle,
            .trace-report-meta-label {
              color: #475569 !important;
            }

            .trace-report-meta-val {
              color: #0f172a !important;
            }

            .trace-report-section-title {
              color: #0f172a !important;
              border-bottom: 1.5px solid #cbd5e1 !important;
              margin-top: 15px !important;
              page-break-after: avoid;
            }

            .trace-report-text,
            .trace-report-info-label,
            .trace-report-info-val,
            .trace-report-timeline-text {
              color: #334155 !important;
            }

            .trace-report-info-val.monospace,
            .trace-report-timeline-time {
              color: #0284c7 !important;
            }

            .trace-report-table th {
              color: #475569 !important;
              border-bottom: 1.5px solid #cbd5e1 !important;
            }

            .trace-report-table td {
              color: #334155 !important;
              border-bottom: 1px solid #e2e8f0 !important;
            }

            .trace-report-indicator-row {
              background-color: #f8fafc !important;
              border: 1px solid #e2e8f0 !important;
              page-break-inside: avoid;
            }

            .trace-report-indicator-title {
              color: #0f172a !important;
            }

            .trace-report-indicator-meta {
              color: #64748b !important;
            }

            .trace-report-ai-badge {
              background-color: #e0f2fe !important;
              border: 1px solid #bae6fd !important;
              color: #0369a1 !important;
            }

            .trace-conclusion-textarea {
              background-color: #ffffff !important;
              border: 1px solid #cbd5e1 !important;
              color: #0f172a !important;
              resize: none !important;
              height: auto !important;
              min-height: 100px !important;
            }

            .trace-report-section {
              page-break-inside: avoid;
            }
          }

          /* Spacing overrides for tablet/mobile viewports */
          @media (max-width: 992px) {
            .trace-report-tab {
              flex-direction: column;
            }
            .trace-report-toc {
              display: none; /* Hide TOC navigation link grid on mobile/tablets */
            }
          }

          @media (max-width: 768px) {
            .trace-report-document {
              padding: 20px 16px;
              gap: 20px;
            }
            .trace-report-meta-grid {
              grid-template-columns: 1fr;
              gap: 8px;
            }
            .trace-report-info-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
        `
      }} />

      {/* Left Column: Table of Contents navigation link panel */}
      <nav className="trace-report-toc" aria-label="Report table of contents">
        <span className="trace-report-toc-title">TOC Sections</span>
        <a href="#case-info" className="trace-report-toc-link">Case Information</a>
        <a href="#incident-summary" className="trace-report-toc-link">Incident Summary</a>
        <a href="#evidence-summary" className="trace-report-toc-link">Evidence Summary</a>
        <a href="#suspicious-indicators" className="trace-report-toc-link">Indicators</a>
        <a href="#ai-findings" className="trace-report-toc-link">AI Findings</a>
        <a href="#risk-assessment" className="trace-report-toc-link">Risk Assessment</a>
        <a href="#attack-timeline" className="trace-report-toc-link">Attack Timeline</a>
        <a href="#analyst-conclusion" className="trace-report-toc-link">Analyst Conclusion</a>
      </nav>

      {/* Right Column: Physical document layout */}
      <div className="trace-report-document-wrap">
        
        {/* Printable/Save as PDF document card */}
        <article className="trace-report-document" id="trace-report-printable-area">
          
          {/* Document Title Header */}
          <header className="trace-report-doc-header">
            <span className="trace-report-brand">TRACE AI DFIR</span>
            <h3 className="trace-report-doc-title">Digital Forensics &amp; Incident Response</h3>
            <span className="trace-report-doc-subtitle">Investigation Findings Report</span>

            <div className="trace-report-meta-grid">
              <div>
                <span className="trace-report-meta-label">Case ID:</span>
                <span className="trace-report-meta-val" style={{ marginLeft: '4px' }}>{caseId}</span>
              </div>
              <div>
                <span className="trace-report-meta-label">Report Status:</span>
                <span className="trace-report-meta-val" style={{ marginLeft: '4px' }}>Ready</span>
              </div>
              <div>
                <span className="trace-report-meta-label">Generated:</span>
                <span className="trace-report-meta-val" style={{ marginLeft: '4px', fontFamily: 'monospace' }}>
                  {reportGeneratedTime}
                </span>
              </div>
              <div>
                <span className="trace-report-meta-label">Classification:</span>
                <span className="trace-report-meta-val" style={{ marginLeft: '4px' }}>Internal Investigation</span>
              </div>
            </div>
          </header>

          {/* Section 1: CASE INFORMATION */}
          <section id="case-info" className="trace-report-section" aria-labelledby="title-case-info">
            <h4 id="title-case-info" className="trace-report-section-title">1. Case Information</h4>
            <div className="trace-report-info-grid">
              <div className="trace-report-info-item">
                <span className="trace-report-info-label">Case ID</span>
                <span className="trace-report-info-val monospace">{caseId}</span>
              </div>
              <div className="trace-report-info-item">
                <span className="trace-report-info-label">Title</span>
                <span className="trace-report-info-val">Suspicious Account Activity</span>
              </div>
              <div className="trace-report-info-item">
                <span className="trace-report-info-label">Incident Type</span>
                <span className="trace-report-info-val">Account Compromise</span>
              </div>
              <div className="trace-report-info-item">
                <span className="trace-report-info-label">Assigned Investigator</span>
                <span className="trace-report-info-val">Analyst01</span>
              </div>
              <div className="trace-report-info-item">
                <span className="trace-report-info-label">Created Date</span>
                <span className="trace-report-info-val">Jul 29, 2026</span>
              </div>
              <div className="trace-report-info-item">
                <span className="trace-report-info-label">Severity</span>
                <span className="trace-report-info-val">
                  <StatusBadge status="High" />
                </span>
              </div>
              <div className="trace-report-info-item">
                <span className="trace-report-info-label">Status</span>
                <span className="trace-report-info-val">
                  <StatusBadge status="Investigating" />
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: INCIDENT SUMMARY */}
          <section id="incident-summary" className="trace-report-section" aria-labelledby="title-incident-summary">
            <h4 id="title-incident-summary" className="trace-report-section-title">2. Incident Summary</h4>
            <p className="trace-report-text">
              Multiple failed authentication attempts were followed by a successful login from an unusual source. Subsequent evidence review identified suspicious process execution and an outbound network connection.
            </p>
          </section>

          {/* Section 3: EVIDENCE SUMMARY */}
          <section id="evidence-summary" className="trace-report-section" aria-labelledby="title-evidence-summary">
            <h4 id="title-evidence-summary" className="trace-report-section-title">3. Evidence Summary</h4>
            <div className="trace-report-info-grid" style={{ marginBottom: '8px' }}>
              <div className="trace-report-info-item">
                <span className="trace-report-info-label">Total Evidence Items</span>
                <span className="trace-report-info-val">4</span>
              </div>
              <div className="trace-report-info-item">
                <span className="trace-report-info-label">Verified Items</span>
                <span className="trace-report-info-val">4</span>
              </div>
              <div className="trace-report-info-item">
                <span className="trace-report-info-label">Integrity Issues</span>
                <span className="trace-report-info-val">0</span>
              </div>
            </div>
            
            <div className="trace-report-table-container">
              <table className="trace-report-table">
                <thead>
                  <tr>
                    <th scope="col">File Name</th>
                    <th scope="col">Evidence Type</th>
                    <th scope="col">Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {REPORT_EVIDENCE.map((ev) => (
                    <tr key={ev.name}>
                      <td style={{ fontWeight: 600 }}>{ev.name}</td>
                      <td>{ev.type}</td>
                      <td>
                        <StatusBadge status={ev.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: SUSPICIOUS INDICATORS */}
          <section id="suspicious-indicators" className="trace-report-section" aria-labelledby="title-suspicious-indicators">
            <h4 id="title-suspicious-indicators" className="trace-report-section-title">4. Suspicious Indicators</h4>
            <div className="trace-report-indicators-list">
              {REPORT_INDICATORS.map((ind) => (
                <div key={ind.name} className="trace-report-indicator-row">
                  <div className="trace-report-indicator-main">
                    <span className="trace-report-indicator-title">{ind.name}</span>
                    <span className="trace-report-indicator-meta">
                      Time: {ind.time} | Evidence: {ind.file}
                    </span>
                  </div>
                  <StatusBadge status={ind.severity} />
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: AI FINDINGS */}
          <section id="ai-findings" className="trace-report-section" aria-labelledby="title-ai-findings">
            <h4 id="title-ai-findings" className="trace-report-section-title">5. AI Findings</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="trace-report-ai-badge">Prototype AI Analysis</span>
              <p className="trace-report-text">
                The available case evidence indicates a sequence beginning with abnormal authentication activity, followed by suspicious process execution and an external network connection. The correlated events produce a HIGH threat assessment.
              </p>
            </div>
          </section>

          {/* Section 6: RISK ASSESSMENT */}
          <section id="risk-assessment" className="trace-report-section" aria-labelledby="title-risk-assessment">
            <h4 id="title-risk-assessment" className="trace-report-section-title">6. Risk Assessment</h4>
            <div className="trace-report-info-grid">
              <div className="trace-report-risk-item" style={{ gridColumn: 'span 2', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
                <span className="trace-report-info-label" style={{ fontWeight: 700 }}>Overall Risk Score</span>
                <span className="trace-report-info-val" style={{ color: 'var(--status-high)' }}>82 / 100</span>
              </div>
              <div className="trace-report-risk-item">
                <span className="trace-report-info-label">Threat Level</span>
                <span className="trace-report-info-val" style={{ color: 'var(--status-high)' }}>HIGH</span>
              </div>
              <div className="trace-report-risk-item">
                <span className="trace-report-info-label">Authentication Risk</span>
                <span className="trace-report-info-val">88</span>
              </div>
              <div className="trace-report-risk-item">
                <span className="trace-report-info-label">Process Risk</span>
                <span className="trace-report-info-val">79</span>
              </div>
              <div className="trace-report-risk-item">
                <span className="trace-report-info-label">Network Risk</span>
                <span className="trace-report-info-val">74</span>
              </div>
            </div>
          </section>

          {/* Section 7: ATTACK TIMELINE */}
          <section id="attack-timeline" className="trace-report-section" aria-labelledby="title-attack-timeline">
            <h4 id="title-attack-timeline" className="trace-report-section-title">7. Attack Timeline</h4>
            <div className="trace-report-timeline-list">
              {REPORT_TIMELINE.map((timeRow) => (
                <div key={timeRow.time} className="trace-report-timeline-row">
                  <span className="trace-report-timeline-time">{timeRow.time}</span>
                  <span className="trace-report-timeline-text">{timeRow.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 8: ANALYST CONCLUSION */}
          <section id="analyst-conclusion" className="trace-report-section" aria-labelledby="title-analyst-conclusion">
            <h4 id="title-analyst-conclusion" className="trace-report-section-title">
              <label htmlFor="trace-conclusion-input-field">8. Analyst Conclusion</label>
            </h4>
            
            <form onSubmit={handleSaveConclusion} className="trace-conclusion-form">
              <textarea
                id="trace-conclusion-input-field"
                className="trace-conclusion-textarea"
                placeholder="Enter final investigation conclusion and recommended actions..."
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                aria-label="Analyst Conclusion text field"
              />
              <div className="trace-conclusion-action-row">
                <button type="submit" className="trace-conclusion-save-btn">
                  Save Conclusion
                </button>
                {saveFeedback && (
                  <span className="trace-conclusion-feedback" role="status">
                    Conclusion saved for this session.
                  </span>
                )}
              </div>
            </form>
          </section>

        </article>

        {/* Floating buttons/actions list container */}
        <div className="trace-report-actions-row">
          <button 
            type="button" 
            className="trace-report-print-btn"
            onClick={handlePrint}
            title="Generate document printout or save PDF file"
          >
            <FiPrinter aria-hidden="true" />
            <span>Generate PDF Report</span>
          </button>
        </div>

      </div>
    </div>
  );
}
