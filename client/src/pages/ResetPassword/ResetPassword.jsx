import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/auth.service';

/**
 * ResetPassword Component
 * Allows security analysts to verify the out-of-band reset code and define a new clearance key.
 * Styled to match the premium enterprise design system of Login and ForgotPassword.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || searchParams.get('oobCode');

  // Logic & Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [email, setEmail] = useState('');

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Submission states
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token presence on mount
  useEffect(() => {
    if (!token) {
      setVerificationError('No secure clearance code was found in the URL. Please verify the link you clicked.');
    }
  }, [token]);

  // Form validation
  const validateForm = () => {
    const tempErrors = {};
    if (!password) {
      tempErrors.password = 'New clearance key is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Clearance key must be at least 6 characters long';
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Confirm your clearance key';
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Clearance keys do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isSuccess || isVerifying || verificationError) return;

    if (validateForm()) {
      setIsLoading(true);
      setErrors({});

      try {
        console.log('[ResetPassword] Applying new password...');
        await authService.resetPassword(token, password);
        console.log('[ResetPassword] Password updated successfully');
        setIsLoading(false);
        setIsSuccess(true);
        
        // Auto-redirect after 4 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 4000);
      } catch (error) {
        console.error('[ResetPassword] Error confirming password reset:', error);
        setIsLoading(false);
        setErrors({ auth: error.message || 'Password reset operation failed.' });
      }
    }
  };

  return (
    <main className="trace-reset-page">
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-reset-page {
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
          .trace-reset-left {
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

          .trace-reset-grid-overlay {
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

          .trace-reset-left-content {
            display: flex;
            flex-direction: column;
            z-index: 2;
          }

          .trace-reset-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            user-select: none;
          }

          .trace-reset-brand-icon {
            font-size: 2.2rem;
            color: #47FAF3;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-reset-brand-text {
            display: flex;
            flex-direction: column;
          }

          .trace-reset-brand-name {
            font-size: 1.6rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            line-height: 1.1;
            color: #F8FAFC;
          }

          .trace-reset-brand-subtitle {
            font-size: 0.75rem;
            font-weight: 700;
            color: #3B82F6;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-top: 2px;
          }

          .trace-reset-hero {
            margin-top: 80px;
            max-width: 460px;
            z-index: 2;
          }

          .trace-reset-hero-title {
            font-size: 2.25rem;
            font-weight: 700;
            line-height: 1.25;
            color: #F8FAFC;
            margin-bottom: 20px;
          }

          .trace-reset-hero-title span {
            color: #47FAF3;
          }

          .trace-reset-hero-desc {
            font-size: 0.95rem;
            line-height: 1.6;
            color: #94A3B8;
          }

          .trace-reset-left-footer {
            font-size: 0.8125rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            color: #3B82F6;
            text-transform: uppercase;
            z-index: 2;
            user-select: none;
          }

          /* Right column card container */
          .trace-reset-right {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px;
            box-sizing: border-box;
            background-color: #050814;
          }

          .trace-reset-card {
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

          .trace-reset-card:hover {
            border-color: rgba(71, 250, 243, 0.15);
            box-shadow: 0 10px 30px rgba(71, 250, 243, 0.03);
          }

          .trace-reset-card-header {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .trace-reset-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
            color: #F8FAFC;
          }

          .trace-reset-support-text {
            font-size: 0.875rem;
            color: #94A3B8;
            line-height: 1.45;
            margin: 0;
          }

          .trace-reset-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .trace-reset-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
            text-align: left;
          }

          .trace-reset-label {
            font-size: 12px;
            font-weight: 600;
            color: #cbd5e1;
            text-transform: uppercase;
            letter-spacing: 0.10em;
          }

          .trace-reset-input-container {
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

          .trace-reset-input-container:focus-within {
            border-color: #47FAF3;
            box-shadow: 0 0 20px rgba(71,250,243,.25);
          }

          .trace-reset-input-container.error-state {
            border-color: #EF4444;
          }

          .trace-reset-input-icon {
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

          .trace-reset-input-container input.trace-reset-input {
            width: 100% !important;
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            padding-left: 52px !important;
            padding-right: 48px !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            color: #F8FAFC !important;
            font-size: 14px !important;
            outline: none !important;
            height: 100% !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
          }

          .trace-reset-input-container input.trace-reset-input::placeholder {
            color: #94A3B8 !important;
          }

          .trace-reset-password-toggle-btn {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            background: none;
            border: none;
            color: #94A3B8;
            cursor: pointer;
            transition: color 250ms ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 54px;
            padding: 0 18px 0 10px;
            box-sizing: border-box;
            z-index: 12;
          }

          .trace-reset-password-toggle-btn:hover {
            color: #47FAF3;
          }

          .trace-reset-validation-feedback {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 500;
            margin-top: 4px;
          }

          .trace-reset-validation-feedback.success {
            color: #10B981;
          }

          .trace-reset-validation-feedback.error {
            color: #EF4444;
          }

          .trace-reset-submit-btn {
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

          .trace-reset-submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(34,211,238,.45);
          }

          .trace-reset-submit-btn:active:not(:disabled) {
            transform: scale(.98);
          }

          .trace-reset-submit-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .trace-reset-card-footer {
            margin-top: 10px;
            text-align: center;
            font-size: 0.875rem;
            color: #94A3B8;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-reset-login-link {
            color: #47FAF3;
            text-decoration: none;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: color 250ms ease;
            outline: none;
          }

          .trace-reset-login-link:hover {
            text-decoration: underline;
            color: #47FAF3;
          }

          @media (max-width: 992px) {
            .trace-reset-left { padding: 36px; }
            .trace-reset-right { padding: 36px; }
            .trace-reset-hero-title { font-size: 1.85rem; }
          }

          @media (max-width: 768px) {
            .trace-reset-page { flex-direction: column; }
            .trace-reset-left {
              flex: none;
              padding: 32px 24px;
              border-right: none;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
              background: radial-gradient(circle at 50% 50%, #0c152b 0%, #04070e 100%);
            }
            .trace-reset-hero { margin-top: 20px; }
            .trace-reset-hero-title { font-size: 1.6rem; margin-bottom: 8px; }
            .trace-reset-hero-desc { font-size: 0.875rem; }
            .trace-reset-right {
              flex: 1;
              padding: 32px 16px;
              align-items: flex-start;
            }
            .trace-reset-card {
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
      <section className="trace-reset-left" aria-label="Product Information">
        <div className="trace-reset-grid-overlay" />
        
        <div className="trace-reset-left-content">
          <div className="trace-reset-brand">
            <div className="trace-reset-brand-icon" aria-hidden="true">
              <img src="/logo-white.svg" alt="TRACE AI Logo" className="w-9 h-9" />
            </div>
            <div className="trace-reset-brand-text">
              <span className="trace-reset-brand-name">TRACE AI</span>
              <span className="trace-reset-brand-subtitle">DFIR</span>
            </div>
          </div>

          <div className="trace-reset-hero">
            <h2 className="trace-reset-hero-title">
              Clearance Key<br />
              <span>Authorization</span> Update
            </h2>
            <p className="trace-reset-hero-desc">
              Define a strong cryptographic clearance key to restore access to the SOC dashboard. Ensure your password is at least 6 characters long.
            </p>
          </div>
        </div>

        <div className="trace-reset-left-footer">
          SECURE TERMINAL UPDATE
        </div>
      </section>

      {/* Right Column: Reset Password Card */}
      <section className="trace-reset-right" aria-label="Clearance Update Form">
        
        {isVerifying ? (
          /* State 1: Verification Loading */
          <div className="trace-reset-card" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
            <Loader2 className="w-8 h-8 animate-spin text-[#47FAF3]" />
            <p className="trace-reset-support-text" style={{ marginTop: '12px', textAlign: 'center' }}>
              Verifying security clearance code...
            </p>
          </div>
        ) : verificationError ? (
          /* State 2: Verification Failed Error */
          <div className="trace-reset-card">
            <div className="trace-reset-card-header">
              <h1 className="trace-reset-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
                <AlertCircle className="w-6 h-6" />
                <span>Verification Failed</span>
              </h1>
              <p className="trace-reset-support-text" style={{ marginTop: '8px' }}>
                {verificationError}
              </p>
            </div>
            
            <div className="trace-reset-card-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '12px' }}>
              <Link to="/forgot-password" className="trace-reset-login-link">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Request a new link</span>
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          /* State 3: Password Update Success */
          <div className="trace-reset-card" role="status" aria-live="polite">
            <div className="trace-reset-card-header">
              <h1 className="trace-reset-title" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 className="w-6 h-6" />
                <span>Clearance key updated</span>
              </h1>
              <p className="trace-reset-support-text" style={{ marginTop: '8px' }}>
                Your clearance credentials have been successfully updated. Redirecting to the analyst login portal...
              </p>
            </div>

            <div className="trace-reset-card-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '12px' }}>
              <Link to="/login" className="trace-reset-login-link">
                <span>Go to Login Immediately</span>
              </Link>
            </div>
          </div>
        ) : (
          /* State 4: Reset Form */
          <div className="trace-reset-card">
            <div className="trace-reset-card-header">
              <h1 className="trace-reset-title">Define clearance key</h1>
              <p className="trace-reset-support-text">
                Enter your new credentials below for <strong>{email}</strong>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="trace-reset-form" noValidate>
              
              {/* Password Input */}
              <div className="trace-reset-field">
                <label htmlFor="new-password" className="trace-reset-label">
                  New Clearance Key
                </label>
                <div className={`trace-reset-input-container ${errors.password ? 'error-state' : ''}`}>
                  <span className="trace-reset-input-icon" aria-hidden="true">
                    <Lock className="w-[18px] h-[18px]" />
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="trace-reset-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                      if (errors.auth) setErrors((prev) => ({ ...prev, auth: null }));
                    }}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    disabled={isLoading}
                    required
                  />
                  <button 
                    className="trace-reset-password-toggle-btn" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {errors.password && (
                  <span id="password-error" className="trace-reset-validation-feedback error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>✕ {errors.password}</span>
                  </span>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="trace-reset-field">
                <label htmlFor="confirm-password" className="trace-reset-label">
                  Confirm Clearance Key
                </label>
                <div className={`trace-reset-input-container ${errors.confirmPassword ? 'error-state' : ''}`}>
                  <span className="trace-reset-input-icon" aria-hidden="true">
                    <Lock className="w-[18px] h-[18px]" />
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="trace-reset-input"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                      if (errors.auth) setErrors((prev) => ({ ...prev, auth: null }));
                    }}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                    disabled={isLoading}
                    required
                  />
                  <button 
                    className="trace-reset-password-toggle-btn" 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span id="confirm-password-error" className="trace-reset-validation-feedback error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>✕ {errors.confirmPassword}</span>
                  </span>
                )}
              </div>

              {errors.auth && (
                <div className="trace-reset-validation-feedback error" role="alert" style={{ alignSelf: 'center', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>✕ {errors.auth}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="trace-reset-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Updating Clearance Key...</span>
                  </>
                ) : (
                  <span>Update Clearance Key</span>
                )}
              </button>
            </form>

            <div className="trace-reset-card-footer">
              <Link to="/login" className="trace-reset-login-link">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Return to Login</span>
              </Link>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
