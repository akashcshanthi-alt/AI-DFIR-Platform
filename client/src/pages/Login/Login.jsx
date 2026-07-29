import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShield, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * Login Component
 * The entry point for security analysts into the TRACE AI DFIR platform.
 * Features a split responsive view with a branded security visual panel and
 * a focused, validated credentials login form.
 */
export default function Login() {
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation and Loading states
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Client-side validations
  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit Handler with prototype dashboard navigation
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (validateForm()) {
      setIsLoading(true);

      // Simulate network request latency before navigating
      setTimeout(() => {
        setIsLoading(false);
        // Establish developer session token for the dashboard auth guard
        sessionStorage.setItem('arclight-dev-session', 'active');
        navigate('/dashboard', { replace: true });
      }, 1500);
    }
  };

  return (
    <main className="trace-login-page">
      {/* Self-contained styling block for the login screen */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-login-page {
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
          .trace-login-left {
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

          /* Subtle digital matrix visual grid */
          .trace-login-grid-overlay {
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

          .trace-login-left-content {
            display: flex;
            flex-direction: column;
            z-index: 2;
          }

          .trace-login-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            user-select: none;
          }

          .trace-login-brand-icon {
            font-size: 2.2rem;
            color: var(--color-primary, #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-login-brand-text {
            display: flex;
            flex-direction: column;
          }

          .trace-login-brand-name {
            font-size: 1.6rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            line-height: 1.1;
            color: var(--text-primary, #f8fafc);
          }

          .trace-login-brand-subtitle {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--color-secondary, #06b6d4);
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-top: 2px;
          }

          .trace-login-hero {
            margin-top: 80px;
            max-width: 460px;
            z-index: 2;
          }

          .trace-login-hero-title {
            font-size: 2.25rem;
            font-weight: 700;
            line-height: 1.25;
            color: var(--text-primary, #f8fafc);
            margin-bottom: 20px;
          }

          .trace-login-hero-title span {
            color: var(--color-primary, #3b82f6);
          }

          .trace-login-hero-desc {
            font-size: 0.95rem;
            line-height: 1.6;
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-login-left-footer {
            font-size: 0.8125rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            color: var(--color-secondary, #06b6d4);
            text-transform: uppercase;
            z-index: 2;
            user-select: none;
          }

          /* Dynamic network vector visual using SVG */
          .trace-login-network-visual {
            position: absolute;
            right: -40px;
            bottom: -20px;
            width: 320px;
            height: 320px;
            opacity: 0.2;
            pointer-events: none;
            z-index: 1;
          }

          /* Right Action Column */
          .trace-login-right {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px;
            box-sizing: border-box;
            background-color: var(--bg-main, #060913);
          }

          .trace-login-card {
            width: 100%;
            max-width: 400px;
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-lg, 12px);
            padding: 40px 32px;
            box-shadow: var(--shadow-lg);
            box-sizing: border-box;
          }

          .trace-login-card-header {
            margin-bottom: 28px;
          }

          .trace-login-title {
            font-size: 1.35rem;
            font-weight: 600;
            margin-bottom: 6px;
            color: var(--text-primary, #f8fafc);
          }

          .trace-login-support-text {
            font-size: 0.875rem;
            color: var(--text-muted, #64748b);
          }

          /* Form Controls */
          .trace-login-form {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .trace-login-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .trace-login-label {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-login-input-container {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
          }

          .trace-login-input-icon {
            position: absolute;
            left: 12px;
            color: var(--text-muted, #64748b);
            font-size: 1rem;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-login-input {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 10px 40px 10px 36px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            transition: all var(--transition-speed, 200ms) ease;
            height: 40px;
            box-sizing: border-box;
          }

          .trace-login-input:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.15));
          }

          .trace-login-input.error {
            border-color: var(--status-critical, #ef4444);
            box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
          }

          .trace-login-password-toggle {
            position: absolute;
            right: 12px;
            background: transparent;
            border: none;
            color: var(--text-muted, #64748b);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.05rem;
            outline: none;
            padding: 0;
            height: 24px;
            width: 24px;
            transition: color var(--transition-speed, 200ms) ease;
          }

          .trace-login-password-toggle:hover {
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-login-password-toggle:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            border-radius: var(--radius-sm, 4px);
          }

          .trace-login-validation-error {
            font-size: 0.75rem;
            color: var(--status-critical, #ef4444);
            font-weight: 500;
            margin-top: 3px;
          }

          /* Remember & Forgot Row */
          .trace-login-options-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.8125rem;
            margin-top: 4px;
          }

          .trace-login-remember {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            user-select: none;
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-login-checkbox {
            accent-color: var(--color-primary, #3b82f6);
            cursor: pointer;
            width: 14px;
            height: 14px;
            border-radius: var(--radius-xs, 2px);
          }

          .trace-login-forgot-link {
            color: var(--color-primary, #3b82f6);
            text-decoration: none;
            font-weight: 600;
            transition: color var(--transition-speed, 200ms) ease;
            outline: none;
          }

          .trace-login-forgot-link:hover {
            color: var(--color-secondary, #06b6d4);
          }

          .trace-login-forgot-link:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 1px;
          }

          /* Submit Button & loading */
          .trace-login-submit-btn {
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
          }

          .trace-login-submit-btn:hover:not(:disabled) {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-login-submit-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            background-color: var(--bg-surface-elevated, #162035);
            color: var(--text-muted, #64748b);
            border-color: var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-login-submit-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
          }

          .trace-login-btn-spinner {
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

          /* Card Footer Registration link */
          .trace-login-card-footer {
            margin-top: 24px;
            text-align: center;
            font-size: 0.8125rem;
            color: var(--text-muted, #64748b);
          }

          .trace-login-register-link {
            color: var(--color-primary, #3b82f6);
            text-decoration: none;
            font-weight: 600;
            margin-left: 6px;
            transition: color var(--transition-speed, 200ms) ease;
            outline: none;
          }

          .trace-login-register-link:hover {
            color: var(--color-secondary, #06b6d4);
          }

          .trace-login-register-link:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 1px;
          }

          /* Responsive Layout */
          @media (max-width: 992px) {
            .trace-login-left {
              padding: 36px;
            }
            .trace-login-right {
              padding: 36px;
            }
            .trace-login-hero-title {
              font-size: 1.85rem;
            }
          }

          @media (max-width: 768px) {
            .trace-login-page {
              flex-direction: column;
            }
            .trace-login-left {
              flex: none;
              padding: 32px 24px;
              border-right: none;
              border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
              background: radial-gradient(circle at 50% 50%, #0c152b 0%, #04070e 100%);
            }
            .trace-login-hero {
              margin-top: 20px;
            }
            .trace-login-hero-title {
              font-size: 1.6rem;
              margin-bottom: 8px;
            }
            .trace-login-hero-desc {
              font-size: 0.875rem;
            }
            .trace-login-network-visual {
              display: none; /* Hide SVG background graphic on small screens to save height */
            }
            .trace-login-right {
              flex: 1;
              padding: 32px 16px;
              align-items: flex-start;
            }
            .trace-login-card {
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
      <section className="trace-login-left" aria-label="Product Information">
        <div className="trace-login-grid-overlay" />
        
        <div className="trace-login-left-content">
          <div className="trace-login-brand">
            <div className="trace-login-brand-icon" aria-hidden="true">
              <FiShield />
            </div>
            <div className="trace-login-brand-text">
              <span className="trace-login-brand-name">TRACE AI</span>
              <span className="trace-login-brand-subtitle">DFIR</span>
            </div>
          </div>

          <div className="trace-login-hero">
            <h2 className="trace-login-hero-title">
              AI-Driven Digital Forensics &<br />
              <span>Incident Response</span> Platform
            </h2>
            <p className="trace-login-hero-desc">
              Harness autonomous triage heuristics, automated playbooks, and detailed event timeline correlation to outpace and contain modern threats.
            </p>
          </div>
        </div>

        {/* Vector SVG node visual */}
        <div className="trace-login-network-visual" aria-hidden="true">
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

        <div className="trace-login-left-footer">
          Investigate. Correlate. Respond.
        </div>
      </section>

      {/* Right Column: Credentials Form */}
      <section className="trace-login-right" aria-label="Account Login">
        <div className="trace-login-card">
          <div className="trace-login-card-header">
            <h1 className="trace-login-title">Welcome back</h1>
            <p className="trace-login-support-text">Sign in to continue to TRACE AI DFIR.</p>
          </div>

          <form onSubmit={handleSubmit} className="trace-login-form" noValidate>
            
            {/* Email Field */}
            <div className="trace-login-field">
              <label htmlFor="trace-email-input" className="trace-login-label">
                Email Address
              </label>
              <div className="trace-login-input-container">
                <span className="trace-login-input-icon" aria-hidden="true">
                  <FiMail />
                </span>
                <input
                  id="trace-email-input"
                  type="email"
                  className={`trace-login-input ${errors.email ? 'error' : ''}`}
                  placeholder="name@agency.gov"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'trace-email-error' : undefined}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <span id="trace-email-error" className="trace-login-validation-error" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="trace-login-field">
              <label htmlFor="trace-password-input" className="trace-login-label">
                Password
              </label>
              <div className="trace-login-input-container">
                <span className="trace-login-input-icon" aria-hidden="true">
                  <FiLock />
                </span>
                <input
                  id="trace-password-input"
                  type={showPassword ? 'text' : 'password'}
                  className={`trace-login-input ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'trace-password-error' : undefined}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="trace-login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && (
                <span id="trace-password-error" className="trace-login-validation-error" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Options Row: Remember & Forgot Password */}
            <div className="trace-login-options-row">
              <label className="trace-login-remember">
                <input
                  type="checkbox"
                  className="trace-login-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Remember me</span>
              </label>
              <a
                href="#forgot-password"
                className="trace-login-forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="trace-login-submit-btn"
              disabled={isLoading}
            >
              {isLoading && <span className="trace-login-btn-spinner" aria-hidden="true" />}
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Create Account Navigation Link */}
          <div className="trace-login-card-footer">
            Don't have an account?
            <Link to="/register" className="trace-login-register-link">
              Create account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
