import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, Bolt, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup } from '../../services/firebase';

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

  // Email verification resend states
  const [showResend, setShowResend] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Client-side validations
  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      tempErrors.email = 'Operator email address is required';
    } else if (!emailRegex.test(email.trim())) {
      tempErrors.email = 'Please enter a valid operator email address';
    }

    if (!password) {
      tempErrors.password = 'Clearance key is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit Handler with Backend Authentication and Firebase Verification Check
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (validateForm()) {
      setIsLoading(true);
      setErrors({});
      setShowResend(false);
      setResendSuccess('');

      try {
        // 1. Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // 2. Check if email is verified in Firebase
        if (!user.emailVerified) {
          await signOut(auth);
          setIsLoading(false);
          setErrors({ auth: 'Please verify your email before signing in.' });
          setShowResend(true);
          return;
        }

        // 3. Allow login normally on local backend if email is verified
        await authService.login(email.trim(), password);
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('[Login] Detailed login error:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
          raw: error
        });
        setIsLoading(false);
        let errorMsg = error.message || 'Invalid email or password.';
        if (error.code === 'auth/invalid-credential') {
          errorMsg = 'Invalid email or password.';
        } else if (error.message && error.message.includes('Failed to fetch')) {
          errorMsg = `Failed to fetch: Connection to backend API [${import.meta.env.VITE_API_URL}] failed. Verify the backend server is running and accessible.`;
        }
        setErrors({ auth: errorMsg });
      }
    }
  };

  // Resend verification flow
  const handleResendVerification = async () => {
    if (isResending || !email.trim() || !password) return;
    setIsResending(true);
    setResendSuccess('');
    setErrors({});

    try {
      // Temporarily sign in to get the user object, send email verification, and sign out
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      setResendSuccess('Verification email resent successfully! Please check your inbox.');
    } catch (error) {
      console.error('[Login] Resend verification error:', error);
      let errorMsg = 'Failed to resend verification email. Ensure credentials are correct.';
      if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Server limit exceeded. Please wait a moment before trying again.';
      }
      setErrors({ auth: errorMsg });
    } finally {
      setIsResending(false);
    }
  };

  // Google OAuth popup handler
  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrors({});
    setResendSuccess('');
    setShowResend(false);

    try {
      // 1. Authenticate with Google popup in Firebase
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      // 2. Authenticate with local backend
      await authService.googleLogin(
        user.email,
        user.displayName || user.email.split('@')[0],
        user.photoURL || ''
      );

      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('[Login] Detailed Google auth error:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        raw: error
      });
      setIsLoading(false);
      
      let errorMsg = error.message || 'Google authentication failed.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Authentication popup was closed before completion (auth/popup-closed-by-user).';
      } else if (error.code === 'auth/network-request-failed') {
        errorMsg = 'Network connectivity issue during authentication (auth/network-request-failed). Check your internet connection.';
      } else if (error.message && error.message.includes('Failed to fetch')) {
        errorMsg = `Failed to fetch: Connection to backend API [${import.meta.env.VITE_API_URL}] failed. Verify the backend server is running and accessible.`;
      } else {
        errorMsg = `Google authentication failed: ${error.message || error}`;
      }
      setErrors({ auth: errorMsg });
    }
  };

  // Mouse move glow effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const glow = document.querySelector('.glow-cursor');
      if (glow) {
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Real-time checking for validation indicators
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length > 0;

  return (
    <main className="trace-login-page">
      {/* Scoped styling block for the login screen */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-login-page {
            display: flex;
            min-height: 100vh;
            width: 100vw;
            position: relative;
            background-color: #050814;
            color: #F8FAFC;
            font-family: 'Inter', sans-serif;
            overflow: hidden;
            box-sizing: border-box;
          }

          /* Left Panel (Hero) */
          .trace-login-left-panel {
            width: 50%;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            background-color: #050814;
            border-right: 1px solid rgba(255, 255, 255, 0.08);
          }

          @media (max-width: 1024px) {
            .trace-login-left-panel {
              display: none;
            }
          }

          .trace-login-left-bg {
            position: absolute;
            inset: 0;
            z-index: 0;
            background-size: cover;
            background-position: center;
          }

          .trace-login-left-bg-overlay {
            position: absolute;
            inset: 0;
            background-color: rgba(10, 14, 26, 0.7);
            backdrop-filter: blur(2px);
          }

          .trace-login-left-bg-gradient {
            position: absolute;
            inset: 0;
            background: linear-gradient(to right, transparent, #050814);
          }

          .trace-login-grid-overlay {
            position: absolute;
            inset: 0;
            z-index: 10;
            pointer-events: none;
            background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), 
                              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
            background-size: 32px 32px;
          }

          .trace-login-left-content {
            position: relative;
            z-index: 20;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 48px;
            box-sizing: border-box;
          }

          .trace-login-left-hero-space {
            margin-bottom: 32px;
            max-width: 512px;
            text-align: left;
          }

          .trace-login-access-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #47FAF3;
            margin-bottom: 8px;
          }

          .trace-login-badge-text {
            font-family: monospace;
            font-size: 12px;
            letter-spacing: 0.1em;
            font-weight: 600;
          }

          .trace-login-hero-title {
            font-size: 2.25rem;
            line-height: 1.25;
            letter-spacing: -0.02em;
            font-weight: 700;
            color: #F8FAFC;
            margin-top: 8px;
            margin-bottom: 16px;
          }

          .trace-login-highlight {
            color: #47FAF3;
          }

          .trace-login-hero-desc {
            font-size: 0.95rem;
            line-height: 1.6;
            color: #94A3B8;
          }

          .trace-login-status-row {
            display: flex;
            gap: 40px;
            padding-top: 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            margin-top: 16px;
            box-sizing: border-box;
          }

          .trace-login-status-col {
            display: flex;
            flex-direction: column;
            text-align: left;
          }

          .trace-login-status-label {
            font-family: monospace;
            font-size: 11px;
            letter-spacing: 0.15em;
            font-weight: 600;
            color: #cbd5e1;
            margin-bottom: 4px;
            text-transform: uppercase;
          }

          .trace-login-status-value {
            font-family: monospace;
            font-size: 13px;
            color: #47FAF3;
            display: flex;
            align-items: center;
          }

          .trace-login-pulse-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #47FAF3;
            margin-right: 8px;
            box-shadow: 0 0 8px #47FAF3;
          }

          /* Right Panel (Authentication) */
          .trace-login-right-panel {
            width: 50%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            padding: 48px;
            background-color: #050814;
            box-sizing: border-box;
          }

          @media (max-width: 1024px) {
            .trace-login-right-panel {
              width: 100%;
              padding: 16px;
            }
          }

          .trace-login-glow-top-right {
            position: absolute;
            top: 0;
            right: 0;
            width: 256px;
            height: 256px;
            background-color: rgba(174, 198, 255, 0.03);
            filter: blur(120px);
            border-radius: 50%;
            pointer-events: none;
          }

          .trace-login-glow-bottom-left {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 384px;
            height: 384px;
            background-color: rgba(71, 250, 243, 0.03);
            filter: blur(120px);
            border-radius: 50%;
            pointer-events: none;
          }

          /* Login Card */
          .trace-login-card {
            width: 100%;
            max-width: 440px;
            background-color: #101827;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 40px 32px;
            position: relative;
            z-index: 30;
            transition: border-color 250ms ease, box-shadow 250ms ease;
            box-sizing: border-box;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }

          .trace-login-card:hover {
            border-color: rgba(71, 250, 243, 0.15);
            box-shadow: 0 10px 30px rgba(71, 250, 243, 0.03);
          }

          .trace-login-card-header {
            text-align: center;
            margin-bottom: 28px;
          }

          .trace-login-logo {
            display: block;
            width: 64px;
            height: 64px;
            aspect-ratio: 1/1;
            object-fit: contain;
            margin-left: auto;
            margin-right: auto;
            margin-bottom: 20px;
          }

          .trace-login-card-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #F8FAFC;
            margin: 0 0 8px;
          }

          .trace-login-card-subtitle {
            font-size: 0.875rem;
            color: #94A3B8;
            margin: 0;
          }

          /* Form Elements */
          .trace-login-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .trace-login-field-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            text-align: left;
          }

          .trace-login-field-label {
            font-size: 12px;
            line-height: 1.25;
            letter-spacing: 0.10em;
            font-weight: 600;
            color: #cbd5e1;
            text-transform: uppercase;
          }

          .trace-login-input-wrapper {
            position: relative;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background-color: rgba(10, 16, 30, 0.85);
            transition: all 0.3s ease;
            height: 56px;
            display: flex;
            align-items: center;
            box-sizing: border-box;
          }

          .trace-login-input-wrapper:hover {
            border-color: rgba(0, 217, 255, 0.45);
            background-color: rgba(16, 24, 44, 0.85);
          }

          .trace-login-input-wrapper:focus-within {
            border-color: #00D9FF;
            box-shadow: 0 0 0 3px rgba(0, 217, 255, 0.15);
          }

          .trace-login-input-wrapper.error-border {
            border-color: #EF4444;
          }

          .trace-login-input-icon {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            width: 18px;
            height: 18px;
            color: #94A3B8;
            opacity: 0.6;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            transition: all 0.3s ease;
          }

          .trace-login-input-wrapper:focus-within .trace-login-input-icon {
            color: #00D9FF;
            opacity: 1;
          }

          .trace-login-input-wrapper input.trace-login-input-field {
            width: 100% !important;
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            color: #FFFFFF !important;
            padding-left: 52px !important;
            padding-right: 48px !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            border-radius: 14px !important;
            font-size: 14px !important;
            outline: none !important;
            height: 100% !important;
            box-sizing: border-box !important;
            transition: all 0.3s ease !important;
            line-height: normal !important;
            box-shadow: none !important;
          }

          .trace-login-input-wrapper input.trace-login-input-field::placeholder {
            color: #7C879E !important;
          }

          .trace-login-field-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }

          .trace-login-forgot-link {
            font-size: 12px;
            color: #47FAF3;
            text-decoration: none;
            transition: color 0.3s ease;
            font-weight: 600;
          }

          .trace-login-forgot-link:hover {
            text-decoration: underline;
          }

          .trace-login-password-toggle-btn {
            position: absolute;
            right: 4px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #94A3B8;
            opacity: 0.6;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            box-sizing: border-box;
          }

          .trace-login-password-toggle-btn:hover {
            color: #00D9FF;
            opacity: 1;
            background-color: rgba(255, 255, 255, 0.03);
          }

          .trace-login-input-wrapper:focus-within .trace-login-password-toggle-btn {
            color: #00D9FF;
            opacity: 1;
          }

          .trace-login-validation-feedback {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 500;
            margin-top: 4px;
          }

          .trace-login-validation-feedback.success {
            color: #10B981;
          }

          .trace-login-validation-feedback.error {
            color: #EF4444;
          }

          /* Checkbox & CTA Button */
          .trace-login-remember-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-top: 4px;
          }

          .trace-login-checkbox {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background-color: #0F172A;
            accent-color: #47FAF3;
            cursor: pointer;
          }

          .trace-login-checkbox-label {
            font-size: 14px;
            color: #cbd5e1;
            cursor: pointer;
            user-select: none;
          }

          .trace-login-primary-cta-btn {
            width: 100%;
            background: linear-gradient(90deg, #22D3EE, #06B6D4);
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
            border: none;
            border-radius: 14px;
            height: 56px;
            box-shadow: 0 10px 30px rgba(34, 211, 238, 0.35);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            position: relative;
            box-sizing: border-box;
          }

          .trace-login-primary-cta-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);
          }

          .trace-login-primary-cta-btn:active:not(:disabled) {
            transform: scale(0.98);
          }

          .trace-login-primary-cta-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
          }

          .trace-login-bolt-icon {
            transition: transform 0.3s ease;
          }

          .trace-login-primary-cta-btn:hover:not(:disabled) .trace-login-bolt-icon {
            transform: translateX(4px);
          }

          /* SSO & Divider */
          .trace-login-google-btn {
            width: 100%;
            background-color: #FFFFFF;
            color: #1F1F1F;
            font-size: 15px;
            font-weight: 600;
            border: 1px solid #E5E7EB;
            border-radius: 14px;
            height: 56px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            position: relative;
            box-sizing: border-box;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            margin-top: 14px;
          }

          .trace-login-google-btn:hover:not(:disabled) {
            background-color: #F3F4F6;
            transform: translateY(-2px);
            border-color: #D1D5DB;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
          }

          @media (prefers-color-scheme: dark) {
            .trace-login-google-btn:hover:not(:disabled) {
              box-shadow: 0 0 15px rgba(71, 250, 243, 0.35);
              border-color: #47FAF3;
            }
          }

          .trace-login-google-btn:active:not(:disabled) {
            transform: scale(0.98);
          }

          .trace-login-google-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .trace-login-google-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-login-divider {
            display: flex;
            align-items: center;
            margin-top: 24px;
            margin-bottom: 24px;
          }

          .trace-login-divider-line {
            flex-grow: 1;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }

          .trace-login-divider-text {
            font-size: 11px;
            color: #94A3B8;
            margin-left: 16px;
            margin-right: 16px;
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-family: monospace;
          }

          .trace-login-sso-btn {
            width: 100%;
            background-color: #0F172A;
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #F8FAFC;
            font-size: 14px;
            font-weight: 600;
            height: 56px;
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            box-sizing: border-box;
          }

          .trace-login-sso-btn:hover {
            border-color: #47FAF3;
            background-color: rgba(255, 255, 255, 0.02);
          }

          .trace-login-sso-icon {
            width: 20px;
            height: 20px;
            transition: transform 0.3s ease;
          }

          .trace-login-sso-btn:hover .trace-login-sso-icon {
            transform: scale(1.1);
          }

          .trace-login-card-footer {
            margin-top: 24px;
            text-align: center;
          }

          .trace-login-footer-text {
            font-size: 14px;
            color: #94A3B8;
            margin: 0;
          }

          .trace-login-register-link {
            color: #47FAF3;
            font-weight: 600;
            text-decoration: none;
            margin-left: 6px;
            transition: color 0.3s ease;
          }

          .trace-login-register-link:hover {
            text-decoration: underline;
          }

          /* Decorative Bottom Info */
          .trace-login-footer-info {
            position: absolute;
            bottom: 24px;
            left: 24px;
            right: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 20;
            pointer-events: none;
          }

          @media (max-width: 1024px) {
            .trace-login-footer-info {
              position: static;
              margin-top: 40px;
              padding: 0 16px;
              flex-direction: column;
              gap: 12px;
            }
          }

          .trace-login-footer-status {
            display: flex;
            align-items: center;
            font-size: 11px;
            font-family: monospace;
            color: #94A3B8;
          }

          .trace-login-footer-divider {
            height: 12px;
            width: 1px;
            background-color: rgba(255, 255, 255, 0.08);
          }

          @media (max-width: 1024px) {
            .trace-login-footer-divider {
              display: none;
            }
          }

          .trace-login-footer-copyright {
            font-size: 11px;
            font-family: monospace;
            color: #94A3B8;
            margin: 0;
          }

          .glow-cursor {
            position: fixed;
            width: 384px;
            height: 384px;
            background: radial-gradient(circle, rgba(71, 250, 243, 0.03) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            transform: translate(-50%, -50%);
            z-index: 10;
          }
        `
      }} />

      {/* Left Panel: Security branding visual */}
      <section className="trace-login-left-panel" aria-label="Product Information">
        <div className="trace-login-grid-overlay"></div>
        <div className="trace-login-left-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80')" }}></div>
        <div className="trace-login-left-bg-overlay"></div>
        <div className="trace-login-left-bg-gradient"></div>
        
        <div className="trace-login-left-content">
          <div className="trace-login-left-hero-space">
            <div className="trace-login-access-badge">
              <Shield className="w-[18px] h-[18px]" />
              <span className="trace-login-badge-text">SECURE TERMINAL ACCESS</span>
            </div>
            
            <h1 className="trace-login-hero-title">
              Autonomous Threat<br />
              <span className="trace-login-highlight">Investigation Portal</span>
            </h1>
            
            <p className="trace-login-hero-desc">
              Connect to client telemetry channels and orchestrate isolated endpoint recovery with cognitive AI augmentations.
            </p>
          </div>

          <div className="trace-login-status-row">
            <div className="trace-login-status-col">
              <span className="trace-login-status-label">Client Status</span>
              <div className="trace-login-status-value">
                <span className="trace-login-pulse-dot"></span>
                <span>CONNECTED</span>
              </div>
            </div>
            <div className="trace-login-status-col">
              <span className="trace-login-status-label">Grid Mode</span>
              <span className="trace-login-status-value">DECRYPT ACTIVE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel: Interactive credentials container */}
      <section className="trace-login-right-panel" aria-label="Operator Authentication">
        <div className="trace-login-glow-top-right"></div>
        <div className="trace-login-glow-bottom-left"></div>
        
        {/* Login Card */}
        <div className="trace-login-card">
          {/* Brand & Header */}
          <div className="trace-login-card-header">
            <img alt="TRACE AI Logo" className="trace-login-logo" src="/logo-white.svg"/>
            <h2 className="trace-login-card-title">Welcome back</h2>
            <p className="trace-login-card-subtitle">AI-Driven Digital Forensics &amp; Incident Response Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="trace-login-form" noValidate>
            
            {/* Email Field */}
            <div className="trace-login-field-group">
              <label className="trace-login-field-label" htmlFor="email">OPERATOR EMAIL</label>
              <div className={`trace-login-input-wrapper ${errors.email ? 'error-border' : ''}`}>
                <Mail className="trace-login-input-icon w-[18px] h-[18px]" />
                <input 
                  className="trace-login-input-field" 
                  style={{ paddingLeft: '52px', paddingRight: '48px' }}
                  id="email" 
                  name="email" 
                  placeholder="name@agency.gov" 
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email || errors.auth) setErrors((prev) => ({ ...prev, email: null, auth: null }));
                  }}
                  disabled={isLoading}
                />
              </div>
              {email.trim() !== '' && isEmailValid && (
                <span className="trace-login-validation-feedback success" role="status">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Valid email</span>
                </span>
              )}
              {errors.email && (
                <span className="trace-login-validation-feedback error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>✕ {errors.email}</span>
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="trace-login-field-group">
              <div className="trace-login-field-header">
                <label className="trace-login-field-label" htmlFor="password">CLEARANCE KEY</label>
                <Link to="/forgot-password" className="trace-login-forgot-link">Forgot Password?</Link>
              </div>
              
              <div className={`trace-login-input-wrapper ${errors.password ? 'error-border' : ''}`}>
                <Lock className="trace-login-input-icon w-[18px] h-[18px]" />
                <input 
                  className="trace-login-input-field" 
                  style={{ paddingLeft: '52px', paddingRight: '48px' }}
                  id="password" 
                  name="password" 
                  placeholder="••••••••••••" 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password || errors.auth) setErrors((prev) => ({ ...prev, password: null, auth: null }));
                  }}
                  disabled={isLoading}
                />
                <button 
                  className="trace-login-password-toggle-btn" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide clearance key" : "Show clearance key"}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {password.trim() !== '' && isPasswordValid && (
                <span className="trace-login-validation-feedback success" role="status">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Clearance key format valid</span>
                </span>
              )}
              {errors.password && (
                <span className="trace-login-validation-feedback error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>✕ {errors.password}</span>
                </span>
              )}
            </div>

            {/* Remember Me */}
            <div className="trace-login-remember-wrapper">
              <input 
                className="trace-login-checkbox" 
                id="remember" 
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <label className="trace-login-checkbox-label" htmlFor="remember">Maintain persistent session</label>
            </div>

             {errors.auth && (
              <div className="trace-login-validation-feedback error" role="alert" style={{ alignSelf: 'center', margin: '4px 0' }}>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>✕ {errors.auth}</span>
              </div>
            )}

            {resendSuccess && (
              <div className="trace-login-validation-feedback success" role="alert" style={{ alignSelf: 'center', margin: '4px 0', color: '#10B981' }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {showResend && (
              <button 
                className="trace-login-resend-btn" 
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                style={{
                  alignSelf: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: '#47FAF3',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  textDecoration: 'underline',
                  transition: 'opacity 0.2s'
                }}
              >
                {isResending ? 'Resending verification email...' : 'Resend Verification Email'}
              </button>
            )}

            {/* Primary CTA */}
            <button 
              className="trace-login-primary-cta-btn" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Initiating Authentication...</span>
                </>
              ) : (
                <>
                  <span>Initiate Authentication</span>
                  <Bolt className="trace-login-bolt-icon w-4 h-4" />
                </>
              )}
            </button>

            {/* Google Authentication Sign-In */}
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="trace-login-google-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="trace-login-google-icon">
                <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.62 14.99 1 12 1 7.37 1 3.4 3.73 1.58 7.72l3.87 3c.87-2.61 3.3-4.68 6.55-4.68z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.48-1.11 2.73-2.37 3.58l3.68 2.85c2.15-1.99 3.74-4.91 3.74-8.58z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.96-1.07 7.95-2.91l-3.68-2.85c-1.02.68-2.33 1.09-4.27 1.09-3.25 0-6.01-2.07-6.99-4.86H1.14v3.08C3.12 20.27 7.23 23 12 23z"/>
                <path fill="#FBBC05" d="M5.01 13.47c-.24-.71-.38-1.47-.38-2.25s.14-1.54.38-2.25V5.89H1.14C.41 7.38 0 9.04 0 10.8s.41 3.42 1.14 4.91l3.87-2.24z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Footer Link */}
          <div className="trace-login-card-footer">
            <p className="trace-login-footer-text">
              New to the Grid? 
              <Link to="/register" className="trace-login-register-link">Request Clearance</Link>
            </p>
          </div>
        </div>

        {/* Decorative Bottom Info */}
        <footer className="trace-login-footer-info">
          <div className="trace-login-footer-status">
            <span className="trace-login-pulse-dot"></span>
            <span>System Health: Nominal</span>
          </div>
          <div className="trace-login-footer-divider"></div>
          <p className="trace-login-footer-copyright">© 2024 TRACE AI DFIR • ENCRYPTED SESSION</p>
        </footer>

        {/* Mouse Interactive Glow */}
        <div className="glow-cursor"></div>
      </section>
    </main>
  );
}
