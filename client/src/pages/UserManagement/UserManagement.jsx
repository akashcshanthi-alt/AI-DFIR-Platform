import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  User, 
  Shield, 
  Slash, 
  CheckCircle, 
  Trash2, 
  Loader2, 
  Edit3, 
  X,
  AlertTriangle,
  Award
} from 'lucide-react';
import { userService } from '../../services/user.service';
import './UserManagement.css';

export default function UserManagement() {
  const navigate = useNavigate();

  // Guard verification checks
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';
  const myRole = localStorage.getItem('operatorRole') || '';
  const isPrivileged = myRole === 'Admin' || myRole === 'Super Admin';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    } else if (!isPrivileged) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasSession, isPrivileged, navigate]);

  // Query state parameters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 8;

  // Database results state
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive modal drawers states
  const [toastMsg, setToastMsg] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', department: '', phone: '' });
  const [isActionLoading, setIsActionLoading] = useState(false);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await userService.getUsers({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        page: currentPage,
        limit
      });
      setUsers(res.data || []);
      setPagination({
        total: res.pagination?.total || 0,
        pages: res.pagination?.pages || 1
      });
    } catch (err) {
      console.error('[UserManagement] Fetch error:', err);
      setError(err.message || 'Connection to the user registry failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasSession && isPrivileged) {
      fetchUsers();
    }
  }, [currentPage, roleFilter, statusFilter, hasSession, isPrivileged]);

  if (!hasSession || !isPrivileged) return null;

  // Search Go button
  const handleSearchGo = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  // Details dialog trigger
  const handleOpenDetails = async (user) => {
    try {
      setIsActionLoading(true);
      const details = await userService.getUserById(user.userId);
      setSelectedUser(details);
      setEditForm({
        fullName: details.fullName || '',
        department: details.department || '',
        phone: details.phone || ''
      });
      setIsEditing(false);
    } catch (err) {
      triggerToast(`Failed to load details: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Save detailed changes (PUT)
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!selectedUser || isActionLoading) return;
    try {
      setIsActionLoading(true);
      const updated = await userService.updateUser(selectedUser.userId, editForm);
      setSelectedUser(updated);
      setIsEditing(false);
      triggerToast('Operator details updated successfully.');
      fetchUsers();
    } catch (err) {
      triggerToast(`Update failed: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Change Operator Role (PUT /role)
  const handleRoleChange = async (userId, newRole) => {
    try {
      setIsActionLoading(true);
      const updated = await userService.updateUserRole(userId, newRole);
      if (selectedUser && selectedUser.userId === userId) {
        setSelectedUser(updated);
      }
      triggerToast(`Operator role updated to ${newRole}.`);
      fetchUsers();
    } catch (err) {
      triggerToast(`Role change rejected: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Toggle Operator Status (PUT /status)
  const handleStatusToggle = async (userObj) => {
    const nextStatus = userObj.accountStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      setIsActionLoading(true);
      const updated = await userService.updateUserStatus(userObj.userId, nextStatus);
      if (selectedUser && selectedUser.userId === userObj.userId) {
        setSelectedUser(updated);
      }
      triggerToast(`Operator account is now ${nextStatus}.`);
      fetchUsers();
    } catch (err) {
      triggerToast(`Status update rejected: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete Operator Account (DELETE)
  const handleDeleteUser = async (userObj) => {
    if (!window.confirm(`Permanently remove operator ${userObj.fullName} (${userObj.userId})?`)) {
      return;
    }
    try {
      setIsActionLoading(true);
      await userService.deleteUser(userObj.userId);
      setSelectedUser(null);
      triggerToast('Operator account removed from system registry.');
      fetchUsers();
    } catch (err) {
      triggerToast(`Deletion failed: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="trace-users-layout min-h-screen text-on-surface select-none font-body-md grid-bg-users relative">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#47faf3] text-[#47faf3] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          {toastMsg}
        </div>
      )}

      <div className="p-6 space-y-6">

        {/* Title Header */}
        <div className="flex flex-col text-left mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Operator Workspace Catalog</h1>
          <p className="text-xs text-[#cbd5e1]/50 mt-0.5">Admin console managing clearance, access levels, and organizational scopes.</p>
        </div>

        {/* Filters Toolbar */}
        <section className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#121928]/90 border border-white/5 p-4 rounded-2xl relative shadow-lg">
          <form onSubmit={handleSearchGo} className="relative flex-1 max-w-sm flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 bg-[#050814] border border-white/10 rounded-lg px-4 text-xs text-white placeholder:text-[#cbd5e1]/30 focus:border-[#00E5FF]/40 outline-none"
              placeholder="Search user, name, email, scope..."
            />
            <button type="submit" className="ml-2 px-3 py-1 bg-white/5 text-[10px] uppercase font-bold tracking-wider hover:bg-white/10 rounded text-white h-9">
              Go
            </button>
          </form>

          <div className="flex items-center gap-3 justify-end text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="text-white/40 uppercase text-[9px] tracking-wider">Role</span>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="bg-[#050814] border border-white/10 rounded px-2.5 py-1 text-xs text-[#cbd5e1] outline-none"
              >
                <option value="All">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Investigator">Investigator</option>
                <option value="Analyst">Analyst</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-white/40 uppercase text-[9px] tracking-wider">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-[#050814] border border-white/10 rounded px-2.5 py-1 text-xs text-[#cbd5e1] outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </section>

        {/* Core Layout Split */}
        <div className="grid grid-cols-12 gap-6 items-start">

          {/* TABLE PANEL */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <section className="bg-[#121928]/60 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-[440px] justify-between">
              
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0f1423]/70 text-[#cbd5e1]/50 text-[10px] uppercase font-bold tracking-wider border-b border-white/5">
                    <tr>
                      <th scope="col" className="px-4 py-3">Operator ID</th>
                      <th scope="col" className="px-4 py-3">Full Name</th>
                      <th scope="col" className="px-4 py-3">Role</th>
                      <th scope="col" className="px-4 py-3">Department</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                      <th scope="col" className="px-4 py-3 text-right pr-4">Triage Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5 font-medium">
                    {isLoading ? (
                      Array.from({ length: limit }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse bg-white/[0.01]">
                          <td className="px-4 py-4"><div className="h-3 bg-white/10 rounded w-20"></div></td>
                          <td className="px-4 py-4"><div className="h-3 bg-white/10 rounded w-28"></div></td>
                          <td className="px-4 py-4"><div className="h-3 bg-white/10 rounded w-20"></div></td>
                          <td className="px-4 py-4"><div className="h-3 bg-white/10 rounded w-24"></div></td>
                          <td className="px-4 py-4"><div className="h-4 bg-white/10 rounded w-16"></div></td>
                          <td className="px-4 py-4 text-right pr-4"><div className="h-6 bg-white/10 rounded w-14 inline-block"></div></td>
                        </tr>
                      ))
                    ) : error ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-16 text-center text-red-400">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400 animate-bounce" />
                          <span>Registry link failure: {error}</span>
                        </td>
                      </tr>
                    ) : users.length > 0 ? (
                      users.map((u) => {
                        const isSuspended = u.accountStatus?.toLowerCase() === 'suspended';
                        const isActive = u.accountStatus?.toLowerCase() === 'active';
                        return (
                          <tr 
                            key={u._id} 
                            onClick={() => handleOpenDetails(u)}
                            className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedUser?.userId === u.userId ? 'bg-white/[0.03]' : ''} ${isSuspended ? 'bg-red-500/[0.01]' : ''}`}
                          >
                            <td className="px-4 py-3.5 font-mono text-[#00E5FF] font-semibold">{u.userId}</td>
                            <td className="px-4 py-3.5 text-white font-bold">{u.fullName}</td>
                            <td className="px-4 py-3.5">
                              <span className="bg-[#00E5FF]/5 border border-[#00E5FF]/20 px-2 py-0.5 rounded text-[10px] text-[#00E5FF] font-semibold">
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-[#cbd5e1]/70">{u.department || 'N/A'}</td>
                            <td className="px-4 py-3.5">
                              <span className={`flex items-center gap-1.5 text-[10px] font-bold ${
                                isActive ? 'text-[#10b981]' : isSuspended ? 'text-[#ef4444]' : 'text-yellow-500'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-[#10b981]' : isSuspended ? 'bg-[#ef4444]' : 'bg-yellow-500'
                                }`} />
                                {u.accountStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleStatusToggle(u)}
                                  className={`px-2 py-0.5 border text-[9px] font-bold rounded ${
                                    isActive 
                                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                  }`}
                                  title={isActive ? 'Suspend User' : 'Activate User'}
                                >
                                  {isActive ? 'Suspend' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1 text-[#cbd5e1] hover:text-red-400 border border-transparent hover:border-red-500/20 rounded"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-16 text-center text-outline text-[#cbd5e1]/40">
                          <User className="w-12 h-12 mx-auto mb-2 text-white/5" />
                          <span>No security operators cataloged matching criteria.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!error && users.length > 0 && (
                <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between text-xs text-[#cbd5e1]/40 select-none">
                  <span className="font-semibold">
                    Page {currentPage} of {pagination.pages}
                  </span>
                  
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || isLoading}
                      className="px-3 py-1 bg-white/5 border border-white/5 rounded text-white disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                      disabled={currentPage === pagination.pages || isLoading}
                      className="px-3 py-1 bg-white/5 border border-white/5 rounded text-white disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* DETAILS/ACTION PANEL */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            {!selectedUser ? (
              <div className="glass-panel p-8 text-center text-outline text-[#cbd5e1]/40 rounded-2xl min-h-[300px] flex flex-col justify-center items-center gap-3">
                <Shield className="w-12 h-12 text-white/5 animate-pulse" />
                <p className="text-xs font-semibold">Select an analyst workspace in the list queue to manage credentials, clearance, or permissions.</p>
              </div>
            ) : (
              <section className="glass-panel p-6 rounded-2xl relative overflow-hidden text-left space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#00E5FF]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Operator Profile</h3>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-white/5 rounded text-[#cbd5e1]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full border border-[#00E5FF]/20 flex items-center justify-center bg-[#070c16] text-[#00E5FF] font-bold text-lg">
                    {selectedUser.fullName?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{selectedUser.fullName}</h4>
                    <p className="text-[10px] font-mono text-[#cbd5e1]/50 mt-0.5">{selectedUser.userId}</p>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#00E5FF] mt-1 block">
                      {selectedUser.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-xs border-b border-white/[0.03] pb-2">
                    <span className="text-[#cbd5e1]/50">Status</span>
                    <span className="font-bold text-white">{selectedUser.accountStatus}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-white/[0.03] pb-2">
                    <span className="text-[#cbd5e1]/50">Clearance Email</span>
                    <span className="font-mono text-white truncate max-w-[200px]" title={selectedUser.email}>{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-white/[0.03] pb-2">
                    <span className="text-[#cbd5e1]/50">Joined On</span>
                    <span className="font-mono text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Edit Form / Dynamic Fields */}
                {isEditing ? (
                  <form onSubmit={handleSaveDetails} className="space-y-4 pt-2 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#cbd5e1]/50">Full Name</label>
                      <input 
                        type="text" 
                        value={editForm.fullName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full bg-[#050814] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#cbd5e1]/50">Department</label>
                      <input 
                        type="text" 
                        value={editForm.department}
                        onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full bg-[#050814] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#cbd5e1]/50">Phone</label>
                      <input 
                        type="text" 
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-[#050814] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                      <button 
                        type="button" 
                        onClick={() => setIsEditing(false)} 
                        className="px-3 py-1.5 bg-white/5 rounded text-xs text-white"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isActionLoading}
                        className="px-3 py-1.5 bg-[#00E5FF] text-black font-bold rounded text-xs"
                      >
                        Save Details
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    
                    {/* Role selector change dropdown */}
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-[#cbd5e1]/50 uppercase text-[9px] tracking-wider mb-1">Adjust Role Permission</span>
                      <select 
                        value={selectedUser.role} 
                        onChange={(e) => handleRoleChange(selectedUser.userId, e.target.value)}
                        disabled={isActionLoading}
                        className="bg-[#050814] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Admin">Admin</option>
                        <option value="Investigator">Investigator</option>
                        <option value="Analyst">Analyst</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        disabled={isActionLoading}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => handleStatusToggle(selectedUser)}
                        disabled={isActionLoading}
                        className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-xs font-semibold ${
                          selectedUser.accountStatus === 'Active'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        <Slash className="w-3.5 h-3.5" />
                        {selectedUser.accountStatus === 'Active' ? 'Suspend User' : 'Activate User'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(selectedUser)}
                        disabled={isActionLoading}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Account
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </aside>

        </div>

      </div>
    </div>
  );
}
