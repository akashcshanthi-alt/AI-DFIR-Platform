import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { settingsService } from '../../services/settings.service';
import { 
  Shield, 
  Loader2, 
  Save, 
  RotateCcw,
  Building,
  Key,
  Mail,
  Brain,
  Bell,
  Palette,
  Eye,
  Lock,
  LogOut
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();

  // Auth Guard check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Active Tab state: default matches first category
  const [activeTab, setActiveTab] = useState('Organization');

  // Loading, saving, feedback states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Local settings state matching Mongoose fields
  const [settings, setSettings] = useState({
    organization: { companyName: '', contactEmail: '', timezone: '' },
    security: { mfaEnabled: true, inactivityTimeout: 45 },
    authentication: { allowOAuth: false, ssoProvider: 'None' },
    email: { smtpHost: '', smtpPort: 587, smtpUser: '', useTls: true },
    aiConfiguration: { aiSensitivity: 8, confidenceThreshold: 92 },
    notifications: { emailAlerts: true, slackWebhook: '', webPushEnabled: true },
    theme: { isDark: true, primaryColor: '#0070f3' },
    appearance: { density: 'Compact', sidebarCollapsed: false },
    passwordPolicy: { pwSpecial: true, pwNumeric: true, pwHistory: false, minLength: 8 }
  });

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('[Settings] Fetch failure:', err);
      setError(err.message || 'Failed to download platform configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasSession) {
      fetchSettings();
    }
  }, [hasSession]);

  if (!hasSession) return null;

  // Safe field update handler for deep nested values
  const handleFieldChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // PUT changes trigger
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const data = await settingsService.updateSettings(settings);
      setSettings(data);
      triggerToast('Platform configurations successfully persisted.');
    } catch (err) {
      console.error('[Settings] Update failure:', err);
      triggerToast(`Failed to update configurations: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Restores baseline system defaults
  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all security and system categories to default baselines?')) {
      return;
    }
    const defaults = {
      organization: { companyName: 'TRACE DFIR Labs', contactEmail: 'security@trace.local', timezone: 'UTC' },
      security: { mfaEnabled: true, inactivityTimeout: 45 },
      authentication: { allowOAuth: false, ssoProvider: 'None' },
      email: { smtpHost: 'smtp.trace.local', smtpPort: 587, smtpUser: 'notifications@trace.local', useTls: true },
      aiConfiguration: { aiSensitivity: 8, confidenceThreshold: 92 },
      notifications: { emailAlerts: true, slackWebhook: '', webPushEnabled: true },
      theme: { isDark: true, primaryColor: '#0070f3' },
      appearance: { density: 'Compact', sidebarCollapsed: false },
      passwordPolicy: { pwSpecial: true, pwNumeric: true, pwHistory: false, minLength: 8 }
    };

    try {
      setIsSaving(true);
      const data = await settingsService.updateSettings(defaults);
      setSettings(data);
      triggerToast('System settings restored to system defaults.');
    } catch (err) {
      console.error('[Settings] Reset failure:', err);
      triggerToast(`Failed to restore defaults: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger transient message toast
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
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

  // AI sensitivity badge resolver
  const getSensitivityLabel = (val) => {
    if (val > 7) return 'HIGH';
    if (val > 4) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="trace-settings-layout min-h-screen text-on-surface font-body-md grid-bg-settings selection:bg-secondary/30 selection:text-secondary">
      {/* Component CSS Overrides */}
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
          input:checked + .slider { background-color: #00E5FF; }
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
              padding: 14px 16px;
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
              color: #00E5FF;
          }
          .trace-settings-sidebar-btn.active {
              color: #47faf3;
              background-color: rgba(71, 250, 243, 0.05);
              border: 1px solid rgba(71, 250, 243, 0.2);
              font-weight: 700;
          }
          
          .trace-settings-field-box {
              display: flex;
              flex-direction: column;
              gap: 6px;
              box-sizing: border-box;
              text-align: left;
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
              border-color: #00E5FF;
              box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.1);
          }
          .trace-settings-text-input:disabled {
              opacity: 0.6;
              background-color: rgba(255, 255, 255, 0.015);
              cursor: not-allowed;
          }
          
          .trace-settings-select {
              width: 100%;
              background-color: #0a0e1a;
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 4px;
              padding: 8px 12px;
              color: #dfe2f3;
              font-size: 0.875rem;
              outline: none;
              height: 38px;
              cursor: pointer;
          }
          .trace-settings-select:focus {
              border-color: #00E5FF;
          }
        `
      }} />

      {/* Floating toast notification popup */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#47faf3] text-[#47faf3] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          {toastMsg}
        </div>
      )}

      {/* Workspace wrapper */}
      <div className="p-6 space-y-6">

        {/* Page Title Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-4 mb-6 text-left">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Settings &amp; Administration</h2>
            <p className="text-sm text-[#cbd5e1]/60 mt-1">Configure global platform security, email triggers, and AI engines.</p>
          </div>
          
          <div className="flex items-center gap-3 justify-end">
            <button 
              onClick={handleResetDefaults}
              disabled={isLoading || isSaving}
              className="flex items-center gap-1.5 px-4 py-2 btn-secondary text-xs h-9"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button 
              onClick={handleSaveSettings}
              disabled={isLoading || isSaving}
              className="flex items-center gap-1.5 px-4 py-2 btn-primary text-xs h-9"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-12 gap-6 items-start animate-pulse">
            <div className="col-span-12 lg:col-span-3 space-y-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-11 bg-white/5 rounded-xl"></div>
              ))}
            </div>
            <div className="col-span-12 lg:col-span-9 h-96 bg-white/5 rounded-2xl"></div>
          </div>
        ) : error ? (
          <div className="glass-panel p-8 text-center text-red-400 rounded-2xl">
            <p className="text-sm font-semibold">Error retrieving settings: {error}</p>
            <button onClick={fetchSettings} className="mt-4 px-4 py-2 bg-red-400/20 text-red-400 border border-red-400/30 rounded text-xs">
              Retry Load
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6 items-start">
            
            {/* Sidebar Tabs */}
            <nav className="col-span-12 lg:col-span-3 flex flex-col gap-1.5 select-none">
              {[
                { name: 'Organization', icon: <Building className="w-4 h-4" /> },
                { name: 'Security', icon: <Shield className="w-4 h-4" /> },
                { name: 'Authentication', icon: <Key className="w-4 h-4" /> },
                { name: 'Email', icon: <Mail className="w-4 h-4" /> },
                { name: 'AI Configuration', icon: <Brain className="w-4 h-4" /> },
                { name: 'Notifications', icon: <Bell className="w-4 h-4" /> },
                { name: 'Theme', icon: <Palette className="w-4 h-4" /> },
                { name: 'Appearance', icon: <Eye className="w-4 h-4" /> },
                { name: 'Password Policy', icon: <Lock className="w-4 h-4" /> }
              ].map(t => (
                <button 
                  key={t.name}
                  onClick={() => setActiveTab(t.name)}
                  className={`trace-settings-sidebar-btn ${activeTab === t.name ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {t.icon}
                    <span className="font-medium text-xs">{t.name}</span>
                  </div>
                </button>
              ))}
              
              <button 
                onClick={handleLogout}
                className="trace-settings-sidebar-btn hover:text-red-400 mt-6"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium text-xs">Exit Portal</span>
                </div>
              </button>
            </nav>

            {/* Config Panels Canvas */}
            <div className="col-span-12 lg:col-span-9 space-y-6 pb-20">

              {/* 1. ORGANIZATION */}
              {activeTab === 'Organization' && (
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <Building className="w-5 h-5 text-[#00E5FF]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Organization Settings</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="trace-settings-field-box">
                      <label className="trace-settings-label-text">Company Name</label>
                      <input 
                        type="text" 
                        value={settings.organization.companyName}
                        onChange={(e) => handleFieldChange('organization', 'companyName', e.target.value)}
                        className="trace-settings-text-input"
                      />
                    </div>

                    <div className="trace-settings-field-box">
                      <label className="trace-settings-label-text">Contact Email</label>
                      <input 
                        type="email" 
                        value={settings.organization.contactEmail}
                        onChange={(e) => handleFieldChange('organization', 'contactEmail', e.target.value)}
                        className="trace-settings-text-input"
                      />
                    </div>

                    <div className="trace-settings-field-box">
                      <label className="trace-settings-label-text">System Timezone</label>
                      <select 
                        value={settings.organization.timezone}
                        onChange={(e) => handleFieldChange('organization', 'timezone', e.target.value)}
                        className="trace-settings-select"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="EST">EST (Eastern Standard Time)</option>
                        <option value="PST">PST (Pacific Standard Time)</option>
                        <option value="GMT">GMT (Greenwich Mean Time)</option>
                        <option value="CET">CET (Central European Time)</option>
                      </select>
                    </div>
                  </div>
                </section>
              )}

              {/* 2. SECURITY */}
              {activeTab === 'Security' && (
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <Shield className="w-5 h-5 text-[#00E5FF]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Access Control</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex flex-col justify-between min-h-[120px] text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-on-surface text-sm">Two-Factor Authentication</h4>
                          <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Enforce MFA credentials check for logins.</p>
                        </div>
                        <label className="switch-toggle">
                          <input 
                            type="checkbox" 
                            checked={settings.security.mfaEnabled} 
                            onChange={(e) => handleFieldChange('security', 'mfaEnabled', e.target.checked)} 
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                      <span className={`px-2 py-0.5 w-fit ${settings.security.mfaEnabled ? 'bg-secondary/10 text-secondary' : 'bg-white/5 text-outline'} text-[10px] font-bold rounded uppercase tracking-wider mt-4`}>
                        {settings.security.mfaEnabled ? 'Enforced' : 'Disabled'}
                      </span>
                    </div>

                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex flex-col justify-between min-h-[120px] text-left">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Inactivity Timeout</h4>
                        <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Close analyst session after timeout.</p>
                      </div>
                      <div className="mt-4">
                        <input 
                          className="range-slider" 
                          max="120" 
                          min="15" 
                          type="range" 
                          value={settings.security.inactivityTimeout}
                          onChange={(e) => handleFieldChange('security', 'inactivityTimeout', Number(e.target.value))}
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-mono text-[#cbd5e1]/55">
                          <span>15 MIN</span>
                          <span className="text-[#00E5FF] font-bold">{settings.security.inactivityTimeout} MINUTES</span>
                          <span>120 MIN</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 3. AUTHENTICATION */}
              {activeTab === 'Authentication' && (
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <Key className="w-5 h-5 text-[#00E5FF]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Authentication</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex flex-col justify-between min-h-[120px] text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-on-surface text-sm">OAuth Integrations</h4>
                          <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Allow login via social SSO operators.</p>
                        </div>
                        <label className="switch-toggle">
                          <input 
                            type="checkbox" 
                            checked={settings.authentication.allowOAuth} 
                            onChange={(e) => handleFieldChange('authentication', 'allowOAuth', e.target.checked)} 
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                      <span className={`px-2 py-0.5 w-fit ${settings.authentication.allowOAuth ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'bg-white/5 text-outline'} text-[10px] font-bold rounded uppercase tracking-wider mt-4`}>
                        {settings.authentication.allowOAuth ? 'Allowed' : 'Block Local'}
                      </span>
                    </div>

                    <div className="trace-settings-field-box">
                      <label className="trace-settings-label-text">SSO Identity Provider</label>
                      <select 
                        value={settings.authentication.ssoProvider}
                        onChange={(e) => handleFieldChange('authentication', 'ssoProvider', e.target.value)}
                        className="trace-settings-select"
                      >
                        <option value="None">None (Password Authentication)</option>
                        <option value="Okta">Okta Enterprise ID</option>
                        <option value="ActiveDirectory">Active Directory Federation</option>
                        <option value="AzureAD">Microsoft Entra ID (Azure AD)</option>
                      </select>
                    </div>
                  </div>
                </section>
              )}

              {/* 4. EMAIL */}
              {activeTab === 'Email' && (
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <Mail className="w-5 h-5 text-[#00E5FF]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Email SMTP configuration</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="trace-settings-field-box">
                      <label className="trace-settings-label-text">SMTP Gateway Host</label>
                      <input 
                        type="text" 
                        value={settings.email.smtpHost}
                        onChange={(e) => handleFieldChange('email', 'smtpHost', e.target.value)}
                        className="trace-settings-text-input"
                      />
                    </div>

                    <div className="trace-settings-field-box">
                      <label className="trace-settings-label-text">SMTP Gateway Port</label>
                      <input 
                        type="number" 
                        value={settings.email.smtpPort}
                        onChange={(e) => handleFieldChange('email', 'smtpPort', Number(e.target.value))}
                        className="trace-settings-text-input"
                      />
                    </div>

                    <div className="trace-settings-field-box">
                      <label className="trace-settings-label-text">SMTP Username</label>
                      <input 
                        type="text" 
                        value={settings.email.smtpUser}
                        onChange={(e) => handleFieldChange('email', 'smtpUser', e.target.value)}
                        className="trace-settings-text-input"
                      />
                    </div>

                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex items-center justify-between text-left">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Force TLS/SSL Encryption</h4>
                        <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Encrypt outbound traffic sockets.</p>
                      </div>
                      <label className="switch-toggle">
                        <input 
                          type="checkbox" 
                          checked={settings.email.useTls} 
                          onChange={(e) => handleFieldChange('email', 'useTls', e.target.checked)} 
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </section>
              )}

              {/* 5. AI CONFIGURATION */}
              {activeTab === 'AI Configuration' && (
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <Brain className="w-5 h-5 text-[#00E5FF]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Heuristics Engine</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-on-surface text-xs">Analysis Sensitivity</label>
                        <span className="text-secondary text-xs font-bold font-mono">{getSensitivityLabel(settings.aiConfiguration.aiSensitivity)}</span>
                      </div>
                      <input 
                        className="range-slider" 
                        max="10" 
                        min="1" 
                        type="range" 
                        value={settings.aiConfiguration.aiSensitivity}
                        onChange={(e) => handleFieldChange('aiConfiguration', 'aiSensitivity', Number(e.target.value))}
                      />
                      <p className="text-[10px] text-[#cbd5e1]/50 italic leading-relaxed">
                        Adjust scanning deep heuristic models. Higher levels flags more anomalies but can generate more alerts.
                      </p>
                    </div>

                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-on-surface text-xs">Confidence Threshold</label>
                        <span className="text-secondary text-xs font-bold font-mono">{settings.aiConfiguration.confidenceThreshold}%</span>
                      </div>
                      <input 
                        className="range-slider" 
                        max="100" 
                        min="50" 
                        type="range" 
                        value={settings.aiConfiguration.confidenceThreshold}
                        onChange={(e) => handleFieldChange('aiConfiguration', 'confidenceThreshold', Number(e.target.value))}
                      />
                      <p className="text-[10px] text-[#cbd5e1]/50 italic leading-relaxed">
                        Suppress EDR correlation cases that fall below this threat probability limit.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* 6. NOTIFICATIONS */}
              {activeTab === 'Notifications' && (
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <Bell className="w-5 h-5 text-[#00E5FF]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Alerting Triggers</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex items-center justify-between text-left">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Send Email Alerts</h4>
                        <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Dispatches emails on Critical alarms.</p>
                      </div>
                      <label className="switch-toggle">
                        <input 
                          type="checkbox" 
                          checked={settings.notifications.emailAlerts} 
                          onChange={(e) => handleFieldChange('notifications', 'emailAlerts', e.target.checked)} 
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex items-center justify-between text-left">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Web Push Notifications</h4>
                        <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Enables browser-level visual alerts.</p>
                      </div>
                      <label className="switch-toggle">
                        <input 
                          type="checkbox" 
                          checked={settings.notifications.webPushEnabled} 
                          onChange={(e) => handleFieldChange('notifications', 'webPushEnabled', e.target.checked)} 
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="trace-settings-field-box md:col-span-2">
                      <label className="trace-settings-label-text">Slack Hook URL</label>
                      <input 
                        type="text" 
                        value={settings.notifications.slackWebhook}
                        onChange={(e) => handleFieldChange('notifications', 'slackWebhook', e.target.value)}
                        placeholder="https://hooks.slack.com/services/..."
                        className="trace-settings-text-input font-mono"
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* 7. THEME */}
              {activeTab === 'Theme' && (
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <Palette className="w-5 h-5 text-[#00E5FF]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Color Themes</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex items-center justify-between text-left">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Force Dark Mode Grid</h4>
                        <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Sets dark aesthetics as system baseline.</p>
                      </div>
                      <label className="switch-toggle">
                        <input 
                          type="checkbox" 
                          checked={settings.theme.isDark} 
                          onChange={(e) => handleFieldChange('theme', 'isDark', e.target.checked)} 
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="trace-settings-field-box">
                      <label className="trace-settings-label-text">Primary Cyan/Blue Accent (Hex)</label>
                      <input 
                        type="text" 
                        value={settings.theme.primaryColor}
                        onChange={(e) => handleFieldChange('theme', 'primaryColor', e.target.value)}
                        className="trace-settings-text-input font-mono"
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* 8. APPEARANCE */}
              {activeTab === 'Appearance' && (
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <Eye className="w-5 h-5 text-[#00E5FF]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Appearance density</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="trace-settings-field-box">
                      <label className="trace-settings-label-text">Grid Padding Density</label>
                      <select 
                        value={settings.appearance.density}
                        onChange={(e) => handleFieldChange('appearance', 'density', e.target.value)}
                        className="trace-settings-select"
                      >
                        <option value="Comfortable">Comfortable (Wide Spacings)</option>
                        <option value="Cozy">Cozy (Standard Padding)</option>
                        <option value="Compact">Compact (Miniature Layouts)</option>
                      </select>
                    </div>

                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex items-center justify-between text-left">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Collapse Sidebar Left</h4>
                        <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Maximize dashboard canvas width.</p>
                      </div>
                      <label className="switch-toggle">
                        <input 
                          type="checkbox" 
                          checked={settings.appearance.sidebarCollapsed} 
                          onChange={(e) => handleFieldChange('appearance', 'sidebarCollapsed', e.target.checked)} 
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </section>
              )}

              {/* 9. PASSWORD POLICY */}
              {activeTab === 'Password Policy' && (
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <Lock className="w-5 h-5 text-[#00E5FF]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Clearance Password constraints</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex items-center justify-between text-left">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Inclusion of Special Characters</h4>
                        <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Requires symbols (e.g., @, #, $).</p>
                      </div>
                      <label className="switch-toggle">
                        <input 
                          type="checkbox" 
                          checked={settings.passwordPolicy.pwSpecial} 
                          onChange={(e) => handleFieldChange('passwordPolicy', 'pwSpecial', e.target.checked)} 
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex items-center justify-between text-left">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Inclusion of Numerical Digits</h4>
                        <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Requires digits (e.g., 0-9).</p>
                      </div>
                      <label className="switch-toggle">
                        <input 
                          type="checkbox" 
                          checked={settings.passwordPolicy.pwNumeric} 
                          onChange={(e) => handleFieldChange('passwordPolicy', 'pwNumeric', e.target.checked)} 
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="p-5 bg-surface-container-low rounded-xl border border-white/5 flex items-center justify-between text-left">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Restrict Passwords Reuse</h4>
                        <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Block recent history passwords.</p>
                      </div>
                      <label className="switch-toggle">
                        <input 
                          type="checkbox" 
                          checked={settings.passwordPolicy.pwHistory} 
                          onChange={(e) => handleFieldChange('passwordPolicy', 'pwHistory', e.target.checked)} 
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="trace-settings-field-box">
                      <label className="trace-settings-label-text">Minimum Character Length</label>
                      <input 
                        type="number" 
                        min="6"
                        max="32"
                        value={settings.passwordPolicy.minLength}
                        onChange={(e) => handleFieldChange('passwordPolicy', 'minLength', Number(e.target.value))}
                        className="trace-settings-text-input"
                      />
                    </div>
                  </div>
                </section>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
