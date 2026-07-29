import React, { useState } from 'react';

/**
 * ErrorMessage Component
 * A reusable, compact component to show error states and API failure notifications.
 *
 * @param {Object} props
 * @param {string} [props.message="Something went wrong. Please try again."] - Error description text
 * @param {Function} [props.onRetry] - Optional callback function to trigger a retry action
 * @param {string} [props.className=""] - Optional custom CSS class name
 */
export default function ErrorMessage({ 
  message = 'Something went wrong. Please try again.', 
  onRetry, 
  className = '' 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Gracefully fallback to default error message if the message is empty/missing
  const displayMessage = message ? String(message).trim() : 'Something went wrong. Please try again.';

  // Inline CSS-in-JS layout styles mapping to standard variables
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '10px 16px',
    backgroundColor: 'var(--status-critical-bg, rgba(239, 68, 68, 0.1))',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 'var(--radius-md, 8px)',
    width: '100%',
    boxSizing: 'border-box',
    userSelect: 'none',
  };

  const contentStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: '1 1 250px', // Allow flex wrap behavior on narrow screens
    minWidth: 0,
  };

  const iconStyle = {
    color: 'var(--status-critical, #ef4444)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const textStyle = {
    color: 'var(--text-primary, #f8fafc)',
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  };

  const buttonStyle = {
    backgroundColor: isHovered ? 'var(--status-critical, #ef4444)' : 'transparent',
    color: isHovered ? '#ffffff' : 'var(--status-critical, #ef4444)',
    border: '1px solid var(--status-critical, #ef4444)',
    borderRadius: 'var(--radius-sm, 4px)',
    padding: '5px 12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    transition: 'all var(--transition-speed, 200ms) ease',
    outline: isFocused ? '2px solid var(--color-primary, #3b82f6)' : 'none',
    outlineOffset: isFocused ? '2px' : 'none',
    flexShrink: 0,
    alignSelf: 'center',
  };

  return (
    <div 
      className={className} 
      style={containerStyle} 
      role="alert"
    >
      <div style={contentStyle}>
        {/* Error icon - standard warning triangle */}
        <div style={iconStyle} aria-hidden="true">
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        
        {/* Error Message Text */}
        <span style={textStyle}>{displayMessage}</span>
      </div>

      {/* Conditional Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          style={buttonStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          type="button"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
