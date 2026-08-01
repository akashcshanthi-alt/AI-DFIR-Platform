import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';

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

  const mapFirebaseError = (error) => {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No operator record found with this email address.';
      case 'auth/invalid-email':
        return 'Please enter a valid operator email address.';
      case 'auth/too-many-requests':
        return 'Access blocked due to excessive attempts. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  };

  // Firebase sendPasswordResetEmail submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isSent) return;

    if (validateForm()) {
      setIsLoading(true);
      setErrors({});

      try {
        console.log('[ForgotPassword] Starting sendPasswordResetEmail for email:', email.trim());
        await sendPasswordResetEmail(auth, email.trim());
        console.log('[ForgotPassword] sendPasswordResetEmail Success');
        setIsLoading(false);
        setIsSent(true);
      } catch (error) {
        console.error('[ForgotPassword] Error occurred:', error);
        console.error('[ForgotPassword] Error code:', error.code, 'Error message:', error.message);
        setIsLoading(false);
        const userFriendlyMessage = mapFirebaseError(error);
        setErrors({ auth: `${userFriendlyMessage} (Debug Code: ${error.code || 'unknown'})` });
      }
    }
  };

  // Real-time email validation checking for inline feedback
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <main className="trace-forgot-page">
      {/* Self-contained styling block for premium enterprise design system */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-forgot-page {
            display: flex;
            min-height: 100vh;
            background-color: #050814;
            color: #F8FAFC;
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
            border-right: 1px solid rgba(255, 255, 255, 0.08);
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
            color: #47FAF3;
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
            color: #F8FAFC;
          }

          .trace-forgot-brand-subtitle {
            font-size: 0.75rem;
            font-weight: 700;
            color: #3B82F6;
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
            color: #F8FAFC;
            margin-bottom: 20px;
          }

          .trace-forgot-hero-title span {
            color: #47FAF3;
          }

          .trace-forgot-hero-desc {
            font-size: 0.95rem;
            line-height: 1.6;
            color: #94A3B8;
          }

          .trace-forgot-left-footer {
            font-size: 0.8125rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            color: #3B82F6;
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
            background-color: #050814;
          }

          .trace-forgot-card {
            width: 100%;
            max-width: 440px;
            background-color: #101827;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 40px 32px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 24px;
            transition: border-color 250ms ease, box-shadow 250ms ease;
          }

          .trace-forgot-card:hover {
            border-color: rgba(71, 250, 243, 0.15);
            box-shadow: 0 10px 30px rgba(71, 250, 243, 0.03);
          }

          .trace-forgot-card-header {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .trace-forgot-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
            color: #F8FAFC;
          }

          .trace-forgot-support-text {
            font-size: 0.875rem;
            color: #94A3B8;
            line-height: 1.45;
            margin: 0;
          }

          .trace-forgot-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .trace-forgot-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .trace-forgot-label {
            font-size: 12px;
            font-weight: 600;
            color: #cbd5e1;
            text-transform: uppercase;
            letter-spacing: 0.10em;
          }

          .trace-forgot-input-container {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
            background-color: #0F172A;
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 14px;
            height: 54px;
            box-sizing: border-box;
            transition: border-color 250ms ease, box-shadow 250ms ease;
          }

          .trace-forgot-input-container:focus-within {
            border-color: #47FAF3;
            box-shadow: 0 0 20px rgba(71,250,243,.25);
          }

          .trace-forgot-input-container.error-state {
            border-color: #EF4444;
          }

          .trace-forgot-input-icon {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            width: 18px;
            height: 18px;
            color: #94A3B8;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
          }

          .trace-forgot-input {
            width: 100%;
            background: transparent;
            border: none;
            padding-left: 52px !important;
            padding-right: 18px;
            padding-top: 0;
            padding-bottom: 0;
            color: #F8FAFC;
            font-size: 14px;
            outline: none;
            height: 100%;
            box-sizing: border-box;
          }

          .trace-forgot-input::placeholder {
            color: #94A3B8;
          }

          .trace-forgot-validation-feedback {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 500;
            margin-top: 4px;
          }

          .trace-forgot-validation-feedback.success {
            color: #10B981;
          }

          .trace-forgot-validation-feedback.error {
            color: #EF4444;
          }

          .trace-forgot-submit-btn {
            background: linear-gradient(90deg, #22D3EE, #06B6D4);
            color: #ffffff;
            border: none;
            border-radius: 14px;
            padding: 0 24px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 250ms ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            height: 54px;
            box-sizing: border-box;
            box-shadow: 0 10px 30px rgba(34,211,238,.35);
          }

          .trace-forgot-submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(34,211,238,.45);
          }

          .trace-forgot-submit-btn:active:not(:disabled) {
            transform: scale(.98);
          }

          .trace-forgot-submit-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          /* Card Footer Links */
          .trace-forgot-card-footer {
            margin-top: 10px;
            text-align: center;
            font-size: 0.875rem;
            color: #94A3B8;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-forgot-login-link {
            color: #47FAF3;
            text-decoration: none;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: color 250ms ease;
            outline: none;
          }

          .trace-forgot-login-link:hover {
            text-decoration: underline;
            color: #47FAF3;
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
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
              padding: 32px 24px;
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
              <Shield className="w-9 h-9 text-[#47FAF3]" />
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
            <circle cx="100" cy="100" r="80" stroke="#47FAF3" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.15"/>
            <circle cx="100" cy="100" r="50" stroke="#3B82F6" strokeWidth="0.75" strokeDasharray="6 2" opacity="0.25"/>
            <circle cx="100" cy="100" r="20" stroke="#47FAF3" strokeWidth="1" opacity="0.35"/>
            <circle cx="100" cy="20" r="3" fill="#3B82F6"/>
            <circle cx="180" cy="100" r="3.5" fill="#47FAF3"/>
            <circle cx="100" cy="180" r="3" fill="#3B82F6"/>
            <circle cx="20" cy="100" r="3.5" fill="#47FAF3"/>
            <circle cx="156" cy="44" r="4.5" fill="#47FAF3"/>
            <line x1="100" y1="20" x2="156" y2="44" stroke="#3B82F6" strokeWidth="0.5" opacity="0.4"/>
            <line x1="156" y1="44" x2="180" y2="100" stroke="#47FAF3" strokeWidth="0.5" opacity="0.4"/>
            <line x1="100" y1="100" x2="156" y2="44" stroke="#47FAF3" strokeWidth="0.5" opacity="0.3"/>
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
                <div className={`trace-forgot-input-container ${errors.email ? 'error-state' : ''}`}>
                  <span className="trace-forgot-input-icon" aria-hidden="true">
                    <Mail className="w-[18px] h-[18px]" />
                  </span>
                  <input
                    id="trace-forgot-email"
                    type="email"
                    className="trace-forgot-input"
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
                {email.trim() !== '' && isEmailValid && (
                  <span className="trace-forgot-validation-feedback success" role="status">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>✓ Valid email</span>
                  </span>
                )}
                {errors.email && (
                  <span id="trace-forgot-email-error" className="trace-forgot-validation-feedback error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>✕ {errors.email}</span>
                  </span>
                )}
              </div>

              {errors.auth && (
                <div className="trace-forgot-validation-feedback error" role="alert" style={{ alignSelf: 'center', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>✕ {errors.auth}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="trace-forgot-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Sending Instructions...</span>
                  </>
                ) : (
                  <span>Send Reset Instructions</span>
                )}
              </button>
            </form>

            {/* Back to login control */}
            <div className="trace-forgot-card-footer">
              <Link to="/login" className="trace-forgot-login-link">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        ) : (
          /* State 2: Success state feedback */
          <div className="trace-forgot-card" role="status" aria-live="polite">
            <div className="trace-forgot-card-header">
              <h1 className="trace-forgot-title" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 className="w-6 h-6" />
                <span>Instructions sent</span>
              </h1>
              <p className="trace-forgot-support-text" style={{ marginTop: '8px' }}>
                If an account exists for this email, password reset instructions have been sent.
              </p>
            </div>

            <div className="trace-forgot-card-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '12px' }}>
              <Link to="/login" className="trace-forgot-login-link">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
