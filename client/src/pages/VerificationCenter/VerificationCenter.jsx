import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, AlertCircle, RefreshCw, Send, Loader2, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';
import { auth } from '../../services/firebase';
import { sendEmailVerification, signOut, onAuthStateChanged } from 'firebase/auth';
import './VerificationCenter.css';

/**
 * VerificationCenter Page
 * Dynamic security dashboard to monitor and verify security operator credentials.
 */
export default function VerificationCenter() {
  const navigate = useNavigate();
  const location = useLocation();

  // Firebase auth state
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Verification UI states: 'pending' | 'exists_unverified' | 'verified'
  const [verificationState, setVerificationState] = useState('pending');
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  // Alert/Status notification
  const [alert, setAlert] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }

  // Refs for tracking intervals
  const pollingIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Initialize and check user session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Reload to get fresh emailVerified state from Firebase servers
        try {
          await currentUser.reload();
        } catch (err) {
          console.error('[VerificationCenter] Failed to reload user:', err);
        }

        const freshUser = auth.currentUser;
        
        // If already verified, transition immediately
        if (freshUser?.emailVerified) {
          handleVerificationSuccess(freshUser);
        } else {
          // Check if register page passed existsUnverified state
          if (location.state?.existsUnverified) {
            setVerificationState('exists_unverified');
          } else {
            setVerificationState('pending');
          }
          
          // Setup countdown timer based on localStorage rate limiting
          initCountdown(freshUser.uid);
          // Start status polling
          startPolling();
        }
      } else {
        if (location.state?.email) {
          setUser({ email: location.state.email });
          setVerificationState('pending');
        } else {
          setUser(null);
          navigate('/login', { replace: true });
        }
      }
      setIsInitializing(false);
    });

    return () => {
      unsubscribe();
      stopPolling();
      stopCountdown();
    };
  }, [navigate, location.state]);

  // Handle countdown initialization & tick
  const initCountdown = (uid) => {
    const storageKey = `trace_verification_last_send_${uid}`;
    const lastSendTime = localStorage.getItem(storageKey);
    
    if (lastSendTime) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSendTime, 10)) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      if (remaining > 0) {
        setCountdown(remaining);
        startCountdownTimer(remaining, uid);
        return;
      }
    }
    setCountdown(0);
  };

  const startCountdownTimer = (initialValue, uid) => {
    stopCountdown();
    let current = initialValue;
    
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

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Continuous status polling
  const startPolling = () => {
    stopPolling();
    
    pollingIntervalRef.current = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await currentUser.reload();
          const freshUser = auth.currentUser;
          console.log('[VerificationCenter] Polled state:', freshUser?.emailVerified ? 'VERIFIED' : 'PENDING');
          
          if (freshUser?.emailVerified) {
            stopPolling();
            handleVerificationSuccess(freshUser);
          }
        } catch (err) {
          console.warn('[VerificationCenter] Polling status update failure:', err.message);
        }
      }
    }, 3000); // Poll status every 3 seconds
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Action: Trigger verification success sequence
  const handleVerificationSuccess = (verifiedUser) => {
    setVerificationState('verified');
    setAlert({ message: 'Identity confirmed. Access granted to TRACE AI Console.', type: 'success' });
    stopPolling();
    stopCountdown();

    // Store local storage auth keys
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('operatorName', verifiedUser.displayName || 'Security Analyst');
    localStorage.setItem('operatorEmail', verifiedUser.email || '');
    localStorage.setItem('operatorAvatar', verifiedUser.photoURL || '');

    // Premium redirect after animation concludes
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 2500);
  };

  // Action: Resend Verification Email
  const handleResendEmail = async () => {
    if (countdown > 0 || isSending || !user) return;
    setIsSending(true);
    setAlert(null);

    try {
      await sendEmailVerification(user);
      
      // Save resend timestamp to enforce anti-spam limit
      const now = Date.now();
      localStorage.setItem(`trace_verification_last_send_${user.uid}`, now.toString());
      setCountdown(60);
      startCountdownTimer(60, user.uid);

      setAlert({
        message: 'A secure clearance link was dispatched to your registered email address.',
        type: 'success'
      });
    } catch (error) {
      console.error('[VerificationCenter] Resend error:', error);
      let errorMsg = 'Failed to transmit verification email. Please try again.';
      if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Server limit exceeded. Please wait a brief moment before resending.';
      }
      setAlert({
        message: errorMsg,
        type: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Action: Refresh Verification Status manually
  const handleRefreshStatus = async () => {
    if (isChecking || !user) return;
    setIsChecking(true);
    setAlert(null);

    try {
      await user.reload();
      const freshUser = auth.currentUser;
      
      if (freshUser?.emailVerified) {
        handleVerificationSuccess(freshUser);
      } else {
        setAlert({
          message: 'Clearance verification still pending. Please verify via the link sent to your inbox.',
          type: 'info'
        });
      }
    } catch (error) {
      console.error('[VerificationCenter] Reload error:', error);
      setAlert({
        message: 'Failed to synchronize authentication state. Please check your network connection.',
        type: 'error'
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Action: Log out user and redirect to login
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('[VerificationCenter] Logout error:', error);
    } finally {
      localStorage.clear();
      navigate('/login', { replace: true });
    }
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
              Your analyst workspace is encrypted under cryptographic identity protocols. Please confirm verification using your organization credentials to establish secure SOC connection.
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
              <span>Verifying Node Telemetry...</span>
            </div>
          )}

          {/* Verification Shield Visual representation */}
          <div className="trace-verify-shield-container">
            <div className="trace-verify-radar" />
            <div className="trace-verify-radar-inner" />
            <Shield 
              className={`w-20 h-20 trace-verify-shield-icon ${
                verificationState === 'verified' ? 'verified' : 
                verificationState === 'exists_unverified' ? 'warning' : ''
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
                  Session authentication established. Transferring workspace control...
                </p>
              </>
            ) : verificationState === 'exists_unverified' ? (
              <>
                <span className="trace-verify-status-badge warning">
                  Pending Activation
                </span>
                <h1 className="trace-verify-title">Existing Account Pending</h1>
                <p className="trace-verify-support-text">
                  This account already exists but is not verified. Please check <strong>{user?.email}</strong> for activation link or trigger a resend.
                </p>
              </>
            ) : (
              <>
                <span className="trace-verify-status-badge">
                  Verification Pending
                </span>
                <h1 className="trace-verify-title">Verify Your Clearance</h1>
                <p className="trace-verify-support-text">
                  Verification credentials sent to <strong>{user?.email}</strong>. Confirm the security email link to proceed.
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
                disabled
              >
                <span>Synchronizing...</span>
                <Loader2 className="w-4 h-4 animate-spin" />
              </button>
            ) : (
              <>
                {auth.currentUser && (
                  <>
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

                    <button
                      type="button"
                      className="trace-verify-btn trace-verify-btn-secondary"
                      onClick={handleRefreshStatus}
                      disabled={isChecking}
                    >
                      <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                      <span>Refresh Verification Status</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="trace-verify-btn trace-verify-btn-danger"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Go to Login</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
