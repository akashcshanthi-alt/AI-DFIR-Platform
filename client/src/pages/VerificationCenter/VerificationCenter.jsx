import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { Shield, AlertCircle, RefreshCw, Send, Loader2, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import './VerificationCenter.css';

/**
 * VerificationCenter Page
 * Dynamic security dashboard to monitor and verify security operator credentials.
 * Supports token verification from email link (?token=...) and resend flow.
 */
export default function VerificationCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [userEmail, setUserEmail] = useState(() => {
    return emailParam || location.state?.email || localStorage.getItem('operatorEmail') || '';
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const [verificationState, setVerificationState] = useState('pending'); // 'pending' | 'verified' | 'failed'
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [alert, setAlert] = useState(null);

  const countdownIntervalRef = useRef(null);

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const startCountdownTimer = (initialValue) => {
    stopCountdown();
    let current = initialValue;
    setCountdown(current);

    countdownIntervalRef.current = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        setCountdown(0);
        stopCountdown();
      } else {
        setCountdown(current);
      }
    }, 1000);
  };

  // If token is present in URL, verify immediately
  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (tokenParam) {
        setIsChecking(true);
        try {
          const res = await authService.verifyEmail(tokenParam);
          if (isMounted) {
            setVerificationState('verified');
            setAlert({
              message: res.message || 'Identity confirmed. Clearance granted to TRACE AI.',
              type: 'success'
            });
            setTimeout(() => {
              if (isMounted) navigate('/login', { replace: true });
            }, 3000);
          }
        } catch (err) {
          if (isMounted) {
            setVerificationState('failed');
            setAlert({
              message: err.message || 'Verification token is invalid or has expired.',
              type: 'error'
            });
          }
        } finally {
          if (isMounted) setIsChecking(false);
        }
      } else {
        if (location.state?.existsUnverified) {
          setVerificationState('exists_unverified');
        } else {
          setVerificationState('pending');
        }
      }
      if (isMounted) setIsInitializing(false);
    };

    verifyToken();

    return () => {
      isMounted = false;
      stopCountdown();
    };
  }, [tokenParam, navigate, location.state]);

  // Action: Resend Verification Email
  const handleResendEmail = async () => {
    if (countdown > 0 || isSending || !userEmail) {
      if (!userEmail) {
        setAlert({
          message: 'No registered email found. Please register or return to login.',
          type: 'error'
        });
      }
      return;
    }

    setIsSending(true);
    setAlert(null);

    try {
      const res = await authService.resendVerification(userEmail);
      startCountdownTimer(60);
      setAlert({
        message: res.message || 'A secure clearance link has been dispatched to your email.',
        type: 'success'
      });
    } catch (error) {
      console.error('[VerificationCenter] Resend error:', error);
      setAlert({
        message: error.message || 'Failed to dispatch verification email. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
  };

  if (isInitializing) {
    return (
      <main className="trace-verify-page justify-center items-center">
        <div className="flex flex-col items-center gap-4 text-[#47FAF3]">
          <Loader2 className="w-12 h-12 animate-spin" />
          <span className="text-sm font-bold tracking-widest uppercase">Initializing Secure Channel...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="trace-verify-page">
      <div className="trace-verify-grid-overlay" />

      {/* Left branding visual column */}
      <section className="trace-verify-left" aria-label="Identity Verification Center Info">
        <div className="trace-verify-grid-overlay" />
        
        <div className="trace-verify-left-content">
          <div className="trace-verify-brand">
            <div className="trace-verify-brand-icon">
              <Shield className="w-9 h-9" />
            </div>
            <div className="trace-verify-brand-text">
              <span className="trace-verify-brand-name">TRACE AI</span>
              <span className="trace-verify-brand-subtitle">DFIR</span>
            </div>
          </div>

          <div className="trace-verify-hero">
            <h2 className="trace-verify-hero-title">
              Enterprise Identity<br />
              <span>Verification Center</span>
            </h2>
            <p className="trace-verify-hero-desc">
              Your analyst workspace is protected under cryptographic identity protocols. Please confirm verification using your organization credentials to establish secure SOC connection.
            </p>
          </div>
        </div>

        {/* Vector SVG node visual matching Register page */}
        <div className="trace-verify-network-visual" aria-hidden="true">
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

        <div className="trace-verify-left-footer">
          TRACE AI Cryptographic Shielding
        </div>
      </section>

      {/* Right verification center actions column */}
      <section className="trace-verify-right">
        <div className="trace-verify-card">
          
          {/* Refresh overlay blocker during verification queries */}
          {isChecking && (
            <div className="trace-verify-checking-overlay">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>Verifying Clearance Token...</span>
            </div>
          )}

          {/* Verification Shield Visual representation */}
          <div className="trace-verify-shield-container">
            <div className="trace-verify-radar" />
            <div className="trace-verify-radar-inner" />
            <Shield 
              className={`w-20 h-20 trace-verify-shield-icon ${
                verificationState === 'verified' ? 'verified' : 
                verificationState === 'failed' ? 'error' : ''
              }`} 
            />
          </div>

          <div className="trace-verify-card-header">
            {verificationState === 'verified' ? (
              <>
                <span className="trace-verify-status-badge success">
                  Verified
                </span>
                <h1 className="trace-verify-title">Operator Authorized</h1>
                <p className="trace-verify-support-text">
                  Clearance confirmed. Transferring to login portal...
                </p>
              </>
            ) : verificationState === 'failed' ? (
              <>
                <span className="trace-verify-status-badge error" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                  Verification Failed
                </span>
                <h1 className="trace-verify-title">Invalid or Expired Link</h1>
                <p className="trace-verify-support-text">
                  The security clearance link has expired or was already used. Please request a new verification email below.
                </p>
              </>
            ) : (
              <>
                <span className="trace-verify-status-badge">
                  Verification Pending
                </span>
                <h1 className="trace-verify-title">Verify Your Clearance</h1>
                <p className="trace-verify-support-text">
                  Verification credentials sent to <strong>{userEmail || 'your email'}</strong>. Click the link in the email to activate your account.
                </p>
              </>
            )}
          </div>

          {/* Action notification center */}
          {alert && (
            <div className={`trace-verify-alert ${alert.type}`} role="alert">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{alert.message}</span>
            </div>
          )}

          {/* Dynamic Actions Center */}
          <div className="trace-verify-actions">
            {verificationState === 'verified' ? (
              <button 
                type="button"
                className="trace-verify-btn trace-verify-btn-primary"
                onClick={handleGoToLogin}
              >
                <span>Proceed to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {userEmail && (
                  <button
                    type="button"
                    className="trace-verify-btn trace-verify-btn-primary"
                    onClick={handleResendEmail}
                    disabled={countdown > 0 || isSending}
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {countdown > 0 
                        ? `Resend available in ${countdown}s` 
                        : isSending 
                          ? 'Sending Code...' 
                          : 'Resend Verification Email'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  className="trace-verify-btn trace-verify-btn-danger"
                  onClick={handleGoToLogin}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Return to Login</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
