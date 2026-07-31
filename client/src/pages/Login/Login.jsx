import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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

  // Submit Handler with local development credentials validation
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (validateForm()) {
      // Check dev credentials
      if (email.trim() === 'aa7193147@gmail.com' && password === 'Akash@2007') {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          localStorage.setItem('isAuthenticated', 'true');
          navigate('/dashboard', { replace: true });
        }, 1500);
      } else {
        setErrors({ auth: 'Invalid email or password.' });
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

  return (
    <main className="trace-login-page">
      {/* Scoped styling block for the login screen */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

          .trace-login-page {
            /* Scoped variables matching reference design */
            --on-background: #dfe2f3;
            --surface-bright: #353946;
            --on-secondary: #003735;
            --on-surface: #dfe2f3;
            --primary-container: #0070f3;
            --primary: #aec6ff;
            --primary-fixed: #d8e2ff;
            --primary-fixed-dim: #aec6ff;
            --surface-container-high: #262a37;
            --secondary-fixed-dim: #00ddd6;
            --on-tertiary: #68000b;
            --on-primary-container: #ffffff;
            --on-surface-variant: #c1c6d7;
            --inverse-surface: #dfe2f3;
            --surface-container-lowest: #0a0e1a;
            --on-primary-fixed-variant: #004397;
            --inverse-primary: #0059c5;
            --inverse-on-surface: #2c303d;
            --secondary-container: #00ddd6;
            --on-error: #690005;
            --on-tertiary-fixed: #410004;
            --on-primary: #002e6b;
            --surface-tint: #aec6ff;
            --surface-container-highest: #313442;
            --on-tertiary-fixed-variant: #930014;
            --on-error-container: #ffdad6;
            --tertiary-container: #dd3438;
            --surface-container: #1b1f2c;
            --surface-dim: #0f131f;
            --surface-variant: #313442;
            --outline-variant: #414754;
            --tertiary: #ffb3ae;
            --on-tertiary-container: #ffffff;
            --on-secondary-fixed-variant: #00504d;
            --background: #0f131f;
            --secondary: #47faf3;
            --error: #ffb4ab;
            --surface: #0f131f;
            --tertiary-fixed-dim: #ffb3ae;
            --on-primary-fixed: #001a43;
            --on-secondary-container: #005d5a;
            --tertiary-fixed: #ffdad7;
            --outline: #8b90a0;
            --secondary-fixed: #47faf3;
            --surface-container-low: #171b28;
            --on-secondary-fixed: #00201f;
            --error-container: #93000a;

            /* Spacing overrides for typography */
            --font-display-lg-size: 48px;
            --font-display-lg-lh: 56px;
            --font-headline-lg-size: 32px;
            --font-headline-lg-lh: 40px;
            --font-headline-md-size: 24px;
            --font-headline-md-lh: 32px;
            --font-body-lg-size: 18px;
            --font-body-lg-lh: 28px;
            --font-body-md-size: 16px;
            --font-body-md-lh: 24px;
            --font-code-sm-size: 13px;
            --font-code-sm-lh: 20px;
            --font-label-caps-size: 12px;
            --font-label-caps-lh: 16px;

            display: flex;
            min-height: 100vh;
            width: 100vw;
            position: relative;
            background-color: var(--background);
            color: var(--on-surface);
            font-family: 'Inter', sans-serif;
            overflow: hidden;
            box-sizing: border-box;
          }

          /* Material icons global rules */
          .trace-login-page .material-symbols-outlined {
            font-family: 'Material Symbols Outlined';
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            line-height: 1;
            text-transform: none;
            letter-spacing: normal;
            word-wrap: normal;
            white-space: nowrap;
            direction: ltr;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
            -moz-osx-font-smoothing: grayscale;
            font-feature-settings: 'liga';
            vertical-align: middle;
          }

          /* Left Panel (Hero) */
          .trace-login-left-panel {
            width: 50%;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            background-color: var(--surface-container-lowest);
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
            background-color: rgba(10, 14, 26, 0.7); /* bg-surface-container-lowest/70 */
            backdrop-filter: blur(2px);
          }

          .trace-login-left-bg-gradient {
            position: absolute;
            inset: 0;
            background: linear-gradient(to right, transparent, var(--surface));
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
            padding: 40px; /* margin-desktop */
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
            color: var(--secondary);
            margin-bottom: 8px;
          }

          .trace-login-access-badge span {
            font-size: 18px;
          }

          .trace-login-badge-text {
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--font-label-caps-size);
            line-height: var(--font-label-caps-lh);
            letter-spacing: 0.1em;
            font-weight: 600;
          }

          .trace-login-hero-title {
            font-family: 'Geist', sans-serif;
            font-size: var(--font-display-lg-size);
            line-height: var(--font-display-lg-lh);
            letter-spacing: -0.02em;
            font-weight: 700;
            color: var(--on-surface);
            margin-top: 8px;
            margin-bottom: 16px;
          }

          .trace-login-highlight {
            color: var(--secondary);
          }

          .trace-login-hero-desc {
            font-family: 'Inter', sans-serif;
            font-size: var(--font-body-lg-size);
            line-height: var(--font-body-lg-lh);
            color: var(--on-surface-variant);
          }

          .trace-login-status-row {
            display: flex;
            gap: 40px; /* gutter */
            padding-top: 32px; /* stack-lg */
            border-top: 1px solid rgba(65, 71, 84, 0.3); /* outline-variant/30 */
            margin-top: 16px;
            box-sizing: border-box;
          }

          .trace-login-status-col {
            display: flex;
            flex-direction: column;
            text-align: left;
          }

          .trace-login-status-label {
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--font-label-caps-size);
            line-height: var(--font-label-caps-lh);
            letter-spacing: 0.15em;
            font-weight: 600;
            color: var(--outline);
            margin-bottom: 4px;
          }

          .trace-login-status-value {
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--font-code-sm-size);
            line-height: var(--font-code-sm-lh);
            color: var(--secondary);
            display: flex;
            align-items: center;
          }

          .trace-login-pulse-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--secondary);
            margin-right: 8px;
            animation: pulse-glow 3s infinite ease-in-out;
          }

          /* Right Panel (Authentication) */
          .trace-login-right-panel {
            width: 50%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            padding: 40px; /* margin-desktop */
            background-color: var(--surface);
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
            background-color: rgba(174, 198, 255, 0.05); /* primary/5 */
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
            background-color: rgba(71, 250, 243, 0.05); /* secondary/5 */
            filter: blur(120px);
            border-radius: 50%;
            pointer-events: none;
          }

          /* Login Card (glass-card) */
          .trace-login-card {
            width: 100%;
            max-width: 480px;
            background: rgba(27, 31, 44, 0.4);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px; /* rounded-xl */
            padding: 32px; /* stack-lg */
            position: relative;
            z-index: 30;
            transition: all 0.5s ease;
            box-sizing: border-box;
          }

          @media (min-width: 768px) {
            .trace-login-card {
              padding: 48px;
            }
          }

          .trace-login-card:hover {
            box-shadow: 0 8px 32px 0 rgba(71, 250, 243, 0.08);
            border-color: rgba(255, 255, 255, 0.12);
          }

          .trace-login-card-header {
            text-align: center;
            margin-bottom: 32px; /* stack-lg */
          }

          .trace-login-logo {
            height: 64px;
            margin-left: auto;
            margin-right: auto;
            margin-bottom: 16px; /* stack-md */
          }

          .trace-login-card-title {
            font-family: 'Geist', sans-serif;
            font-size: var(--font-headline-lg-size);
            line-height: var(--font-headline-lg-lh);
            font-weight: 600;
            color: var(--on-surface);
            margin: 0 0 8px;
          }

          .trace-login-card-subtitle {
            font-family: 'Inter', sans-serif;
            font-size: var(--font-body-md-size);
            line-height: var(--font-body-md-lh);
            color: var(--on-surface-variant);
            margin: 8px 0 0;
          }

          /* Form Elements */
          .trace-login-form {
            display: flex;
            flex-direction: column;
            gap: 16px; /* stack-md */
          }

          .trace-login-field-group {
            display: flex;
            flex-direction: column;
            gap: 8px; /* space-y-2 */
            text-align: left;
          }

          .trace-login-field-label {
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--font-label-caps-size);
            line-height: var(--font-label-caps-lh);
            letter-spacing: 0.1em;
            font-weight: 600;
            color: var(--on-surface-variant);
            margin-left: 4px;
            text-transform: uppercase;
          }

          .trace-login-input-wrapper {
            position: relative;
            border-radius: 8px; /* rounded-lg */
            border: 1px solid rgba(255, 255, 255, 0.08); /* fallback border */
            background-color: var(--surface-container-low);
            transition: all 0.3s ease;
          }

          .trace-login-input-wrapper:focus-within {
            transform: translateY(-2px);
            box-shadow: 0 0 15px rgba(71, 250, 243, 0.2);
            border-color: #47faf3;
          }

          .trace-login-input-wrapper.error-border {
            border-color: var(--status-critical, #ef4444);
          }

          .trace-login-input-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--outline);
            font-size: 20px !important;
            pointer-events: none;
          }

          .trace-login-input-field {
            width: 100%;
            background: transparent;
            border: none;
            color: var(--on-surface);
            padding-top: 14px;
            padding-bottom: 14px;
            padding-left: 48px;
            padding-right: 16px;
            border-radius: 8px;
            font-size: var(--font-body-md-size);
            line-height: var(--font-body-md-lh);
            outline: none;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }

          .trace-login-input-field::placeholder {
            color: rgba(139, 144, 160, 0.5); /* outline/50 */
          }

          .trace-login-field-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-left: 4px;
            padding-right: 4px;
          }

          .trace-login-forgot-link {
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--font-code-sm-size);
            line-height: var(--font-code-sm-lh);
            color: var(--secondary);
            text-decoration: none;
            transition: color 0.2s ease;
          }

          .trace-login-forgot-link:hover {
            color: var(--primary);
          }

          .trace-login-password-toggle-btn {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--outline);
            cursor: pointer;
            transition: color 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-login-password-toggle-btn:hover {
            color: var(--secondary);
          }

          .trace-login-password-toggle-btn span {
            font-size: 20px !important;
          }

          .trace-login-error-message {
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            color: #ffb4ab; /* error color matching palette */
            margin-top: 4px;
            margin-left: 4px;
          }

          /* Checkbox & CTA Button */
          .trace-login-remember-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-left: 4px;
            padding-top: 4px;
          }

          .trace-login-checkbox {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            border: 1px solid rgba(65, 71, 84, 0.5); /* outline-variant/50 */
            background-color: var(--surface-container-high);
            accent-color: var(--secondary);
            cursor: pointer;
          }

          .trace-login-checkbox-label {
            font-family: 'Inter', sans-serif;
            font-size: var(--font-body-md-size);
            color: var(--on-surface-variant);
            cursor: pointer;
            user-select: none;
          }

          .trace-login-primary-cta-btn {
            width: 100%;
            background: linear-gradient(135deg, #0070f3 0%, #47faf3 100%); /* cyber-gradient */
            color: var(--on-primary-container);
            font-family: 'Geist', sans-serif;
            font-size: var(--font-body-lg-size);
            line-height: var(--font-body-lg-lh);
            font-weight: 600;
            padding-top: 16px;
            padding-bottom: 16px;
            border: none;
            border-radius: 8px;
            box-shadow: 0 4px 14px 0 rgba(71, 250, 243, 0.2);
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            position: relative;
            box-sizing: border-box;
          }

          .trace-login-primary-cta-btn:hover:not(:disabled) {
            box-shadow: 0 6px 20px 0 rgba(71, 250, 243, 0.4);
          }

          .trace-login-primary-cta-btn:active:not(:disabled) {
            transform: scale(0.98);
          }

          .trace-login-primary-cta-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .trace-login-bolt-icon {
            font-size: 20px !important;
            transition: transform 0.3s ease;
          }

          .trace-login-primary-cta-btn:hover:not(:disabled) .trace-login-bolt-icon {
            transform: translateX(4px);
          }

          /* SSO & Divider */
          .trace-login-divider {
            display: flex;
            align-items: center;
            margin-top: 32px;
            margin-bottom: 32px;
          }

          .trace-login-divider-line {
            flex-grow: 1;
            border-top: 1px solid rgba(65, 71, 84, 0.3); /* outline-variant/30 */
          }

          .trace-login-divider-text {
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--font-label-caps-size);
            color: var(--outline);
            margin-left: 16px;
            margin-right: 16px;
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }

          .trace-login-sso-btn {
            width: 100%;
            background-color: var(--surface-container-high);
            border: 1px solid rgba(65, 71, 84, 0.5); /* outline-variant/50 */
            color: var(--on-surface);
            font-family: 'Inter', sans-serif;
            font-size: var(--font-body-md-size);
            padding-top: 14px;
            padding-bottom: 14px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            box-sizing: border-box;
          }

          .trace-login-sso-btn:hover {
            background-color: var(--surface-variant);
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
            margin-top: 32px;
            text-align: center;
          }

          .trace-login-footer-text {
            font-family: 'Inter', sans-serif;
            font-size: var(--font-body-md-size);
            color: var(--on-surface-variant);
            margin: 0;
          }

          .trace-login-register-link {
            color: var(--secondary);
            font-weight: 700;
            text-decoration: none;
            margin-left: 6px;
            transition: text-decoration 0.2s ease;
          }

          .trace-login-register-link:hover {
            text-decoration: underline;
          }

          /* Footer Info */
          .trace-login-footer-info {
            position: absolute;
            bottom: 40px; /* margin-desktop */
            display: flex;
            align-items: center;
            gap: 24px;
            color: var(--outline);
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--font-code-sm-size);
          }

          @media (max-width: 1024px) {
            .trace-login-footer-info {
              position: static;
              margin-top: 32px;
              justify-content: center;
              flex-wrap: wrap;
            }
          }

          .trace-login-footer-status {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .trace-login-footer-pulse-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--secondary);
          }

          .trace-login-footer-divider {
            height: 16px;
            width: 1px;
            background-color: rgba(139, 144, 160, 0.2); /* outline/20 */
          }

          @media (max-width: 1024px) {
            .trace-login-footer-divider {
              display: none;
            }
          }

          .trace-login-footer-copyright {
            color: var(--outline);
            margin: 0;
          }

          /* Cursor Glow Effect & Animations */
          .glow-cursor {
            position: fixed;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(71, 250, 243, 0.04) 0%, transparent 70%);
            pointer-events: none;
            z-index: 5;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            transition: left 0.1s ease, top 0.1s ease;
          }

          @keyframes pulse-glow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
          }

          .trace-login-spinner {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-top-color: #ffffff;
            animation: trace-spin 0.8s linear infinite;
            display: inline-block;
          }

          @keyframes trace-spin {
            to { transform: rotate(360deg); }
          }
        `
      }} />

      {/* Left Side: Hero Visualization */}
      <section className="trace-login-left-panel">
        {/* Full Bleed Background Image with Dark Overlay */}
        <div className="trace-login-left-bg" style={{ backgroundImage: "url('/illustration.png')" }}>
          <div className="trace-login-left-bg-overlay"></div>
          <div className="trace-login-left-bg-gradient"></div>
        </div>
        
        {/* Grid Overlay */}
        <div className="trace-login-grid-overlay"></div>
        
        {/* Hero Content */}
        <div className="trace-login-left-content">
          <div className="trace-login-left-hero-space">
            <div className="trace-login-access-badge">
              <span className="material-symbols-outlined">verified_user</span>
              <span className="trace-login-badge-text">SECURE ACCESS GRANTED</span>
            </div>
            
            <h1 className="trace-login-hero-title">
              Neural Trace <br/>
              <span className="trace-login-highlight">Intelligence</span>
            </h1>
            
            <p className="trace-login-hero-desc">
              Next-generation AI-driven forensics platform. Decrypt, analyze, and neutralize threats with hyper-scale computational precision.
            </p>
          </div>
          
          {/* Status Indicators */}
          <div className="trace-login-status-row">
            <div className="trace-login-status-col">
              <p className="trace-login-status-label">LATENCY</p>
              <p className="trace-login-status-value">24ms</p>
            </div>
            <div className="trace-login-status-col">
              <p className="trace-login-status-label">NODE STATUS</p>
              <p className="trace-login-status-value">
                <span className="trace-login-pulse-dot"></span>
                ACTIVE
              </p>
            </div>
            <div className="trace-login-status-col">
              <p className="trace-login-status-label">ENCRYPTION</p>
              <p className="trace-login-status-value">RSA-4096</p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side: Authentication Panel */}
      <section className="trace-login-right-panel">
        {/* Atmospheric Elements */}
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
                <span className="material-symbols-outlined trace-login-input-icon">alternate_email</span>
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
              {errors.email && (
                <span className="trace-login-error-message" role="alert">
                  {errors.email}
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
                <span className="material-symbols-outlined trace-login-input-icon">lock</span>
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
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.password && (
                <span className="trace-login-error-message" role="alert">
                  {errors.password}
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
              <div className="trace-login-error-message" role="alert" style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px' }}>
                {errors.auth}
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
                  <span className="trace-login-spinner" aria-hidden="true" />
                  <span>Initiating Authentication...</span>
                </>
              ) : (
                <>
                  <span>Initiate Authentication</span>
                  <span className="material-symbols-outlined trace-login-bolt-icon">bolt</span>
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
          <button className="trace-login-sso-btn" type="button" disabled={isLoading}>
            <svg className="trace-login-sso-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span>Secure Federated Identity</span>
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

