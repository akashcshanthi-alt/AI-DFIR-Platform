import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Globe, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../services/firebase';

const mapFirebaseError = (error) => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Email already exists in the system database.';
    case 'auth/invalid-email':
      return 'Invalid email address formatting.';
    case 'auth/weak-password':
      return 'Clearance key does not meet required strength criteria.';
    case 'auth/wrong-password':
      return 'Invalid operator clearance key.';
    case 'auth/user-not-found':
      return 'No operator record found with these credentials.';
    case 'auth/too-many-requests':
      return 'Access blocked due to excessive attempts. Please try again later.';
    case 'auth/operation-not-allowed':
      return 'Email/Password provider is disabled in your Firebase console. Please go to Authentication > Sign-in method in Firebase Console to enable it.';
    default:
      return error.message || 'An unexpected authentication error occurred.';
  }
};

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
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength logic
  const getPasswordStrength = (val) => {
    if (!val) return { score: 0, text: '', color: 'bg-transparent', width: '0%' };
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-red-500', width: '33%', style: '#EF4444' };
    if (score === 2 || score === 3) return { score: 2, text: 'Medium', color: 'bg-yellow-500', width: '66%', style: '#F59E0B' };
    return { score: 4, text: 'Strong', color: 'bg-emerald-500', width: '100%', style: '#10B981' };
  };

  const strength = getPasswordStrength(password);

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

  // Submit handler with Firebase user registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (validateForm()) {
      setIsSubmitting(true);
      setErrors({});
      setSuccessMessage('');

      try {
        console.log('[Register] Starting createUserWithEmailAndPassword for email:', email.trim());
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        console.log('[Register] createUserWithEmailAndPassword Success. User UID:', userCredential.user?.uid);
        
        console.log('[Register] Starting updateProfile for name:', name.trim());
        await updateProfile(userCredential.user, {
          displayName: name.trim(),
        });
        console.log('[Register] updateProfile Success');

        console.log('[Register] Starting sendEmailVerification');
        await sendEmailVerification(userCredential.user);
        console.log('[Register] sendEmailVerification Success');

        setSuccessMessage('Verification email has been sent. Please verify your email before logging in.');
        
        setTimeout(() => {
          setIsSubmitting(false);
          navigate('/login');
        }, 6000);
      } catch (error) {
        console.error('[Register] Error occurred:', error);
        console.error('[Register] Error code:', error.code, 'Error message:', error.message);
        setIsSubmitting(false);
        const userFriendlyMessage = mapFirebaseError(error);
        setErrors({ auth: `${userFriendlyMessage} (Debug Code: ${error.code || 'unknown'})` });
      }
    }
  };

  // Real-time validation indicators
  const isNameValid = name.trim().length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isOrgValid = organization.trim().length > 0;
  const isPasswordValid = password.length >= 8;
  const isConfirmPasswordValid = confirmPassword.length > 0 && confirmPassword === password;

  return (
    <main className="trace-register-page">
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#10b981]/15 border border-[#10b981] text-[#10b981] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          ✓ {successMessage}
        </div>
      )}
      {/* Self-contained style block for premium register styling matching Login.jsx */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-register-page {
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
          .trace-register-left {
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

          /* Digital matrix grid overlay */
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
            color: #47FAF3;
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
            color: #F8FAFC;
          }

          .trace-register-brand-subtitle {
            font-size: 0.75rem;
            font-weight: 700;
            color: #3B82F6;
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
            color: #F8FAFC;
            margin-bottom: 20px;
          }

          .trace-register-hero-title span {
            color: #47FAF3;
          }

          .trace-register-hero-desc {
            font-size: 0.95rem;
            line-height: 1.6;
            color: #94A3B8;
          }

          .trace-register-left-footer {
            font-size: 0.8125rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            color: #3B82F6;
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
            background-color: #050814;
          }

          .trace-register-card {
            width: 100%;
            max-width: 440px;
            background-color: #101827;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 36px 32px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            box-sizing: border-box;
            transition: border-color 250ms ease, box-shadow 250ms ease;
          }

          .trace-register-card:hover {
            border-color: rgba(71, 250, 243, 0.15);
            box-shadow: 0 10px 30px rgba(71, 250, 243, 0.03);
          }

          .trace-register-card-header {
            margin-bottom: 24px;
          }

          .trace-register-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 6px;
            color: #F8FAFC;
          }

          .trace-register-support-text {
            font-size: 0.875rem;
            color: #94A3B8;
          }

          /* Form Controls */
          .trace-register-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .trace-register-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .trace-register-label {
            font-size: 12px;
            font-weight: 600;
            color: #cbd5e1;
            text-transform: uppercase;
            letter-spacing: 0.10em;
          }

          .trace-register-input-container {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
            background-color: #0F172A;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            height: 54px;
            box-sizing: border-box;
            transition: border-color 250ms ease, box-shadow 250ms ease;
          }

          .trace-register-input-container:focus-within {
            border-color: #47FAF3;
            box-shadow: 0 0 20px rgba(71, 250, 243, 0.25);
          }

          .trace-register-input-container.error {
            border-color: #EF4444;
          }

          .trace-register-input-icon {
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

          .trace-register-input {
            width: 100%;
            background: transparent;
            border: none;
            padding-left: 52px !important;
            padding-right: 40px;
            padding-top: 0;
            padding-bottom: 0;
            color: #F8FAFC;
            font-size: 14px;
            outline: none;
            height: 100%;
            box-sizing: border-box;
          }

          .trace-register-input::placeholder {
            color: #94A3B8;
          }

          .trace-register-password-toggle {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            background: transparent;
            border: none;
            color: #94A3B8;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 54px;
            padding: 0 18px 0 10px;
            outline: none;
            box-sizing: border-box;
            transition: color 250ms ease;
          }

          .trace-register-password-toggle:hover {
            color: #47FAF3;
          }

          .trace-register-validation-feedback {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 500;
            margin-top: 4px;
          }

          .trace-register-validation-feedback.success {
            color: #10B981;
          }

          .trace-register-validation-feedback.error {
            color: #EF4444;
          }

          /* Submit Button & loading spinner */
          .trace-register-submit-btn {
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
            box-shadow: 0 10px 30px rgba(34, 211, 238, 0.35);
          }

          .trace-register-submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(34, 211, 238, 0.45);
          }

          .trace-register-submit-btn:active:not(:disabled) {
            transform: scale(0.98);
          }

          .trace-register-submit-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          /* Card Footer Registration link */
          .trace-register-card-footer {
            margin-top: 20px;
            text-align: center;
            font-size: 0.875rem;
            color: #94A3B8;
          }

          .trace-register-login-link {
            color: #47FAF3;
            text-decoration: none;
            font-weight: 600;
            margin-left: 6px;
            transition: color 250ms ease;
            outline: none;
          }

          .trace-register-login-link:hover {
            text-decoration: underline;
            color: #47FAF3;
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
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
      <section className="trace-register-left" aria-label="Product Information">
        <div className="trace-register-grid-overlay" />
        
        <div className="trace-register-left-content">
          <div className="trace-register-brand">
            <div className="trace-register-brand-icon" aria-hidden="true">
              <Shield className="w-9 h-9 text-[#47FAF3]" />
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
              <div className={`trace-register-input-container ${errors.name ? 'error' : ''}`}>
                <span className="trace-register-input-icon" aria-hidden="true">
                  <User className="w-[18px] h-[18px]" />
                </span>
                <input
                  id="trace-name-input"
                  type="text"
                  className="trace-register-input"
                  placeholder="Akash C"
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
              {name.trim() !== '' && isNameValid && (
                <span className="trace-register-validation-feedback success" role="status">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Valid name</span>
                </span>
              )}
              {errors.name && (
                <span id="trace-name-error" className="trace-register-validation-feedback error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>✕ {errors.name}</span>
                </span>
              )}
            </div>

            {/* Email Field */}
            <div className="trace-register-field">
              <label htmlFor="trace-email-input" className="trace-register-label">
                Email Address
              </label>
              <div className={`trace-register-input-container ${errors.email ? 'error' : ''}`}>
                <span className="trace-register-input-icon" aria-hidden="true">
                  <Mail className="w-[18px] h-[18px]" />
                </span>
                <input
                  id="trace-email-input"
                  type="email"
                  className="trace-register-input"
                  placeholder="akashcshanthi@gmail.com"
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
              {email.trim() !== '' && isEmailValid && (
                <span className="trace-register-validation-feedback success" role="status">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Valid email</span>
                </span>
              )}
              {errors.email && (
                <span id="trace-email-error" className="trace-register-validation-feedback error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>✕ {errors.email}</span>
                </span>
              )}
            </div>

            {/* Organization Field */}
            <div className="trace-register-field">
              <label htmlFor="trace-org-input" className="trace-register-label">
                Organization
              </label>
              <div className={`trace-register-input-container ${errors.organization ? 'error' : ''}`}>
                <span className="trace-register-input-icon" aria-hidden="true">
                  <Globe className="w-[18px] h-[18px]" />
                </span>
                <input
                  id="trace-org-input"
                  type="text"
                  className="trace-register-input"
                  placeholder="Mazharul Uloom College (Autonomous), Ambur"
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
              {organization.trim() !== '' && isOrgValid && (
                <span className="trace-register-validation-feedback success" role="status">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Valid organization</span>
                </span>
              )}
              {errors.organization && (
                <span id="trace-org-error" className="trace-register-validation-feedback error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>✕ {errors.organization}</span>
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="trace-register-field">
              <label htmlFor="trace-password-input" className="trace-register-label">
                Password
              </label>
              <div className={`trace-register-input-container ${errors.password ? 'error' : ''}`}>
                <span className="trace-register-input-icon" aria-hidden="true">
                  <Lock className="w-[18px] h-[18px]" />
                </span>
                <input
                  id="trace-password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="trace-register-input"
                  placeholder="Minimum 8 characters"
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
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {/* Strength Meter */}
              {password && (
                <div style={{ marginTop: '2px' }}>
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-1">
                    <span className="text-[#94A3B8]">Security Strength</span>
                    <span style={{ color: strength.style }}>
                      {strength.text}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${strength.color}`} 
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              )}
              {password.trim() !== '' && isPasswordValid && (
                <span className="trace-register-validation-feedback success" role="status">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Password meets criteria</span>
                </span>
              )}
              {errors.password && (
                <span id="trace-password-error" className="trace-register-validation-feedback error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>✕ {errors.password}</span>
                </span>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="trace-register-field">
              <label htmlFor="trace-confirm-password-input" className="trace-register-label">
                Confirm Password
              </label>
              <div className={`trace-register-input-container ${errors.confirmPassword ? 'error' : ''}`}>
                <span className="trace-register-input-icon" aria-hidden="true">
                  <Lock className="w-[18px] h-[18px]" />
                </span>
                <input
                  id="trace-confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="trace-register-input"
                  placeholder="Re-enter password"
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
                  {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {confirmPassword.trim() !== '' && isConfirmPasswordValid && (
                <span className="trace-register-validation-feedback success" role="status">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Passwords match</span>
                </span>
              )}
              {errors.confirmPassword && (
                <span id="trace-confirm-password-error" className="trace-register-validation-feedback error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>✕ {errors.confirmPassword}</span>
                </span>
              )}
            </div>

            {errors.auth && (
              <div className="trace-register-validation-feedback error" role="alert" style={{ alignSelf: 'center', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>✕ {errors.auth}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="trace-register-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
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