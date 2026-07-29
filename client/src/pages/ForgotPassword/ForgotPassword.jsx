import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiMail, FiArrowLeft } from 'react-icons/fi';

/**
 * ForgotPassword Component
 * Allows security analysts to request password reset instructions.
 * Renders a professional split layout matching Login.jsx and handles local simulations.
 */
export default function ForgotPassword() {
  // Form and interface states
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Validate basic email format
  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      tempErrors.email = 'Please enter a valid email address';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Simulated email trigger submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading || isSent) return;

    if (validateForm()) {
      setIsLoading(true);

      // Simulate network request delay
      setTimeout(() => {
        setIsLoading(false);
        setIsSent(true);
      }, 1500);
    }
  };

  return (
    <main className="trace-forgot-page">
      {/* Self-contained styling matching Login.jsx */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-forgot-page {
            display: flex;
            min-height: 100vh;
            background-color: var(--bg-main, #060913);
            color: var(--text-primary, #f8fafc);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow-x: hidden;
            width: 100%;
            box-sizing: border-box;
          }

          /* Left Branding Column */
          .trace-forgot-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: radial-gradient(circle at 30% 30%, #0c152b 0%, #04070e 100%);
            border-right: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            padding: 48px;
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
          }

          /* Grid overlay */
          .trace-forgot-grid-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.12;
            background-size: 32px 32px;
            background-image: 
              linear-gradient(to right, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59, 130, 246, 0.15) 1px, transparent 1px);
            pointer-events: none;
            z-index: 1;
          }

          .trace-forgot-left-content {
            display: flex;
            flex-direction: column;
            z-index: 2;
          }

          .trace-forgot-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            user-select: none;
          }

          .trace-forgot-brand-icon {
            font-size: 2.2rem;
            color: var(--color-primary, #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-forgot-brand-text {
            display: flex;
            flex-direction: column;
          }

          .trace-forgot-brand-name {
            font-size: 1.6rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            line-height: 1.1;
            color: var(--text-primary, #f8fafc);
          }

          .trace-forgot-brand-subtitle {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--color-secondary, #06b6d4);
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-top: 2px;
          }

          .trace-forgot-hero {
            margin-top: 80px;
            max-width: 460px;
            z-index: 2;
          }

          .trace-forgot-hero-title {
            font-size: 2.25rem;
            font-weight: 700;
            line-height: 1.25;
            color: var(--text-primary, #f8fafc);
            margin-bottom: 20px;
          }

          .trace-forgot-hero-title span {
            color: var(--color-primary, #3b82f6);
          }

          .trace-forgot-hero-desc {
            font-size: 0.95rem;
            line-height: 1.6;
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-forgot-left-footer {
            font-size: 0.8125rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            color: var(--color-secondary, #06b6d4);
            text-transform: uppercase;
            z-index: 2;
            user-select: none;
          }

          /* Network visual background graphic */
          .trace-forgot-network-visual {
            position: absolute;
            right: -40px;
            bottom: -20px;
            width: 320px;
            height: 320px;
            opacity: 0.2;
            pointer-events: none;
            z-index: 1;
          }

          /* Right column card container */
          .trace-forgot-right {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px;
            box-sizing: border-box;
            background-color: var(--bg-main, #060913);
          }

          .trace-forgot-card {
            width: 100%;
            max-width: 400px;
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-lg, 12px);
            padding: 40px 32px;
            box-shadow: var(--shadow-lg);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .trace-forgot-card-header {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .trace-forgot-title {
            font-size: 1.35rem;
            font-weight: 600;
            margin: 0;
            color: var(--text-primary, #f8fafc);
          }

          .trace-forgot-support-text {
            font-size: 0.875rem;
            color: var(--text-muted, #64748b);
            line-height: 1.45;
            margin: 0;
          }

          .trace-forgot-form {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .trace-forgot-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .trace-forgot-label {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-forgot-input-container {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
          }

          .trace-forgot-input-icon {
            position: absolute;
            left: 12px;
            color: var(--text-muted, #64748b);
            font-size: 1rem;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-forgot-input {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 10px 12px 10px 36px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            transition: all var(--transition-speed, 200ms) ease;
            height: 40px;
            box-sizing: border-box;
          }

          .trace-forgot-input:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.15));
          }

          .trace-forgot-input.error {
            border-color: var(--status-critical, #ef4444);
            box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
          }

          .trace-forgot-validation-error {
            font-size: 0.75rem;
            color: var(--status-critical, #ef4444);
            font-weight: 500;
            margin-top: 3px;
          }

          .trace-forgot-submit-btn {
            background-color: var(--color-primary, #3b82f6);
            color: #ffffff;
            border: 1px solid transparent;
            border-radius: var(--radius-sm, 4px);
            padding: 10px 16px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            height: 40px;
            box-sizing: border-box;
            outline: none;
            margin-top: 6px;
            user-select: none;
          }

          .trace-forgot-submit-btn:hover:not(:disabled) {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-forgot-submit-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            background-color: var(--bg-surface-elevated, #162035);
            color: var(--text-muted, #64748b);
            border-color: var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-forgot-submit-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
          }

          .trace-forgot-btn-spinner {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.15);
            border-top-color: #ffffff;
            animation: trace-forgot-spin 0.75s linear infinite;
            flex-shrink: 0;
          }

          @keyframes trace-forgot-spin {
            to { transform: rotate(360deg); }
          }

          /* Card Footer Links */
          .trace-forgot-card-footer {
            margin-top: 10px;
            text-align: center;
            font-size: 0.8125rem;
            color: var(--text-muted, #64748b);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-forgot-login-link {
            color: var(--color-primary, #3b82f6);
            text-decoration: none;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: color var(--transition-speed, 200ms) ease;
            outline: none;
          }

          .trace-forgot-login-link:hover {
            color: var(--color-secondary, #06b6d4);
          }

          .trace-forgot-login-link:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 1px;
          }

          /* Responsive Breakpoints */
          @media (max-width: 992px) {
            .trace-forgot-left {
              padding: 36px;
            }
            .trace-forgot-right {
              padding: 36px;
            }
            .trace-forgot-hero-title {
              font-size: 1.85rem;
            }
          }

          @media (max-width: 768px) {
            .trace-forgot-page {
              flex-direction: column;
            }
            .trace-forgot-left {
              flex: none;
              padding: 32px 24px;
              border-right: none;
              border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
              background: radial-gradient(circle at 50% 50%, #0c152b 0%, #04070e 100%);
            }
            .trace-forgot-hero {
              margin-top: 20px;
            }
            .trace-forgot-hero-title {
              font-size: 1.6rem;
              margin-bottom: 8px;
            }
            .trace-forgot-hero-desc {
              font-size: 0.875rem;
            }
            .trace-forgot-network-visual {
              display: none;
            }
            .trace-forgot-right {
              flex: 1;
              padding: 32px 16px;
              align-items: flex-start;
            }
            .trace-forgot-card {
              padding: 24px 16px;
              border: none;
              background: transparent;
              box-shadow: none;
              max-width: 100%;
            }
          }
        `
      }} />

      {/* Left Column: Branding and visual graphics */}
      <section className="trace-forgot-left" aria-label="Product Information">
        <div className="trace-forgot-grid-overlay" />
        
        <div className="trace-forgot-left-content">
          <div className="trace-forgot-brand">
            <div className="trace-forgot-brand-icon" aria-hidden="true">
              <FiShield />
            </div>
            <div className="trace-forgot-brand-text">
              <span className="trace-forgot-brand-name">TRACE AI</span>
              <span className="trace-forgot-brand-subtitle">DFIR</span>
            </div>
          </div>

          <div className="trace-forgot-hero">
            <h2 className="trace-forgot-hero-title">
              AI-Driven Digital Forensics &<br />
              <span>Incident Response</span> Platform
            </h2>
            <p className="trace-forgot-hero-desc">
              Harness autonomous triage heuristics, automated playbooks, and detailed event timeline correlation to outpace and contain modern threats.
            </p>
          </div>
        </div>

        {/* Vector SVG node visual */}
        <div className="trace-forgot-network-visual" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <circle cx="100" cy="100" r="80" stroke="var(--color-primary, #3b82f6)" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.15"/>
            <circle cx="100" cy="100" r="50" stroke="var(--color-secondary, #06b6d4)" strokeWidth="0.75" strokeDasharray="6 2" opacity="0.25"/>
            <circle cx="100" cy="100" r="20" stroke="var(--color-primary, #3b82f6)" strokeWidth="1" opacity="0.35"/>
            <circle cx="100" cy="20" r="3" fill="var(--color-secondary, #06b6d4)"/>
            <circle cx="180" cy="100" r="3.5" fill="var(--color-primary, #3b82f6)"/>
            <circle cx="100" cy="180" r="3" fill="var(--color-secondary, #06b6d4)"/>
            <circle cx="20" cy="100" r="3.5" fill="var(--color-primary, #3b82f6)"/>
            <circle cx="156" cy="44" r="4.5" fill="var(--color-primary, #3b82f6)"/>
            <line x1="100" y1="20" x2="156" y2="44" stroke="var(--color-secondary, #06b6d4)" strokeWidth="0.5" opacity="0.4"/>
            <line x1="156" y1="44" x2="180" y2="100" stroke="var(--color-primary, #3b82f6)" strokeWidth="0.5" opacity="0.4"/>
            <line x1="100" y1="100" x2="156" y2="44" stroke="var(--color-primary, #3b82f6)" strokeWidth="0.5" opacity="0.3"/>
          </svg>
        </div>

        <div className="trace-forgot-left-footer">
          Investigate. Correlate. Respond.
        </div>
      </section>

      {/* Right Column: Reset Password Card */}
      <section className="trace-forgot-right" aria-label="Password Reset Request">
        
        {!isSent ? (
          /* State 1: Request reset form */
          <div className="trace-forgot-card">
            <div className="trace-forgot-card-header">
              <h1 className="trace-forgot-title">Reset your password</h1>
              <p className="trace-forgot-support-text">
                Enter your account email and we'll send you instructions to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="trace-forgot-form" noValidate>
              
              {/* Email Input Field */}
              <div className="trace-forgot-field">
                <label htmlFor="trace-forgot-email" className="trace-forgot-label">
                  Email Address
                </label>
                <div className="trace-forgot-input-container">
                  <span className="trace-forgot-input-icon" aria-hidden="true">
                    <FiMail />
                  </span>
                  <input
                    id="trace-forgot-email"
                    type="email"
                    className={`trace-forgot-input ${errors.email ? 'error' : ''}`}
                    placeholder="analyst@trace.local"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                    }}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'trace-forgot-email-error' : undefined}
                    disabled={isLoading}
                    required
                  />
                </div>
                {errors.email && (
                  <span id="trace-forgot-email-error" className="trace-forgot-validation-error" role="alert">
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="trace-forgot-submit-btn"
                disabled={isLoading}
              >
                {isLoading && <span className="trace-forgot-btn-spinner" aria-hidden="true" />}
                <span>{isLoading ? 'Sending...' : 'Send Reset Instructions'}</span>
              </button>
            </form>

            {/* Back to login control */}
            <div className="trace-forgot-card-footer">
              <Link to="/login" className="trace-forgot-login-link">
                <FiArrowLeft aria-hidden="true" />
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        ) : (
          /* State 2: Success state feedback */
          <div className="trace-forgot-card" role="status" aria-live="polite">
            <div className="trace-forgot-card-header">
              <h1 className="trace-forgot-title" style={{ color: 'var(--status-low, #22c55e)' }}>
                Reset instructions sent
              </h1>
              <p className="trace-forgot-support-text" style={{ marginTop: '8px' }}>
                If an account exists for this email, password reset instructions have been sent.
              </p>
            </div>

            <div className="trace-forgot-card-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '16px', marginTop: '12px' }}>
              <Link to="/login" className="trace-forgot-login-link">
                <FiArrowLeft aria-hidden="true" />
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
