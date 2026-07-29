import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

// Visual options list for severity selector
const SEVERITY_OPTIONS = [
  { value: 'Critical', colorClass: 'critical', label: 'Critical' },
  { value: 'High', colorClass: 'high', label: 'High' },
  { value: 'Medium', colorClass: 'medium', label: 'Medium' },
  { value: 'Low', colorClass: 'low', label: 'Low' },
];

/**
 * CreateCase Component
 * Provides the creation workflow dashboard for starting new forensics cases.
 * Features inline input constraints, character telemetry trackers, accessibility markup,
 * and simulated prototype redirection.
 */
export default function CreateCase() {
  const navigate = useNavigate();

  // Auth Guard
  const hasSession = sessionStorage.getItem('arclight-dev-session') === 'active';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Form Field States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [severity, setSeverity] = useState('');
  const [assignedInvestigator, setAssignedInvestigator] = useState('');

  // Status flags
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!hasSession) return null;

  const handleLogout = () => {
    sessionStorage.removeItem('arclight-dev-session');
    navigate('/login', { replace: true });
  };

  // Form input validation checks
  const validateForm = () => {
    const tempErrors = {};

    if (!title.trim()) {
      tempErrors.title = 'Case title is required';
    }

    if (!description.trim()) {
      tempErrors.description = 'Description is required';
    } else if (description.length > 1000) {
      tempErrors.description = 'Description must not exceed 1000 characters';
    }

    if (!incidentType) {
      tempErrors.incidentType = 'Please select an incident type';
    }

    if (!severity) {
      tempErrors.severity = 'Please select a severity level';
    }

    if (!assignedInvestigator) {
      tempErrors.assignedInvestigator = 'Please assign an investigator';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit flow
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (validateForm()) {
      setIsSubmitting(true);
      setErrors({});

      // Simulate prototype case creation delay before navigating
      setTimeout(() => {
        setShowSuccess(true);
        
        setTimeout(() => {
          setIsSubmitting(false);
          setShowSuccess(false);
          // Route back to the newly generated case details screen (prototype endpoint)
          navigate('/cases/TRC-2026-0043');
        }, 1200);
      }, 1000);
    }
  };

  return (
    <div className="trace-create-layout">
      {/* Scope component styling block */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-create-layout {
            display: flex;
            min-height: 100vh;
            background-color: var(--bg-main, #060913);
            color: var(--text-primary, #f8fafc);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            width: 100%;
            box-sizing: border-box;
          }

          .trace-create-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            height: 100vh;
            overflow: hidden;
            box-sizing: border-box;
          }

          .trace-create-content {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-sizing: border-box;
          }

          /* Header area styling */
          .trace-create-back-btn {
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

          .trace-create-back-btn:hover {
            color: var(--color-primary, #3b82f6);
          }

          .trace-create-back-btn:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 2px;
            border-radius: var(--radius-xs, 2px);
          }

          .trace-create-header-row {
            display: flex;
            flex-direction: column;
            margin-bottom: 8px;
          }

          .trace-create-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            line-height: 1.2;
          }

          .trace-create-subtitle {
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 4px 0 0 0;
            line-height: 1.4;
          }

          /* Form Card Panel */
          .trace-create-form-workspace {
            display: flex;
            justify-content: center;
            width: 100%;
          }

          .trace-create-card {
            width: 100%;
            max-width: 700px;
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 32px;
            box-shadow: var(--shadow-md);
            box-sizing: border-box;
          }

          .trace-create-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .trace-create-form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .trace-create-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            width: 100%;
          }

          .trace-create-field.full-width {
            grid-column: span 2;
          }

          .trace-create-label {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-secondary, #cbd5e1);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .trace-create-input {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 10px 12px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            transition: border-color var(--transition-speed, 200ms) ease;
            height: 40px;
            box-sizing: border-box;
          }

          .trace-create-input:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.1));
          }

          .trace-create-input.error {
            border-color: var(--status-critical, #ef4444);
            box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
          }

          .trace-create-textarea {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 10px 12px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            transition: border-color var(--transition-speed, 200ms) ease;
            height: 110px;
            box-sizing: border-box;
            resize: vertical;
            font-family: inherit;
            line-height: 1.4;
          }

          .trace-create-textarea:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.1));
          }

          .trace-create-textarea.error {
            border-color: var(--status-critical, #ef4444);
            box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
          }

          .trace-create-select {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            padding: 10px 24px 10px 12px;
            height: 40px;
            outline: none;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
            background-repeat: no-repeat;
            background-position: right 12px center;
            background-size: 14px;
            box-sizing: border-box;
          }

          .trace-create-select:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.1));
          }

          .trace-create-select.error {
            border-color: var(--status-critical, #ef4444);
            box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
          }

          /* Severity Selector Pills */
          .trace-create-severity-wrapper {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            width: 100%;
            box-sizing: border-box;
          }

          .trace-create-severity-btn {
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            color: var(--text-secondary, #cbd5e1);
            padding: 8px 12px;
            font-size: 0.8125rem;
            font-weight: 600;
            text-align: center;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
            user-select: none;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }

          .trace-create-severity-btn:hover {
            background-color: rgba(255, 255, 255, 0.02);
            border-color: var(--border-color-hover, rgba(255, 255, 255, 0.15));
          }

          .trace-create-severity-btn:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 1px;
          }

          .trace-create-severity-btn.selected {
            color: #ffffff;
            font-weight: 700;
          }

          .trace-create-severity-btn.selected.critical {
            border-color: var(--status-critical, #ef4444);
            background-color: var(--status-critical-bg, rgba(239, 68, 68, 0.15));
            color: var(--status-critical, #ef4444);
          }

          .trace-create-severity-btn.selected.high {
            border-color: var(--status-high, #f97316);
            background-color: var(--status-high-bg, rgba(249, 115, 22, 0.15));
            color: var(--status-high, #f97316);
          }

          .trace-create-severity-btn.selected.medium {
            border-color: var(--status-medium, #eab308);
            background-color: var(--status-medium-bg, rgba(234, 179, 8, 0.15));
            color: var(--status-medium, #eab308);
          }

          .trace-create-severity-btn.selected.low {
            border-color: var(--status-low, #22c55e);
            background-color: var(--status-low-bg, rgba(34, 197, 94, 0.15));
            color: var(--status-low, #22c55e);
          }

          .trace-create-char-counter {
            font-size: 0.75rem;
            color: var(--text-muted, #64748b);
            font-weight: 500;
          }

          .trace-create-validation-error {
            font-size: 0.75rem;
            color: var(--status-critical, #ef4444);
            font-weight: 500;
            margin-top: 3px;
          }

          /* Alert Banner */
          .trace-create-alert-banner {
            background-color: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.2);
            color: var(--status-low, #22c55e);
            border-radius: var(--radius-sm, 4px);
            padding: 8px 12px;
            font-size: 0.8125rem;
            font-weight: 600;
            margin-bottom: 16px;
            text-align: center;
          }

          /* Form Actions Row */
          .trace-create-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.03);
            padding-top: 20px;
          }

          .trace-create-cancel-btn {
            background-color: transparent;
            color: var(--text-secondary, #cbd5e1);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 8px 18px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
            height: 38px;
            display: flex;
            align-items: center;
            text-decoration: none;
            box-sizing: border-box;
          }

          .trace-create-cancel-btn:hover {
            background-color: rgba(255, 255, 255, 0.02);
            color: var(--text-primary, #f8fafc);
            border-color: var(--border-color-hover, rgba(255, 255, 255, 0.15));
          }

          .trace-create-cancel-btn:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 1px;
          }

          .trace-create-submit-btn {
            background-color: var(--color-primary, #3b82f6);
            color: #ffffff;
            border: 1px solid transparent;
            border-radius: var(--radius-sm, 4px);
            padding: 8px 20px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
            height: 38px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-sizing: border-box;
          }

          .trace-create-submit-btn:hover:not(:disabled) {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-create-submit-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            background-color: var(--bg-surface-elevated, #162035);
            color: var(--text-muted, #64748b);
            border-color: var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-create-submit-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
          }

          .trace-create-btn-spinner {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.15);
            border-top-color: #ffffff;
            animation: trace-btn-spin 0.75s linear infinite;
            flex-shrink: 0;
          }

          @keyframes trace-btn-spin {
            to { transform: rotate(360deg); }
          }

          /* Responsive Layout */
          @media (max-width: 768px) {
            .trace-create-card {
              padding: 24px 16px;
              border: none;
              background: transparent;
              box-shadow: none;
            }
            .trace-create-form-grid {
              grid-template-columns: 1fr;
            }
            .trace-create-field.full-width {
              grid-column: span 1;
            }
            .trace-create-severity-wrapper {
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
            }
            .trace-create-content {
              padding: 16px;
              gap: 16px;
            }
          }

          @media (max-width: 480px) {
            .trace-create-severity-wrapper {
              grid-template-columns: 1fr;
            }
            .trace-create-actions {
              flex-direction: column-reverse;
              align-items: stretch;
            }
            .trace-create-cancel-btn,
            .trace-create-submit-btn {
              width: 100%;
              justify-content: center;
            }
          }
        `
      }} />

      {/* Main Persistent Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main content wrapper */}
      <div className="trace-create-main">
        {/* Top persistent header */}
        <Header 
          title="Create New Case" 
          userName="Security Analyst" 
          userRole="Investigator" 
        />

        {/* Scrollable Form areas */}
        <main className="trace-create-content">
          
          {/* Header Panel with back navigation link */}
          <div className="trace-create-header-row">
            <Link to="/cases" className="trace-create-back-btn" aria-label="Go back to cases page">
              &larr; Back to Cases
            </Link>
            <h2 className="trace-create-title">Create New Case</h2>
            <p className="trace-create-subtitle">
              Start a new digital forensic investigation.
            </p>
          </div>

          {/* Form Workspace Center */}
          <div className="trace-create-form-workspace">
            <div className="trace-create-card">
              
              {/* Optional Local Success Banner */}
              {showSuccess && (
                <div className="trace-create-alert-banner" role="alert">
                  Case created successfully. Redirecting...
                </div>
              )}

              <form onSubmit={handleSubmit} className="trace-create-form" noValidate>
                
                {/* Form fields layout grid */}
                <div className="trace-create-form-grid">
                  
                  {/* Case Title Field */}
                  <div className="trace-create-field full-width">
                    <label htmlFor="case-title-input" className="trace-create-label">
                      Case Title
                    </label>
                    <input
                      id="case-title-input"
                      type="text"
                      className={`trace-create-input ${errors.title ? 'error' : ''}`}
                      placeholder="Enter investigation title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                      }}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.title}
                      aria-describedby={errors.title ? 'case-title-error' : undefined}
                      required
                    />
                    {errors.title && (
                      <span id="case-title-error" className="trace-create-validation-error" role="alert">
                        {errors.title}
                      </span>
                    )}
                  </div>

                  {/* Description Field */}
                  <div className="trace-create-field full-width">
                    <div className="trace-create-label">
                      <label htmlFor="case-desc-textarea">Description</label>
                      <span className="trace-create-char-counter" aria-live="polite">
                        {description.length} / 1000
                      </span>
                    </div>
                    <textarea
                      id="case-desc-textarea"
                      className={`trace-create-textarea ${errors.description ? 'error' : ''}`}
                      placeholder="Describe the incident and initial findings..."
                      maxLength={1000}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
                      }}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.description}
                      aria-describedby={errors.description ? 'case-desc-error' : undefined}
                      required
                    />
                    {errors.description && (
                      <span id="case-desc-error" className="trace-create-validation-error" role="alert">
                        {errors.description}
                      </span>
                    )}
                  </div>

                  {/* Incident Type Select Field */}
                  <div className="trace-create-field">
                    <label htmlFor="case-type-select" className="trace-create-label">
                      Incident Type
                    </label>
                    <select
                      id="case-type-select"
                      className={`trace-create-select ${errors.incidentType ? 'error' : ''}`}
                      value={incidentType}
                      onChange={(e) => {
                        setIncidentType(e.target.value);
                        if (errors.incidentType) setErrors((prev) => ({ ...prev, incidentType: null }));
                      }}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.incidentType}
                      aria-describedby={errors.incidentType ? 'case-type-error' : undefined}
                      required
                    >
                      <option value="">Select incident type</option>
                      <option value="Account Compromise">Account Compromise</option>
                      <option value="Malware Activity">Malware Activity</option>
                      <option value="Network Intrusion">Network Intrusion</option>
                      <option value="Unauthorized Access">Unauthorized Access</option>
                      <option value="Phishing">Phishing</option>
                      <option value="Data Exfiltration">Data Exfiltration</option>
                      <option value="Suspicious Activity">Suspicious Activity</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.incidentType && (
                      <span id="case-type-error" className="trace-create-validation-error" role="alert">
                        {errors.incidentType}
                      </span>
                    )}
                  </div>

                  {/* Assigned Investigator Field */}
                  <div className="trace-create-field">
                    <label htmlFor="case-investigator-select" className="trace-create-label">
                      Assigned Investigator
                    </label>
                    <select
                      id="case-investigator-select"
                      className={`trace-create-select ${errors.assignedInvestigator ? 'error' : ''}`}
                      value={assignedInvestigator}
                      onChange={(e) => {
                        setAssignedInvestigator(e.target.value);
                        if (errors.assignedInvestigator) setErrors((prev) => ({ ...prev, assignedInvestigator: null }));
                      }}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.assignedInvestigator}
                      aria-describedby={errors.assignedInvestigator ? 'case-investigator-error' : undefined}
                      required
                    >
                      <option value="">Select investigator</option>
                      <option value="Analyst01">Analyst01</option>
                      <option value="Investigator02">Investigator02</option>
                      <option value="Security Analyst">Security Analyst</option>
                      <option value="Forensic Analyst">Forensic Analyst</option>
                    </select>
                    {errors.assignedInvestigator && (
                      <span id="case-investigator-error" className="trace-create-validation-error" role="alert">
                        {errors.assignedInvestigator}
                      </span>
                    )}
                  </div>

                  {/* Severity Pill Radio Group Selection */}
                  <div className="trace-create-field full-width">
                    <span className="trace-create-label" id="severity-group-label">
                      Severity
                    </span>
                    <div 
                      className="trace-create-severity-wrapper" 
                      role="radiogroup" 
                      aria-labelledby="severity-group-label"
                    >
                      {SEVERITY_OPTIONS.map((opt) => {
                        const isSelected = severity === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={`trace-create-severity-btn ${isSelected ? `selected ${opt.colorClass}` : ''}`}
                            onClick={() => {
                              if (isSubmitting) return;
                              setSeverity(opt.value);
                              if (errors.severity) setErrors((prev) => ({ ...prev, severity: null }));
                            }}
                            role="radio"
                            aria-checked={isSelected}
                            disabled={isSubmitting}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    {errors.severity && (
                      <span className="trace-create-validation-error" role="alert">
                        {errors.severity}
                      </span>
                    )}
                  </div>

                </div>

                {/* Submit Actions Row */}
                <div className="trace-create-actions">
                  <Link
                    to="/cases"
                    className="trace-create-cancel-btn"
                    style={{ pointerEvents: isSubmitting ? 'none' : 'auto' }}
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="trace-create-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <span className="trace-create-btn-spinner" aria-hidden="true" />}
                    <span>{isSubmitting ? 'Creating Case...' : 'Create Case'}</span>
                  </button>
                </div>

              </form>

            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
