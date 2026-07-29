import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiCheck, 
  FiArrowLeft, 
  FiDatabase, 
  FiCpu, 
  FiActivity, 
  FiFileText, 
  FiClock, 
  FiBookmark 
} from 'react-icons/fi';

import StatusBadge from '../../components/common/StatusBadge';
import EvidenceTab from '../../features/investigation/EvidenceTab';
import AIAnalysisTab from '../../features/investigation/AIAnalysisTab';
import TimelineTab from '../../features/investigation/TimelineTab';
import ReportTab from '../../features/investigation/ReportTab';

/**
 * CaseDetails Component
 * The central forensics incident workspace for TRACE AI DFIR.
 * Displays meta information, visual progress trackers, and detailed tabs for
 * Overview, Evidence, AI Investigation, Timelines, and Reports.
 */
export default function CaseDetails() {
  const navigate = useNavigate();
  // Safe param extraction support (works if router maps caseId or id)
  const { id, caseId } = useParams();
  const activeCaseId = id || caseId || 'TRC-2026-0042';

  // Auth Guard check
  const hasSession = sessionStorage.getItem('arclight-dev-session') === 'active';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Tab State
  const [activeTab, setActiveTab] = useState('overview');

  // Investigator Notes State
  const [notes, setNotes] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);

  if (!hasSession) return null;

  const handleLogout = () => {
    sessionStorage.removeItem('arclight-dev-session');
    navigate('/login', { replace: true });
  };

  const handleSaveNotes = (e) => {
    e.preventDefault();
    if (!notes.trim()) return;

    // Simulate saving notes in local session
    setSaveFeedback(true);
    setTimeout(() => {
      setSaveFeedback(false);
    }, 2500);
  };

  return (
    <div className="trace-details-layout">
      {/* Component CSS styling block */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-details-layout {
            display: flex;
            min-height: 100vh;
            background-color: var(--bg-main, #060913);
            color: var(--text-primary, #f8fafc);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            width: 100%;
            box-sizing: border-box;
          }

          .trace-details-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            height: 100vh;
            overflow: hidden;
            box-sizing: border-box;
          }

          .trace-details-content {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-sizing: border-box;
          }

          /* Header area and meta panel */
          .trace-details-back-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--text-muted, #64748b);
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: color var(--transition-speed, 200ms) ease;
            width: fit-content;
            border: none;
            background: transparent;
            outline: none;
            margin-bottom: 4px;
          }

          .trace-details-back-btn:hover {
            color: var(--color-primary, #3b82f6);
          }

          .trace-details-back-btn:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 2px;
            border-radius: var(--radius-xs, 2px);
          }

          .trace-details-header-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 20px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-sizing: border-box;
          }

          .trace-details-header-info {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            box-sizing: border-box;
          }

          .trace-details-title-group {
            display: flex;
            flex-direction: column;
          }

          .trace-details-case-id-tag {
            font-family: 'SFMono-Regular', Consolas, monospace;
            font-size: 0.8125rem;
            font-weight: 700;
            color: var(--color-secondary, #06b6d4);
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .trace-details-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 4px 0 8px 0;
            line-height: 1.25;
          }

          .trace-details-meta-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            font-size: 0.8125rem;
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-details-meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            padding-right: 16px;
          }

          .trace-details-meta-item:last-child {
            border-right: none;
            padding-right: 0;
          }

          .trace-details-meta-item strong {
            color: var(--text-muted, #64748b);
            font-weight: 600;
          }

          /* Steps Progress Tracker styling */
          .trace-details-progress-tracker {
            display: flex;
            align-items: center;
            width: 100%;
            padding: 8px 0;
            box-sizing: border-box;
            overflow-x: auto;
            scrollbar-width: thin;
          }

          .trace-progress-step {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
          }

          .trace-progress-dot {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: 700;
            box-sizing: border-box;
          }

          .trace-progress-dot.complete {
            background-color: var(--status-low-bg, rgba(34, 197, 94, 0.15));
            border: 1px solid var(--status-low, #22c55e);
            color: var(--status-low, #22c55e);
          }

          .trace-progress-dot.active {
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.15));
            border: 1px solid var(--color-primary, #3b82f6);
            color: var(--color-primary, #3b82f6);
          }

          .trace-progress-dot.pending {
            background-color: transparent;
            border: 1.5px dashed var(--text-muted, #64748b);
            color: var(--text-muted, #64748b);
          }

          .trace-progress-label {
            font-size: 0.8125rem;
            font-weight: 600;
            white-space: nowrap;
          }

          .trace-progress-label.complete {
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-progress-label.active {
            color: var(--text-primary, #f8fafc);
          }

          .trace-progress-label.pending {
            color: var(--text-muted, #64748b);
          }

          .trace-progress-connector {
            flex-grow: 1;
            height: 1px;
            background-color: var(--border-color, rgba(255, 255, 255, 0.08));
            margin: 0 16px;
            min-width: 24px;
            flex-shrink: 0;
          }

          .trace-progress-connector.complete {
            background-color: var(--status-low, #22c55e);
          }

          /* Tab List Controls styling */
          .trace-details-tabs-list {
            display: flex;
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            margin-top: 8px;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
            box-sizing: border-box;
          }

          .trace-details-tabs-list::-webkit-scrollbar {
            display: none;
          }

          .trace-details-tab-btn {
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            color: var(--text-muted, #64748b);
            padding: 10px 16px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            white-space: nowrap;
            outline: none;
          }

          .trace-details-tab-btn:hover {
            color: var(--text-primary, #f8fafc);
          }

          .trace-details-tab-btn.active {
            color: var(--color-primary, #3b82f6);
            border-bottom-color: var(--color-primary, #3b82f6);
          }

          .trace-details-tab-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            border-radius: var(--radius-sm, 4px) var(--radius-sm, 4px) 0 0;
          }

          /* Tab panel block */
          .trace-details-tab-panel {
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-sizing: border-box;
            outline: none;
          }

          /* Overview Layout styling */
          .trace-overview-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 16px;
            box-sizing: border-box;
          }

          .trace-overview-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 20px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-sizing: border-box;
          }

          .trace-overview-section-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            padding-bottom: 10px;
            margin-bottom: 2px;
          }

          .trace-overview-info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px 24px;
          }

          .trace-overview-info-item {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .trace-overview-info-label {
            font-size: 0.725rem;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--text-muted, #64748b);
            letter-spacing: 0.04em;
          }

          .trace-overview-info-value {
            font-size: 0.875rem;
            color: var(--text-primary, #f8fafc);
          }

          .trace-overview-info-value.monospace {
            font-family: 'SFMono-Regular', Consolas, monospace;
            color: var(--color-secondary, #06b6d4);
            font-weight: 600;
            font-size: 0.8125rem;
          }

          .trace-overview-description {
            font-size: 0.875rem;
            line-height: 1.5;
            color: var(--text-secondary, #cbd5e1);
            word-wrap: break-word;
          }

          /* Summary details column lists */
          .trace-overview-summary-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .trace-overview-summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.875rem;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.04);
            padding-bottom: 8px;
            box-sizing: border-box;
          }

          .trace-overview-summary-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }

          .trace-overview-summary-label {
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-overview-summary-value {
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
          }

          /* Investigator Notes Area */
          .trace-notes-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .trace-notes-textarea {
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
            line-height: 1.4;
            font-family: inherit;
          }

          .trace-notes-textarea:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.1));
          }

          .trace-notes-action-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
          }

          .trace-notes-save-btn {
            background-color: var(--color-primary, #3b82f6);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-sm, 4px);
            padding: 8px 16px;
            font-size: 0.8125rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color var(--transition-speed, 200ms) ease;
            width: fit-content;
            outline: none;
            height: 34px;
            box-sizing: border-box;
            user-select: none;
          }

          .trace-notes-save-btn:hover {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-notes-save-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
          }

          .trace-notes-feedback {
            font-size: 0.75rem;
            color: var(--status-low, #22c55e);
            font-weight: 600;
            animation: trace-fadeIn 300ms ease;
          }

          @keyframes trace-fadeIn {
            from { opacity: 0; transform: translateX(-4px); }
            to { opacity: 1; transform: translateX(0); }
          }

          /* Temporary Tab Placeholders */
          .trace-tab-placeholder {
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

          .trace-tab-placeholder-icon {
            font-size: 2.8rem;
            color: var(--text-muted, #64748b);
            opacity: 0.6;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-tab-placeholder-title {
            font-size: 1.05rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0;
          }

          .trace-tab-placeholder-desc {
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            max-width: 340px;
            margin: 0;
            line-height: 1.5;
          }

          /* Responsive Breakpoints */
          @media (max-width: 992px) {
            .trace-overview-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 768px) {
            .trace-details-header-info {
              flex-direction: column;
              align-items: stretch;
            }
            .trace-details-meta-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }
            .trace-details-meta-item {
              border-right: none;
              padding-right: 0;
              width: 100%;
            }
            .trace-overview-info-grid {
              grid-template-columns: 1fr;
            }
            .trace-details-content {
              padding: 16px;
              gap: 16px;
            }
          }
        `
      }} />

      {/* Main Command Workspace Shell */}
      <div className="trace-details-main">

        {/* Scrollable Details workspace */}
        <main className="trace-details-content">
          
          {/* Back Navigation Button */}
          <Link to="/cases" className="trace-details-back-btn" aria-label="Go back to cases overview page">
            <FiArrowLeft aria-hidden="true" />
            <span>Back to Cases</span>
          </Link>

          {/* Compact Professional Case Meta Header Card */}
          <div className="trace-details-header-card" role="region" aria-label="Case profile summary">
            <div className="trace-details-header-info">
              <div className="trace-details-title-group">
                <span className="trace-details-case-id-tag">Case ID: {activeCaseId}</span>
                <h2 className="trace-details-title">Suspicious Account Activity</h2>
                <div className="trace-details-meta-row">
                  <span className="trace-details-meta-item">
                    <strong>Investigator:</strong> Analyst01
                  </span>
                  <span className="trace-details-meta-item">
                    <strong>Created:</strong> Jul 29, 2026
                  </span>
                </div>
              </div>

              {/* Severity and Status Badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <StatusBadge status="High" />
                <StatusBadge status="Investigating" />
              </div>
            </div>

            {/* Step Bar progress indicator */}
            <div 
              className="trace-details-progress-tracker" 
              role="img" 
              aria-label="Investigation progress: Case Created, Evidence Added, and AI Analysis are complete. Timeline is active. Report is pending."
            >
              
              {/* Step 1: Case Created */}
              <div className="trace-progress-step">
                <div className="trace-progress-dot complete" title="Case Created: Complete">
                  <FiCheck />
                </div>
                <span className="trace-progress-label complete">Case Created</span>
              </div>
              <div className="trace-progress-connector complete" />

              {/* Step 2: Evidence Added */}
              <div className="trace-progress-step">
                <div className="trace-progress-dot complete" title="Evidence Added: Complete">
                  <FiCheck />
                </div>
                <span className="trace-progress-label complete">Evidence Added</span>
              </div>
              <div className="trace-progress-connector complete" />

              {/* Step 3: AI Analysis */}
              <div className="trace-progress-step">
                <div className="trace-progress-dot complete" title="AI Analysis: Complete">
                  <FiCheck />
                </div>
                <span className="trace-progress-label complete">AI Analysis</span>
              </div>
              <div className="trace-progress-connector" />

              {/* Step 4: Timeline */}
              <div className="trace-progress-step">
                <div className="trace-progress-dot active" title="Timeline: Active / Complete">
                  <FiClock />
                </div>
                <span className="trace-progress-label active">Timeline</span>
              </div>
              <div className="trace-progress-connector" />

              {/* Step 5: Report */}
              <div className="trace-progress-step">
                <div className="trace-progress-dot pending" title="Report: Pending">
                  5
                </div>
                <span className="trace-progress-label pending">Report</span>
              </div>

            </div>
          </div>

          {/* Workspace tab select bar */}
          <div 
            className="trace-details-tabs-list" 
            role="tablist" 
            aria-label="Investigation workspace tabs"
          >
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'evidence', label: 'Evidence' },
              { id: 'ai-analysis', label: 'AI Analysis' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'report', label: 'Report' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`trace-tab-${tab.id}`}
                  type="button"
                  className={`trace-details-tab-btn ${isActive ? 'active' : ''}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`trace-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  tabIndex={0}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel render */}
          
          {/* Tab 1: Overview Tab Panel */}
          {activeTab === 'overview' && (
            <div 
              id="trace-panel-overview"
              className="trace-details-tab-panel"
              role="tabpanel"
              aria-labelledby="trace-tab-overview"
              tabIndex={0}
            >
              <div className="trace-overview-grid">
                
                {/* Left panel: Case Profile Information details */}
                <div className="trace-overview-card">
                  <h3 className="trace-overview-section-title">Case Information</h3>
                  <div className="trace-overview-info-grid">
                    <div className="trace-overview-info-item">
                      <span className="trace-overview-info-label">Case ID</span>
                      <span className="trace-overview-info-value monospace">{activeCaseId}</span>
                    </div>
                    <div className="trace-overview-info-item">
                      <span className="trace-overview-info-label">Title</span>
                      <span className="trace-overview-info-value">Suspicious Account Activity</span>
                    </div>
                    <div className="trace-overview-info-item">
                      <span className="trace-overview-info-label">Incident Type</span>
                      <span className="trace-overview-info-value">Account Compromise</span>
                    </div>
                    <div className="trace-overview-info-item">
                      <span className="trace-overview-info-label">Assigned Investigator</span>
                      <span className="trace-overview-info-value">Analyst01</span>
                    </div>
                    <div className="trace-overview-info-item">
                      <span className="trace-overview-info-label">Created Date</span>
                      <span className="trace-overview-info-value">Jul 29, 2026</span>
                    </div>
                  </div>
                  
                  <div className="trace-overview-info-item" style={{ marginTop: '4px' }}>
                    <span className="trace-overview-info-label">Description</span>
                    <p className="trace-overview-description">
                      Multiple failed authentication attempts followed by a successful login from an unusual source were detected.
                    </p>
                  </div>
                </div>

                {/* Right panel: Summary metrics and Analyst Notes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Investigation Summary details */}
                  <div className="trace-overview-card">
                    <h3 className="trace-overview-section-title">Investigation Summary</h3>
                    <div className="trace-overview-summary-list">
                      <div className="trace-overview-summary-item">
                        <span className="trace-overview-summary-label">Evidence Items</span>
                        <span className="trace-overview-summary-value">4</span>
                      </div>
                      <div className="trace-overview-summary-item">
                        <span className="trace-overview-summary-label">Risk Score</span>
                        <span className="trace-overview-summary-value" style={{ color: 'var(--status-high)' }}>
                          82 / 100
                        </span>
                      </div>
                      <div className="trace-overview-summary-item">
                        <span className="trace-overview-summary-label">Threat Level</span>
                        <span className="trace-overview-summary-value" style={{ color: 'var(--status-high)' }}>
                          High
                        </span>
                      </div>
                      <div className="trace-overview-summary-item">
                        <span className="trace-overview-summary-label">Indicators Found</span>
                        <span className="trace-overview-summary-value">3</span>
                      </div>
                    </div>
                  </div>

                  {/* Investigator Notes Textarea Form */}
                  <div className="trace-overview-card">
                    <h3 className="trace-overview-section-title">
                      <label htmlFor="trace-investigator-notes-field">Investigator Notes</label>
                    </h3>
                    <form onSubmit={handleSaveNotes} className="trace-notes-form">
                      <textarea
                        id="trace-investigator-notes-field"
                        className="trace-notes-textarea"
                        placeholder="Add investigation notes and observations..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        aria-label="Investigator Notes input field"
                      />
                      <div className="trace-notes-action-row">
                        <button type="submit" className="trace-notes-save-btn">
                          Save Notes
                        </button>
                        {saveFeedback && (
                          <span className="trace-notes-feedback" role="status">
                            Notes saved for this session.
                          </span>
                        )}
                      </div>
                    </form>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Evidence Tab Panel */}
          {activeTab === 'evidence' && (
            <div 
              id="trace-panel-evidence"
              className="trace-details-tab-panel"
              role="tabpanel"
              aria-labelledby="trace-tab-evidence"
              tabIndex={0}
            >
              <EvidenceTab caseId={activeCaseId} />
            </div>
          )}

          {/* Tab 3: AI Analysis Tab Panel */}
          {activeTab === 'ai-analysis' && (
            <div 
              id="trace-panel-ai-analysis"
              className="trace-details-tab-panel"
              role="tabpanel"
              aria-labelledby="trace-tab-ai-analysis"
              tabIndex={0}
            >
              <AIAnalysisTab caseId={activeCaseId} />
            </div>
          )}

          {/* Tab 4: Timeline Tab Panel */}
          {activeTab === 'timeline' && (
            <div 
              id="trace-panel-timeline"
              className="trace-details-tab-panel"
              role="tabpanel"
              aria-labelledby="trace-tab-timeline"
              tabIndex={0}
            >
              <TimelineTab caseId={activeCaseId} />
            </div>
          )}

          {/* Tab 5: Report Tab Panel */}
          {activeTab === 'report' && (
            <div 
              id="trace-panel-report"
              className="trace-details-tab-panel"
              role="tabpanel"
              aria-labelledby="trace-tab-report"
              tabIndex={0}
            >
              <ReportTab caseId={activeCaseId} />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
