import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUser, 
  FiMail, 
  FiShield, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiCalendar, 
  FiClock, 
  FiBriefcase, 
  FiPhone, 
  FiEdit2, 
  FiLock, 
  FiLogOut,
  FiFolder, 
  FiActivity,
  FiRefreshCw,
  FiX,
  FiSave
} from 'react-icons/fi';
import { authService } from '../../services/auth.service';
import { userService } from '../../services/user.service';
import { casesService } from '../../services/cases.service';
import { auditService } from '../../services/audit.service';

export default function Profile() {
  const navigate = useNavigate();

  // Profile and Loading State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Associated Real Records
  const [assignedCases, setAssignedCases] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  // Modals & Feedback State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Edit Profile Form
  const [editForm, setEditForm] = useState({
    fullName: '',
    department: '',
    phone: '',
    profileImage: ''
  });

  // Change Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const showNotification = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: 'success' }), 4000);
  };

  // Fetch real authenticated profile
  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.getProfile();
      if (response && response.success && response.data) {
        setProfile(response.data);
        setEditForm({
          fullName: response.data.fullName || '',
          department: response.data.department || '',
          phone: response.data.phone || '',
          profileImage: response.data.profileImage || ''
        });
      } else {
        setError('Failed to retrieve operator profile.');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Error communicating with authentication server.');
      if (err.message && err.message.includes('token')) {
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch real assigned cases
  const fetchUserCases = async () => {
    setCasesLoading(true);
    try {
      const res = await casesService.getCases({ limit: 5 });
      if (res && res.success && Array.isArray(res.data)) {
        setAssignedCases(res.data);
      } else {
        setAssignedCases([]);
      }
    } catch (err) {
      console.error('Error loading cases for profile:', err);
      setAssignedCases([]);
    } finally {
      setCasesLoading(false);
    }
  };

  // Fetch real user activity
  const fetchUserActivity = async () => {
    setActivityLoading(true);
    try {
      const res = await auditService.getAuditLogs({ limit: 5 });
      if (Array.isArray(res)) {
        setRecentActivity(res);
      } else if (res && res.success && Array.isArray(res.data)) {
        setRecentActivity(res.data);
      } else {
        setRecentActivity([]);
      }
    } catch (err) {
      console.error('Error loading user activity for profile:', err);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    const hasSession = localStorage.getItem('isAuthenticated') === 'true' && localStorage.getItem('token');
    if (!hasSession) {
      navigate('/login', { replace: true });
      return;
    }

    fetchProfileData();
    fetchUserCases();
    fetchUserActivity();
  }, [navigate]);

  // Handle Edit Profile Form Submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) {
      showNotification('Full Name is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.updateProfile(
        editForm.fullName.trim(),
        editForm.department.trim(),
        editForm.phone.trim(),
        editForm.profileImage.trim()
      );

      if (res && res.success && res.data) {
        setProfile(res.data);
        localStorage.setItem('operatorName', res.data.fullName);
        showNotification('Profile information updated successfully.', 'success');
        setEditModalOpen(false);
      } else {
        showNotification('Failed to update profile.', 'error');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      showNotification(err.message || 'Error updating profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Password Change Form Submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Please provide both current and new passwords.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await userService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (res && res.success) {
        setPasswordSuccess('Password updated successfully.');
        showNotification('Password updated successfully.', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordError('Failed to change password. Please check your current password.');
      }
    } catch (err) {
      setPasswordError(err.message || 'Error updating password.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout warning:', err.message);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login', { replace: true });
    }
  };

  const getInitials = (name) => {
    if (!name) return 'OP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="trace-profile-container min-h-screen text-slate-100 p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {feedback.message && (
        <div 
          className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-medium border transition-all animate-bounce ${
            feedback.type === 'error' 
              ? 'bg-rose-950/90 text-rose-200 border-rose-600/50' 
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-600/50'
          }`}
        >
          {feedback.type === 'error' ? <FiAlertCircle size={16} /> : <FiCheckCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header & Reload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FiUser className="text-cyan-400" />
            My Profile
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authenticated operator identity, account specifications, and security controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchProfileData();
              fetchUserCases();
              fetchUserActivity();
              showNotification('Refreshed profile data.', 'success');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
            title="Refresh Profile"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setEditModalOpen(true)}
            disabled={!profile}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-colors disabled:opacity-50"
          >
            <FiEdit2 size={14} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && !profile && (
        <div className="flex flex-col items-center justify-center p-16 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 gap-3">
          <FiRefreshCw size={24} className="animate-spin text-cyan-400" />
          <span className="text-xs">Authenticating and retrieving operator profile...</span>
        </div>
      )}

      {error && !profile && (
        <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 flex items-start gap-3">
          <FiAlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-rose-200">Unable to load profile</h3>
            <p className="text-xs text-rose-300/80 mt-1">{error}</p>
            <button
              onClick={fetchProfileData}
              className="mt-3 px-3 py-1.5 rounded bg-rose-900/50 hover:bg-rose-900 border border-rose-700/50 text-xs text-rose-100"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Profile Overview, Security Status, and Session */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Operator Card */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

              {/* Avatar */}
              <div className="relative mb-4 mt-2">
                <div className="h-24 w-24 rounded-full border-2 border-cyan-400/80 p-1 shadow-lg shadow-cyan-950/50 flex items-center justify-center bg-slate-800 overflow-hidden">
                  {profile.profileImage ? (
                    <img 
                      src={profile.profileImage} 
                      alt={profile.fullName} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-2xl font-bold font-mono text-cyan-300">
                      {getInitials(profile.fullName)}
                    </span>
                  )}
                </div>

                <div 
                  className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-white text-xs ${
                    profile.emailVerified ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  title={profile.emailVerified ? 'Email Verified' : 'Email Pending Verification'}
                >
                  <FiCheckCircle size={12} />
                </div>
              </div>

              {/* Identity Header */}
              <h2 className="text-xl font-bold text-white tracking-tight">{profile.fullName}</h2>
              <p className="text-xs font-mono text-cyan-400 mt-1">{profile.email}</p>
              
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 flex items-center gap-1.5">
                  <FiShield size={12} />
                  {profile.role || 'Investigator'}
                </span>

                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  profile.accountStatus === 'Active' 
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50' 
                    : 'bg-amber-950/80 text-amber-300 border-amber-700/50'
                }`}>
                  Status: {profile.accountStatus || 'Active'}
                </span>
              </div>

              {/* Edit Profile Trigger */}
              <button
                onClick={() => setEditModalOpen(true)}
                className="w-full mt-6 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <FiEdit2 size={13} />
                <span>Update Profile Details</span>
              </button>
            </div>

            {/* Account Status & Verification Summary */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FiShield size={14} className="text-cyan-400" />
                Account Verification
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Email Status</span>
                  <span className={profile.emailVerified ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                    {profile.emailVerified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Clearance Level</span>
                  <span className="text-slate-200 font-medium">{profile.role}</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Account Access</span>
                  <span className="text-emerald-400 font-medium">Authorized</span>
                </div>
              </div>
            </div>

            {/* Session Management & Direct Logout */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FiLogOut size={14} className="text-rose-400" />
                  Active Session
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Current authentication token session.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Session Type:</span>
                  <span className="text-slate-300 font-mono">JWT Bearer Token</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-emerald-400 font-medium">Active & Validated</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-800/50 flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <FiLogOut size={14} />
                <span>Logout Session</span>
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Account Specifications, Change Password, and Real Assigned Records */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Account Specifications */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                  <FiBriefcase className="text-cyan-400" />
                  Account Specifications
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authenticated parameters associated with this investigator session.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <FiShield size={14} className="text-cyan-400" />
                    <span>Operator ID</span>
                  </div>
                  <div className="text-sm font-mono text-slate-200 font-semibold">
                    {profile.userId || profile.id || 'N/A'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <FiUser size={14} className="text-cyan-400" />
                    <span>Full Name</span>
                  </div>
                  <div className="text-sm text-slate-200 font-semibold">
                    {profile.fullName || 'N/A'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <FiMail size={14} className="text-cyan-400" />
                    <span>Email Address</span>
                  </div>
                  <div className="text-sm font-mono text-slate-200">
                    {profile.email || 'N/A'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <FiBriefcase size={14} className="text-cyan-400" />
                    <span>Department / Unit</span>
                  </div>
                  <div className="text-sm text-slate-200">
                    {profile.department || 'DFIR Incident Response'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <FiPhone size={14} className="text-cyan-400" />
                    <span>Contact Phone</span>
                  </div>
                  <div className="text-sm text-slate-200">
                    {profile.phone || 'Not provided'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <FiCalendar size={14} className="text-cyan-400" />
                    <span>Account Created</span>
                  </div>
                  <div className="text-sm text-slate-200">
                    {formatDate(profile.createdAt)}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/80 md:col-span-2">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <FiClock size={14} className="text-cyan-400" />
                    <span>Last Profile Update</span>
                  </div>
                  <div className="text-sm text-slate-200">
                    {formatDate(profile.updatedAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Change Password Card */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                  <FiLock className="text-cyan-400" />
                  Change Password
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your authentication clearance key.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <FiAlertCircle size={14} className="shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <FiCheckCircle size={14} className="shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white"
                      placeholder="Current password"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      New Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white"
                      placeholder="Min. 8 chars"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passwordSubmitting}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <FiSave size={14} />
                    <span>{passwordSubmitting ? 'Updating...' : 'Change Password'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Assigned Cases Section */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                    <FiFolder className="text-cyan-400" />
                    Assigned Cases
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Active investigation cases assigned to this operator.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/cases')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  View All Cases &rarr;
                </button>
              </div>

              {casesLoading ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Loading assigned cases...
                </div>
              ) : assignedCases.length === 0 ? (
                <div className="py-6 text-center rounded-lg bg-slate-950/30 border border-dashed border-slate-800 text-slate-400 text-xs">
                  <FiFolder size={20} className="mx-auto mb-1.5 text-slate-600" />
                  <span>No assigned cases yet.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {assignedCases.map((c) => (
                    <div
                      key={c._id || c.caseId}
                      onClick={() => navigate(`/cases/${c._id || c.caseId}`)}
                      className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 hover:border-cyan-500/40 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-semibold text-cyan-400">
                          {c.caseId || `#${c._id.slice(-6)}`}
                        </span>
                        <span className="text-xs text-slate-200 font-medium">{c.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {c.status || 'Active'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/40">
                          {c.severity || 'Medium'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Incident Activity */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                    <FiActivity className="text-cyan-400" />
                    Recent Activity
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Audit log events executed under this operator clearance.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/audit-logs')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  View Audit Logs &rarr;
                </button>
              </div>

              {activityLoading ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Loading recent activity...
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="py-6 text-center rounded-lg bg-slate-950/30 border border-dashed border-slate-800 text-slate-400 text-xs">
                  <FiActivity size={20} className="mx-auto mb-1.5 text-slate-600" />
                  <span>No recent activity.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentActivity.map((log) => (
                    <div
                      key={log._id}
                      className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {log.action}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {log.details || log.targetType || 'Activity logged'}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FiEdit2 className="text-cyan-400" />
                Edit Operator Profile
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white"
                  placeholder="e.g. AKASH C"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Department / Organization Unit
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white"
                  placeholder="e.g. DFIR Incident Response"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white"
                  placeholder="e.g. +1 (555) 019-2834"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Profile Avatar URL
                </label>
                <input
                  type="url"
                  value={editForm.profileImage}
                  onChange={(e) => setEditForm({ ...editForm, profileImage: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <FiSave size={14} />
                  <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
