import React, { useState } from 'react';
import { 
  FiActivity, 
  FiLock, 
  FiCpu, 
  FiGlobe, 
  FiAlertTriangle, 
  FiChevronRight 
} from 'react-icons/fi';

import StatusBadge from '../../components/common/StatusBadge';

// Coherent mock timeline events list
const TIMELINE_EVENTS = [
  {
    time: '10:29:48',
    type: 'Authentication',
    title: 'Repeated Login Failures',
    severity: 'Medium',
    evidence: 'security.evtx',
    description: 'Multiple failed authentication attempts were recorded for the target account within a short period.',
    icon: FiLock,
    isCorrelated: false,
  },
  {
    time: '10:31:14',
    type: 'Authentication',
    title: 'Authentication Anomaly',
    severity: 'High',
    evidence: 'security.evtx',
    description: 'A successful login occurred from an unusual source shortly after repeated authentication failures.',
    icon: FiLock,
    isCorrelated: true,
  },
  {
    time: '10:34:27',
    type: 'Process',
    title: 'Suspicious Process Execution',
    severity: 'Critical',
    evidence: 'memory.raw',
    description: 'An unusual PowerShell process pattern was identified during memory evidence review.',
    icon: FiCpu,
    isCorrelated: true,
  },
  {
    time: '10:36:52',
    type: 'Network',
    title: 'External Network Connection',
    severity: 'Medium',
    evidence: 'network.pcap',
    description: 'An outbound connection to an uncommon external destination was observed after the suspicious process event.',
    icon: FiGlobe,
    isCorrelated: true,
  },
  {
    time: '10:38:10',
    type: 'Alert',
    title: 'Threat Correlation Triggered',
    severity: 'High',
    evidence: 'Correlated Findings',
    description: 'TRACE AI correlated the authentication, process, and network findings into a single investigation sequence.',
    icon: FiAlertTriangle,
    isCorrelated: true,
  },
];

/**
 * TimelineTab Component
 * Renders the chronological investigation event timeline for security analysts.
 * Features inline event type categorizations, collapsible row details,
 * attack progression indicators, and multi-value local filters.
 *
 * @param {Object} props
 * @param {string} [props.caseId] - Parent case unique identifier
 */
export default function TimelineTab({ caseId = 'TRC-2026-0042' }) {
  // Local state managers
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedEvents, setExpandedEvents] = useState([]);

  // Expand / collapse single event toggle
  const toggleEventExpanded = (time) => {
    setExpandedEvents((prev) => 
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  // Local filtering engine
  const filteredEvents = TIMELINE_EVENTS.filter((item) => {
    if (activeFilter === 'All') return true;
    return item.type.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="trace-timeline-tab">
      {/* Component styles module */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-timeline-tab {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
            box-sizing: border-box;
          }

          /* Header & Stats segment */
          .trace-timeline-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            padding-bottom: 16px;
            box-sizing: border-box;
          }

          .trace-timeline-title-group {
            display: flex;
            flex-direction: column;
          }

          .trace-timeline-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            line-height: 1.2;
          }

          .trace-timeline-subtitle {
            font-size: 0.8125rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 4px 0 0 0;
            line-height: 1.4;
          }

          .trace-timeline-summary-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            user-select: none;
          }

          .trace-timeline-summary-pill {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 6px 12px;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-secondary, #cbd5e1);
            box-sizing: border-box;
          }

          .trace-timeline-summary-pill strong {
            color: var(--text-primary, #f8fafc);
            margin-left: 4px;
          }

          /* Attack Progression indicator */
          .trace-timeline-progression {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-secondary, #cbd5e1);
            flex-wrap: wrap;
            user-select: none;
            box-sizing: border-box;
          }

          .trace-progression-step {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-muted, #64748b);
          }

          .trace-progression-step.active {
            color: var(--color-secondary, #06b6d4);
          }

          .trace-progression-arrow {
            color: var(--text-muted, #64748b);
            opacity: 0.6;
            display: flex;
            align-items: center;
          }

          /* Filtering Toolbar */
          .trace-timeline-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            box-sizing: border-box;
          }

          .trace-timeline-filters {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .trace-timeline-filter-btn {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            color: var(--text-secondary, #cbd5e1);
            padding: 6px 12px;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
            box-sizing: border-box;
          }

          .trace-timeline-filter-btn:hover {
            background-color: rgba(255, 255, 255, 0.02);
            color: var(--text-primary, #f8fafc);
          }

          .trace-timeline-filter-btn.active {
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.1));
            border-color: var(--color-primary, #3b82f6);
            color: var(--text-primary, #f8fafc);
          }

          .trace-timeline-filter-btn:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
          }

          /* Chronological Timeline feed layout */
          .trace-timeline-container {
            position: relative;
            padding: 10px 0 32px 0;
            display: flex;
            flex-direction: column;
            gap: 24px;
            box-sizing: border-box;
          }

          /* Central visual vertical connecting line */
          .trace-timeline-line {
            position: absolute;
            left: 108px;
            top: 24px;
            bottom: 24px;
            width: 2px;
            background-color: var(--border-color, rgba(255, 255, 255, 0.08));
            z-index: 1;
          }

          .trace-timeline-event-item {
            display: flex;
            align-items: flex-start;
            position: relative;
            z-index: 2;
            box-sizing: border-box;
          }

          /* Column 1: Time (Monospaced alignment) */
          .trace-timeline-time-col {
            width: 80px;
            font-family: 'SFMono-Regular', Consolas, monospace;
            font-size: 0.8125rem;
            font-weight: 700;
            color: var(--text-muted, #64748b);
            text-align: right;
            padding-top: 10px;
            flex-shrink: 0;
            user-select: none;
          }

          /* Column 2: Visual Indicator Ring */
          .trace-timeline-icon-col {
            width: 58px;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            padding-top: 6px;
          }

          .trace-timeline-icon-dot {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background-color: var(--bg-surface, #0e1626);
            border: 2px solid var(--border-color, rgba(255, 255, 255, 0.08));
            color: var(--text-secondary, #cbd5e1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            z-index: 3;
            transition: all var(--transition-speed, 200ms) ease;
            box-sizing: border-box;
          }

          .trace-timeline-event-item:hover .trace-timeline-icon-dot {
            border-color: var(--color-primary, #3b82f6);
            color: var(--color-primary, #3b82f6);
          }

          .trace-timeline-icon-dot.critical {
            border-color: var(--status-critical, #ef4444);
            color: var(--status-critical, #ef4444);
            background-color: var(--status-critical-bg, rgba(239, 68, 68, 0.05));
          }

          .trace-timeline-icon-dot.high {
            border-color: var(--status-high, #f97316);
            color: var(--status-high, #f97316);
            background-color: var(--status-high-bg, rgba(249, 115, 22, 0.05));
          }

          /* Column 3: Event profile Card content */
          .trace-timeline-card-col {
            flex-grow: 1;
            min-width: 0;
          }

          .trace-timeline-event-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 16px;
            box-shadow: var(--shadow-sm);
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-sizing: border-box;
            text-align: left;
            width: 100%;
            border-style: solid;
          }

          .trace-timeline-event-card:hover {
            border-color: var(--border-color-hover, rgba(255, 255, 255, 0.15));
            background-color: rgba(255, 255, 255, 0.005);
          }

          .trace-timeline-event-card:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: -1px;
          }

          .trace-timeline-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }

          .trace-timeline-event-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0;
          }

          .trace-timeline-card-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.725rem;
            color: var(--text-muted, #64748b);
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.04em;
          }

          .trace-timeline-meta-type {
            color: var(--color-secondary, #06b6d4);
          }

          .trace-timeline-meta-evidence {
            font-family: monospace;
            background-color: rgba(255, 255, 255, 0.04);
            padding: 1px 5px;
            border-radius: 3px;
            color: var(--text-secondary, #cbd5e1);
            text-transform: none;
          }

          .trace-timeline-event-desc {
            font-size: 0.8125rem;
            line-height: 1.45;
            color: var(--text-secondary, #cbd5e1);
            margin: 0;
          }

          /* Collapsible Details Panel */
          .trace-timeline-card-details {
            border-top: 1px solid rgba(255, 255, 255, 0.03);
            padding-top: 12px;
            margin-top: 4px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: 0.8125rem;
            animation: trace-timeline-slideDown 200ms ease;
            box-sizing: border-box;
          }

          .trace-timeline-details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px 16px;
            box-sizing: border-box;
          }

          .trace-timeline-details-item {
            display: flex;
            gap: 6px;
            line-height: 1.4;
          }

          .trace-timeline-details-label {
            font-weight: 600;
            color: var(--text-muted, #64748b);
            width: 100px;
            flex-shrink: 0;
          }

          .trace-timeline-details-val {
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-timeline-details-val.monospace {
            font-family: monospace;
            color: var(--color-secondary, #06b6d4);
            font-size: 0.75rem;
          }

          .trace-timeline-correlated-badge {
            background-color: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.15);
            color: var(--color-primary, #3b82f6);
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 2px 6px;
            border-radius: 3px;
            width: fit-content;
            align-self: flex-start;
            margin-top: 4px;
            user-select: none;
          }

          /* Empty State placeholder card */
          .trace-timeline-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 48px 24px;
            text-align: center;
            gap: 12px;
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            box-sizing: border-box;
            user-select: none;
          }

          .trace-timeline-empty-icon {
            font-size: 2.5rem;
            color: var(--text-muted, #64748b);
            opacity: 0.5;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-timeline-empty-text {
            font-size: 0.95rem;
            font-weight: 500;
            color: var(--text-secondary, #cbd5e1);
            margin: 0;
            line-height: 1.4;
          }

          @keyframes trace-timeline-slideDown {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Responsive Layout */
          @media (max-width: 768px) {
            .trace-timeline-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }
            .trace-timeline-line {
              left: 24px;
            }
            .trace-timeline-event-item {
              flex-direction: column;
              padding-left: 48px;
              width: 100%;
            }
            .trace-timeline-time-col {
              width: auto;
              text-align: left;
              font-size: 0.75rem;
              padding-top: 0;
              margin-bottom: 6px;
              order: 2;
            }
            .trace-timeline-card-col {
              order: 3;
              width: 100%;
            }
            .trace-timeline-icon-col {
              position: absolute;
              left: 0;
              top: 0;
              width: 48px;
              padding-top: 0;
              order: 1;
            }
            .trace-timeline-details-grid {
              grid-template-columns: 1fr;
              gap: 8px;
            }
          }
        `
      }} />

      {/* Header Summary Telemetry area */}
      <div className="trace-timeline-header" role="region" aria-label="Timeline stats overview">
        <div className="trace-timeline-title-group">
          <h3 className="trace-timeline-title">Investigation Timeline</h3>
          <p className="trace-timeline-subtitle">
            Chronological sequence of correlated investigation events.
          </p>
        </div>
        <div className="trace-timeline-summary-row">
          <span className="trace-timeline-summary-pill">
            Events: <strong>5</strong>
          </span>
          <span className="trace-timeline-summary-pill">
            Critical Events: <strong>1</strong>
          </span>
          <span className="trace-timeline-summary-pill">
            First Activity: <strong>10:29:48</strong>
          </span>
          <span className="trace-timeline-summary-pill">
            Last Activity: <strong>10:38:10</strong>
          </span>
        </div>
      </div>

      {/* Breadcrumb-style Attack Progression summary */}
      <div className="trace-timeline-progression" role="region" aria-label="Incident attack progression path">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Progression:
        </span>
        <div className="trace-progression-step active">
          <span>Authentication</span>
        </div>
        <span className="trace-progression-arrow" aria-hidden="true">&rarr;</span>
        <div className="trace-progression-step active">
          <span>Process Execution</span>
        </div>
        <span className="trace-progression-arrow" aria-hidden="true">&rarr;</span>
        <div className="trace-progression-step active">
          <span>External Connection</span>
        </div>
        <span className="trace-progression-arrow" aria-hidden="true">&rarr;</span>
        <div className="trace-progression-step active">
          <span>Threat Correlation</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="trace-timeline-toolbar">
        <div className="trace-timeline-filters" role="group" aria-label="Filter events by category">
          {[
            { id: 'All', label: 'All Events' },
            { id: 'Authentication', label: 'Authentication' },
            { id: 'Process', label: 'Process' },
            { id: 'Network', label: 'Network' },
            { id: 'Alert', label: 'Alert' }
          ].map((btn) => {
            const isActive = activeFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                className={`trace-timeline-filter-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveFilter(btn.id)}
                aria-pressed={isActive}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vertical Timeline container */}
      {filteredEvents.length > 0 ? (
        <ol className="trace-timeline-container" aria-label="Incident timeline list">
          {/* Vertical line connector */}
          <div className="trace-timeline-line" aria-hidden="true" />

          {filteredEvents.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedEvents.includes(item.time);
            
            // Adjust center dot border colors according to severity levels
            let severityClass = 'normal';
            if (item.severity.toLowerCase() === 'critical') severityClass = 'critical';
            else if (item.severity.toLowerCase() === 'high') severityClass = 'high';

            return (
              <li key={item.time} className="trace-timeline-event-item">
                
                {/* Column 1: Time */}
                <div className="trace-timeline-time-col">
                  <time>{item.time}</time>
                </div>

                {/* Column 2: Visual icon node */}
                <div className="trace-timeline-icon-col">
                  <div 
                    className={`trace-timeline-icon-dot ${severityClass}`} 
                    aria-label={`Event category: ${item.type}`}
                  >
                    <Icon aria-hidden="true" />
                  </div>
                </div>

                {/* Column 3: Event card content */}
                <div className="trace-timeline-card-col">
                  <button
                    type="button"
                    className="trace-timeline-event-card"
                    onClick={() => toggleEventExpanded(item.time)}
                    aria-expanded={isExpanded}
                    aria-label={`Event at ${item.time}: ${item.title}. Severity: ${item.severity}. Click to toggle details.`}
                  >
                    <div className="trace-timeline-card-header">
                      <h4 className="trace-timeline-event-title">{item.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="trace-timeline-card-meta">
                          <span className="trace-timeline-meta-type">{item.type}</span>
                          <span className="trace-timeline-meta-evidence">{item.evidence}</span>
                        </div>
                        <StatusBadge status={item.severity} />
                      </div>
                    </div>

                    {/* Standard compact preview description */}
                    <p className="trace-timeline-event-desc">
                      {item.description}
                    </p>

                    {/* Collapsible Details Drawer */}
                    {isExpanded && (
                      <div className="trace-timeline-card-details">
                        <div className="trace-timeline-details-grid">
                          <div className="trace-timeline-details-item">
                            <span className="trace-timeline-details-label">Event Type:</span>
                            <span className="trace-timeline-details-val">{item.type}</span>
                          </div>
                          <div className="trace-timeline-details-item">
                            <span className="trace-timeline-details-label">Timestamp:</span>
                            <span className="trace-timeline-details-val monospace">{item.time}</span>
                          </div>
                          <div className="trace-timeline-details-item">
                            <span className="trace-timeline-details-label">Evidence Source:</span>
                            <span className="trace-timeline-details-val monospace">{item.evidence}</span>
                          </div>
                          <div className="trace-timeline-details-item">
                            <span className="trace-timeline-details-label">Severity Level:</span>
                            <span className="trace-timeline-details-val">{item.severity}</span>
                          </div>
                        </div>

                        {item.isCorrelated && (
                          <span className="trace-timeline-correlated-badge">
                            Correlated Event
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                </div>

              </li>
            );
          })}
        </ol>
      ) : (
        /* Empty State block if filter results are empty */
        <div className="trace-timeline-empty-state" role="region" aria-label="No matching events found">
          <div className="trace-timeline-empty-icon" aria-hidden="true">
            <FiActivity />
          </div>
          <p className="trace-timeline-empty-text">No timeline events match this filter.</p>
        </div>
      )}

    </div>
  );
}
