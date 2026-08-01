import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';

export default function Settings() {
  const navigate = useNavigate();

  // Auth Guard check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Active Tab state: default is 'Security' matching the Stitch design state
  const [activeTab, setActiveTab] = useState('Security');

  // General Tab - Profile States
  const [profileName, setProfileName] = useState('Security Analyst');
  const [profileEmail, setProfileEmail] = useState('analyst@trace.local');
  const [profileOrg, setProfileOrg] = useState('TRACE Security Team');
  const profileRole = 'Investigator'; // Read-only
  const [profileFeedback, setProfileFeedback] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // General Tab - Password fields states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Security Tab States
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [inactivityTimeout, setInactivityTimeout] = useState(45);
  const [pwSpecial, setPwSpecial] = useState(true);
  const [pwNumeric, setPwNumeric] = useState(true);
  const [pwHistory, setPwHistory] = useState(false);
  const [aiSensitivity, setAiSensitivity] = useState(8);
  const [confidenceThreshold, setConfidenceThreshold] = useState(92);
  const [settingsFeedback, setSettingsFeedback] = useState(false);

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
    setPasswordFeedback(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setPasswordFeedback(false);
    }, 2500);
  };

  // Save changes handler for Security Tab settings
  const handleSaveSecuritySettings = () => {
    setSettingsFeedback(true);
    setTimeout(() => {
      setSettingsFeedback(false);
    }, 2500);
  };

  // Logout session trigger
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.clear();
      navigate('/login', { replace: true });
    }
  };

  // Helper to resolve AI sensitivity level description string
  const getSensitivityLabel = (val) => {
    if (val > 7) return 'HIGH';
    if (val > 4) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="trace-settings-layout min-h-screen text-on-surface font-body-md grid-bg-settings selection:bg-secondary/30 selection:text-secondary">
      {/* Component Inline Styles overrides */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .glass-panel {
              background: rgba(27, 31, 44, 0.6);
              backdrop-filter: blur(12px);
              border-top: 1px solid rgba(255, 255, 255, 0.08);
              border-left: 1px solid rgba(255, 255, 255, 0.03);
          }

          .neo-button {
              background: linear-gradient(135deg, #0070f3 0%, #00ddd6 100%);
              transition: all 0.3s ease;
          }

          .neo-button:hover:not(:disabled) {
              box-shadow: 0 0 15px rgba(71, 250, 243, 0.4);
              transform: translateY(-1px);
          }

          .custom-scrollbar::-webkit-scrollbar {
              width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(71, 250, 243, 0.2);
              border-radius: 10px;
          }

          .grid-bg-settings {
              background-image: radial-gradient(circle, rgba(71, 250, 243, 0.05) 1px, transparent 1px);
              background-size: 32px 32px;
          }

          .switch-toggle {
              position: relative;
              display: inline-block;
              width: 44px;
              height: 22px;
          }
          .switch-toggle input { opacity: 0; width: 0; height: 0; }
          .slider {
              position: absolute;
              cursor: pointer;
              top: 0; left: 0; right: 0; bottom: 0;
              background-color: #313442;
              transition: .4s;
              border-radius: 34px;
          }
          .slider:before {
              position: absolute;
              content: "";
              height: 16px; width: 16px;
              left: 3px; bottom: 3px;
              background-color: white;
              transition: .4s;
              border-radius: 50%;
          }
          input:checked + .slider { background-color: #0070f3; }
          input:checked + .slider:before { transform: translateX(22px); }

          .range-slider {
              -webkit-appearance: none;
              width: 100%;
              height: 4px;
              background: #313442;
              border-radius: 2px;
              outline: none;
          }
          .range-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 16px;
              height: 16px;
              background: #47faf3;
              cursor: pointer;
              border-radius: 50%;
              box-shadow: 0 0 10px rgba(71, 250, 243, 0.6);
          }
          
          .trace-settings-sidebar-btn {
              display: flex;
              align-items: center;
              justify-content: space-between;
              width: 100%;
              padding: 16px;
              border-radius: 12px;
              background: transparent;
              border: 1px solid transparent;
              color: var(--on-surface-variant, #c1c6d7);
              cursor: pointer;
              transition: all 0.2s ease;
              text-align: left;
          }
          .trace-settings-sidebar-btn:hover {
              background-color: rgba(38, 42, 55, 0.5);
              color: var(--primary, #aec6ff);
          }
          .trace-settings-sidebar-btn.active {
              color: var(--secondary-fixed, #47faf3);
              background-color: rgba(71, 250, 243, 0.05);
              border: 1px solid rgba(71, 250, 243, 0.2);
              font-weight: 700;
          }
          
          .trace-settings-field-box {
              display: flex;
              flex-direction: column;
              gap: 6px;
              box-sizing: border-box;
          }
          .trace-settings-label-text {
              font-size: 0.8125rem;
              font-weight: 600;
              color: var(--text-secondary, #cbd5e1);
          }
          .trace-settings-text-input {
              width: 100%;
              background-color: var(--surface-container-lowest, #0a0e1a);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 4px;
              padding: 8px 12px;
              color: var(--on-surface, #dfe2f3);
              font-size: 0.875rem;
              outline: none;
              height: 38px;
              box-sizing: border-box;
              transition: border-color 0.2s ease;
          }
          .trace-settings-text-input:focus {
              border-color: var(--color-primary, #3b82f6);
              box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.1);
          }
          .trace-settings-text-input:disabled {
              opacity: 0.6;
              background-color: rgba(255, 255, 255, 0.015);
              cursor: not-allowed;
          }
          .trace-settings-text-input.error {
              border-color: var(--status-critical, #ef4444);
              box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
          }
          
          .trace-settings-pwd-toggle-btn {
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
              text-transform: uppercase;
          }
          .trace-settings-pwd-toggle-btn:hover {
              color: var(--on-surface, #dfe2f3);
          }
        `
      }} />

      {/* Workspace Wrapper */}
      <div className="p-6 space-y-6">

        {/* Page Title Header with Quick Actions */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Settings &amp; Administration</h2>
            <p className="text-sm text-on-surface-variant mt-1">Configure global platform security, AI models, and enterprise integrations.</p>
          </div>
          <div className="flex items-center gap-3">
            {settingsFeedback && (
              <span className="text-xs text-secondary font-bold mr-2 animate-pulse">
                Changes saved successfully.
              </span>
            )}
            <button 
              onClick={() => {
                setMfaEnabled(true);
                setInactivityTimeout(45);
                setPwSpecial(true);
                setPwNumeric(true);
                setPwHistory(false);
                setAiSensitivity(8);
                setConfidenceThreshold(92);
              }}
              className="px-5 py-2 rounded-lg border border-outline/30 text-on-surface font-medium hover:bg-surface-bright transition-all text-sm"
            >
              Reset Defaults
            </button>
            <button 
              onClick={handleSaveSecuritySettings}
              className="px-5 py-2 rounded-lg neo-button text-white font-bold shadow-lg shadow-primary/20 text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 items-start">
          
          {/* Settings Tab Sidebar Navigation */}
          <nav className="col-span-12 lg:col-span-3 flex flex-col gap-1.5">
            <button 
              onClick={() => setActiveTab('General')}
              className={`trace-settings-sidebar-btn ${activeTab === 'General' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">tune</span>
                <span className="font-medium text-sm">General Profile</span>
              </div>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>

            <button 
              onClick={() => setActiveTab('Appearance')}
              className={`trace-settings-sidebar-btn ${activeTab === 'Appearance' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">palette</span>
                <span className="font-medium text-sm">Appearance</span>
              </div>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>

            <button 
              onClick={() => setActiveTab('Security')}
              className={`trace-settings-sidebar-btn ${activeTab === 'Security' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">admin_panel_settings</span>
                <span className="font-medium text-sm">Security &amp; AI</span>
              </div>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>

            <button 
              onClick={() => setActiveTab('UserManagement')}
              className={`trace-settings-sidebar-btn ${activeTab === 'UserManagement' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">group</span>
                <span className="font-medium text-sm">User Management</span>
              </div>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>

            <button 
              onClick={() => setActiveTab('Notifications')}
              className={`trace-settings-sidebar-btn ${activeTab === 'Notifications' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">notifications_active</span>
                <span className="font-medium text-sm">Notifications</span>
              </div>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>

            <button 
              onClick={() => setActiveTab('Integrations')}
              className={`trace-settings-sidebar-btn ${activeTab === 'Integrations' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">hub</span>
                <span className="font-medium text-sm">Marketplace Integrations</span>
              </div>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>

            <button 
              onClick={() => setActiveTab('ApiKeys')}
              className={`trace-settings-sidebar-btn ${activeTab === 'ApiKeys' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">key</span>
                <span className="font-medium text-sm">API Keys</span>
              </div>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </nav>

          {/* Active Settings Panel Canvas */}
          <div className="col-span-12 lg:col-span-9 space-y-6 pb-20">

            {/* TAB CONTENT: General tab */}
            {activeTab === 'General' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Profile Information Panel */}
                <section className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">account_circle</span>
                    </div>
                    <h3 className="text-lg font-bold">Profile Details</h3>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
                    <div className="trace-settings-field-box">
                      <label htmlFor="trace-profile-name-field" className="trace-settings-label-text">Name</label>
                      <input
                        id="trace-profile-name-field"
                        type="text"
                        className={`trace-settings-text-input ${profileErrors.name ? 'error' : ''}`}
                        value={profileName}
                        onChange={(e) => {
                          setProfileName(e.target.value);
                          if (profileErrors.name) setProfileErrors(prev => ({ ...prev, name: null }));
                        }}
                        required
                      />
                      {profileErrors.name && (
                        <span className="text-xs text-error mt-0.5" role="alert">{profileErrors.name}</span>
                      )}
                    </div>

                    <div className="trace-settings-field-box">
                      <label htmlFor="trace-profile-email-field" className="trace-settings-label-text">Email</label>
                      <input
                        id="trace-profile-email-field"
                        type="email"
                        className={`trace-settings-text-input ${profileErrors.email ? 'error' : ''}`}
                        value={profileEmail}
                        onChange={(e) => {
                          setProfileEmail(e.target.value);
                          if (profileErrors.email) setProfileErrors(prev => ({ ...prev, email: null }));
                        }}
                        required
                      />
                      {profileErrors.email && (
                        <span className="text-xs text-error mt-0.5" role="alert">{profileErrors.email}</span>
                      )}
                    </div>

                    <div className="trace-settings-field-box">
                      <label htmlFor="trace-profile-org-field" className="trace-settings-label-text">Organization</label>
                      <input
                        id="trace-profile-org-field"
                        type="text"
                        className={`trace-settings-text-input ${profileErrors.org ? 'error' : ''}`}
                        value={profileOrg}
                        onChange={(e) => {
                          setProfileOrg(e.target.value);
                          if (profileErrors.org) setProfileErrors(prev => ({ ...prev, org: null }));
                        }}
                        required
                      />
                      {profileErrors.org && (
                        <span className="text-xs text-error mt-0.5" role="alert">{profileErrors.org}</span>
                      )}
                    </div>

                    <div className="trace-settings-field-box">
                      <label htmlFor="trace-profile-role-field" className="trace-settings-label-text">Role</label>
                      <input
                        id="trace-profile-role-field"
                        type="text"
                        className="trace-settings-text-input"
                        value={profileRole}
                        disabled
                        readOnly
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <button type="submit" className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/95 text-xs">
                        Update Profile
                      </button>
                      {profileFeedback && (
                        <span className="text-xs text-secondary font-bold">Profile changes updated.</span>
                      )}
                    </div>
                  </form>
                </section>

                {/* Password & Session Card */}
                <div className="space-y-6">
                  
                  {/* Change Password Card */}
                  <section className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">lock</span>
                      </div>
                      <h3 className="text-lg font-bold">Change password</h3>
                    </div>

                    <form onSubmit={handleSavePassword} className="space-y-4" noValidate>
                      <div className="trace-settings-field-box relative">
                        <label htmlFor="trace-pwd-current-field" className="trace-settings-label-text">Current Password</label>
                        <div className="relative flex items-center">
                          <input
                            id="trace-pwd-current-field"
                            type={showCurrent ? 'text' : 'password'}
                            className={`trace-settings-text-input pr-12 ${passwordErrors.current ? 'error' : ''}`}
                            value={currentPassword}
                            onChange={(e) => {
                              setCurrentPassword(e.target.value);
                              if (passwordErrors.current) setPasswordErrors(prev => ({ ...prev, current: null }));
                            }}
                            required
                          />
                          <button
                            type="button"
                            className="trace-settings-pwd-toggle-btn"
                            onClick={() => setShowCurrent(!showCurrent)}
                          >
                            {showCurrent ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {passwordErrors.current && (
                          <span className="text-xs text-error mt-0.5" role="alert">{passwordErrors.current}</span>
                        )}
                      </div>

                      <div className="trace-settings-field-box relative">
                        <label htmlFor="trace-pwd-new-field" className="trace-settings-label-text">New Password</label>
                        <div className="relative flex items-center">
                          <input
                            id="trace-pwd-new-field"
                            type={showNew ? 'text' : 'password'}
                            className={`trace-settings-text-input pr-12 ${passwordErrors.new ? 'error' : ''}`}
                            value={newPassword}
                            onChange={(e) => {
                              setNewPassword(e.target.value);
                              if (passwordErrors.new) setPasswordErrors(prev => ({ ...prev, new: null }));
                            }}
                            required
                          />
                          <button
                            type="button"
                            className="trace-settings-pwd-toggle-btn"
                            onClick={() => setShowNew(!showNew)}
                          >
                            {showNew ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {passwordErrors.new && (
                          <span className="text-xs text-error mt-0.5" role="alert">{passwordErrors.new}</span>
                        )}
                      </div>

                      <div className="trace-settings-field-box relative">
                        <label htmlFor="trace-pwd-confirm-field" className="trace-settings-label-text">Confirm New Password</label>
                        <div className="relative flex items-center">
                          <input
                            id="trace-pwd-confirm-field"
                            type={showConfirm ? 'text' : 'password'}
                            className={`trace-settings-text-input pr-12 ${passwordErrors.confirm ? 'error' : ''}`}
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              if (passwordErrors.confirm) setPasswordErrors(prev => ({ ...prev, confirm: null }));
                            }}
                            required
                          />
                          <button
                            type="button"
                            className="trace-settings-pwd-toggle-btn"
                            onClick={() => setShowConfirm(!showConfirm)}
                          >
                            {showConfirm ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {passwordErrors.confirm && (
                          <span className="text-xs text-error mt-0.5" role="alert">{passwordErrors.confirm}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 pt-2">
                        <button type="submit" className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/95 text-xs">
                          Change Password
                        </button>
                        {passwordFeedback && (
                          <span className="text-xs text-secondary font-bold">Password update successfully.</span>
                        )}
                      </div>
                    </form>
                  </section>

                  {/* Session Card */}
                  <section className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-error uppercase tracking-wider">Danger Zone</h3>
                    <p className="text-xs text-outline leading-relaxed">
                      End the current investigator session and return to the operator login.
                    </p>
                    <button
                      onClick={handleLogout}
                      className="w-full py-2 bg-error/10 hover:bg-error/20 text-error font-bold border border-error/30 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Logout Session
                    </button>
                  </section>

                </div>

              </div>
            )}

            {/* TAB CONTENT: Security & AI configurations */}
            {activeTab === 'Security' && (
              <div className="space-y-6">
                
                {/* Security Access Control Section */}
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="material-symbols-outlined text-8xl">verified_user</span>
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">security</span>
                    </div>
                    <h3 className="text-lg font-bold">Security &amp; Access Control</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* MFA Toggle */}
                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex flex-col justify-between min-h-[120px]">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-on-surface text-sm">Two-Factor Authentication</h4>
                          <p className="text-xs text-on-surface-variant mt-0.5">Require MFA for all administrative accounts.</p>
                        </div>
                        <label className="switch-toggle">
                          <input 
                            type="checkbox" 
                            checked={mfaEnabled} 
                            onChange={(e) => setMfaEnabled(e.target.checked)} 
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <span className={`px-2 py-0.5 ${mfaEnabled ? 'bg-secondary/10 text-secondary' : 'bg-white/5 text-outline'} text-[10px] font-bold rounded uppercase tracking-tighter`}>
                          {mfaEnabled ? 'Enforced' : 'Disabled'}
                        </span>
                        <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[10px] font-bold rounded uppercase tracking-tighter">SMS/TOTP</span>
                      </div>
                    </div>

                    {/* Session Timeout Slider */}
                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex flex-col justify-between min-h-[120px]">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Inactivity Timeout</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">Log out users after prolonged inactivity.</p>
                      </div>
                      <div className="mt-4">
                        <input 
                          className="range-slider" 
                          max="120" 
                          min="15" 
                          type="range" 
                          value={inactivityTimeout}
                          onChange={(e) => setInactivityTimeout(Number(e.target.value))}
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-label-caps text-on-surface-variant">
                          <span>15 MIN</span>
                          <span className="text-secondary font-bold">{inactivityTimeout} MINUTES</span>
                          <span>120 MIN</span>
                        </div>
                      </div>
                    </div>

                    {/* Password Policy */}
                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 md:col-span-2">
                      <h4 className="font-bold text-on-surface text-sm mb-4">Password Complexity Policy</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                          <label className="switch-toggle">
                            <input 
                              type="checkbox" 
                              checked={pwSpecial} 
                              onChange={(e) => setPwSpecial(e.target.checked)} 
                            />
                            <span className="slider"></span>
                          </label>
                          <span className="text-xs font-semibold">Special Characters</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="switch-toggle">
                            <input 
                              type="checkbox" 
                              checked={pwNumeric} 
                              onChange={(e) => setPwNumeric(e.target.checked)} 
                            />
                            <span className="slider"></span>
                          </label>
                          <span className="text-xs font-semibold">Numerical Inclusion</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="switch-toggle">
                            <input 
                              type="checkbox" 
                              checked={pwHistory} 
                              onChange={(e) => setPwHistory(e.target.checked)} 
                            />
                            <span className="slider"></span>
                          </label>
                          <span className="text-xs font-semibold">History Reuse (3)</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </section>

                {/* AI Core Configuration */}
                <section className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">psychology</span>
                    </div>
                    <h3 className="text-lg font-bold">AI Core Configuration</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Sensitivity range slider */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-on-surface text-xs">Analysis Sensitivity</label>
                        <span className="text-secondary text-xs font-bold font-mono">{getSensitivityLabel(aiSensitivity)}</span>
                      </div>
                      <input 
                        className="range-slider" 
                        max="10" 
                        min="1" 
                        type="range" 
                        value={aiSensitivity}
                        onChange={(e) => setAiSensitivity(Number(e.target.value))}
                      />
                      <p className="text-[10px] text-on-surface-variant leading-relaxed italic mt-1">
                        Higher sensitivity increases deep scanning of obfuscated indicators but may yield more false positives.
                      </p>
                    </div>

                    {/* Confidence Threshold */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-on-surface text-xs">Confidence Threshold</label>
                        <span className="text-secondary text-xs font-bold font-mono">{confidenceThreshold}%</span>
                      </div>
                      <input 
                        className="range-slider" 
                        max="100" 
                        min="50" 
                        type="range" 
                        value={confidenceThreshold}
                        onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                      />
                      <p className="text-[10px] text-on-surface-variant leading-relaxed italic mt-1">
                        Auto-suppress alerts that do not meet the minimum confidence score assigned by the model.
                      </p>
                    </div>

                  </div>
                </section>

                {/* Marketplace Connected Integrations */}
                <section className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-tertiary/20 flex items-center justify-center text-tertiary">
                        <span className="material-symbols-outlined">hub</span>
                      </div>
                      <h3 className="text-lg font-bold">Connected Integrations</h3>
                    </div>
                    <button className="text-secondary hover:underline text-xs font-bold" onClick={() => setActiveTab('Integrations')}>
                      Browse Marketplace
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* VirusTotal */}
                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 hover:border-secondary/30 transition-all cursor-pointer">
                      <div className="flex justify-between mb-4">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-primary">shield_with_heart</span>
                        </div>
                        <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[9px] font-bold rounded-full h-fit">CONNECTED</span>
                      </div>
                      <h4 className="font-bold text-on-surface text-sm">VirusTotal</h4>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">Unified threat intelligence and file hashes analysis.</p>
                    </div>

                    {/* Splunk */}
                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 hover:border-secondary/30 transition-all cursor-pointer">
                      <div className="flex justify-between mb-4">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-secondary">monitoring</span>
                        </div>
                        <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[9px] font-bold rounded-full h-fit">CONNECTED</span>
                      </div>
                      <h4 className="font-bold text-on-surface text-sm">Splunk Cloud</h4>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">SIEM telemetry logs ingestion and correlation analysis.</p>
                    </div>

                    {/* Slack */}
                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 hover:border-secondary/30 transition-all cursor-pointer">
                      <div className="flex justify-between mb-4">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-tertiary">forum</span>
                        </div>
                        <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[9px] font-bold rounded-full h-fit">CONNECTED</span>
                      </div>
                      <h4 className="font-bold text-on-surface text-sm">Slack Enterprise</h4>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">Real-time incident response alerting and messaging.</p>
                    </div>

                  </div>
                </section>

              </div>
            )}

            {/* TAB CONTENT: Placeholder page for other tabs */}
            {activeTab !== 'General' && activeTab !== 'Security' && (
              <section className="glass-panel p-12 rounded-2xl text-center text-outline">
                <span className="material-symbols-outlined text-5xl text-outline/30 mb-2">settings_suggest</span>
                <h3 className="text-on-surface font-bold text-base mb-1">{activeTab} Panel</h3>
                <p className="text-xs">
                  This administrative settings panel is currently locked or stubbed for local security developer testing.
                </p>
              </section>
            )}

          </div>

        </div>

      </div>

      {/* Floating Action Quick Help Button */}
      <div className="fixed bottom-10 right-10">
        <button className="w-14 h-14 rounded-full neo-button flex items-center justify-center shadow-2xl text-white group relative">
          <span className="material-symbols-outlined text-2xl transition-transform group-hover:rotate-45">bolt</span>
          <span className="absolute -top-12 right-0 bg-surface-container border border-secondary/30 text-secondary px-3 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Quick Help
          </span>
        </button>
      </div>

    </div>
  );
}
