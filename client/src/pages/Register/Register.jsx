import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShield, FiUser, FiMail, FiGlobe, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * Register Component
 * Standard registration screen for TRACE AI DFIR.
 * Allows new analysts to create an organization workspace.
 * Visually mirrors Login.jsx to maintain consistent brand styling.
 */
export default function Register() {
  const navigate = useNavigate();

  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility flags
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status flags
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification checks matching standard rules
  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      tempErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!organization.trim()) {
      tempErrors.organization = 'Organization is required';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 8) {
      tempErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Confirm password is required';
    } else if (confirmPassword !== password) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit handler with mock account creation flow
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (validateForm()) {
      setIsSubmitting(true);

      // Simulate registration delay before navigating to login
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/login');
      }, 1500);
    }
  };

  return (
    <main className="trace-register-page">
      {/* Self-contained style block to maintain strict design cohesion */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-register-page {
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
          .trace-register-left {
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

          /* Digital matrix grid grid overlay */
          .trace-register-grid-overlay {
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

          .trace-register-left-content {
            display: flex;
            flex-direction: column;
            z-index: 2;
          }

          .trace-register-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            user-select: none;
          }

          .trace-register-brand-icon {
            font-size: 2.2rem;
            color: var(--color-primary, #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-register-brand-text {
            display: flex;
            flex-direction: column;
          }

          .trace-register-brand-name {
            font-size: 1.6rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            line-height: 1.1;
            color: var(--text-primary, #f8fafc);
          }

          .trace-register-brand-subtitle {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--color-secondary, #06b6d4);
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-top: 2px;
          }

          .trace-register-hero {
            margin-top: 80px;
            max-width: 460px;
            z-index: 2;
          }

          .trace-register-hero-title {
            font-size: 2.25rem;
            font-weight: 700;
            line-height: 1.25;
            color: var(--text-primary, #f8fafc);
            margin-bottom: 20px;
          }

          .trace-register-hero-title span {
            color: var(--color-primary, #3b82f6);
          }

          .trace-register-hero-desc {
            font-size: 0.95rem;
            line-height: 1.6;
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-register-left-footer {
            font-size: 0.8125rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            color: var(--color-secondary, #06b6d4);
            text-transform: uppercase;
            z-index: 2;
            user-select: none;
          }

          /* Dynamic network vector visual using SVG */
          .trace-register-network-visual {
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
          .trace-register-right {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px;
            box-sizing: border-box;
            background-color: var(--bg-main, #060913);
          }

          .trace-register-card {
            width: 100%;
            max-width: 420px;
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-lg, 12px);
            padding: 36px 32px;
            box-shadow: var(--shadow-lg);
            box-sizing: border-box;
          }

          .trace-register-card-header {
            margin-bottom: 24px;
          }

          .trace-register-title {
            font-size: 1.35rem;
            font-weight: 600;
            margin-bottom: 6px;
            color: var(--text-primary, #f8fafc);
          }

          .trace-register-support-text {
            font-size: 0.875rem;
            color: var(--text-muted, #64748b);
          }

          /* Form Controls */
          .trace-register-form {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .trace-register-field {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .trace-register-label {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-register-input-container {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
          }

          .trace-register-input-icon {
            position: absolute;
            left: 12px;
            color: var(--text-muted, #64748b);
            font-size: 1rem;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-register-input {
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

          .trace-register-input:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.15));
          }

          .trace-register-input.error {
            border-color: var(--status-critical, #ef4444);
            box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
          }

          .trace-register-password-toggle {
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

          .trace-register-password-toggle:hover {
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-register-password-toggle:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            border-radius: var(--radius-sm, 4px);
          }

          .trace-register-validation-error {
            font-size: 0.75rem;
            color: var(--status-critical, #ef4444);
            font-weight: 500;
            margin-top: 3px;
          }

          /* Submit Button & loading spinner */
          .trace-register-submit-btn {
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

          .trace-register-submit-btn:hover:not(:disabled) {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-register-submit-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            background-color: var(--bg-surface-elevated, #162035);
            color: var(--text-muted, #64748b);
            border-color: var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-register-submit-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
          }

          .trace-register-btn-spinner {
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
          .trace-register-card-footer {
            margin-top: 20px;
            text-align: center;
            font-size: 0.8125rem;
            color: var(--text-muted, #64748b);
          }

          .trace-register-login-link {
            color: var(--color-primary, #3b82f6);
            text-decoration: none;
            font-weight: 600;
            margin-left: 6px;
            transition: color var(--transition-speed, 200ms) ease;
            outline: none;
          }

          .trace-register-login-link:hover {
            color: var(--color-secondary, #06b6d4);
          }

          .trace-register-login-link:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: 1px;
          }

          /* Responsive Layout */
          @media (max-width: 992px) {
            .trace-register-left {
              padding: 36px;
            }
            .trace-register-right {
              padding: 36px;
            }
            .trace-register-hero-title {
              font-size: 1.85rem;
            }
          }

          @media (max-width: 768px) {
            .trace-register-page {
              flex-direction: column;
            }
            .trace-register-left {
              flex: none;
              padding: 32px 24px;
              border-right: none;
              border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
              background: radial-gradient(circle at 50% 50%, #0c152b 0%, #04070e 100%);
            }
            .trace-register-hero {
              margin-top: 20px;
            }
            .trace-register-hero-title {
              font-size: 1.6rem;
              margin-bottom: 8px;
            }
            .trace-register-hero-desc {
              font-size: 0.875rem;
            }
            .trace-register-network-visual {
              display: none;
            }
            .trace-register-right {
              flex: 1;
              padding: 32px 16px;
              align-items: flex-start;
            }
            .trace-register-card {
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
      <section className="trace-register-left" aria-label="Product Information">
        <div className="trace-register-grid-overlay" />
        
        <div className="trace-register-left-content">
          <div className="trace-register-brand">
            <div className="trace-register-brand-icon" aria-hidden="true">
              <FiShield />
            </div>
            <div className="trace-register-brand-text">
              <span className="trace-register-brand-name">TRACE AI</span>
              <span className="trace-register-brand-subtitle">DFIR</span>
            </div>
          </div>

          <div className="trace-register-hero">
            <h2 className="trace-register-hero-title">
              AI-Driven Digital Forensics &<br />
              <span>Incident Response</span> Platform
            </h2>
            <p className="trace-register-hero-desc">
              Harness autonomous triage heuristics, automated playbooks, and detailed event timeline correlation to outpace and contain modern threats.
            </p>
          </div>
        </div>

        {/* Vector SVG node visual */}
        <div className="trace-register-network-visual" aria-hidden="true">
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

        <div className="trace-register-left-footer">
          Investigate. Correlate. Respond.
        </div>
      </section>

      {/* Right Column: Registration Form */}
      <section className="trace-register-right" aria-label="Create Organization Account">
        <div className="trace-register-card">
          <div className="trace-register-card-header">
            <h1 className="trace-register-title">Create your account</h1>
            <p className="trace-register-support-text">Set up your TRACE AI DFIR analyst workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="trace-register-form" noValidate>
            
            {/* Full Name Field */}
            <div className="trace-register-field">
              <label htmlFor="trace-name-input" className="trace-register-label">
                Full Name
              </label>
              <div className="trace-register-input-container">
                <span className="trace-register-input-icon" aria-hidden="true">
                  <FiUser />
                </span>
                <input
                  id="trace-name-input"
                  type="text"
                  className={`trace-register-input ${errors.name ? 'error' : ''}`}
                  placeholder="Sarah Rivera"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'trace-name-error' : undefined}
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && (
                <span id="trace-name-error" className="trace-register-validation-error" role="alert">
                  {errors.name}
                </span>
              )}
            </div>

            {/* Email Field */}
            <div className="trace-register-field">
              <label htmlFor="trace-email-input" className="trace-register-label">
                Email Address
              </label>
              <div className="trace-register-input-container">
                <span className="trace-register-input-icon" aria-hidden="true">
                  <FiMail />
                </span>
                <input
                  id="trace-email-input"
                  type="email"
                  className={`trace-register-input ${errors.email ? 'error' : ''}`}
                  placeholder="s.rivera@agency.gov"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'trace-email-error' : undefined}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <span id="trace-email-error" className="trace-register-validation-error" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Organization Field */}
            <div className="trace-register-field">
              <label htmlFor="trace-org-input" className="trace-register-label">
                Organization
              </label>
              <div className="trace-register-input-container">
                <span className="trace-register-input-icon" aria-hidden="true">
                  <FiGlobe />
                </span>
                <input
                  id="trace-org-input"
                  type="text"
                  className={`trace-register-input ${errors.organization ? 'error' : ''}`}
                  placeholder="Security Operations Center"
                  autoComplete="organization"
                  value={organization}
                  onChange={(e) => {
                    setOrganization(e.target.value);
                    if (errors.organization) setErrors((prev) => ({ ...prev, organization: null }));
                  }}
                  aria-invalid={!!errors.organization}
                  aria-describedby={errors.organization ? 'trace-org-error' : undefined}
                  disabled={isSubmitting}
                />
              </div>
              {errors.organization && (
                <span id="trace-org-error" className="trace-register-validation-error" role="alert">
                  {errors.organization}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="trace-register-field">
              <label htmlFor="trace-password-input" className="trace-register-label">
                Password
              </label>
              <div className="trace-register-input-container">
                <span className="trace-register-input-icon" aria-hidden="true">
                  <FiLock />
                </span>
                <input
                  id="trace-password-input"
                  type={showPassword ? 'text' : 'password'}
                  className={`trace-register-input ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'trace-password-error' : undefined}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="trace-register-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && (
                <span id="trace-password-error" className="trace-register-validation-error" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="trace-register-field">
              <label htmlFor="trace-confirm-password-input" className="trace-register-label">
                Confirm Password
              </label>
              <div className="trace-register-input-container">
                <span className="trace-register-input-icon" aria-hidden="true">
                  <FiLock />
                </span>
                <input
                  id="trace-confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`trace-register-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'trace-confirm-password-error' : undefined}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="trace-register-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span id="trace-confirm-password-error" className="trace-register-validation-error" role="alert">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="trace-register-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting && <span className="trace-register-btn-spinner" aria-hidden="true" />}
              <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>

          {/* Navigation Link to Login Screen */}
          <div className="trace-register-card-footer">
            Already have an account?
            <Link to="/login" className="trace-register-login-link">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}