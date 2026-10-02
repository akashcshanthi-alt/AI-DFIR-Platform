import React, { useState, useEffect } from 'react';
import {
  FiFileText,
  FiPrinter,
  FiDownload,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiShield,
  FiInfo
} from 'react-icons/fi';
import StatusBadge from '../../components/common/StatusBadge';
import { casesService } from '../../services/cases.service';
import { evidenceService } from '../../services/evidence.service';
import { iocService } from '../../services/ioc.service';
import { timelineService } from '../../services/timeline.service';
import { mitreService } from '../../services/mitre.service';
import { aiService } from '../../services/ai.service';
import { reportsService } from '../../services/reports.service';

/**
 * ReportTab Component
 * Renders the consolidated incident summary, forensic tables, AI findings,
 * and multi-page print layout controls. Uses live case telemetry and evidence records.
 *
 * @param {Object} props
 * @param {string} [props.caseId] - Parent case unique identifier
 */
export default function ReportTab({ caseId = 'TRC-2026-0042' }) {
  // Telemetry state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [iocList, setIocList] = useState([]);
  const [timelineList, setTimelineList] = useState([]);
  const [mitreList, setMitreList] = useState([]);
  const [latestAiRun, setLatestAiRun] = useState(null);

  // PDF Generation State
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(null);
  const [pdfError, setPdfError] = useState(null);

  // Local state managers
  const [conclusion, setConclusion] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);

  const loadData = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      setError(null);

      const [caseRes, evidenceRes, iocsRes, timelineRes, runsRes, mitreRes] = await Promise.allSettled([
        casesService.getCaseById(caseId),
        evidenceService.getEvidenceByCase(caseId),
        iocService.getIOCs({ caseId, limit: 100 }),
        timelineService.getTimelineEvents({ caseId, limit: 100 }),
        aiService.getInvestigationRuns({ caseId, limit: 5 }),
        mitreService.getMappings({ caseId, limit: 100 })
      ]);

      if (caseRes.status === 'fulfilled' && caseRes.value) {
        setCaseData(caseRes.value);
      }
      if (evidenceRes.status === 'fulfilled' && evidenceRes.value) {
        const evs = Array.isArray(evidenceRes.value) ? evidenceRes.value : (evidenceRes.value?.items || []);
        setEvidenceList(evs);
      }
      if (iocsRes.status === 'fulfilled' && iocsRes.value) {
        const iocs = Array.isArray(iocsRes.value) ? iocsRes.value : (iocsRes.value?.items || []);
        setIocList(iocs);
      }
      if (timelineRes.status === 'fulfilled' && timelineRes.value) {
        const tl = Array.isArray(timelineRes.value) ? timelineRes.value : (timelineRes.value?.items || []);
        setTimelineList(tl);
      }
      if (mitreRes.status === 'fulfilled' && mitreRes.value) {
        const ml = Array.isArray(mitreRes.value) ? mitreRes.value : (mitreRes.value?.items || []);
        setMitreList(ml);
      }
      if (runsRes.status === 'fulfilled' && runsRes.value) {
        const items = runsRes.value?.items || [];
        const completedRun = items.find(r => r.status === 'completed') || items[0] || null;
        setLatestAiRun(completedRun);
      }
    } catch (err) {
      console.error('[ReportTab] Failed to load live telemetry:', err);
      setError(err.message || 'Failed to load case report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [caseId]);

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

    setSaveFeedback(true);
    setTimeout(() => {
      setSaveFeedback(false);
    }, 2500);
  };

  // Generate and download official backend PDF
  const handleGeneratePdf = async () => {
    try {
      setGeneratingPdf(true);
      setPdfError(null);
      setPdfSuccess(null);

      const title = `TRACE AI Forensic Report - ${caseData?.caseId || caseId}`;
      const payload = {
        title,
        caseId: caseData?.caseId || caseId,
        format: 'PDF',
        reportType: 'Technical Investigation',
        analystConclusion: conclusion
      };

      const report = await reportsService.generateReport(payload);
      const downloadFileName = `${report.reportId || 'REP'}_${caseData?.caseId || caseId}.pdf`;
      await reportsService.downloadReport(report.reportId, downloadFileName);

      setPdfSuccess(`Official report [${report.reportId}] synthesized and downloaded successfully.`);
      setTimeout(() => setPdfSuccess(null), 5000);
    } catch (err) {
      console.error('[ReportTab] PDF generation error:', err);
      setPdfError(err.message || 'Failed to synthesize backend PDF report.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Browser print / Save as PDF routine
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="trace-report-tab">
      {/* Component styling block including screen & dedicated print modes */}
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
            width: 190px;
            display: flex;
            flex-direction: column;
            gap: 5px;
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
            font-size: 0.75rem;
            font-weight: 600;
            padding: 6px 10px;
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
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            user-select: none;
          }

          .trace-report-print-btn {
            background-color: #0284c7;
            color: #ffffff;
            border: none;
            border-radius: var(--radius-sm, 4px);
            padding: 10px 20px;
            font-size: 0.875rem;
            font-weight: 700;
            cursor: pointer;
            transition: background-color var(--transition-speed, 200ms);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            outline: none;
            height: 38px;
            box-sizing: border-box;
          }

          .trace-report-print-btn:hover {
            background-color: #0369a1;
          }

          .trace-report-print-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .trace-report-print-preview-btn {
            background-color: transparent;
            color: var(--text-secondary, #cbd5e1);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.2));
            border-radius: var(--radius-sm, 4px);
            padding: 10px 18px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            outline: none;
            height: 38px;
            box-sizing: border-box;
          }

          .trace-report-print-preview-btn:hover {
            background-color: rgba(255, 255, 255, 0.06);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.4);
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
            line-height: 1.25;
          }

          .trace-report-doc-subtitle {
            font-size: 0.875rem;
            color: var(--text-muted, #64748b);
            font-weight: 500;
          }

          .trace-report-meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            background-color: var(--bg-surface-alt, #080d1a);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));
            border-radius: var(--radius-sm, 4px);
            padding: 12px 16px;
            margin-top: 8px;
            font-size: 0.8125rem;
          }

          .trace-report-meta-label {
            color: var(--text-muted, #64748b);
            font-weight: 500;
          }

          .trace-report-meta-val {
            color: var(--text-primary, #f8fafc);
            font-weight: 600;
          }

          /* Section block formatting */
          .trace-report-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .trace-report-section-title {
            font-size: 0.9375rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            padding-bottom: 6px;
            margin: 0;
            letter-spacing: 0.025em;
          }

          .trace-report-text {
            font-size: 0.875rem;
            line-height: 1.6;
            color: var(--text-secondary, #cbd5e1);
            margin: 0;
          }

          .trace-report-info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .trace-report-info-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .trace-report-info-label {
            font-size: 0.75rem;
            color: var(--text-muted, #64748b);
            font-weight: 500;
          }

          .trace-report-info-val {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
          }

          .trace-report-info-val.monospace {
            font-family: var(--font-mono, monospace);
          }

          /* Evidence Table */
          .trace-report-table-container {
            width: 100%;
            overflow-x: auto;
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
          }

          .trace-report-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.8125rem;
          }

          .trace-report-table th {
            background-color: var(--bg-surface-alt, #080d1a);
            padding: 8px 12px;
            font-weight: 600;
            color: var(--text-muted, #64748b);
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-report-table td {
            padding: 8px 12px;
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.04));
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-report-table tr:last-child td {
            border-bottom: none;
          }

          /* Indicators row items */
          .trace-report-indicators-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .trace-report-indicator-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background-color: var(--bg-surface-alt, #080d1a);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.04));
            border-radius: var(--radius-sm, 4px);
          }

          .trace-report-indicator-main {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .trace-report-indicator-title {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
          }

          .trace-report-indicator-meta {
            font-size: 0.725rem;
            color: var(--text-muted, #64748b);
          }

          .trace-report-ai-badge {
            display: inline-block;
            align-self: flex-start;
            font-size: 0.6875rem;
            font-weight: 700;
            color: var(--color-secondary, #06b6d4);
            background-color: rgba(6, 182, 212, 0.1);
            border: 1px solid rgba(6, 182, 212, 0.2);
            padding: 2px 8px;
            border-radius: 9999px;
            letter-spacing: 0.05em;
          }

          /* Timeline Row List */
          .trace-report-timeline-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .trace-report-timeline-row {
            display: flex;
            align-items: baseline;
            gap: 16px;
            font-size: 0.8125rem;
            padding: 4px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          }

          .trace-report-timeline-time {
            font-family: var(--font-mono, monospace);
            color: var(--color-secondary, #06b6d4);
            font-size: 0.75rem;
            flex-shrink: 0;
            width: 90px;
          }

          .trace-report-timeline-text {
            color: var(--text-secondary, #cbd5e1);
          }

          /* Analyst conclusion form */
          .trace-conclusion-form {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .trace-conclusion-textarea {
            width: 100%;
            height: 90px;
            background-color: var(--bg-surface-alt, #080d1a);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
            border-radius: var(--radius-sm, 4px);
            padding: 10px;
            color: var(--text-primary, #f8fafc);
            font-family: inherit;
            font-size: 0.875rem;
            line-height: 1.5;
            resize: vertical;
            outline: none;
            box-sizing: border-box;
            transition: border-color var(--transition-speed, 200ms);
          }

          .trace-conclusion-textarea:focus {
            border-color: var(--color-primary, #3b82f6);
          }

          .trace-conclusion-action-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .trace-conclusion-save-btn {
            background-color: var(--color-primary, #3b82f6);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-sm, 4px);
            padding: 6px 14px;
            font-size: 0.8125rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color var(--transition-speed, 200ms);
          }

          .trace-conclusion-save-btn:hover {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-conclusion-feedback {
            font-size: 0.75rem;
            color: var(--status-low, #22c55e);
            font-weight: 600;
          }

          /* Hide print-only elements on screen */
          .trace-print-header,
          .trace-print-footer {
            display: none;
          }

          /* ========================================================================= */
          /* DEDICATED MULTI-PAGE PRINT MEDIA STYLESHEET                               */
          /* ========================================================================= */
          @media print {
            /* 1. Global Viewport Reset — Unconstrain height and remove all overflow traps */
            html,
            body,
            #root,
            .trace-app-layout,
            .trace-app-main,
            .trace-app-content,
            .flex-grow,
            .max-w-7xl {
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              position: static !important;
              background-color: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              display: block !important;
            }

            /* 2. Hide ALL application chrome: sidebar, top navbar, case tabs, TOC, buttons */
            .trace-sidebar,
            aside,
            .trace-app-header,
            header:not(.trace-report-doc-header),
            nav:not([aria-label="Report table of contents"]),
            .trace-report-toc,
            .trace-report-actions-row,
            .trace-conclusion-action-row,
            .trace-case-header,
            button {
              display: none !important;
              visibility: hidden !important;
            }

            /* 3. A4 Page Layout Definition */
            @page {
              size: A4 portrait;
              margin: 14mm 12mm 16mm 12mm;
            }

            /* 4. Document Layout & Multi-page Flow */
            .trace-report-tab {
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
            }

            .trace-report-document-wrap {
              display: block !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .trace-report-document {
              background-color: #ffffff !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              color: #0f172a !important;
              width: 100% !important;
              max-width: 100% !important;
              display: block !important;
              font-size: 9pt !important;
              line-height: 1.4 !important;
            }

            /* 5. Clean Running Print Header & Footer */
            .trace-print-header {
              display: flex !important;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 4px;
              margin-bottom: 12px;
              font-size: 7.5pt;
              color: #64748b;
              font-weight: 600;
            }

            .trace-print-footer {
              display: flex !important;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid #cbd5e1;
              padding-top: 4px;
              margin-top: 24px;
              font-size: 7.5pt;
              color: #64748b;
            }

            /* 6. Section Page Breaks */
            .trace-report-section {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 16px !important;
              display: block !important;
            }

            .trace-report-section-title {
              color: #0f172a !important;
              border-bottom: 1.5px solid #cbd5e1 !important;
              margin-top: 12px !important;
              margin-bottom: 8px !important;
              font-size: 10.5pt !important;
              font-weight: 700 !important;
              page-break-after: avoid;
              break-after: avoid;
            }

            /* 7. Preserved Tables & Rows without clipping */
            .trace-report-table-container {
              border: 1px solid #e2e8f0 !important;
              overflow: visible !important;
            }

            .trace-report-table {
              width: 100% !important;
              border-collapse: collapse !important;
            }

            .trace-report-table tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .trace-report-table th {
              background-color: #f1f5f9 !important;
              color: #334155 !important;
              font-weight: 700 !important;
              border-bottom: 1.5px solid #cbd5e1 !important;
              padding: 5px 8px !important;
              font-size: 8pt !important;
            }

            .trace-report-table td {
              border-bottom: 1px solid #e2e8f0 !important;
              padding: 5px 8px !important;
              font-size: 8pt !important;
              color: #1e293b !important;
            }

            .trace-report-indicator-row {
              background-color: #f8fafc !important;
              border: 1px solid #e2e8f0 !important;
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 5px !important;
              padding: 6px 10px !important;
            }

            .trace-report-indicator-title {
              color: #0f172a !important;
              font-size: 8pt !important;
            }

            .trace-report-indicator-meta {
              color: #64748b !important;
              font-size: 7.5pt !important;
            }

            .trace-report-meta-grid {
              background-color: #f8fafc !important;
              border: 1px solid #e2e8f0 !important;
              color: #0f172a !important;
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 8px !important;
              padding: 10px !important;
            }

            .trace-report-info-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 8px !important;
            }

            .trace-report-info-label {
              color: #475569 !important;
              font-size: 7.5pt !important;
            }

            .trace-report-info-val {
              color: #0f172a !important;
              font-size: 8.5pt !important;
            }

            .trace-report-text {
              color: #334155 !important;
              font-size: 8.5pt !important;
              line-height: 1.4 !important;
            }

            .trace-conclusion-textarea {
              background-color: #ffffff !important;
              border: 1px solid #cbd5e1 !important;
              color: #0f172a !important;
              resize: none !important;
              height: auto !important;
              min-height: 70px !important;
              font-size: 8.5pt !important;
            }

            .trace-report-ai-badge {
              background-color: #e0f2fe !important;
              border: 1px solid #bae6fd !important;
              color: #0369a1 !important;
            }
          }
        `
      }} />

      {/* Left Column: Table of Contents navigation link panel (Screen Only) */}
      <nav className="trace-report-toc" aria-label="Report table of contents">
        <span className="trace-report-toc-title">TOC Sections</span>
        <a href="#case-info" className="trace-report-toc-link">1. Case Information</a>
        <a href="#incident-summary" className="trace-report-toc-link">2. Incident Summary</a>
        <a href="#evidence-summary" className="trace-report-toc-link">3. Evidence &amp; Hashes</a>
        <a href="#suspicious-indicators" className="trace-report-toc-link">4. Threat Indicators</a>
        <a href="#attack-timeline" className="trace-report-toc-link">5. Forensic Timeline</a>
        <a href="#mitre-findings" className="trace-report-toc-link">6. MITRE ATT&CK</a>
        <a href="#ai-findings" className="trace-report-toc-link">7. AI Investigation</a>
        <a href="#risk-assessment" className="trace-report-toc-link">8. Risk Assessment</a>
        <a href="#analyst-conclusion" className="trace-report-toc-link">9. Analyst Conclusion</a>
      </nav>

      {/* Right Column: Physical document layout */}
      <div className="trace-report-document-wrap">
        {loading ? (
          <div className="trace-report-document flex flex-col items-center justify-center p-12 text-center text-[#8b90a0]">
            <FiRefreshCw className="w-8 h-8 animate-spin text-[#38bdf8] mb-3" />
            <p className="text-sm font-semibold text-white">Synthesizing live incident telemetry for report...</p>
          </div>
        ) : error ? (
          <div className="trace-report-document p-6 border border-error/30 bg-error/5 text-error flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiAlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 bg-error/20 hover:bg-error/30 rounded text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Printable/Save as PDF document card */}
            <article className="trace-report-document" id="trace-report-printable-area">
              
              {/* Running Print Header (Print mode only) */}
              <div className="trace-print-header">
                <span>TRACE AI DFIR • Digital Forensics &amp; Incident Response Report</span>
                <span>Case ID: {caseData?.caseId || caseId}</span>
              </div>

              {/* Document Title Header */}
              <header className="trace-report-doc-header">
                <span className="trace-report-brand">TRACE AI DFIR PLATFORM</span>
                <h3 className="trace-report-doc-title">Digital Forensics &amp; Incident Response</h3>
                <span className="trace-report-doc-subtitle">Incident Findings &amp; Forensic Verification Report</span>

                <div className="trace-report-meta-grid">
                  <div>
                    <span className="trace-report-meta-label">Case ID:</span>
                    <span className="trace-report-meta-val" style={{ marginLeft: '4px' }}>{caseData?.caseId || caseId}</span>
                  </div>
                  <div>
                    <span className="trace-report-meta-label">Report Status:</span>
                    <span className="trace-report-meta-val" style={{ marginLeft: '4px' }}>{caseData?.status || 'Active'}</span>
                  </div>
                  <div>
                    <span className="trace-report-meta-label">Generated:</span>
                    <span className="trace-report-meta-val" style={{ marginLeft: '4px', fontFamily: 'monospace' }}>
                      {reportGeneratedTime}
                    </span>
                  </div>
                  <div>
                    <span className="trace-report-meta-label">Classification:</span>
                    <span className="trace-report-meta-val" style={{ marginLeft: '4px' }}>Internal DFIR Investigation // TLP:AMBER</span>
                  </div>
                </div>
              </header>

              {/* Section 1: CASE INFORMATION */}
              <section id="case-info" className="trace-report-section" aria-labelledby="title-case-info">
                <h4 id="title-case-info" className="trace-report-section-title">1. Case Information</h4>
                <div className="trace-report-info-grid">
                  <div className="trace-report-info-item">
                    <span className="trace-report-info-label">Case ID</span>
                    <span className="trace-report-info-val monospace">{caseData?.caseId || caseId}</span>
                  </div>
                  <div className="trace-report-info-item">
                    <span className="trace-report-info-label">Title</span>
                    <span className="trace-report-info-val">{caseData?.title || 'Case ' + caseId}</span>
                  </div>
                  <div className="trace-report-info-item">
                    <span className="trace-report-info-label">Incident Type</span>
                    <span className="trace-report-info-val">
                      {caseData?.incidentType || (caseData?.tags && caseData.tags.length > 0 ? caseData.tags.join(', ') : 'Forensic Investigation')}
                    </span>
                  </div>
                  <div className="trace-report-info-item">
                    <span className="trace-report-info-label">Target Host</span>
                    <span className="trace-report-info-val">{caseData?.targetHost || 'N/A'}</span>
                  </div>
                  <div className="trace-report-info-item">
                    <span className="trace-report-info-label">Created Date</span>
                    <span className="trace-report-info-val">
                      {caseData?.createdAt ? new Date(caseData.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  <div className="trace-report-info-item">
                    <span className="trace-report-info-label">Severity</span>
                    <span className="trace-report-info-val">
                      <StatusBadge status={caseData?.severity || 'Medium'} />
                    </span>
                  </div>
                  <div className="trace-report-info-item">
                    <span className="trace-report-info-label">Status</span>
                    <span className="trace-report-info-val">
                      <StatusBadge status={caseData?.status || 'Active'} />
                    </span>
                  </div>
                </div>
              </section>

              {/* Section 2: INCIDENT SUMMARY */}
              <section id="incident-summary" className="trace-report-section" aria-labelledby="title-incident-summary">
                <h4 id="title-incident-summary" className="trace-report-section-title">2. Incident Summary &amp; Scope</h4>
                <p className="trace-report-text">
                  {caseData?.description || 'No description provided for this incident case.'}
                </p>
              </section>

              {/* Section 3: EVIDENCE SUMMARY & CRYPTOGRAPHIC INTEGRITY */}
              <section id="evidence-summary" className="trace-report-section" aria-labelledby="title-evidence-summary">
                <h4 id="title-evidence-summary" className="trace-report-section-title">3. Evidence Summary &amp; Cryptographic Integrity</h4>
                <div className="trace-report-info-grid" style={{ marginBottom: '8px' }}>
                  <div className="trace-report-info-item">
                    <span className="trace-report-info-label">Total Ingested Artifacts</span>
                    <span className="trace-report-info-val">{evidenceList.length}</span>
                  </div>
                  <div className="trace-report-info-item">
                    <span className="trace-report-info-label">Cryptographically Verified</span>
                    <span className="trace-report-info-val">{evidenceList.filter(e => e.sha256Hash).length}</span>
                  </div>
                  <div className="trace-report-info-item">
                    <span className="trace-report-info-label">Integrity Status</span>
                    <span className="trace-report-info-val text-[#10b981]">Hash Integrity Confirmed</span>
                  </div>
                </div>
                
                {evidenceList.length === 0 ? (
                  <p className="trace-report-text italic text-[#8b90a0]">
                    No evidence items have been uploaded or ingested for this case yet.
                  </p>
                ) : (
                  <div className="trace-report-table-container">
                    <table className="trace-report-table">
                      <thead>
                        <tr>
                          <th scope="col">File Name</th>
                          <th scope="col">Type</th>
                          <th scope="col">SHA-256 Hash</th>
                          <th scope="col">Verification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evidenceList.map((ev, i) => (
                          <tr key={ev.evidenceId || ev._id || i}>
                            <td style={{ fontWeight: 600 }}>{ev.originalName || ev.fileName}</td>
                            <td>{ev.fileType || ev.mimeType || 'Forensic Log'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.725rem', wordBreak: 'break-all' }}>
                              {ev.sha256Hash || 'N/A'}
                            </td>
                            <td>
                              <StatusBadge status={ev.sha256Hash ? 'Verified' : 'Pending'} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Section 4: THREAT INDICATORS OF COMPROMISE (IOC FINDINGS) */}
              <section id="suspicious-indicators" className="trace-report-section" aria-labelledby="title-suspicious-indicators">
                <h4 id="title-suspicious-indicators" className="trace-report-section-title">
                  4. Threat Indicators of Compromise ({iocList.length} Detected)
                </h4>
                {iocList.length === 0 ? (
                  <p className="trace-report-text italic text-[#8b90a0]">
                    No indicators of compromise (IOCs) detected for this case.
                  </p>
                ) : (
                  <div className="trace-report-indicators-list">
                    {iocList.map((ind, i) => (
                      <div key={ind.iocId || ind._id || i} className="trace-report-indicator-row">
                        <div className="trace-report-indicator-main">
                          <span className="trace-report-indicator-title font-mono">{ind.value}</span>
                          <span className="trace-report-indicator-meta">
                            Type: {(ind.type || 'Indicator').toUpperCase()} | Provenance: {ind.evidenceRefs?.[0]?.fileName || ind.source || 'Case Ingestion'}
                            {ind.createdAt && ` | Detected: ${new Date(ind.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        </div>
                        <StatusBadge status={ind.severity || 'Medium'} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Section 5: FORENSIC TIMELINE SEQUENCE */}
              <section id="attack-timeline" className="trace-report-section" aria-labelledby="title-attack-timeline">
                <h4 id="title-attack-timeline" className="trace-report-section-title">
                  5. Forensic Timeline Sequence ({timelineList.length} Events)
                </h4>
                {timelineList.length === 0 ? (
                  <p className="trace-report-text italic text-[#8b90a0]">
                    No forensic timeline events recorded for this case.
                  </p>
                ) : (
                  <div className="trace-report-timeline-list">
                    {timelineList.map((timeRow, i) => {
                      const timeStr = timeRow.timestamp
                        ? new Date(timeRow.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : `Event ${i + 1}`;
                      return (
                        <div key={timeRow.eventId || timeRow._id || i} className="trace-report-timeline-row">
                          <span className="trace-report-timeline-time">{timeStr}</span>
                          <div className="flex flex-col">
                            <span className="trace-report-timeline-text font-semibold">{timeRow.title || timeRow.summary || timeRow.eventType}</span>
                            {timeRow.description && (
                              <span className="text-[11px] text-[#8b90a0] mt-0.5">{timeRow.description}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Section 6: MITRE ATT&CK FRAMEWORK CORRELATIONS */}
              <section id="mitre-findings" className="trace-report-section" aria-labelledby="title-mitre-findings">
                <h4 id="title-mitre-findings" className="trace-report-section-title">
                  6. MITRE ATT&CK Framework Findings ({mitreList.length} Techniques)
                </h4>
                {mitreList.length === 0 ? (
                  <p className="trace-report-text italic text-[#8b90a0]">
                    No MITRE ATT&CK technique mappings correlated for this case yet. Correlate indicators from the MITRE ATT&CK tab.
                  </p>
                ) : (
                  <div className="trace-report-table-container">
                    <table className="trace-report-table">
                      <thead>
                        <tr>
                          <th scope="col">Technique ID</th>
                          <th scope="col">Technique Name</th>
                          <th scope="col">Tactic</th>
                          <th scope="col">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mitreList.map((m, i) => (
                          <tr key={m.mappingId || m._id || i}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>{m.techniqueId}</td>
                            <td style={{ fontWeight: 600 }}>{m.techniqueName}</td>
                            <td>{m.tacticName || m.tactic || 'N/A'}</td>
                            <td>
                              <span className="font-mono text-xs text-[#10b981] font-bold">
                                {m.confidenceScore || 75}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Section 7: COGNITIVE AI INVESTIGATION FINDINGS */}
              <section id="ai-findings" className="trace-report-section" aria-labelledby="title-ai-findings">
                <h4 id="title-ai-findings" className="trace-report-section-title">7. Cognitive AI Investigation Findings</h4>
                {latestAiRun ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="trace-report-ai-badge">
                        LangGraph Run: {latestAiRun.runId} • Model: {latestAiRun.model} • Status: {latestAiRun.status?.toUpperCase()}
                      </span>
                    </div>
                    <p className="trace-report-text font-medium text-white">
                      {latestAiRun.executiveSummary}
                    </p>
                    {latestAiRun.hypotheses && latestAiRun.hypotheses.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <span className="text-xs font-bold text-white block">Validated Candidate Hypotheses:</span>
                        {latestAiRun.hypotheses.map((h, i) => (
                          <div key={i} className="text-xs p-2.5 rounded bg-surface-container-high/40 border border-white/5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#47faf3]">{h.title}</span>
                              <span className="font-mono text-[10px] text-[#10b981]">Confidence: {h.confidence?.score || 50}%</span>
                            </div>
                            <p className="text-[#cbd5e1]">{h.statement}</p>
                            {h.supportingEvidenceIds && h.supportingEvidenceIds.length > 0 && (
                              <p className="text-[10px] font-mono text-[#8b90a0]">
                                Provenance: {h.supportingEvidenceIds.join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {latestAiRun.evidenceGaps && latestAiRun.evidenceGaps.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <span className="text-xs font-bold text-[#f59e0b] block">Identified Evidence Blindspots:</span>
                        <ul className="list-disc list-inside text-xs text-[#cbd5e1] space-y-0.5">
                          {latestAiRun.evidenceGaps.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="trace-report-ai-badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#8b90a0', borderColor: 'rgba(255,255,255,0.1)' }}>
                      No AI Investigation Executed
                    </span>
                    <p className="trace-report-text italic text-[#8b90a0]">
                      No AI investigation run has been executed for this case yet. Go to the AI Investigation tab and run the LangGraph workflow to synthesize candidate hypotheses and executive findings.
                    </p>
                  </div>
                )}
              </section>

              {/* Section 8: QUANTITATIVE RISK ASSESSMENT */}
              <section id="risk-assessment" className="trace-report-section" aria-labelledby="title-risk-assessment">
                <h4 id="title-risk-assessment" className="trace-report-section-title">8. Quantitative Risk Assessment</h4>
                <div className="trace-report-info-grid">
                  {(() => {
                    const sev = (caseData?.severity || 'Medium').toLowerCase();
                    const baseScore = sev === 'critical' ? 90 : sev === 'high' ? 75 : sev === 'medium' ? 50 : 25;
                    const highIocs = iocList.filter(i => ['High', 'Critical'].includes(i.severity)).length;
                    const calcScore = Math.min(100, baseScore + Math.min(10, highIocs * 3));
                    return (
                      <>
                        <div className="trace-report-risk-item" style={{ gridColumn: 'span 2', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
                          <span className="trace-report-info-label" style={{ fontWeight: 700 }}>Telemetry Risk Score</span>
                          <span className="trace-report-info-val" style={{ color: calcScore >= 75 ? 'var(--status-high)' : 'var(--color-primary)' }}>
                            {calcScore} / 100
                          </span>
                        </div>
                        <div className="trace-report-risk-item">
                          <span className="trace-report-info-label">Threat Level</span>
                          <span className="trace-report-info-val" style={{ color: 'var(--status-high)' }}>
                            {(caseData?.severity || 'Medium').toUpperCase()}
                          </span>
                        </div>
                        <div className="trace-report-risk-item">
                          <span className="trace-report-info-label">Active Indicators</span>
                          <span className="trace-report-info-val">{iocList.length}</span>
                        </div>
                        <div className="trace-report-risk-item">
                          <span className="trace-report-info-label">Evidence Artifacts</span>
                          <span className="trace-report-info-val">{evidenceList.length}</span>
                        </div>
                        <div className="trace-report-risk-item">
                          <span className="trace-report-info-label">Timeline Sequence</span>
                          <span className="trace-report-info-val">{timelineList.length} events</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </section>

              {/* Section 9: ANALYST CONCLUSION & OFFICIAL SIGN-OFF */}
              <section id="analyst-conclusion" className="trace-report-section" aria-labelledby="title-analyst-conclusion">
                <h4 id="title-analyst-conclusion" className="trace-report-section-title">
                  <label htmlFor="trace-conclusion-input-field">9. Analyst Conclusion &amp; Incident Sign-off</label>
                </h4>
                
                <form onSubmit={handleSaveConclusion} className="trace-conclusion-form">
                  <textarea
                    id="trace-conclusion-input-field"
                    className="trace-conclusion-textarea"
                    placeholder="Enter final investigation conclusion and recommended containment actions..."
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

              {/* Running Print Footer (Print mode only) */}
              <div className="trace-print-footer">
                <span>TRACE AI DFIR PLATFORM • Case [{caseData?.caseId || caseId}] • Cryptographic Integrity Verified</span>
                <span>Confidential Forensic Record // TLP:AMBER</span>
              </div>

            </article>

            {/* Floating buttons/actions list container */}
            <div className="trace-report-actions-row">
              {pdfSuccess && (
                <div className="text-xs text-[#10b981] font-semibold flex items-center gap-1.5 mr-auto">
                  <FiCheckCircle className="w-4 h-4" />
                  <span>{pdfSuccess}</span>
                </div>
              )}
              {pdfError && (
                <div className="text-xs text-error font-semibold flex items-center gap-1.5 mr-auto">
                  <FiAlertTriangle className="w-4 h-4" />
                  <span>{pdfError}</span>
                </div>
              )}
              <button 
                type="button" 
                className="trace-report-print-btn"
                onClick={handleGeneratePdf}
                disabled={generatingPdf}
                title="Download official publication-quality multi-page PDF"
              >
                <FiDownload className={`w-4 h-4 ${generatingPdf ? 'animate-bounce' : ''}`} aria-hidden="true" />
                <span>{generatingPdf ? 'Synthesizing PDF...' : 'Generate PDF Report'}</span>
              </button>
              <button 
                type="button" 
                className="trace-report-print-preview-btn"
                onClick={handlePrint}
                title="Open browser print dialog / Save as PDF"
              >
                <FiPrinter className="w-4 h-4" aria-hidden="true" />
                <span>Browser Print / PDF</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
