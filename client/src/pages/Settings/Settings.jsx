import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiLogOut } from 'react-icons/fi';

import StatusBadge from '../../components/common/StatusBadge';

/**
 * Settings Component
 * Profile configuration, credential change utilities, and session logout controls
 * for TRACE AI DFIR.
 */
export default function Settings() {
  const navigate = useNavigate();

  // Auth Guard check
  const hasSession = sessionStorage.getItem('arclight-dev-session') === 'active';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Profile Information local states
  const [profileName, setProfileName] = useState('Security Analyst');
  const [profileEmail, setProfileEmail] = useState('analyst@trace.local');
  const [profileOrg, setProfileOrg] = useState('TRACE Security Team');
  const profileRole = 'Investigator'; // Read-only

  // Profile status feedbacks
  const [profileFeedback, setProfileFeedback] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Password fields states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password show/hide switches
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password status feedbacks
  const [passwordFeedback, setPasswordFeedback] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  if (!hasSession) return null;

  // Save profile information handler
  const handleSaveProfile = (e) => {
    e.preventDefault();

    const tempErrors = {};
    if (!profileName.trim()) tempErrors.name = 'Profile name is required';
    
    const emailTrim = profileEmail.trim();
    if (!emailTrim) {
      tempErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      tempErrors.email = 'Please provide a valid email format';
    }

    if (!profileOrg.trim()) tempErrors.org = 'Organization is required';

    if (Object.keys(tempErrors).length > 0) {
      setProfileErrors(tempErrors);
      return;
    }

    setProfileErrors({});
    // Mock save response locally
    setProfileFeedback(true);
    setTimeout(() => {
      setProfileFeedback(false);
    }, 2500);
  };

  // Change password handler
  const handleSavePassword = (e) => {
    e.preventDefault();

    const tempErrors = {};
    if (!currentPassword) tempErrors.current = 'Current password is required';
    if (!newPassword) {
      tempErrors.new = 'New password is required';
    } else if (newPassword.length < 8) {
      tempErrors.new = 'New password must contain at least 8 characters';
    }

    if (!confirmPassword) {
      tempErrors.confirm = 'Confirm new password is required';
    } else if (confirmPassword !== newPassword) {
      tempErrors.confirm = 'Confirm password must match the new password';
    }

    if (Object.keys(tempErrors).length > 0) {
      setPasswordErrors(tempErrors);
      return;
    }

    setPasswordErrors({});
    // Mock change success response
    setPasswordFeedback(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setPasswordFeedback(false);
    }, 2500);
  };

  // Logout session trigger
  const handleLogout = () => {
    sessionStorage.removeItem('arclight-dev-session');
    navigate('/login', { replace: true });
  };

  return (
    <div className="trace-settings-layout">
      {/* Embedded page CSS styling block */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-settings-layout {
            display: flex;
            min-height: 100vh;
            background-color: var(--bg-main, #060913);
            color: var(--text-primary, #f8fafc);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            width: 100%;
            box-sizing: border-box;
          }

          .trace-settings-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            height: 100vh;
            overflow: hidden;
            box-sizing: border-box;
          }

          .trace-settings-content {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-sizing: border-box;
          }

          /* Page Header */
          .trace-settings-page-header {
            display: flex;
            flex-direction: column;
          }

          .trace-settings-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            line-height: 1.2;
          }

          .trace-settings-subtitle {
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 4px 0 0 0;
            line-height: 1.45;
          }

          /* Profile Summary header banner */
          .trace-settings-summary-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 20px;
            box-shadow: var(--shadow-sm);
            display: flex;
            align-items: center;
            gap: 20px;
            box-sizing: border-box;
          }

          .trace-settings-avatar-bubble {
            width: 58px;
            height: 58px;
            border-radius: 50%;
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.15));
            border: 2.2px solid var(--color-primary, #3b82f6);
            color: var(--color-primary, #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.45rem;
            font-weight: 700;
            user-select: none;
            flex-shrink: 0;
          }

          .trace-settings-summary-details {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
          }

          .trace-settings-summary-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 0;
          }

          .trace-settings-summary-role-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .trace-settings-summary-role {
            font-size: 0.8125rem;
            color: var(--text-secondary, #cbd5e1);
            font-weight: 500;
          }

          .trace-settings-summary-org {
            font-size: 0.75rem;
            color: var(--text-muted, #64748b);
          }

          /* Two-column grid setup */
          .trace-settings-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 20px;
            box-sizing: border-box;
            width: 100%;
          }

          .trace-settings-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 24px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-sizing: border-box;
            height: fit-content;
          }

          .trace-settings-card-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            padding-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            user-select: none;
          }

          /* Input fields controls */
          .trace-settings-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-sizing: border-box;
          }

          .trace-settings-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            position: relative;
            box-sizing: border-box;
          }

          .trace-settings-label {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-settings-input {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 8px 12px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            height: 38px;
            box-sizing: border-box;
            transition: border-color var(--transition-speed, 200ms) ease;
          }

          .trace-settings-input:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.1));
          }

          .trace-settings-input:disabled {
            opacity: 0.6;
            background-color: rgba(255, 255, 255, 0.015);
            cursor: not-allowed;
            border-color: var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-settings-input.error {
            border-color: var(--status-critical, #ef4444);
            box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
          }

          .trace-settings-input-password-wrap {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
          }

          .trace-settings-input-password-wrap .trace-settings-input {
            padding-right: 42px;
          }

          .trace-settings-password-toggle {
            position: absolute;
            right: 12px;
            background: transparent;
            border: none;
            color: var(--text-muted, #64748b);
            cursor: pointer;
            padding: 4px;
            font-size: 0.725rem;
            font-weight: 700;
            outline: none;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: center;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .trace-settings-password-toggle:hover {
            color: var(--text-primary, #f8fafc);
          }

          .trace-settings-password-toggle:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
            border-radius: var(--radius-xs, 2px);
          }

          .trace-settings-validation-error {
            font-size: 0.75rem;
            color: var(--status-critical, #ef4444);
            font-weight: 500;
            margin-top: 2px;
          }

          .trace-settings-submit-row {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 4px;
            user-select: none;
          }

          .trace-settings-submit-btn {
            background-color: var(--color-primary, #3b82f6);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-sm, 4px);
            padding: 10px 20px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color var(--transition-speed, 200ms) ease;
            height: 38px;
            outline: none;
            box-sizing: border-box;
          }

          .trace-settings-submit-btn:hover {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-settings-submit-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
          }

          .trace-settings-feedback {
            font-size: 0.75rem;
            color: var(--status-low, #22c55e);
            font-weight: 600;
            animation: trace-settings-fadeIn 300ms ease;
          }

          @keyframes trace-settings-fadeIn {
            from { opacity: 0; transform: translateX(-4px); }
            to { opacity: 1; transform: translateX(0); }
          }

          /* Logout session styling */
          .trace-settings-logout-btn {
            background-color: transparent;
            border: 1px solid var(--status-critical, #ef4444);
            color: var(--status-critical, #ef4444);
            border-radius: var(--radius-sm, 4px);
            padding: 8px 16px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
            width: fit-content;
            display: flex;
            align-items: center;
            gap: 8px;
            box-sizing: border-box;
            height: 36px;
          }

          .trace-settings-logout-btn:hover {
            background-color: rgba(239, 68, 68, 0.08);
          }

          .trace-settings-logout-btn:focus-visible {
            outline: 2px solid var(--status-critical, #ef4444);
            outline-offset: 1px;
          }

          /* Tablet/Mobile Breakpoints */
          @media (max-width: 992px) {
            .trace-settings-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 768px) {
            .trace-settings-content {
              padding: 16px;
              gap: 16px;
            }
          }
        `
      }} />

      {/* Main Command Workspace Frame */}
      <div className="trace-settings-main">

        {/* Scrollable Settings contents */}
        <main className="trace-settings-content">
          
          {/* Header page title section */}
          <div className="trace-settings-page-header" role="region" aria-label="Settings profile summary">
            <h2 className="trace-settings-title">Settings</h2>
            <p className="trace-settings-subtitle">
              Manage your TRACE AI DFIR profile and account settings.
            </p>
          </div>

          {/* Profile Initials SA avatar card */}
          <div className="trace-settings-summary-card" role="region" aria-label="Profile Avatar Details">
            <div className="trace-settings-avatar-bubble" aria-hidden="true">
              SA
            </div>
            <div className="trace-settings-summary-details">
              <h3 className="trace-settings-summary-name">Security Analyst</h3>
              <div className="trace-settings-summary-role-row">
                <span className="trace-settings-summary-role">Investigator</span>
                <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                <span className="trace-settings-summary-org">TRACE Security Team</span>
                <StatusBadge status="Active" />
              </div>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="trace-settings-grid">
            
            {/* Column 1: Profile Information Panel */}
            <section className="trace-settings-card" aria-labelledby="profile-info-title">
              <h4 id="profile-info-title" className="trace-settings-card-title">
                Profile Information
              </h4>

              <form onSubmit={handleSaveProfile} className="trace-settings-form" noValidate>
                
                {/* Field 1: Name */}
                <div className="trace-settings-field">
                  <label htmlFor="trace-profile-name-field" className="trace-settings-label">
                    Name
                  </label>
                  <input
                    id="trace-profile-name-field"
                    type="text"
                    className={`trace-settings-input ${profileErrors.name ? 'error' : ''}`}
                    value={profileName}
                    onChange={(e) => {
                      setProfileName(e.target.value);
                      if (profileErrors.name) setProfileErrors(prev => ({ ...prev, name: null }));
                    }}
                    autoComplete="name"
                    required
                  />
                  {profileErrors.name && (
                    <span className="trace-settings-validation-error" role="alert">
                      {profileErrors.name}
                    </span>
                  )}
                </div>

                {/* Field 2: Email */}
                <div className="trace-settings-field">
                  <label htmlFor="trace-profile-email-field" className="trace-settings-label">
                    Email
                  </label>
                  <input
                    id="trace-profile-email-field"
                    type="email"
                    className={`trace-settings-input ${profileErrors.email ? 'error' : ''}`}
                    value={profileEmail}
                    onChange={(e) => {
                      setProfileEmail(e.target.value);
                      if (profileErrors.email) setProfileErrors(prev => ({ ...prev, email: null }));
                    }}
                    autoComplete="email"
                    required
                  />
                  {profileErrors.email && (
                    <span className="trace-settings-validation-error" role="alert">
                      {profileErrors.email}
                    </span>
                  )}
                </div>

                {/* Field 3: Organization */}
                <div className="trace-settings-field">
                  <label htmlFor="trace-profile-org-field" className="trace-settings-label">
                    Organization
                  </label>
                  <input
                    id="trace-profile-org-field"
                    type="text"
                    className={`trace-settings-input ${profileErrors.org ? 'error' : ''}`}
                    value={profileOrg}
                    onChange={(e) => {
                      setProfileOrg(e.target.value);
                      if (profileErrors.org) setProfileErrors(prev => ({ ...prev, org: null }));
                    }}
                    autoComplete="organization"
                    required
                  />
                  {profileErrors.org && (
                    <span className="trace-settings-validation-error" role="alert">
                      {profileErrors.org}
                    </span>
                  )}
                </div>

                {/* Field 4: Role (Read-only) */}
                <div className="trace-settings-field">
                  <label htmlFor="trace-profile-role-field" className="trace-settings-label">
                    Role
                  </label>
                  <input
                    id="trace-profile-role-field"
                    type="text"
                    className="trace-settings-input"
                    value={profileRole}
                    disabled
                    readOnly
                  />
                </div>

                {/* Submit button row */}
                <div className="trace-settings-submit-row">
                  <button type="submit" className="trace-settings-submit-btn">
                    Save Changes
                  </button>
                  {profileFeedback && (
                    <span className="trace-settings-feedback" role="status">
                      Profile updated for this session.
                    </span>
                  )}
                </div>

              </form>
            </section>

            {/* Column 2: Password & Session layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Change Password Card */}
              <section className="trace-settings-card" aria-labelledby="change-password-title">
                <h4 id="change-password-title" className="trace-settings-card-title">
                  Change Password
                </h4>

                <form onSubmit={handleSavePassword} className="trace-settings-form" noValidate>
                  
                  {/* Field 1: Current Password */}
                  <div className="trace-settings-field">
                    <label htmlFor="trace-pwd-current-field" className="trace-settings-label">
                      Current Password
                    </label>
                    <div className="trace-settings-input-password-wrap">
                      <input
                        id="trace-pwd-current-field"
                        type={showCurrent ? 'text' : 'password'}
                        className={`trace-settings-input ${passwordErrors.current ? 'error' : ''}`}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          if (passwordErrors.current) setPasswordErrors(prev => ({ ...prev, current: null }));
                        }}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="trace-settings-password-toggle"
                        onClick={() => setShowCurrent(!showCurrent)}
                        aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                      >
                        {showCurrent ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {passwordErrors.current && (
                      <span className="trace-settings-validation-error" role="alert">
                        {passwordErrors.current}
                      </span>
                    )}
                  </div>

                  {/* Field 2: New Password */}
                  <div className="trace-settings-field">
                    <label htmlFor="trace-pwd-new-field" className="trace-settings-label">
                      New Password
                    </label>
                    <div className="trace-settings-input-password-wrap">
                      <input
                        id="trace-pwd-new-field"
                        type={showNew ? 'text' : 'password'}
                        className={`trace-settings-input ${passwordErrors.new ? 'error' : ''}`}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passwordErrors.new) setPasswordErrors(prev => ({ ...prev, new: null }));
                        }}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="trace-settings-password-toggle"
                        onClick={() => setShowNew(!showNew)}
                        aria-label={showNew ? 'Hide new password' : 'Show new password'}
                      >
                        {showNew ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {passwordErrors.new && (
                      <span className="trace-settings-validation-error" role="alert">
                        {passwordErrors.new}
                      </span>
                    )}
                  </div>

                  {/* Field 3: Confirm New Password */}
                  <div className="trace-settings-field">
                    <label htmlFor="trace-pwd-confirm-field" className="trace-settings-label">
                      Confirm New Password
                    </label>
                    <div className="trace-settings-input-password-wrap">
                      <input
                        id="trace-pwd-confirm-field"
                        type={showConfirm ? 'text' : 'password'}
                        className={`trace-settings-input ${passwordErrors.confirm ? 'error' : ''}`}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordErrors.confirm) setPasswordErrors(prev => ({ ...prev, confirm: null }));
                        }}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="trace-settings-password-toggle"
                        onClick={() => setShowConfirm(!showConfirm)}
                        aria-label={showConfirm ? 'Hide confirmed password' : 'Show confirmed password'}
                      >
                        {showConfirm ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {passwordErrors.confirm && (
                      <span className="trace-settings-validation-error" role="alert">
                        {passwordErrors.confirm}
                      </span>
                    )}
                  </div>

                  {/* Submit row */}
                  <div className="trace-settings-submit-row">
                    <button type="submit" className="trace-settings-submit-btn">
                      Change Password
                    </button>
                    {passwordFeedback && (
                      <span className="trace-settings-feedback" role="status">
                        Password change simulated successfully.
                      </span>
                    )}
                  </div>

                </form>
              </section>

              {/* Logout Session Card */}
              <section className="trace-settings-card" aria-labelledby="session-title">
                <h4 id="session-title" className="trace-settings-card-title">
                  Session
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p className="trace-settings-label" style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>
                    End the current investigator session and return to the operator login.
                  </p>
                  <button
                    type="button"
                    className="trace-settings-logout-btn"
                    onClick={handleLogout}
                    title="Terminate current session session token"
                  >
                    <FiLogOut aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </div>
              </section>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
