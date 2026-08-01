import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, Bolt, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../../services/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setGoogleError('');

    // Pre-flight environment keys check: explain exactly what is missing
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (!apiKey || apiKey === 'mock-api-key-replace-this') {
      setGoogleError('Configuration Error: VITE_FIREBASE_API_KEY is not configured or is set to mock value in client/.env. Please replace it with your Firebase Web App credentials.');
      setGoogleLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('operatorName', result.user.displayName || 'Operator');
        localStorage.setItem('operatorEmail', result.user.email || '');
        localStorage.setItem('operatorAvatar', result.user.photoURL || '');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log('Google Auth popup closed by user.');
        return;
      }
      if (error.code === 'auth/api-key-not-valid' || (error.message && error.message.includes('api-key-not-valid'))) {
        setGoogleError('Invalid Firebase API Key. Please verify that the credentials inside client/.env match your Google console project.');
      } else {
        setGoogleError(error.message || 'Google Federated Authentication failed.');
      }
      setTimeout(() => setGoogleError(''), 7000);
    } finally {
      setGoogleLoading(false);
    }
  };

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

  const mapFirebaseError = (error) => {
    switch (error.code) {
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/invalid-email':
        return 'Please enter a valid operator email address.';
      case 'auth/too-many-requests':
        return 'Access blocked due to excessive attempts. Please try again later.';
      case 'auth/operation-not-allowed':
        return 'Email/Password provider is disabled in your Firebase console. Please go to Authentication > Sign-in method in Firebase Console to enable it.';
      default:
        return error.message || 'An unexpected authentication error occurred.';
    }
  };

  // Submit Handler with Firebase Authentication
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (validateForm()) {
      setIsLoading(true);
      setErrors({});

      try {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        
        // Redirect to Verification Center if email is not verified
        if (!result.user.emailVerified) {
          console.log('[Login] User email not verified. Redirecting to Verification Center...');
          setIsLoading(false);
          navigate('/verify');
          return;
        }

        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('operatorName', result.user.displayName || 'Operator');
        localStorage.setItem('operatorEmail', result.user.email || '');
        localStorage.setItem('operatorAvatar', result.user.photoURL || '');
        navigate('/dashboard', { replace: true });
      } catch (error) {
        setIsLoading(false);
        const userFriendlyMessage = mapFirebaseError(error);
        setErrors({ auth: userFriendlyMessage });
      }
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
      {googleError && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#ef4444] text-[#ef4444] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          ✕ {googleError}
        </div>
      )}
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
            margin-bottom: 24px;
          }

          .trace-login-logo {
            height: 64px;
            margin-left: auto;
            margin-right: auto;
            margin-bottom: 16px;
          }

          .trace-login-card-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #F8FAFC;
            margin: 0 0 6px;
          }

          .trace-login-card-subtitle {
            font-size: 0.875rem;
            color: #94A3B8;
            margin: 6px 0 0;
          }

          /* Form Elements */
          .trace-login-form {
            display: flex;
            flex-direction: column;
            gap: 18px;
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
            background-color: #0F172A;
            transition: border-color 250ms ease, box-shadow 250ms ease;
            height: 54px;
            display: flex;
            align-items: center;
            box-sizing: border-box;
          }

          .trace-login-input-wrapper:focus-within {
            border-color: #47FAF3;
            box-shadow: 0 0 20px rgba(71, 250, 243, 0.25);
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
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
          }

          .trace-login-input-field {
            width: 100%;
            background: transparent;
            border: none;
            color: #F8FAFC;
            padding-left: 52px !important;
            padding-right: 48px;
            padding-top: 0;
            padding-bottom: 0;
            border-radius: 14px;
            font-size: 14px;
            outline: none;
            height: 100%;
            box-sizing: border-box;
          }

          .trace-login-input-field::placeholder {
            color: #94A3B8;
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
            transition: color 250ms ease;
            font-weight: 600;
          }

          .trace-login-forgot-link:hover {
            text-decoration: underline;
          }

          .trace-login-password-toggle-btn {
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
          }

          .trace-login-password-toggle-btn:hover {
            color: #47FAF3;
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
            height: 54px;
            box-shadow: 0 10px 30px rgba(34, 211, 238, 0.35);
            cursor: pointer;
            transition: all 250ms ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            position: relative;
            box-sizing: border-box;
          }

          .trace-login-primary-cta-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(34, 211, 238, 0.45);
          }

          .trace-login-primary-cta-btn:active:not(:disabled) {
            transform: scale(0.98);
          }

          .trace-login-primary-cta-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .trace-login-bolt-icon {
            transition: transform 250ms ease;
          }

          .trace-login-primary-cta-btn:hover:not(:disabled) .trace-login-bolt-icon {
            transform: translateX(4px);
          }

          /* SSO & Divider */
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
            height: 54px;
            border-radius: 14px;
            cursor: pointer;
            transition: all 250ms ease;
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
            transition: transform 250ms ease;
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
            transition: color 250ms ease;
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
            <img alt="TRACE AI Logo" className="trace-login-logo" src="https://lh3.googleusercontent.com/aida/AP1WRLuz09skiO_Gg27FxlCj0Xpmpe7cK9UWgHVU9v12QjZ3BJitQrudTVRDg937R92CU6i-PCwIQrGUp6CI60bD4P3WxmRTWiB7d9aKfQFE2CJaem64MD2XEGpf_FgjGDBcJuEr1p6O0X1WRRE7GN2149tDknL7D-yP67AoZBZa4vRWBIbOqAeBpQ9NKLbl3XqyYnmIt-HGsX4uyhnBVZ44dXmpxLXMoZpneLrzRTT8o1vDLfxzcjoH6nIe9S8"/>
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
          </form>

          {/* Divider */}
          <div className="trace-login-divider">
            <div className="trace-login-divider-line"></div>
            <span className="trace-login-divider-text">or authenticate via</span>
            <div className="trace-login-divider-line"></div>
          </div>

          {/* Secondary CTA (SSO) */}
          <button 
            className="trace-login-sso-btn" 
            type="button" 
            onClick={handleGoogleSignIn}
            disabled={isLoading || googleLoading}
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#47FAF3]" aria-hidden="true" />
                <span>Authenticating Identity...</span>
              </>
            ) : (
              <>
                <svg className="trace-login-sso-icon" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                <span>Secure Federated Identity</span>
              </>
            )}
          </button>

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
