import React from 'react';

// Color and configuration mapping for supported status/severity values
const STATUS_MAP = {
  critical: {
    label: 'Critical',
    color: 'var(--status-critical)',
    bg: 'var(--status-critical-bg)',
  },
  high: {
    label: 'High',
    color: 'var(--status-high)',
    bg: 'var(--status-high-bg)',
  },
  medium: {
    label: 'Medium',
    color: 'var(--status-medium)',
    bg: 'var(--status-medium-bg)',
  },
  low: {
    label: 'Low',
    color: 'var(--status-low)',
    bg: 'var(--status-low-bg)',
  },
  closed: {
    label: 'Closed',
    color: 'var(--status-closed)',
    bg: 'var(--status-closed-bg)',
  },
  // Common future status values
  open: {
    label: 'Open',
    color: 'var(--color-primary)',
    bg: 'var(--color-primary-light)',
  },
  investigating: {
    label: 'Investigating',
    color: 'var(--color-secondary)',
    bg: 'var(--color-secondary-light)',
  },
  verified: {
    label: 'Verified',
    color: 'var(--status-low)',
    bg: 'var(--status-low-bg)',
  },
  pending: {
    label: 'Pending',
    color: 'var(--text-secondary)',
    bg: 'rgba(255, 255, 255, 0.05)',
    dotColor: 'var(--text-muted)',
  },
};

// Fallback configuration for missing or unknown status values
const DEFAULT_STATUS = {
  color: 'var(--text-secondary)',
  bg: 'rgba(255, 255, 255, 0.05)',
  dotColor: 'var(--text-muted)',
};

/**
 * StatusBadge Component
 * A reusable, compact badge component for displaying cases, threat levels, and investigation status.
 *
 * @param {Object} props
 * @param {string} props.status - The severity/status string (case-insensitive)
 * @param {string} [props.className] - Optional custom CSS class name
 */
export default function StatusBadge({ status, className = '' }) {
  // Gracefully handle undefined/null status and normalize to lowercase string
  const normalizedKey = status ? String(status).trim().toLowerCase() : '';
  const config = STATUS_MAP[normalizedKey] || DEFAULT_STATUS;
  
  // Format the label (use mapped label if defined, fallback to original status text or 'UNKNOWN')
  const label = config.label || (status ? String(status).trim() : 'UNKNOWN');
  const dotColor = config.dotColor || config.color;

  // Inline CSS-in-JS styling mapping to TRACE AI DFIR global design variables
  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 8px',
    borderRadius: 'var(--radius-sm, 4px)',
    backgroundColor: config.bg,
    color: config.color,
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    userSelect: 'none',
    width: 'fit-content',
    lineHeight: '1.2',
  };

  const dotStyle = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: dotColor,
    flexShrink: 0,
  };

  return (
    <span style={badgeStyle} className={className}>
      <span style={dotStyle} />
      <span>{label}</span>
    </span>
  );
}
