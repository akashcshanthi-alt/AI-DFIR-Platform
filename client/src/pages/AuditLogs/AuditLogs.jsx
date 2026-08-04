import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Filter, Download, Shield, AlertTriangle, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { auditService } from '../../services/audit.service';

const severityStyles = {
  Low: 'px-2 py-0.5 rounded bg-blue-500/10 text-[#3b82f6] text-[10px] font-bold border border-blue-500/20',
  Medium: 'px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[10px] font-bold border border-yellow-500/20',
  High: 'px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[10px] font-bold border border-orange-500/20',
  Critical: 'px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20',
  LOW: 'px-2 py-0.5 rounded bg-blue-500/10 text-[#3b82f6] text-[10px] font-bold border border-blue-500/20',
  MEDIUM: 'px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[10px] font-bold border border-yellow-500/20',
  HIGH: 'px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[10px] font-bold border border-orange-500/20',
  CRITICAL: 'px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20'
};

const defaultAvatars = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
];

export default function AuditLogs() {
  const navigate = useNavigate();

  // Guard verification check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Query state parameters
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Toggle drawers
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Live database results state
  const [logs, setLogs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dynamicUsers, setDynamicUsers] = useState([]);
  const [dynamicModules, setDynamicModules] = useState([]);

  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Periodic Telemetry logs simulation array
  const [streamEvents, setStreamEvents] = useState([
    { time: '14:25:01', type: 'secondary', message: 'Auth service: Token validated successfully for user \'admin\'' },
    { time: '14:24:58', type: 'tertiary', message: 'Core Cluster Node: IO latency threshold high (420ms) detected' },
    { time: '14:24:50', type: 'outline', message: 'API Service request: GET /api/dashboard/overview' },
    { time: '14:24:32', type: 'error', message: 'FIREWALL ALERT: Brute force gateway attack signature blocked' }
  ]);

  // Periodically generate simulated live stream log events for design aesthetics
  useEffect(() => {
    const interval = setInterval(() => {
      const types = ['primary', 'secondary', 'tertiary', 'error'];
      const selectedType = types[Math.floor(Math.random() * types.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      
      let message = '';
      switch (selectedType) {
        case 'primary':
          message = 'Database audit query execution triggered for Case index #DF-1002';
          break;
        case 'secondary':
          message = 'Background EDR surveillance scans successfully completed on local subnet';
          break;
        case 'tertiary':
          message = 'Network interface configuration change registered on module FIREWALL';
          break;
        case 'error':
          message = 'SECURITY WARNING: Repeated API key access rejection on auth controller';
          break;
        default:
          message = 'Host agent health checks complete';
      }

      setStreamEvents(prev => [{ time: timeStr, type: selectedType, message }, ...prev.slice(0, 5)]);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // Fetch paginated records from Mongoose
  const fetchAuditLogs = async () => {
    try {
      setIsFetching(true);
      setError(null);
      const params = {
        search: searchTerm,
        user: userFilter,
        status: statusFilter,
        severity: severityFilter,
        module: moduleFilter,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        page: currentPage,
        limit
      };

      const result = await auditService.getAuditLogs(params);
      setLogs(result.logs || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalCount(result.pagination?.total || 0);

      // Save dynamic dropdown inputs from DB
      if (result.filters?.users) setDynamicUsers(result.filters.users);
      if (result.filters?.modules) setDynamicModules(result.filters.modules);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to download audit logs.');
    } finally {
      setIsFetching(false);
    }
  };

  // Re-fetch triggers
  useEffect(() => {
    if (hasSession) {
      fetchAuditLogs();
    }
  }, [
    currentPage,
    userFilter,
    statusFilter,
    severityFilter,
    moduleFilter,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    hasSession
  ]);

  // Reset pagination on text changes
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setCurrentPage(1);
      fetchAuditLogs();
    }
  };

  const handleSearchTrigger = () => {
    setCurrentPage(1);
    fetchAuditLogs();
  };

  // Export CSV / PDF
  const triggerExport = async (format) => {
    try {
      setShowExportMenu(false);
      setToastMsg(`Preparing ${format.toUpperCase()} export payload...`);
      const filters = {
        search: searchTerm,
        user: userFilter,
        status: statusFilter,
        severity: severityFilter,
        module: moduleFilter,
        startDate,
        endDate
      };

      const blob = await auditService.exportAuditLogs(format, filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trace-audit-logs-${new Date().getTime()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setToastMsg(`Logs exported successfully.`);
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setToastMsg(`Export failed: ${err.message}`);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  // Deletion logic
  const handleDeleteLog = async (id) => {
    try {
      setToastMsg('Removing audit log entry...');
      await auditService.deleteAuditLog(id);
      setSelectedLog(null);
      setDeleteConfirmId(null);
      setToastMsg('Audit log successfully deleted.');
      setTimeout(() => setToastMsg(''), 3000);
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      setToastMsg(`Delete failed: ${err.message}`);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const selectLogDetails = async (id) => {
    try {
      const data = await auditService.getAuditLogById(id);
      setSelectedLog(data);
    } catch (err) {
      console.error(err);
      setToastMsg(`Failed to load details: ${err.message}`);
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  // Formatters
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
  };

  // Skeletons
  const renderSkeletons = () => (
    Array.from({ length: limit }).map((_, idx) => (
      <tr key={idx} className="animate-pulse border-b border-white/5 bg-white/[0.01]">
        <td className="px-4 py-4"><div className="h-3.5 bg-white/10 rounded w-28"></div></td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/10"></div>
            <div className="h-3 bg-white/10 rounded w-16"></div>
          </div>
        </td>
        <td className="px-4 py-4"><div className="h-3.5 bg-white/10 rounded w-44"></div></td>
        <td className="px-4 py-4"><div className="h-5 bg-white/10 rounded w-16"></div></td>
        <td className="px-4 py-4"><div className="h-3.5 bg-white/10 rounded w-24"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-white/10 rounded w-6"></div></td>
        <td className="px-4 py-4"><div className="h-3.5 bg-white/10 rounded w-12"></div></td>
        <td className="px-4 py-4"><div className="h-5 bg-white/10 rounded w-12"></div></td>
        <td className="px-4 py-4 text-right"><div className="h-6 bg-white/10 rounded w-14 inline-block"></div></td>
      </tr>
    ))
  );

  if (!hasSession) return null;

  return (
    <div className="trace-audit-layout min-h-screen text-on-surface font-body-md grid-bg-audit selection:bg-secondary/30 selection:text-secondary">
      
      {/* Dynamic CSS Definitions */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .glass-panel {
              background: rgba(15, 20, 35, 0.6);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 255, 255, 0.05);
              border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          .custom-scrollbar::-webkit-scrollbar {
              width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.02);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(71, 250, 243, 0.2);
              border-radius: 10px;
          }
          .grid-bg-audit {
              background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0);
              background-size: 24px 24px;
          }
          .trace-audit-row-btn {
              padding: 4px 10px;
              background-color: rgba(59, 130, 246, 0.1);
              color: #3b82f6;
              border: 1px solid rgba(59, 130, 246, 0.2);
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
          }
          .trace-audit-row-btn:hover {
              background-color: rgba(59, 130, 246, 0.2);
              border-color: #3b82f6;
              color: #ffffff;
          }
          .trace-soc-toolbar {
              background: rgba(18, 25, 40, 0.9) !important;
              backdrop-filter: blur(12px) !important;
              border: 1px solid rgba(255, 255, 255, 0.05) !important;
              border-radius: 16px !important;
              box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3) !important;
              padding: 16px 24px !important;
          }
          .trace-soc-search-wrapper {
              position: relative;
              flex: 1;
              max-width: 400px;
              display: flex;
              align-items: center;
          }
          .trace-soc-search-icon {
              position: absolute;
              left: 14px;
              color: #cbd5e1;
              opacity: 0.5;
              display: flex;
              align-items: center;
          }
          .trace-soc-search-input {
              width: 100% !important;
              height: 38px !important;
              background-color: #050814 !important;
              border: 1px solid rgba(255, 255, 255, 0.08) !important;
              border-radius: 8px !important;
              padding: 0 16px 0 40px !important;
              color: #FFFFFF !important;
              font-size: 0.825rem !important;
              outline: none !important;
              transition: all 0.2s ease !important;
              box-sizing: border-box !important;
          }
          .trace-soc-search-input:focus {
              border-color: rgba(71, 250, 243, 0.4) !important;
              box-shadow: 0 0 10px rgba(71, 250, 243, 0.15) !important;
          }
          .trace-soc-badge-live {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(71, 250, 243, 0.06) !important;
              border: 1px solid rgba(71, 250, 243, 0.15) !important;
              color: #47faf3 !important;
              border-radius: 20px !important;
              padding: 0 12px !important;
              height: 32px !important;
              font-size: 0.7rem !important;
              font-weight: 700 !important;
              letter-spacing: 0.05em;
          }
          .trace-soc-dot-cyan {
              width: 6px;
              height: 6px;
              background-color: #47faf3 !important;
              border-radius: 50%;
              box-shadow: 0 0 6px #47faf3 !important;
          }
          .trace-soc-btn-filter {
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 6px !important;
              background-color: rgba(15, 20, 35, 0.8) !important;
              border: 1px solid rgba(255, 255, 255, 0.08) !important;
              color: #CBD5E1 !important;
              border-radius: 8px !important;
              padding: 0 12px !important;
              height: 34px !important;
              font-size: 0.75rem !important;
              font-weight: 600 !important;
              cursor: pointer !important;
              transition: all 0.2s ease !important;
          }
          .trace-soc-btn-filter:hover, .trace-soc-btn-filter.active {
              background-color: rgba(71, 250, 243, 0.08) !important;
              border-color: #47faf3 !important;
              color: #47faf3 !important;
          }
          .trace-soc-btn-export {
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 6px !important;
              background-color: #3b82f6 !important;
              color: #ffffff !important;
              border-radius: 8px !important;
              padding: 0 12px !important;
              height: 34px !important;
              font-size: 0.75rem !important;
              font-weight: 600 !important;
              cursor: pointer !important;
              transition: all 0.2s ease !important;
              border: none !important;
          }
          .trace-soc-btn-export:hover {
              background-color: #2563eb !important;
          }
          .trace-pagination-btn {
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 5px 12px !important;
              background: rgba(15, 20, 35, 0.8) !important;
              border: 1px solid rgba(255, 255, 255, 0.05) !important;
              color: #94a3b8 !important;
              border-radius: 6px !important;
              font-size: 0.7rem !important;
              font-weight: 600 !important;
              cursor: pointer !important;
              transition: all 0.15s ease !important;
          }
          .trace-pagination-btn:hover:not(:disabled) {
              border-color: rgba(71, 250, 243, 0.3) !important;
              color: #47faf3 !important;
          }
          .trace-pagination-btn.active {
              background: #3b82f6 !important;
              border-color: transparent !important;
              color: #ffffff !important;
          }
          .trace-pagination-btn:disabled {
              opacity: 0.35 !important;
              cursor: not-allowed !important;
          }
        `
      }} />

      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#47faf3] text-[#47faf3] text-[11px] px-4 py-2.5 rounded-lg shadow-2xl font-bold whitespace-nowrap">
          {toastMsg}
        </div>
      )}

      {/* Main Page Layout Wrapper */}
      <div className="p-6 space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col text-left select-none">
          <h1 className="text-xl font-bold text-white tracking-tight">Security Audit Logging Trail</h1>
          <p className="text-xs text-[#cbd5e1]/50 mt-0.5">SOC Compliance logging infrastructure verifying authorization trails.</p>
        </div>

        {/* Toolbar: Search, Filters Trigger, Exports */}
        <section className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 trace-soc-toolbar relative">
          <div className="trace-soc-search-wrapper">
            <span className="trace-soc-search-icon"><Search className="w-4 h-4" /></span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="trace-soc-search-input font-medium"
              placeholder="Search user, action, IP, module..."
            />
            {searchTerm && (
              <button 
                type="button"
                className="absolute right-3 text-outline hover:text-white"
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSearchTrigger}
              className="ml-2 px-3 py-1 bg-surface-bright rounded text-[10px] uppercase font-bold tracking-wider hover:bg-white/10"
            >
              Go
            </button>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <div className="trace-soc-badge-live">
              <span className="trace-soc-dot-cyan animate-ping"></span>
              <span>LIVE UPLINK ACTIVE</span>
            </div>
            
            <button 
              type="button" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`trace-soc-btn-filter ${showAdvanced ? 'active' : ''}`}
            >
              <Filter className="w-3.5 h-3.5" />
              Advanced Filters
            </button>

            <div className="relative">
              <button 
                type="button" 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="trace-soc-btn-export"
              >
                <Download className="w-3.5 h-3.5" />
                Export logs
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 z-50 bg-[#0f1423] border border-white/10 rounded-lg shadow-2xl p-1.5 w-36 flex flex-col gap-1">
                  <button 
                    type="button"
                    onClick={() => triggerExport('csv')}
                    className="w-full text-left px-3 py-1.5 rounded hover:bg-white/5 text-xs text-[#cbd5e1] font-semibold"
                  >
                    Export as CSV
                  </button>
                  <button 
                    type="button"
                    onClick={() => triggerExport('pdf')}
                    className="w-full text-left px-3 py-1.5 rounded hover:bg-white/5 text-xs text-[#cbd5e1] font-semibold"
                  >
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Collapsible Advanced Filters Section */}
        {showAdvanced && (
          <section className="glass-panel rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs select-none">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline text-[#cbd5e1]/50">Severity</span>
              <select
                value={severityFilter}
                onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
                className="w-full h-9 bg-black/40 border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Severities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline text-[#cbd5e1]/50">Module</span>
              <select
                value={moduleFilter}
                onChange={(e) => { setModuleFilter(e.target.value); setCurrentPage(1); }}
                className="w-full h-9 bg-black/40 border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Modules</option>
                {dynamicModules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline text-[#cbd5e1]/50">Date Range</span>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="w-1/2 h-9 bg-black/40 border border-white/10 rounded px-2 text-xs text-white focus:outline-none"
                />
                <span className="text-outline text-white/40">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="w-1/2 h-9 bg-black/40 border border-white/10 rounded px-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline text-[#cbd5e1]/50">Sorting Parameters</span>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                  className="w-1/2 h-9 bg-black/40 border border-white/10 rounded px-2 text-xs text-white focus:outline-none"
                >
                  <option value="timestamp">Timestamp</option>
                  <option value="user">User</option>
                  <option value="action">Action</option>
                  <option value="severity">Severity</option>
                  <option value="status">Status</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                  className="w-1/2 h-9 bg-black/40 border border-white/10 rounded px-2 text-xs text-white focus:outline-none"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Primary Log Trail Table Panel Grid */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-9 space-y-6">
            
            <section className="glass-panel rounded-xl overflow-hidden flex flex-col justify-between min-h-[400px]">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01] select-none">
                <h4 className="font-bold text-xs tracking-wider flex items-center gap-2 uppercase text-white/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
                  Recent Security Audit Trail
                </h4>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="text-outline text-white/40 uppercase text-[10px]">User:</span>
                      <select
                        value={userFilter}
                        onChange={(e) => { setUserFilter(e.target.value); setCurrentPage(1); }}
                        className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-xs text-[#cbd5e1] focus:outline-none"
                      >
                        <option value="All">All Operators</option>
                        {dynamicUsers.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="text-outline text-white/40 uppercase text-[10px]">Status:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-xs text-[#cbd5e1] focus:outline-none"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={fetchAuditLogs}
                    className="p-1.5 hover:bg-white/5 rounded text-outline hover:text-white"
                    title="Refresh data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#47faf3]' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Table Body Viewport */}
              <div className="overflow-x-auto w-full flex-grow">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead className="bg-[#0f1423]/70 text-[#cbd5e1]/50 text-[10px] uppercase font-bold tracking-wider border-b border-white/5 select-none">
                    <tr>
                      <th scope="col" className="px-4 py-3">Timestamp (UTC)</th>
                      <th scope="col" className="px-4 py-3">User</th>
                      <th scope="col" className="px-4 py-3">Action</th>
                      <th scope="col" className="px-4 py-3">Module</th>
                      <th scope="col" className="px-4 py-3">IP Address</th>
                      <th scope="col" className="px-4 py-3">Device</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                      <th scope="col" className="px-4 py-3">Severity</th>
                      <th scope="col" className="px-4 py-3 text-right pr-4">Details</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-white/5 font-medium">
                    {isFetching ? (
                      renderSkeletons()
                    ) : error ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-red-400">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400 animate-bounce" />
                          <span>Error loading audit logs: {error}</span>
                        </td>
                      </tr>
                    ) : logs.length > 0 ? (
                      logs.map((log) => {
                        const isFailed = log.status.toLowerCase() === 'failed';
                        const avatarIndex = Math.abs(log.user.charCodeAt(0) || 0) % defaultAvatars.length;
                        return (
                          <tr 
                            key={log.logId} 
                            className={`hover:bg-white/[0.02] transition-colors ${isFailed ? 'bg-red-500/[0.02]' : ''}`}
                          >
                            <td className="px-4 py-3.5 font-mono text-[#47faf3] opacity-80 whitespace-nowrap">
                              {formatDate(log.timestamp)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                  <img className="w-full h-full object-cover select-none" src={defaultAvatars[avatarIndex]} alt={log.user} />
                                </div>
                                <span className="font-bold text-white text-[11px]">{log.user}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-white max-w-[200px] truncate" title={log.action}>
                              {log.action}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 font-mono text-[9px] text-[#cbd5e1]/70">
                                {log.module}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[#cbd5e1]/70">{log.ipAddress || log.ip}</td>
                            <td className="px-4 py-3.5 text-outline text-[#cbd5e1]/55 uppercase text-[9px] font-mono">{log.device || 'Web'}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`flex items-center gap-1 text-[10px] font-bold ${isFailed ? 'text-[#ffb4ab]' : 'text-[#10b981]'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isFailed ? 'bg-[#ffb4ab]' : 'bg-[#10b981]'}`} />
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={severityStyles[log.severity] || severityStyles.Low}>
                                {log.severity}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right pr-4">
                              <button
                                type="button"
                                onClick={() => selectLogDetails(log.logId)}
                                className="trace-audit-row-btn"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-16 text-center text-outline select-none">
                          <Shield className="w-12 h-12 mx-auto mb-3 text-white/10" />
                          <p className="text-xs text-[#cbd5e1]/40 font-bold uppercase tracking-wider">No audit logs indexed matching criteria</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Pagination Controls */}
              {!error && logs.length > 0 && (
                <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#cbd5e1]/40 select-none">
                  <span className="font-semibold">
                    Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, totalCount)} of {totalCount} records
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || isFetching}
                      className="trace-pagination-btn"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`trace-pagination-btn ${currentPage === page ? 'active' : ''}`}
                        disabled={isFetching}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || isFetching}
                      className="trace-pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Bottom Stream Telemetry logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
              
              <section className="glass-panel rounded-xl h-80 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <h4 className="font-bold text-xs tracking-wider text-white/90 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                    LOG STREAM TELEMETRY
                  </h4>
                  <span className="text-[8px] font-mono text-outline text-[#47faf3]">SOC_WEBSOCKET_UPLINK</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar font-mono text-[10.5px]">
                  {streamEvents.map((evt, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-left">
                      <span className="text-[#cbd5e1]/40 shrink-0 font-bold">{evt.time}</span>
                      <span className="text-[#cbd5e1] leading-relaxed break-words">{evt.message}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="glass-panel rounded-xl h-80 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                  <h4 className="font-bold text-xs tracking-wider text-white/90 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    OPERATIONAL SLA METRICS
                  </h4>
                </div>
                <div className="flex-1 p-5 flex flex-col gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>Index Verification Speed</span>
                      <span className="text-[#47faf3]">99.8%</span>
                    </div>
                    <div className="w-full bg-[#050814] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#47faf3] h-full w-[99.8%]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>Query Response Threshold</span>
                      <span className="text-secondary">42ms</span>
                    </div>
                    <div className="w-full bg-[#050814] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full w-[85%]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>Security Policy Coverage</span>
                      <span className="text-[#10b981]">100%</span>
                    </div>
                    <div className="w-full bg-[#050814] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#10b981] h-full w-[100%]" />
                    </div>
                  </div>
                </div>
              </section>

            </div>

          </div>

          {/* Right Column: AI Risk Scoring */}
          <aside className="col-span-12 lg:col-span-3 space-y-6 select-none">
            
            <section className="glass-panel rounded-xl p-4 border-t-2 border-t-secondary relative overflow-hidden">
              <h4 className="text-[10px] font-bold text-outline uppercase tracking-wider text-[#cbd5e1]/55 mb-4">
                AI RISK INDEX
              </h4>
              <div className="flex items-center justify-center py-2">
                <div className="relative w-28 h-28 flex items-center justify-center rounded-full border border-white/5 bg-black/20">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="6" />
                    <circle cx="50" cy="50" r="42" fill="transparent" stroke="#47faf3" strokeWidth="6" strokeDasharray={263.8} strokeDashoffset={263.8 - (263.8 * 72) / 100} strokeLinecap="round" />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-white font-mono">72</span>
                    <span className="text-[8px] text-outline text-[#cbd5e1]/40 font-bold mt-0.5">ELEVATED</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-center text-[#cbd5e1]/60 leading-relaxed mt-2.5 px-2">
                Current system risk index is elevated. Multiple login verification failures recorded in module CORE_AUTH.
              </p>
            </section>

            <section className="glass-panel rounded-xl p-5">
              <h4 className="text-[10px] font-bold text-outline uppercase tracking-wider text-[#cbd5e1]/55 mb-4">
                ANOMALIES FLAGGED
              </h4>
              <div className="space-y-3.5">
                <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-lg text-left">
                  <p className="text-[11px] font-bold text-red-400">Multiple Failed Logins</p>
                  <p className="text-[10.5px] text-[#cbd5e1]/65 mt-1 leading-snug">IP 198.51.100.99 attempted 12 privilege escalate logs in 3s.</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-3.5 rounded-lg text-left">
                  <p className="text-[11px] font-bold text-[#cbd5e1]">Credential Scan Drill</p>
                  <p className="text-[10.5px] text-[#cbd5e1]/50 mt-1 leading-snug">User 's.keller' adjusted system config keys outside core hours.</p>
                </div>
              </div>
            </section>

          </aside>

        </div>

      </div>

      {/* Details View Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-filter backdrop-blur-sm select-none p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#47faf3] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#47faf3] animate-pulse"></span>
                Audit Details: {selectedLog.logId || selectedLog.eventId}
              </h3>
              <button 
                type="button" 
                onClick={() => { setSelectedLog(null); setDeleteConfirmId(null); }}
                className="p-1 hover:bg-white/10 rounded-full text-[#cbd5e1] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left text-xs max-h-[450px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[#cbd5e1]/45 text-[9px] uppercase tracking-wider font-bold">Timestamp (UTC)</span>
                  <p className="text-white font-mono font-semibold">{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#cbd5e1]/45 text-[9px] uppercase tracking-wider font-bold">Action Event</span>
                  <p className="text-white font-semibold">{selectedLog.action}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#cbd5e1]/45 text-[9px] uppercase tracking-wider font-bold">Operator Profile</span>
                  <p className="text-white font-bold">{selectedLog.user} ({selectedLog.role})</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#cbd5e1]/45 text-[9px] uppercase tracking-wider font-bold">Source Session IP</span>
                  <p className="text-white font-mono font-semibold">{selectedLog.ipAddress || selectedLog.ip}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#cbd5e1]/45 text-[9px] uppercase tracking-wider font-bold">Module Path</span>
                  <p className="text-[#3b82f6] font-mono font-bold">{selectedLog.module}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#cbd5e1]/45 text-[9px] uppercase tracking-wider font-bold">Affected Resource</span>
                  <p className="text-white font-semibold">{selectedLog.resource || 'Global'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#cbd5e1]/45 text-[9px] uppercase tracking-wider font-bold">Client User-Agent</span>
                  <p className="text-[#cbd5e1] font-mono">{selectedLog.browser || 'Chrome 122'} ({selectedLog.device || 'desktop'})</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#cbd5e1]/45 text-[9px] uppercase tracking-wider font-bold">Execution Severity</span>
                  <p className="text-white">
                    <span className={severityStyles[selectedLog.severity] || severityStyles.Low}>
                      {selectedLog.severity}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-1 border-t border-white/5 pt-3">
                <span className="text-[#cbd5e1]/45 text-[9px] uppercase tracking-wider font-bold">Action Description</span>
                <p className="text-[#cbd5e1]/80 leading-relaxed font-semibold bg-black/30 p-3 rounded-lg border border-white/5">
                  {selectedLog.description || 'No detailed diagnostic description documented for this compliance event.'}
                </p>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-between items-center gap-3">
                {deleteConfirmId === selectedLog.logId ? (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                    <span className="text-[10px] text-red-400 font-bold">Confirm logs removal?</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(selectedLog.logId)}
                      className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(selectedLog.logId)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge Entry
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => { setSelectedLog(null); setDeleteConfirmId(null); }}
                  className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold border border-white/5 transition-colors"
                >
                  Close panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
