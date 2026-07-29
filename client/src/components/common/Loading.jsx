import React from 'react';

/**
 * Loading Component
 * A reusable loading indicator for TRACE AI DFIR designed for dashboard widgets,
 * metrics panels, reports, and evidence grids.
 *
 * @param {Object} props
 * @param {string} [props.message="Loading..."] - Loading text shown below the spinner
 * @param {("small"|"medium"|"large")} [props.size="medium"] - Dimensions of the spinner
 * @param {string} [props.className=""] - Optional external class name
 */
export default function Loading({ message = 'Loading...', size = 'medium', className = '' }) {
  // Gracefully fallback to medium if an unsupported size is passed
  const normalizedSize = ['small', 'medium', 'large'].includes(size) ? size : 'medium';

  // Component configuration mapping based on selected size
  const sizeMap = {
    small: {
      spinnerSize: '16px',
      borderWidth: '2px',
      fontSize: '0.75rem',
      gap: '6px',
    },
    medium: {
      spinnerSize: '32px',
      borderWidth: '3px',
      fontSize: '0.875rem',
      gap: '10px',
    },
    large: {
      spinnerSize: '48px',
      borderWidth: '4px',
      fontSize: '1rem',
      gap: '14px',
    },
  };

  const currentSize = sizeMap[normalizedSize];

  // Inline CSS-in-JS layout styles mapping to standard variables
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: currentSize.gap,
    padding: '16px',
    width: '100%',
    height: '100%',
    userSelect: 'none',
  };

  const spinnerStyle = {
    width: currentSize.spinnerSize,
    height: currentSize.spinnerSize,
    borderRadius: '50%',
    border: `${currentSize.borderWidth} solid var(--color-primary-light, rgba(59, 130, 246, 0.1))`,
    borderTopColor: 'var(--color-primary, #3b82f6)',     /* Electric Blue */
    borderRightColor: 'var(--color-secondary, #06b6d4)', /* Cyan Accent */
    animation: 'trace-spinner-spin 0.85s linear infinite',
    boxSizing: 'border-box',
  };

  const textStyle = {
    color: 'var(--text-secondary, #cbd5e1)',
    fontSize: currentSize.fontSize,
    fontWeight: '500',
    letterSpacing: '0.03em',
    textAlign: 'center',
    lineHeight: '1.4',
  };

  return (
    <div
      className={className}
      style={containerStyle}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Inject self-contained keyframe animation rules */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes trace-spinner-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />

      {/* Visual spinner ring */}
      <div style={spinnerStyle} aria-hidden="true" />

      {/* Loading message */}
      {message && (
        <span style={textStyle}>
          {message}
        </span>
      )}
    </div>
  );
}
