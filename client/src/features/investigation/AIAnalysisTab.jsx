import React, { useState, useEffect, useRef } from 'react';
import { 
  FiCpu, 
  FiActivity, 
  FiAlertTriangle, 
  FiFileText, 
  FiCheckCircle, 
  FiSend, 
  FiInfo 
} from 'react-icons/fi';

import StatusBadge from '../../components/common/StatusBadge';

// The six structured stages in the simulated triage timeline
const ANALYSIS_STAGES = [
  'Processing Evidence',
  'Detecting Suspicious Indicators',
  'Correlating Events',
  'Calculating Risk Score',
  'Building Attack Timeline',
  'Generating AI Summary',
];

// Grounded answers dictionary for prototype Ask TRACE AI chatbot
const GROUNDED_ANSWERS = {
  'why is this case high risk?': 
    'The case is assessed as HIGH risk because the evidence shows correlated authentication anomalies, suspicious PowerShell execution, and an external network connection. Authentication risk is the strongest contributor at 88/100.',
  
  'what is the most suspicious activity?': 
    'The most severe finding is the suspicious process execution identified in memory.raw at 10:34:27, which is classified as Critical.',
  
  'which evidence contributed most to the risk score?': 
    'security.evtx contributed strongly to the assessment because it contains the authentication anomaly associated with an Authentication Risk score of 88.',
  
  'summarize the attack sequence.': 
    'The observed sequence begins with an authentication anomaly at 10:31:14, followed by suspicious process execution at 10:34:27, and then an external network connection at 10:36:52.'
};

/**
 * AIAnalysisTab Component
 * Renders the primary AI Investigation findings, threat metrics gauges,
 * chronological indicators lists, and grounded question triggers.
 *
 * @param {Object} props
 * @param {string} [props.caseId] - Parent case unique identifier
 */
export default function AIAnalysisTab({ caseId = 'TRC-2026-0042' }) {
  // Main states: 'idle' | 'analyzing' | 'complete'
  const [analysisState, setAnalysisState] = useState('idle');
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Chatbot states
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  // Timer reference to avoid leaks
  const timerRef = useRef(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Triggers the simulated multi-stage timeline sequence
  const handleRunAnalysis = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setAnalysisState('analyzing');
    setProgress(0);
    setCurrentStageIndex(0);
    setQuestion('');
    setAnswer('');

    let currentProgress = 0;

    timerRef.current = setInterval(() => {
      currentProgress += 5;
      
      if (currentProgress <= 100) {
        setProgress(currentProgress);
        
        // Map percentages to active stage indexes
        if (currentProgress <= 15) {
          setCurrentStageIndex(0);
        } else if (currentProgress <= 35) {
          setCurrentStageIndex(1);
        } else if (currentProgress <= 55) {
          setCurrentStageIndex(2);
        } else if (currentProgress <= 75) {
          setCurrentStageIndex(3);
        } else if (currentProgress <= 90) {
          setCurrentStageIndex(4);
        } else {
          setCurrentStageIndex(5);
        }
      }

      if (currentProgress >= 100) {
        clearInterval(timerRef.current);
        // Short pause on completion state before drawing results
        setTimeout(() => {
          setAnalysisState('complete');
        }, 500);
      }
    }, 120); // Simulated lifecycle finishes in ~2.4s
  };

  // Submit grounded question
  const handleAskQuestion = (e) => {
    if (e) e.preventDefault();
    const cleanQuery = question.trim().toLowerCase();
    if (!cleanQuery || isAnswering) return;

    setIsAnswering(true);
    setAnswer('');

    // Simulate standard model processing lag
    setTimeout(() => {
      const groundedResponse = GROUNDED_ANSWERS[cleanQuery];
      if (groundedResponse) {
        setAnswer(groundedResponse);
      } else {
        setAnswer('I can answer questions only about the findings, risk data, evidence, and timeline available in this case.');
      }
      setIsAnswering(false);
    }, 600);
  };

  // Preset question selectors click trigger
  const handleSelectSuggestion = (suggestedText) => {
    setQuestion(suggestedText);
    // Prepare for direct submission
    setIsAnswering(true);
    setAnswer('');
    setTimeout(() => {
      const groundedResponse = GROUNDED_ANSWERS[suggestedText.trim().toLowerCase()];
      setAnswer(groundedResponse || 'I can answer questions only about the findings, risk data, evidence, and timeline available in this case.');
      setIsAnswering(false);
    }, 600);
  };

  // Reset/Replay
  const handleRerun = () => {
    handleRunAnalysis();
  };

  return (
    <div className="trace-ai-tab">
      {/* Component styles module */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-ai-tab {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
            box-sizing: border-box;
          }

          /* Idle State Cards */
          .trace-ai-idle-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 40px 32px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            max-width: 580px;
            margin: 20px auto;
            box-shadow: var(--shadow-sm);
            box-sizing: border-box;
            user-select: none;
          }

          .trace-ai-idle-icon {
            font-size: 3rem;
            color: var(--color-primary, #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-ai-idle-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 0;
          }

          .trace-ai-idle-desc {
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            line-height: 1.55;
            margin: 0;
          }

          .trace-ai-idle-info {
            display: flex;
            gap: 16px;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 10px 16px;
            font-size: 0.8125rem;
            font-weight: 500;
            color: var(--text-secondary, #cbd5e1);
            margin-top: 4px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .trace-ai-idle-info span strong {
            color: var(--text-primary, #f8fafc);
          }

          .trace-ai-run-btn {
            background-color: var(--color-primary, #3b82f6);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-sm, 4px);
            padding: 10px 24px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color var(--transition-speed, 200ms) ease;
            outline: none;
            margin-top: 8px;
          }

          .trace-ai-run-btn:hover {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-ai-run-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
          }

          /* Analyzing Triage Progress Panel */
          .trace-ai-progress-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 32px;
            max-width: 580px;
            margin: 20px auto;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-sizing: border-box;
            width: 100%;
          }

          .trace-ai-progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
          }

          .trace-ai-progress-title {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0;
          }

          .trace-ai-progress-percent {
            font-family: 'SFMono-Regular', Consolas, monospace;
            font-weight: 700;
            color: var(--color-secondary, #06b6d4);
            font-size: 0.875rem;
          }

          .trace-ai-progress-bar-track {
            width: 100%;
            height: 6px;
            background-color: var(--bg-secondary, #0a0f1d);
            border-radius: var(--radius-full, 9999px);
            overflow: hidden;
          }

          .trace-ai-progress-bar-fill {
            height: 100%;
            background-color: var(--color-primary, #3b82f6);
            transition: width 120ms linear;
          }

          .trace-ai-stages-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 8px;
            user-select: none;
          }

          .trace-ai-stage-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-muted, #64748b);
          }

          .trace-ai-stage-item.complete {
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-ai-stage-item.active {
            color: var(--color-primary, #3b82f6);
            font-weight: 600;
          }

          .trace-ai-stage-dot {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
            font-weight: 700;
            box-sizing: border-box;
            flex-shrink: 0;
          }

          .trace-ai-stage-dot.complete {
            background-color: var(--status-low-bg, rgba(34, 197, 94, 0.15));
            border: 1px solid var(--status-low, #22c55e);
            color: var(--status-low, #22c55e);
          }

          .trace-ai-stage-dot.active {
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.15));
            border: 1px solid var(--color-primary, #3b82f6);
            color: var(--color-primary, #3b82f6);
            animation: trace-ai-pulse-dot 1s infinite alternate;
          }

          .trace-ai-stage-dot.pending {
            border: 1px dashed var(--text-muted, #64748b);
            color: var(--text-muted, #64748b);
          }

          @keyframes trace-ai-pulse-dot {
            from { opacity: 0.55; }
            to { opacity: 1; }
          }

          /* Results workspace template */
          .trace-ai-results-grid {
            display: grid;
            grid-template-columns: 1fr 1.8fr;
            gap: 20px;
            box-sizing: border-box;
          }

          .trace-ai-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 20px;
            box-shadow: var(--shadow-sm);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .trace-ai-card-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            padding-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
          }

          .trace-ai-rerun-btn {
            background: transparent;
            border: none;
            color: var(--text-muted, #64748b);
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: color var(--transition-speed, 200ms);
            text-decoration: underline;
            outline: none;
            padding: 0;
          }

          .trace-ai-rerun-btn:hover {
            color: var(--color-primary, #3b82f6);
          }

          .trace-ai-rerun-btn:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 1px;
          }

          /* Gauge styling */
          .trace-ai-gauge-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
            box-sizing: border-box;
          }

          .trace-ai-gauge-svg {
            width: 100px;
            height: 100px;
            display: block;
          }

          .trace-ai-gauge-bg {
            stroke: rgba(255, 255, 255, 0.03);
            stroke-width: 8;
            fill: none;
          }

          .trace-ai-gauge-fill {
            stroke: var(--status-high, #f97316); /* orange High level code color */
            stroke-width: 8;
            stroke-linecap: round;
            fill: none;
            transform: rotate(-90deg);
            transform-origin: 50% 50%;
            stroke-dasharray: 251.32;
            stroke-dashoffset: 45.24; /* (1 - 0.82) * 251.32 = 82% */
            animation: trace-gauge-fill-anim 1s ease-out;
          }

          @keyframes trace-gauge-fill-anim {
            from { stroke-dashoffset: 251.32; }
            to { stroke-dashoffset: 45.24; }
          }

          .trace-ai-gauge-text {
            fill: var(--text-primary, #f8fafc);
            font-size: 19px;
            font-weight: 700;
            text-anchor: middle;
            font-family: 'SFMono-Regular', Consolas, monospace;
          }

          .trace-ai-gauge-subtext {
            fill: var(--text-muted, #64748b);
            font-size: 8px;
            font-weight: 600;
            text-anchor: middle;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          /* Risk breakdown categories */
          .trace-ai-breakdown-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-sizing: border-box;
          }

          .trace-ai-breakdown-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .trace-ai-breakdown-label-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-ai-breakdown-bar-track {
            width: 100%;
            height: 4px;
            background-color: var(--bg-secondary, #0a0f1d);
            border-radius: var(--radius-full, 9999px);
            overflow: hidden;
          }

          .trace-ai-breakdown-bar-fill {
            height: 100%;
            border-radius: var(--radius-full, 9999px);
            background-color: var(--color-primary, #3b82f6);
            transition: width 1s ease;
          }

          .trace-ai-breakdown-bar-fill.high {
            background-color: var(--status-high, #f97316);
          }

          /* General summary list */
          .trace-ai-meta-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.03);
            padding-top: 14px;
            box-sizing: border-box;
          }

          .trace-ai-meta-item {
            display: flex;
            justify-content: space-between;
            font-size: 0.8125rem;
          }

          .trace-ai-meta-label {
            color: var(--text-muted, #64748b);
            font-weight: 500;
          }

          .trace-ai-meta-val {
            color: var(--text-primary, #f8fafc);
            font-weight: 600;
          }

          /* Suspicious Indicators finding cards */
          .trace-ai-findings-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-sizing: border-box;
          }

          .trace-ai-finding-card {
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-sizing: border-box;
          }

          .trace-ai-finding-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .trace-ai-finding-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
          }

          .trace-ai-finding-meta-row {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.75rem;
            color: var(--text-muted, #64748b);
            font-family: monospace;
          }

          .trace-ai-finding-meta-item span {
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-ai-finding-desc {
            font-size: 0.8125rem;
            line-height: 1.45;
            color: var(--text-secondary, #cbd5e1);
            margin: 0;
          }

          /* Summary details text */
          .trace-ai-summary-text {
            font-size: 0.875rem;
            line-height: 1.5;
            color: var(--text-secondary, #cbd5e1);
            margin: 0;
          }

          .trace-ai-summary-badge {
            background-color: rgba(6, 182, 212, 0.1);
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

          /* Ask TRACE AI chatbot capsule */
          .trace-ai-chat-card {
            margin-top: 8px;
            box-sizing: border-box;
          }

          .trace-ai-chat-subtitle {
            font-size: 0.8125rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 4px 0 12px 0;
          }

          .trace-ai-chat-suggestions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 12px;
          }

          .trace-ai-chat-suggestion-btn {
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-full, 9999px);
            color: var(--text-secondary, #cbd5e1);
            padding: 5px 12px;
            font-size: 0.725rem;
            font-weight: 500;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
          }

          .trace-ai-chat-suggestion-btn:hover {
            border-color: var(--color-primary, #3b82f6);
            background-color: rgba(59, 130, 246, 0.02);
            color: var(--text-primary, #f8fafc);
          }

          .trace-ai-chat-suggestion-btn:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
          }

          .trace-ai-chat-input-row {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .trace-ai-chat-input-wrap {
            position: relative;
            display: flex;
            align-items: center;
            flex: 1;
          }

          .trace-ai-chat-input {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 10px 14px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            transition: border-color var(--transition-speed, 200ms) ease;
            height: 38px;
            box-sizing: border-box;
          }

          .trace-ai-chat-input:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.1));
          }

          .trace-ai-chat-ask-btn {
            background-color: var(--color-primary, #3b82f6);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-sm, 4px);
            padding: 8px 16px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color var(--transition-speed, 200ms) ease;
            outline: none;
            height: 38px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            user-select: none;
            flex-shrink: 0;
          }

          .trace-ai-chat-ask-btn:hover:not(:disabled) {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-ai-chat-ask-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }

          .trace-ai-chat-ask-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
          }

          /* Chat Response Balloon card */
          .trace-ai-chat-response-box {
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 16px;
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-sizing: border-box;
            animation: trace-ai-slideDown 250ms ease;
          }

          .trace-ai-chat-response-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.725rem;
            font-weight: 700;
            user-select: none;
          }

          .trace-ai-chat-response-badge {
            color: var(--color-primary, #3b82f6);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .trace-ai-chat-response-source {
            color: var(--text-muted, #64748b);
            font-weight: 500;
          }

          .trace-ai-chat-response-body {
            font-size: 0.875rem;
            line-height: 1.45;
            color: var(--text-secondary, #cbd5e1);
            margin: 0;
          }

          .trace-ai-chat-spinner {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.15);
            border-top-color: var(--color-primary, #3b82f6);
            animation: trace-btn-spin 0.75s linear infinite;
            flex-shrink: 0;
            display: inline-block;
          }

          @keyframes trace-ai-slideDown {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Responsive Layout */
          @media (max-width: 992px) {
            .trace-ai-results-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 768px) {
            .trace-ai-idle-card,
            .trace-ai-progress-card {
              padding: 24px 16px;
              margin: 10px 0;
            }
          }
        `
      }} />

      {/* State 1: IDLE Intro State */}
      {analysisState === 'idle' && (
        <section className="trace-ai-idle-card" aria-label="Run Triage introduction">
          <div className="trace-ai-idle-icon" aria-hidden="true">
            <FiCpu />
          </div>
          <h3 className="trace-ai-idle-title">AI Investigation</h3>
          <p className="trace-ai-idle-desc">
            Analyze case evidence to identify suspicious activity, correlate events, and assess investigation risk score.
          </p>

          <div className="trace-ai-idle-info">
            <span>Evidence Ready: <strong>4 files</strong></span>
            <span>Case: <strong>{caseId}</strong></span>
            <span>Analysis Status: <strong>Ready</strong></span>
          </div>

          <button
            type="button"
            className="trace-ai-run-btn"
            onClick={handleRunAnalysis}
            title="Start simulated AI triangulation"
          >
            Run AI Analysis
          </button>
        </section>
      )}

      {/* State 2: ANALYZING Simulated Progress Ticker State */}
      {analysisState === 'analyzing' && (
        <section 
          className="trace-ai-progress-card" 
          aria-label="AI triage in progress"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="trace-ai-progress-header">
            <h3 className="trace-ai-progress-title">Analyzing evidence...</h3>
            <span className="trace-ai-progress-percent">{progress}%</span>
          </div>

          <div className="trace-ai-progress-bar-track">
            <div 
              className="trace-ai-progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Verification checklist tracker */}
          <div className="trace-ai-stages-list">
            {ANALYSIS_STAGES.map((stage, idx) => {
              const isComplete = idx < currentStageIndex;
              const isActive = idx === currentStageIndex;
              
              let stepClass = 'pending';
              if (isComplete) stepClass = 'complete';
              else if (isActive) stepClass = 'active';

              return (
                <div key={stage} className={`trace-ai-stage-item ${stepClass}`}>
                  <div className={`trace-ai-stage-dot ${stepClass}`} aria-hidden="true">
                    {isComplete ? <FiCheckCircle /> : idx + 1}
                  </div>
                  <span>{stage}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* State 3: COMPLETE Results State */}
      {analysisState === 'complete' && (
        <div className="trace-ai-results-grid" role="region" aria-label="Investigation findings report">
          
          {/* Left Column: Risk scores & gauge metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Risk Score gauge card */}
            <section className="trace-ai-card" aria-label="Threat Assessment Gauge">
              <div className="trace-ai-card-title">
                <span>Risk Assessment</span>
                <button 
                  type="button" 
                  className="trace-ai-rerun-btn"
                  onClick={handleRerun}
                  title="Replay simulated analysis sequence"
                >
                  Re-run Analysis
                </button>
              </div>

              <div className="trace-ai-gauge-container">
                <svg className="trace-ai-gauge-svg" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" className="trace-ai-gauge-bg" />
                  <circle cx="50" cy="50" r="40" className="trace-ai-gauge-fill" />
                  <text x="50" y="52" className="trace-ai-gauge-text">82</text>
                  <text x="50" y="68" className="trace-ai-gauge-subtext">Risk Score</text>
                </svg>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Threat Level:
                  </span>
                  <StatusBadge status="High" />
                </div>
              </div>

              {/* Risk Category Breakdown Progress Bars */}
              <div className="trace-ai-breakdown-list" aria-label="Risk category breakdown details">
                
                {/* Category 1: Auth Risk */}
                <div className="trace-ai-breakdown-item">
                  <div className="trace-ai-breakdown-label-row">
                    <span>Authentication Risk</span>
                    <span>88</span>
                  </div>
                  <div className="trace-ai-breakdown-bar-track">
                    <div className="trace-ai-breakdown-bar-fill high" style={{ width: '88%' }} />
                  </div>
                </div>

                {/* Category 2: Process Risk */}
                <div className="trace-ai-breakdown-item">
                  <div className="trace-ai-breakdown-label-row">
                    <span>Process Risk</span>
                    <span>79</span>
                  </div>
                  <div className="trace-ai-breakdown-bar-track">
                    <div className="trace-ai-breakdown-bar-fill" style={{ width: '79%' }} />
                  </div>
                </div>

                {/* Category 3: Network Risk */}
                <div className="trace-ai-breakdown-item">
                  <div className="trace-ai-breakdown-label-row">
                    <span>Network Risk</span>
                    <span>74</span>
                  </div>
                  <div className="trace-ai-breakdown-bar-track">
                    <div className="trace-ai-breakdown-bar-fill" style={{ width: '74%' }} />
                  </div>
                </div>

              </div>

              {/* General Metadata Metrics list */}
              <div className="trace-ai-meta-list">
                <div className="trace-ai-meta-item">
                  <span className="trace-ai-meta-label">Evidence Analyzed</span>
                  <span className="trace-ai-meta-val">4</span>
                </div>
                <div className="trace-ai-meta-item">
                  <span className="trace-ai-meta-label">Indicators Found</span>
                  <span className="trace-ai-meta-val">3</span>
                </div>
                <div className="trace-ai-meta-item">
                  <span className="trace-ai-meta-label">Assessed Threat Level</span>
                  <span className="trace-ai-meta-val">High</span>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column: AI Triage Summary and Findings timeline list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* AI Summary card */}
            <section className="trace-ai-card" aria-label="Investigation Summary Report">
              <div className="trace-ai-card-title">
                <span>AI Investigation Summary</span>
                <span className="trace-ai-summary-badge">Prototype Analysis</span>
              </div>
              <p className="trace-ai-summary-text">
                The available case evidence indicates a sequence beginning with abnormal authentication activity, followed by suspicious process execution and an external network connection. The correlated events produce a HIGH threat assessment with a risk score of 82/100. The authentication and process findings contributed most strongly to the current assessment.
              </p>
            </section>

            {/* Suspicious Indicators directory card */}
            <section className="trace-ai-card" aria-label="Suspicious indicators timeline list">
              <h4 className="trace-ai-card-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                Suspicious Indicators (3)
              </h4>

              <div className="trace-ai-findings-list">
                
                {/* Finding 1: Auth anomaly */}
                <div className="trace-ai-finding-card">
                  <div className="trace-ai-finding-header">
                    <span className="trace-ai-finding-title">Authentication Anomaly</span>
                    <StatusBadge status="High" />
                  </div>
                  <div className="trace-ai-finding-meta-row">
                    <span className="trace-ai-finding-meta-item">
                      Time: <span>10:31:14</span>
                    </span>
                    <span className="trace-ai-finding-meta-item">
                      Evidence: <span>security.evtx</span>
                    </span>
                  </div>
                  <p className="trace-ai-finding-desc">
                    Multiple failed authentication attempts were followed by a successful login from an unusual source.
                  </p>
                </div>

                {/* Finding 2: PowerShell process execution */}
                <div className="trace-ai-finding-card">
                  <div className="trace-ai-finding-header">
                    <span className="trace-ai-finding-title">Suspicious Process Execution</span>
                    <StatusBadge status="Critical" />
                  </div>
                  <div className="trace-ai-finding-meta-row">
                    <span className="trace-ai-finding-meta-item">
                      Time: <span>10:34:27</span>
                    </span>
                    <span className="trace-ai-finding-meta-item">
                      Evidence: <span>memory.raw</span>
                    </span>
                  </div>
                  <p className="trace-ai-finding-desc">
                    An unusual PowerShell process pattern was identified during evidence review.
                  </p>
                </div>

                {/* Finding 3: Network Connection */}
                <div className="trace-ai-finding-card">
                  <div className="trace-ai-finding-header">
                    <span className="trace-ai-finding-title">External Network Connection</span>
                    <StatusBadge status="Medium" />
                  </div>
                  <div className="trace-ai-finding-meta-row">
                    <span className="trace-ai-finding-meta-item">
                      Time: <span>10:36:52</span>
                    </span>
                    <span className="trace-ai-finding-meta-item">
                      Evidence: <span>network.pcap</span>
                    </span>
                  </div>
                  <p className="trace-ai-finding-desc">
                    An outbound connection to an uncommon external destination was observed shortly after the suspicious process event.
                  </p>
                </div>

              </div>
            </section>

            {/* Ask TRACE AI Lite chatbot card */}
            <section className="trace-ai-card trace-ai-chat-card" aria-label="TRACE AI Investigation assistant">
              <h4 className="trace-ai-card-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <label htmlFor="trace-chatbot-input-field">Ask TRACE AI</label>
              </h4>
              <p className="trace-ai-chat-subtitle">
                Ask one question about the current investigation.
              </p>

              {/* suggested preset questions buttons */}
              <div className="trace-ai-chat-suggestions">
                <button 
                  type="button" 
                  className="trace-ai-chat-suggestion-btn"
                  onClick={() => handleSelectSuggestion('Why is this case HIGH risk?')}
                  disabled={isAnswering}
                >
                  Why is this case HIGH risk?
                </button>
                <button 
                  type="button" 
                  className="trace-ai-chat-suggestion-btn"
                  onClick={() => handleSelectSuggestion('What is the most suspicious activity?')}
                  disabled={isAnswering}
                >
                  What is the most suspicious activity?
                </button>
                <button 
                  type="button" 
                  className="trace-ai-chat-suggestion-btn"
                  onClick={() => handleSelectSuggestion('Which evidence contributed most to the risk score?')}
                  disabled={isAnswering}
                >
                  Which evidence contributed most to the risk score?
                </button>
                <button 
                  type="button" 
                  className="trace-ai-chat-suggestion-btn"
                  onClick={() => handleSelectSuggestion('Summarize the attack sequence?')}
                  disabled={isAnswering}
                >
                  Summarize the attack sequence.
                </button>
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleAskQuestion} className="trace-ai-chat-input-row" noValidate>
                <div className="trace-ai-chat-input-wrap">
                  <input
                    id="trace-chatbot-input-field"
                    type="text"
                    className="trace-ai-chat-input"
                    placeholder="Ask TRACE AI about this investigation..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={isAnswering}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="trace-ai-chat-ask-btn"
                  disabled={isAnswering || !question.trim()}
                >
                  {isAnswering ? (
                    <span className="trace-ai-chat-spinner" aria-hidden="true" />
                  ) : (
                    <FiSend aria-hidden="true" />
                  )}
                  <span>Ask</span>
                </button>
              </form>

              {/* Chat Answer Box balloon */}
              {answer && (
                <div className="trace-ai-chat-response-box" role="status" aria-live="polite">
                  <div className="trace-ai-chat-response-header">
                    <span className="trace-ai-chat-response-badge">
                      <FiCpu aria-hidden="true" style={{ fontSize: '0.8rem' }} /> TRACE AI
                    </span>
                    <span className="trace-ai-chat-response-source">
                      Based on current case findings
                    </span>
                  </div>
                  <p className="trace-ai-chat-response-body">
                    {answer}
                  </p>
                </div>
              )}
            </section>

          </div>

        </div>
      )}
    </div>
  );
}
