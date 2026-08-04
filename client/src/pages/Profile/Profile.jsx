import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export default function Profile() {
  const navigate = useNavigate();

  // Auth Guard check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  // Profile settings state inside profile page
  const [profileTab, setProfileTab] = useState('activity'); // 'activity' | 'settings'
  const [profileName, setProfileName] = useState(() => localStorage.getItem('operatorName') || 'Agent Sarah Vance');
  const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem('operatorEmail') || 'analyst@trace.local');
  const [profileOrg, setProfileOrg] = useState(() => localStorage.getItem('operatorOrg') || 'TRACE Security Team');
  const [profileRole, setProfileRole] = useState(() => localStorage.getItem('operatorRole') || 'Investigator');
  const [profileErrors, setProfileErrors] = useState({});
  const [profileFeedback, setProfileFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Password fields states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordFeedback, setPasswordFeedback] = useState(false);

  const [aiExpanded, setAiExpanded] = useState(false);
  const [copiedCase, setCopiedCase] = useState(null);

  // Dynamic Skill value increments for interactive micro-interaction
  const [skills, setSkills] = useState({
    forensics: 94,
    malware: 88,
    hunting: 76
  });

  // Action feedback alert
  const [feedback, setFeedback] = useState('');

  // Helper to trigger feedback popups
  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  // Fetch operator profile on mount
  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await authService.getProfile();
        const user = data.data;
        if (user) {
          setProfileName(user.fullName || '');
          setProfileEmail(user.email || '');
          setProfileOrg(user.department || '');
          setProfileRole(user.role || 'Analyst');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        showFeedback('Session expired. Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [hasSession, navigate]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const tempErrors = {};
    if (!profileName.trim()) tempErrors.name = 'Profile name is required';
    if (!profileEmail.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.trim())) {
      tempErrors.email = 'Please provide a valid email format';
    }
    if (!profileOrg.trim()) tempErrors.org = 'Organization is required';

    if (Object.keys(tempErrors).length > 0) {
      setProfileErrors(tempErrors);
      return;
    }

    setProfileErrors({});
    setIsLoading(true);
    try {
      await authService.updateProfile(profileName.trim(), profileOrg.trim());
      setProfileFeedback(true);
      showFeedback('Profile details updated successfully.');
      setTimeout(() => setProfileFeedback(false), 2500);
    } catch (err) {
      showFeedback(err.message || 'Profile update failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    const tempErrors = {};
    if (!currentPassword) tempErrors.current = 'Current password is required';
    if (!newPassword) {
      tempErrors.new = 'New password is required';
    } else if (newPassword.length < 6) {
      tempErrors.new = 'Password must contain at least 6 characters';
    }
    if (!confirmPassword) {
      tempErrors.confirm = 'Confirm new password is required';
    } else if (confirmPassword !== newPassword) {
      tempErrors.confirm = 'Passwords must match';
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
    showFeedback('Clearance key updated successfully.');
    setTimeout(() => setPasswordFeedback(false), 2500);
  };

  const handleCopyCase = (caseId) => {
    navigator.clipboard.writeText(caseId);
    setCopiedCase(caseId);
    showFeedback(`Copied ${caseId} to clipboard.`);
    setTimeout(() => setCopiedCase(null), 2000);
  };

  return (
    <div className="trace-profile-layout min-h-screen text-on-surface font-body-md grid-bg-profile selection:bg-secondary/30 selection:text-secondary">
      {/* Dynamic Inline CSS overrides for page layout elements */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .glass-card {
              background: rgba(27, 31, 44, 0.4);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-top: 1px solid rgba(255, 255, 255, 0.15);
          }
          .grid-bg-profile {
              background-image: linear-gradient(rgba(174, 198, 255, 0.03) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(174, 198, 255, 0.03) 1px, transparent 1px);
              background-size: 32px 32px;
          }
          .glow-blue {
              box-shadow: 0 0 20px rgba(0, 112, 243, 0.2);
          }
          .glow-cyan {
              box-shadow: 0 0 15px rgba(71, 250, 243, 0.15);
          }
          .animate-pulse-slow {
              animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: .7; }
          }
          .custom-scrollbar::-webkit-scrollbar {
              width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.02);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(174, 198, 255, 0.2);
              border-radius: 10px;
          }
          .switch-toggle-profile {
              position: relative;
              display: inline-block;
              width: 32px;
              height: 16px;
          }
          .switch-toggle-profile input { opacity: 0; width: 0; height: 0; }
          .slider-profile {
              position: absolute;
              cursor: pointer;
              top: 0; left: 0; right: 0; bottom: 0;
              background-color: #313442;
              transition: .3s;
              border-radius: 34px;
          }
          .slider-profile:before {
              position: absolute;
              content: "";
              height: 12px; width: 12px;
              left: 2px; bottom: 2px;
              background-color: white;
              transition: .3s;
              border-radius: 50%;
          }
          input:checked + .slider-profile { background-color: #47faf3; }
          input:checked + .slider-profile:before { transform: translateX(16px); }
        `
      }} />

      {/* Floating Action / Action Notification */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-secondary/30 text-secondary text-xs px-4 py-2.5 rounded-lg shadow-xl animate-bounce">
          {feedback}
        </div>
      )}

      {/* Analyst Workspace Content Container */}
      <div className="p-8 w-full max-w-[1600px] mx-auto grid grid-cols-12 gap-6">

        {/* Page Title Header */}
        <div className="col-span-12 select-none mb-2 border-b border-white/5 pb-4">
          <h1 className="font-display-lg text-4xl font-bold text-on-surface tracking-tight">Investigator Profile</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage credentials, security clearance key, and monitor system assignments.</p>
        </div>

        {/* COLUMN 1: Profile and Skills */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* Hero Profile Panel */}
          <div className="glass-card rounded-xl overflow-hidden p-6 relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="h-32 w-32 rounded-full border-2 border-secondary p-1 overflow-hidden glow-cyan">
                  <img 
                    className="w-full h-full object-cover rounded-full" 
                    alt={profileName} 
                    src="/male_analyst_avatar.png"
                  />
                </div>
                <div className="absolute bottom-0 right-0 h-8 w-8 bg-surface-container-highest border border-white/10 rounded-full flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              </div>

              <h1 className="text-xl font-bold text-on-surface">{profileName}</h1>
              <p className="font-label-caps text-xs text-on-surface-variant tracking-[0.2em] mb-4">L4 Lead Investigator</p>
              
              <div className="flex flex-wrap justify-center gap-2">
                <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-label-caps uppercase tracking-wider">Malware Specialist</span>
                <span className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-full text-[10px] font-label-caps uppercase tracking-wider">Forensic Expert</span>
              </div>
            </div>
          </div>

          {/* Performance Stats Bento Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-1 border-l-2 border-l-primary/50 hover:bg-white/5 transition-all">
              <span className="font-label-caps text-[10px] text-on-surface-variant">Cases Solved</span>
              <span className="text-2xl font-bold text-primary font-mono">124</span>
            </div>

            <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-1 border-l-2 border-l-secondary/50 hover:bg-white/5 transition-all">
              <span className="font-label-caps text-[10px] text-on-surface-variant">Success Rate</span>
              <span className="text-2xl font-bold text-secondary font-mono">98%</span>
            </div>

            <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-1 border-l-2 border-l-tertiary/50 hover:bg-white/5 transition-all">
              <span className="font-label-caps text-[10px] text-on-surface-variant">AI Efficiency</span>
              <span className="text-2xl font-bold text-tertiary font-mono">+22%</span>
            </div>

            <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-1 border-l-2 border-l-outline/50 hover:bg-white/5 transition-all">
              <span className="font-label-caps text-[10px] text-on-surface-variant">Evidence Volume</span>
              <span className="text-2xl font-bold text-on-surface font-mono">2.4TB</span>
            </div>

          </div>

          {/* Interactive Skills Progress bars */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-label-caps text-xs text-on-surface border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              Specialized Skills
            </h3>
            
            <div className="flex flex-col gap-4">
              
              <div className="group cursor-pointer" onClick={() => setSkills(s => ({ ...s, forensics: Math.min(100, s.forensics + 1) }))}>
                <div className="flex justify-between font-label-caps text-[10px] mb-1">
                  <span>Digital Forensics</span>
                  <span className="text-primary font-bold group-hover:underline">{skills.forensics}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary glow-blue transition-all duration-500" style={{ width: `${skills.forensics}%` }}></div>
                </div>
              </div>

              <div className="group cursor-pointer" onClick={() => setSkills(s => ({ ...s, malware: Math.min(100, s.malware + 1) }))}>
                <div className="flex justify-between font-label-caps text-[10px] mb-1">
                  <span>Malware Analysis</span>
                  <span className="text-secondary font-bold group-hover:underline">{skills.malware}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary glow-cyan transition-all duration-500" style={{ width: `${skills.malware}%` }}></div>
                </div>
              </div>

              <div className="group cursor-pointer" onClick={() => setSkills(s => ({ ...s, hunting: Math.min(100, s.hunting + 1) }))}>
                <div className="flex justify-between font-label-caps text-[10px] mb-1">
                  <span>Threat Hunting</span>
                  <span className="text-tertiary font-bold group-hover:underline">{skills.hunting}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary transition-all duration-500" style={{ width: `${skills.hunting}%` }}></div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* COLUMN 2: Activity Feed and Account Settings */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          
          {/* Tab Selection Navigation */}
          <div className="flex gap-2 border-b border-white/5 pb-2">
            <button
              type="button"
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                profileTab === 'activity'
                  ? 'bg-secondary/10 text-[#47FAF3] border border-secondary/30'
                  : 'text-outline hover:text-white'
              }`}
              onClick={() => setProfileTab('activity')}
            >
              Incident Activity
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                profileTab === 'settings'
                  ? 'bg-secondary/10 text-[#47FAF3] border border-secondary/30'
                  : 'text-outline hover:text-white'
              }`}
              onClick={() => setProfileTab('settings')}
            >
              Account Management
            </button>
          </div>

          {profileTab === 'activity' ? (
            /* Timeline Activity Feed */
            <div className="glass-card rounded-xl p-6 flex-1 flex flex-col min-h-[420px] max-h-[500px]">
              <h3 className="font-label-caps text-xs text-on-surface border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">timeline</span>
                Incident Activity Feed
              </h3>

              <div className="flex-1 space-y-6 relative overflow-y-auto custom-scrollbar pr-2 pt-2">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-primary via-primary/20 to-transparent"></div>

                {/* Timeline Item 1 */}
                <div className="flex gap-4 relative">
                  <div className="h-6 w-6 rounded-full bg-primary-container border-4 border-background z-10 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <p className="text-on-surface font-semibold text-sm">Incident #TR-8821 Closed</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">Threat neutralized. Data exfiltration prevented at node 44.</p>
                    <span className="text-[9px] font-label-caps text-on-surface-variant/50 block mt-1">2 MINS AGO</span>
                  </div>
                </div>

                {/* Timeline Item 2 */}
                <div className="flex gap-4 relative">
                  <div className="h-6 w-6 rounded-full bg-surface-container-highest border-4 border-background z-10 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 bg-on-surface-variant rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-on-surface font-semibold text-sm">Report Exported</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">Full forensic chain-of-custody report generated for legal review.</p>
                    <span className="text-[9px] font-label-caps text-on-surface-variant/50 block mt-1">1 HOUR AGO</span>
                  </div>
                </div>

                {/* Timeline Item 3 */}
                <div className="flex gap-4 relative">
                  <div className="h-6 w-6 rounded-full bg-secondary border-4 border-background z-10 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 bg-on-secondary rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-on-surface font-semibold text-sm">Evidence Verified</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">Memory dump hash SHA-256 validated against primary storage.</p>
                    <span className="text-[9px] font-label-caps text-on-surface-variant/50 block mt-1">4 HOURS AGO</span>
                  </div>
                </div>

                {/* Timeline Item 4 */}
                <div className="flex gap-4 relative opacity-60">
                  <div className="h-6 w-6 rounded-full bg-surface-container-highest border-4 border-background z-10 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 bg-on-surface-variant rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-on-surface font-semibold text-sm">Security Level Elevate</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">Regional access control adjusted to DEFCON 3.</p>
                    <span className="text-[9px] font-label-caps text-on-surface-variant/50 block mt-1">YESTERDAY</span>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* Account Settings Card stack */
            <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar max-h-[600px] pr-2">
              
              {/* Profile Details Form */}
              <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                  Profile Information
                </h3>
                <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="profile-name" className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider">Operator Name</label>
                    <input
                      id="profile-name"
                      type="text"
                      className="trace-settings-text-input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                    />
                    {profileErrors.name && <span className="text-xs text-error">{profileErrors.name}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="profile-email" className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider">Email Address</label>
                    <input
                      id="profile-email"
                      type="email"
                      className="trace-settings-text-input"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                    />
                    {profileErrors.email && <span className="text-xs text-error">{profileErrors.email}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="profile-org" className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider">Organization</label>
                    <input
                      id="profile-org"
                      type="text"
                      className="trace-settings-text-input"
                      value={profileOrg}
                      onChange={(e) => setProfileOrg(e.target.value)}
                      required
                    />
                    {profileErrors.org && <span className="text-xs text-error">{profileErrors.org}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider">Clearance Role</label>
                    <input
                      type="text"
                      className="trace-settings-text-input opacity-60 cursor-not-allowed"
                      value={profileRole}
                      disabled
                      readOnly
                    />
                  </div>
                  <button type="submit" className="w-full mt-2 btn-primary">
                    Save Profile Details
                  </button>
                </form>
              </div>

              {/* Password update form */}
              <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  Update Clearance Key
                </h3>
                <form onSubmit={handleSavePassword} className="space-y-4" noValidate>
                  <div className="flex flex-col gap-1.5 relative">
                    <label htmlFor="current-pwd" className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider">Current Password</label>
                    <div className="relative flex items-center w-full">
                      <input
                        id="current-pwd"
                        type={showCurrent ? 'text' : 'password'}
                        className="trace-settings-text-input pr-12"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
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
                    {passwordErrors.current && <span className="text-xs text-error">{passwordErrors.current}</span>}
                  </div>
                  
                  <div className="flex flex-col gap-1.5 relative">
                    <label htmlFor="new-pwd" className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider">New Password</label>
                    <div className="relative flex items-center w-full">
                      <input
                        id="new-pwd"
                        type={showNew ? 'text' : 'password'}
                        className="trace-settings-text-input pr-12"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                    {passwordErrors.new && <span className="text-xs text-error">{passwordErrors.new}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5 relative">
                    <label htmlFor="confirm-pwd" className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider">Confirm New Password</label>
                    <div className="relative flex items-center w-full">
                      <input
                        id="confirm-pwd"
                        type={showConfirm ? 'text' : 'password'}
                        className="trace-settings-text-input pr-12"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {passwordErrors.confirm && <span className="text-xs text-error">{passwordErrors.confirm}</span>}
                  </div>

                  <button type="submit" className="w-full mt-2 btn-primary">
                    Update Clearance Key
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>

        {/* COLUMN 3: Assigned Cases, AI Assistant Suggestions, and Team Activity */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          
          {/* Assigned Cases List */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-label-caps text-xs text-on-surface border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">assignment</span>
              Assigned Cases
            </h3>

            <div className="space-y-3">
              
              <div 
                onClick={() => handleCopyCase('#TR-9902')}
                className="p-3 rounded-lg bg-surface-container-highest border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-secondary transition-colors">
                    #TR-9902 {copiedCase === '#TR-9902' && <span className="text-[10px] text-secondary ml-1 font-normal font-sans">(Copied!)</span>}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Memory Injection</p>
                </div>
                <span className="text-[9px] bg-error-container text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">Urgent</span>
              </div>

              <div 
                onClick={() => handleCopyCase('#TR-8815')}
                className="p-3 rounded-lg bg-surface-container-highest border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-secondary transition-colors">
                    #TR-8815 {copiedCase === '#TR-8815' && <span className="text-[10px] text-secondary ml-1 font-normal font-sans">(Copied!)</span>}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Auth Bypass Loop</p>
                </div>
                <span className="text-[9px] bg-primary-container text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">Pending</span>
              </div>

              <div 
                onClick={() => handleCopyCase('#TR-9001')}
                className="p-3 rounded-lg bg-surface-container-highest border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-secondary transition-colors">
                    #TR-9001 {copiedCase === '#TR-9001' && <span className="text-[10px] text-secondary ml-1 font-normal font-sans">(Copied!)</span>}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">SQLi Attempt</p>
                </div>
                <span className="text-[9px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-bold uppercase tracking-wider">Low</span>
              </div>

            </div>
          </div>

          {/* AI Assistant Suggestions Speech bubble */}
          <div className="relative">
            <div className="glass-card rounded-xl p-5 border-primary/30 shadow-[0_0_30px_rgba(0,112,243,0.15)] relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/20 rounded-full blur-2xl"></div>
              
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                <span className="font-label-caps text-[10px] text-primary tracking-wider uppercase">AI Suggestion</span>
              </div>

              <p className="text-xs text-on-surface leading-relaxed italic">
                "Based on recent patterns in Case #TR-9902, I recommend checking the lateral movement in the staging environment. 88% correlation found."
              </p>

              {aiExpanded && (
                <div className="mt-3 p-3 bg-surface-container-low border border-white/5 rounded text-[11px] text-on-surface-variant leading-relaxed">
                  Additional analysis indicates outbound connections to known low-reputation IP blocks on staging port 8443. Recommendation: isolates nodes STG-02 and STG-04.
                </div>
              )}

              <button 
                onClick={() => setAiExpanded(!aiExpanded)}
                className="mt-4 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded font-label-caps text-[9px] tracking-wider uppercase transition-all"
              >
                {aiExpanded ? 'Collapse Analysis' : 'Explore Analysis'}
              </button>
            </div>
            
            {/* Bubble Pointer */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-[#1b1f2c] border border-primary/25 rotate-45 border-t-0 border-l-0"></div>
          </div>

          {/* Team Activity Logs Feed */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-label-caps text-xs text-on-surface border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">group</span>
              Team Activity
            </h3>

            <div className="space-y-4">
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-surface-container-highest overflow-hidden flex-shrink-0">
                  <img 
                    className="h-full w-full object-cover" 
                    alt="Agent Kael" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdSHqT8uFYI3x-7tMpFGKc30Tlsk_UXbc_GU77mAItFjUnpTHwJ6tYeGsyCy_13yrSo-QAgq47oU-NN9PhGBUC5MFijJ_pcgtf8WjmrvPS9o7MOUiZfSWMZ1T5Q8SxfFw58mfxiDiWmNHvJj8U3A7ISWp7BsQowHxYMqqIhaqM17d3JiVKlcVFDZub5qaRSgfndhjrW_DSxoTA7bvNSl1IVnYnsrndn_sWmF9PwFJWjBwN3OQaE5Ct"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface truncate">
                    <span className="font-bold">Agent Kael</span> verified logs
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">10m ago</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-surface-container-highest overflow-hidden flex-shrink-0">
                  <img 
                    className="h-full w-full object-cover" 
                    alt="Agent Jiro" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzmuFbqG3KCQ09jJOCR0-t0mqEAjtj05zLanKYwDWhtPuUXKp1ahw50wxQTks23RsdySIN5KuYDl2Zw-oS8nULzh95V1Ti5Q8DmBjsTCGZTpLrC4amPzH9fLxQ-cC-DqTQwGRQa-yh5I5Cw0WujTxtI2JhlhHesN0N37OoaeyG9VZrZWJt5LBl-tj1u6FDfhupidsmdIuIJxchLo-RXxc5WTJP-MEyfsSmpEyzVmzNJMT7BM97Bj6j"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface truncate">
                    <span className="font-bold">Agent Jiro</span> started Case #TR-9908
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">2h ago</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
