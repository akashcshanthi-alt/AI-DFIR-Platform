import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Coherent initial mock audit log data
const INITIAL_AUDIT_LOGS = [
  {
    eventId: 'AUD-2026-00842',
    timestamp: '2026-08-01 14:22:10',
    user: 'j.valdes',
    role: 'Lead Investigator',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDngz1G28qT0NnYnQdPhJ5e0B6aR-vVdbGceeEJZcx_4TJBQcw_Qfd7WJvfg4j7Y4LhmD2LfSLowfwLFr_XyJAv1Sg18Y0-pWvI4edGM21AqTg20YQ1s3_X_ergSg2kosseWjT2EJpLmEeyvD52j1SLtuzZsMe1fnME-ECo3oF3N9v2RezbOyfpLgNH9YaqqcW5Pm9SjEZsifNy6lf7tDESunXx1whiUwakp4UR2NYZQqV0vR23VQwz',
    action: 'Investigation Started',
    module: 'CASES_V2',
    ip: '192.168.1.124',
    device: 'desktop_windows',
    status: 'Success',
    severity: 'LOW',
  },
  {
    eventId: 'AUD-2026-00841',
    timestamp: '2026-08-01 14:21:55',
    user: 's.keller',
    role: 'SysAdmin',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIJOAdi0WrJNZN5Pf369YgQ_v3tllV8sCaQouKhX5g66bF1jyu09uqDMYZE0g77l6g0N5lU3KhDwbsAchSm_7Ne8omw_GHeqWP4RjbUA_wQ5r-IvTeEY6fohh8iqXcmNk08uyKq2yzBx9xIY9IK4IWeiXw6bg4qX94LfoVYVAqS-dlQclo3PsQBLeab29HHiHLxdraQIZZbetq2--e5RZUffLGCmFg5ciyeMxuLdENqyZlW57J8zPY',
    action: 'Config Change Rejected',
    module: 'CORE_AUTH',
    ip: '45.23.11.90',
    device: 'dns',
    status: 'Failed',
    severity: 'CRITICAL',
  },
  {
    eventId: 'AUD-2026-00840',
    timestamp: '2026-08-01 14:19:02',
    user: 'SYSTEM_SVC',
    role: 'Automated Task',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMJASTLKBv_5hxba9XgMIbhDOx9ePpptx9XJMHQ5bvMu66SRzcbhbmn8k4AHWbI3tiG2iLbRknDUAzHYxMkqYeINH51ucv057frunHhuR1VDL6FEpYs2TP0bAReXLCXUzVDm4zRQ_oSofgd2mUSdn0uJ0ca2s-_xyIJkD_pxwvPoR4ITV4Fyi1AvSfevnj4n-hxAVanYRKMWjPhnFfXfluEfnRhNOfatpkAxtBRSvJo4_UAql2tTad',
    action: 'Evidence Uploaded',
    module: 'DATA_INGEST',
    ip: '127.0.0.1',
    device: 'cloud_upload',
    status: 'Success',
    severity: 'MEDIUM',
  },
  {
    eventId: 'AUD-2026-00839',
    timestamp: '2026-08-01 13:42:31',
    user: 'm.chen',
    role: 'Investigator',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEHLKDfW5_ICUaTDwe0buXxEHlmTw5kgq9uNtVHCOrqiWx4k5bZvESEPVBT8uWQvqyaelKYFWI0KCQKdrcLPSECAtxNtu9FFMl7ZiJkCw9lO0m5evkUqlSqtCNLJLpGF8G4DxXTdMDg5aBPilORCIhS77U6S0t6dUffanedV3FEmHqS9wakzvsTGXB4lkSq_5qvXeOf7oYZCF74WfB-v3DT2NyMSu1tLNsNplpOxS9mhFCtYIjq4SX',
    action: 'Global Logs Exported',
    module: 'AUDIT_EXPORT',
    ip: '192.168.1.105',
    device: 'desktop_windows',
    status: 'Success',
    severity: 'MEDIUM',
  },
  {
    eventId: 'AUD-2026-00838',
    timestamp: '2026-08-01 13:37:14',
    user: 'd.wright',
    role: 'Security Director',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFzj_tdRqzIkKS5c_GZWVwh1FUAqIwIVqHbL8gAU5aFYY71LQeN1c4x3EyNfaP3m6IotZtvwiKYANvuVHBeXKiLbuWOER6TaMCu1iUObBK9iSN4RFUZhwNHWpv2YdGwjZIwLwTXiAs8IZXwCf870KNMvAMnJBRUbUIkt7orwCeArqUU0ZcBTsfnGetnjpDuHnZ7YDypkxVwFQDCezBscQOBxQNO7F0-MqOa42lN6XSRK7GHnmF1v9k',
    action: 'Database Limit Audited',
    module: 'DB_LINK_PROX',
    ip: '192.168.1.200',
    device: 'desktop_windows',
    status: 'Success',
    severity: 'LOW',
  },
  {
    eventId: 'AUD-2026-00837',
    timestamp: '2026-08-01 12:04:15',
    user: 's.keller',
    role: 'SysAdmin',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIJOAdi0WrJNZN5Pf369YgQ_v3tllV8sCaQouKhX5g66bF1jyu09uqDMYZE0g77l6g0N5lU3KhDwbsAchSm_7Ne8omw_GHeqWP4RjbUA_wQ5r-IvTeEY6fohh8iqXcmNk08uyKq2yzBx9xIY9IK4IWeiXw6bg4qX94LfoVYVAqS-dlQclo3PsQBLeab29HHiHLxdraQIZZbetq2--e5RZUffLGCmFg5ciyeMxuLdENqyZlW57J8zPY',
    action: 'DB Connection Revived',
    module: 'CORE_AUTH',
    ip: '10.0.4.15',
    device: 'dns',
    status: 'Success',
    severity: 'HIGH',
  },
  {
    eventId: 'AUD-2026-00836',
    timestamp: '2026-08-01 11:55:02',
    user: 'SYSTEM_SVC',
    role: 'Automated Task',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMJASTLKBv_5hxba9XgMIbhDOx9ePpptx9XJMHQ5bvMu66SRzcbhbmn8k4AHWbI3tiG2iLbRknDUAzHYxMkqYeINH51ucv057frunHhuR1VDL6FEpYs2TP0bAReXLCXUzVDm4zRQ_oSofgd2mUSdn0uJ0ca2s-_xyIJkD_pxwvPoR4ITV4Fyi1AvSfevnj4n-hxAVanYRKMWjPhnFfXfluEfnRhNOfatpkAxtBRSvJo4_UAql2tTad',
    action: 'API Limit Reset',
    module: 'CORE_AUTH',
    ip: '127.0.0.1',
    device: 'dns',
    status: 'Success',
    severity: 'LOW',
  }
];

// Tailwind static color utilities map to avoid dynamic template string issues
const streamEventStyles = {
  primary: 'flex gap-3 items-start border-l-2 border-primary pl-3 py-1 bg-primary/5 rounded-r transition-all duration-500',
  secondary: 'flex gap-3 items-start border-l-2 border-secondary pl-3 py-1 bg-secondary/5 rounded-r transition-all duration-500',
  tertiary: 'flex gap-3 items-start border-l-2 border-tertiary pl-3 py-1 bg-tertiary/5 rounded-r transition-all duration-500',
  error: 'flex gap-3 items-start border-l-2 border-error pl-3 py-1 bg-error-container/10 rounded-r transition-all duration-500',
  outline: 'flex gap-3 items-start border-l-2 border-outline pl-3 py-1 transition-all duration-500'
};

const severityStyles = {
  LOW: 'px-2 py-0.5 rounded bg-on-secondary-container/20 text-secondary text-[10px] font-bold border border-secondary/20',
  MEDIUM: 'px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary text-[10px] font-bold border border-tertiary/20',
  HIGH: 'px-2 py-0.5 rounded bg-error-container/10 text-error text-[10px] font-bold border border-error/20',
  CRITICAL: 'px-2 py-0.5 rounded bg-error-container text-on-error-container text-[10px] font-bold border border-error/50'
};

export default function AuditLogs() {
  const navigate = useNavigate();

  // Auth Guard check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Page telemetry and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedEvent, setExpandedEvent] = useState(null);

  // Live Stream dynamic simulation state
  const [streamEvents, setStreamEvents] = useState([
    { time: '14:25:01', type: 'secondary', message: 'Auth service: <span class="text-secondary font-semibold">Token valid</span> for user \'admin\'' },
    { time: '14:24:58', type: 'tertiary', message: 'Data Node 4: <span class="text-tertiary font-semibold">IO_LATENCY_HIGH</span> (450ms) detected' },
    { time: '14:24:50', type: 'outline', message: 'API Request: GET /v2/investigations/active' },
    { time: '14:24:32', type: 'error', message: '<span class="text-error font-bold">SECURITY ALERT:</span> Brute force attempt blocked from 89.2.1.44' },
    { time: '14:24:12', type: 'outline', message: 'Service check: All systems operational' },
    { time: '14:24:05', type: 'secondary', message: 'Investigation #8821: <span class="text-secondary font-semibold">Status changed to \'Closed\'</span>' }
  ]);

  // Effect to simulate live activity logging periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const types = ['primary', 'secondary', 'tertiary', 'error'];
      const selectedType = types[Math.floor(Math.random() * types.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      
      let message = '';
      switch (selectedType) {
        case 'primary':
          message = 'Global search triggered for fingerprint ID <span class="text-primary font-mono">#AX99</span>';
          break;
        case 'secondary':
          message = 'Background scan <span class="text-secondary font-bold">COMPLETED</span> for Case #772';
          break;
        case 'tertiary':
          message = 'Metadata verification warning on module <span class="text-tertiary font-mono">DB_LINK_PROX</span>';
          break;
        case 'error':
          message = '<span class="text-error font-bold">LATENCY EXCEEDED:</span> Cluster US-EAST-1 response delay of 680ms';
          break;
        default:
          message = 'Service check: All telemetry loops operational';
      }

      setStreamEvents((prev) => [
        { time: timeStr, type: selectedType, message },
        ...prev.slice(0, 19)
      ]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (!hasSession) return null;

  // Toggle expanded details drawer
  const toggleEventDetails = (eventId) => {
    setExpandedEvent((prev) => (prev === eventId ? null : eventId));
  };

  // Filter audit logs based on search and filters
  const filteredLogs = INITIAL_AUDIT_LOGS.filter((log) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      log.eventId.toLowerCase().includes(query) ||
      log.user.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.module.toLowerCase().includes(query) ||
      log.ip.toLowerCase().includes(query);

    const matchesUser =
      userFilter === 'All' || log.user.toLowerCase() === userFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'All' || log.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesUser && matchesStatus;
  });

  return (
    <div className="trace-audit-layout min-h-screen text-on-surface font-body-md grid-bg-audit selection:bg-secondary/30 selection:text-secondary">
      {/* Component Specific CSS Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .glass-panel {
              background: rgba(27, 31, 44, 0.6);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-top: 1px solid rgba(255, 255, 255, 0.15);
          }
          .neon-border-blue {
              box-shadow: 0 0 10px rgba(174, 198, 255, 0.1);
              border: 1px solid rgba(174, 198, 255, 0.3);
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
          @keyframes pulse-cyan {
              0% { box-shadow: 0 0 0 0 rgba(71, 250, 243, 0.4); }
              70% { box-shadow: 0 0 0 10px rgba(71, 250, 243, 0); }
              100% { box-shadow: 0 0 0 0 rgba(71, 250, 243, 0); }
          }
          .status-pulse {
              animation: pulse-cyan 2s infinite;
          }
          .grid-bg-audit {
              background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0);
              background-size: 32px 32px;
          }
          .trace-audit-row-btn {
              padding: 4px 8px;
              background-color: var(--surface-bright, #353946);
              color: var(--on-surface, #dfe2f3);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 4px;
              font-size: 11px;
              cursor: pointer;
              transition: all 0.2s ease;
          }
          .trace-audit-row-btn:hover {
              background-color: var(--primary, #aec6ff);
              color: var(--on-primary, #002e6b);
          }
        `
      }} />

      {/* Main Viewport Container */}
      <div className="p-6 space-y-6">
        
        {/* Local Page Actions & Search Toolbar */}
        <section className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-surface-container/60 p-4 rounded-xl border border-white/5 backdrop-blur-md">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary/50 placeholder:text-outline/50 text-on-surface"
              placeholder="Search event ID, user, IP, or action..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-bright/20 px-3 py-1.5 rounded-lg border border-white/5">
              <span className="w-2 h-2 rounded-full bg-secondary status-pulse"></span>
              <span className="text-xs font-bold text-secondary tracking-wider">LIVE TELEMETRY</span>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-1.5 bg-surface-bright text-on-surface rounded-lg text-sm font-semibold hover:bg-surface-bright/80 transition-all border border-white/10">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Advanced Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg text-sm font-bold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-sm">download</span>
              Export Logs
            </button>
          </div>
        </section>

        {/* KPI Dashboard Cards Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-xs text-outline uppercase font-bold tracking-widest mb-1">Total Events</p>
            <div className="flex items-end justify-between">
              <h3 className="font-display-lg text-2xl font-bold text-on-surface">1.2M</h3>
              <span className="text-secondary text-xs flex items-center gap-0.5">
                +4.2% <span className="material-symbols-outlined text-xs">trending_up</span>
              </span>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl border-l-2 border-l-error">
            <p className="text-xs text-outline uppercase font-bold tracking-widest mb-1">Failed Logins</p>
            <div className="flex items-end justify-between">
              <h3 className="font-display-lg text-2xl font-bold text-error">42</h3>
              <span className="text-error text-xs flex items-center gap-0.5">
                +12 <span className="material-symbols-outlined text-xs">warning</span>
              </span>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-xs text-outline uppercase font-bold tracking-widest mb-1">Successful Logins</p>
            <div className="flex items-end justify-between">
              <h3 className="font-display-lg text-2xl font-bold text-on-surface">856</h3>
              <span className="text-secondary text-xs">Stable</span>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-xs text-outline uppercase font-bold tracking-widest mb-1">Config Changes</p>
            <div className="flex items-end justify-between">
              <h3 className="font-display-lg text-2xl font-bold text-primary">12</h3>
              <span className="text-outline text-xs italic">Review pending</span>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl bg-error-container/10 border-error/30">
            <p className="text-xs text-error uppercase font-bold tracking-widest mb-1">Critical Events</p>
            <div className="flex items-end justify-between">
              <h3 className="font-display-lg text-2xl font-bold text-error">5</h3>
              <span className="text-error animate-pulse material-symbols-outlined">priority_high</span>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-xs text-outline uppercase font-bold tracking-widest mb-1">Active Users</p>
            <div className="flex items-end justify-between">
              <h3 className="font-display-lg text-2xl font-bold text-secondary">24</h3>
              <span className="text-outline text-xs">Session peak</span>
            </div>
          </div>
        </section>

        {/* Main Telemetry & Activity Layout Grid */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column: Recent Audit Trail Table & Bottom Panels */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            
            {/* Recent Audit Entries Table Section */}
            <section className="glass-panel rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-surface-bright/10">
                <h4 className="font-bold text-sm tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">list_alt</span>
                  RECENT AUDIT ENTRIES
                </h4>
                <div className="flex gap-2">
                  {/* Dropdown Filters inside the Table Header */}
                  <div className="flex items-center gap-4 mr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-outline">User:</span>
                      <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="bg-surface-container-lowest border border-white/10 rounded px-2 py-0.5 text-xs text-on-surface focus:outline-none"
                      >
                        <option value="All">All Users</option>
                        <option value="j.valdes">j.valdes</option>
                        <option value="s.keller">s.keller</option>
                        <option value="SYSTEM_SVC">SYSTEM_SVC</option>
                        <option value="m.chen">m.chen</option>
                        <option value="d.wright">d.wright</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-outline">Status:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-surface-container-lowest border border-white/10 rounded px-2 py-0.5 text-xs text-on-surface focus:outline-none"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-white/5 rounded text-outline hover:text-white" title="Refresh trail">
                    <span className="material-symbols-outlined text-sm">refresh</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-high/50 text-outline text-[11px] uppercase tracking-[0.15em] border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Timestamp (UTC)</th>
                      <th className="px-4 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                      <th className="px-4 py-3 font-semibold">Module</th>
                      <th className="px-4 py-3 font-semibold">IP Address</th>
                      <th className="px-4 py-3 font-semibold">Device</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Severity</th>
                      <th className="px-4 py-3 font-semibold text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => {
                        const isExpanded = expandedEvent === log.eventId;
                        const isFailed = log.status.toLowerCase() === 'failed';
                        return (
                          <React.Fragment key={log.eventId}>
                            <tr className={`hover:bg-primary/5 transition-colors group ${isFailed ? 'bg-error-container/5' : ''}`}>
                              <td className="px-4 py-4 font-code-sm text-xs text-primary-fixed opacity-80">
                                {log.timestamp}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-surface-bright border border-white/10 flex items-center justify-center overflow-hidden">
                                    <img className="w-full h-full object-cover" src={log.avatar} alt={`Avatar of ${log.user}`} />
                                  </div>
                                  <div>
                                    <div className="font-bold text-on-surface text-xs">{log.user}</div>
                                    <div className="text-[9px] text-outline">{log.role}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-medium text-xs text-on-surface">
                                {log.action}
                              </td>
                              <td className="px-4 py-4">
                                <span className="px-2 py-0.5 rounded bg-surface-bright/50 text-[10px] border border-white/10 text-outline font-mono">
                                  {log.module}
                                </span>
                              </td>
                              <td className="px-4 py-4 font-code-sm text-xs opacity-90 font-mono">
                                {log.ip}
                              </td>
                              <td className="px-4 py-4 text-outline">
                                <span className="material-symbols-outlined text-sm">{log.device}</span>
                              </td>
                              <td className={`px-4 py-4 text-xs font-semibold flex items-center gap-1 ${isFailed ? 'text-error' : 'text-secondary'}`}>
                                <span className="material-symbols-outlined text-sm">
                                  {isFailed ? 'cancel' : 'check_circle'}
                                </span>
                                {log.status}
                              </td>
                              <td className="px-4 py-4">
                                <span className={severityStyles[log.severity] || severityStyles.LOW}>
                                  {log.severity}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={() => toggleEventDetails(log.eventId)}
                                  className="trace-audit-row-btn"
                                >
                                  {isExpanded ? 'Hide' : 'Details'}
                                </button>
                              </td>
                            </tr>

                            {/* Collapsible Details Drawer */}
                            {isExpanded && (
                              <tr className="bg-surface-container-low/40">
                                <td colSpan={9} className="px-6 py-4">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-surface-container-lowest/80 border border-white/5 text-xs">
                                    <div className="space-y-1">
                                      <span className="text-outline uppercase text-[10px] tracking-wider font-bold">Event ID</span>
                                      <p className="font-mono text-on-surface">{log.eventId}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-outline uppercase text-[10px] tracking-wider font-bold">Module Path</span>
                                      <p className="font-mono text-primary">{log.module}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-outline uppercase text-[10px] tracking-wider font-bold">Investigator Session IP</span>
                                      <p className="font-mono text-on-surface">{log.ip}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-outline uppercase text-[10px] tracking-wider font-bold">Triangulation Scope</span>
                                      <p className="text-on-surface">SOC2 Compliant Event</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-outline">
                          <span className="material-symbols-outlined text-4xl block mb-2 text-outline/30">shield</span>
                          No audit entries found matching the query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Controller */}
              <div className="px-6 py-3 bg-surface-container-high/30 border-t border-white/5 flex justify-between items-center text-xs text-outline">
                <p>Showing 1-{filteredLogs.length} of {filteredLogs.length} results</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-surface-bright rounded border border-white/10 hover:text-white transition-colors" disabled>Previous</button>
                  <button className="px-3 py-1 bg-primary text-on-primary rounded border border-primary font-bold">1</button>
                  <button className="px-3 py-1 bg-surface-bright rounded border border-white/10 hover:text-white transition-colors" disabled>Next</button>
                </div>
              </div>
            </section>

            {/* Bottom Section: Stream Feed and Analyst Timelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Live Event Stream Panel */}
              <section className="glass-panel rounded-xl h-96 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface-bright/10">
                  <h4 className="font-bold text-sm tracking-wide flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary animate-pulse">broadcast_on_personal</span>
                    LIVE EVENT TELEMETRY STREAM
                  </h4>
                  <span className="text-[9px] font-mono text-outline">WS_CONNECTED : PORT_8080</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar font-code-sm text-xs font-mono">
                  {streamEvents.map((evt, idx) => (
                    <div key={idx} className={streamEventStyles[evt.type] || streamEventStyles.outline}>
                      <span className="text-outline shrink-0 font-mono">{evt.time}</span>
                      <span className="text-on-surface font-mono" dangerouslySetInnerHTML={{ __html: evt.message }} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Analyst Activity Timeline */}
              <section className="glass-panel rounded-xl h-96 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-surface-bright/10">
                  <h4 className="font-bold text-sm tracking-wide flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">timeline</span>
                    ANALYST ACTIVITY TIMELINE
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="relative border-l border-white/10 ml-3 pl-8 space-y-6 py-2">
                    <div className="relative">
                      <span className="absolute -left-[42px] top-0.5 w-5 h-5 rounded-full bg-secondary border-4 border-surface-container flex items-center justify-center"></span>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-outline font-bold">14:10 PM</span>
                        <span className="text-xs font-semibold text-on-surface">Login Detected</span>
                        <p className="text-[11px] text-outline mt-0.5">Investigator Valdes logged in via MFA (Duo Push).</p>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[42px] top-0.5 w-5 h-5 rounded-full bg-primary border-4 border-surface-container flex items-center justify-center"></span>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-outline font-bold">14:15 PM</span>
                        <span className="text-xs font-semibold text-on-surface">File Upload: investigation_raw_dump.iso</span>
                        <p className="text-[11px] text-outline mt-0.5">Uploaded to encrypted bucket 'Case-772-evidence'.</p>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[42px] top-0.5 w-5 h-5 rounded-full bg-outline border-4 border-surface-container flex items-center justify-center"></span>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-outline font-bold">14:30 PM</span>
                        <span className="text-xs font-semibold text-on-surface">Report Generated</span>
                        <p className="text-[11px] text-outline mt-0.5">Final incident summary exported as PDF/JSON.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </div>

          </div>

          {/* Right Column: AI Insights & System Health */}
          <aside className="col-span-12 lg:col-span-3 space-y-6">
            
            {/* AI Risk Scoring Radial Dial */}
            <section className="glass-panel rounded-xl p-4 border-t-2 border-t-secondary relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm">bolt</span>
                  AI RISK ALERT
                </h4>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="56" cy="56" fill="transparent" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="6"></circle>
                      <circle cx="56" cy="56" fill="transparent" r="48" stroke="#47faf3" strokeDasharray="301" strokeDashoffset="84" strokeLinecap="round" strokeWidth="6"></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-display-lg font-bold text-on-surface">72</span>
                      <span className="text-[9px] text-outline">RISK SCORE</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-center text-outline leading-relaxed px-2">
                  Current system risk is <span className="text-secondary font-bold">Elevated</span>. Anomalous configuration attempt flagged in AUTH module.
                </p>
              </div>
            </section>

            {/* Suspicious Flagged Anomalies */}
            <section className="glass-panel rounded-xl p-4">
              <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-sm">warning</span>
                ANOMALIES FLAGGED
              </h4>
              <div className="space-y-3">
                <div className="bg-error-container/10 border border-error/20 p-3 rounded-lg">
                  <p className="text-xs font-bold text-error mb-0.5">Multiple Failed Logins</p>
                  <p className="text-[10px] text-on-surface-variant mb-1.5">IP 45.23.11.90 (Russia) attempted 12 auth changes in 3s.</p>
                  <button className="text-[9px] uppercase font-bold text-error underline hover:text-error/85 focus:outline-none">Review Evidence</button>
                </div>
                <div className="bg-surface-bright/20 border border-white/5 p-3 rounded-lg">
                  <p className="text-xs font-bold text-on-surface mb-0.5">Lateral Movement Check</p>
                  <p className="text-[10px] text-outline">User 'j.valdes' accessed admin panels at unusual workstation hours.</p>
                </div>
              </div>
            </section>

            {/* Active Sessions Panel */}
            <section className="glass-panel rounded-xl p-4">
              <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">person_search</span>
                  ACTIVE CLIENTS
                </span>
                <span className="bg-secondary/20 text-secondary px-2 rounded-full text-[8px] font-mono font-bold">24 ONLINE</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img className="w-8 h-8 rounded-full border border-white/10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEHLKDfW5_ICUaTDwe0buXxEHlmTw5kgq9uNtVHCOrqiWx4k5bZvESEPVBT8uWQvqyaelKYFWI0KCQKdrcLPSECAtxNtu9FFMl7ZiJkCw9lO0m5evkUqlSqtCNLJLpGF8G4DxXTdMDg5aBPilORCIhS77U6S0t6dUffanedV3FEmHqS9wakzvsTGXB4lkSq_5qvXeOf7oYZCF74WfB-v3DT2NyMSu1tLNsNplpOxS9mhFCtYIjq4SX" alt="m.chen profile" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-secondary rounded-full border border-surface-container"></span>
                  </div>
                  <div className="flex-1 min-width-0">
                    <p className="text-xs font-bold truncate">m.chen</p>
                    <p className="text-[9px] text-outline truncate">Investigating Case #821</p>
                  </div>
                  <span className="text-[9px] text-outline">2m ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img className="w-8 h-8 rounded-full border border-white/10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFzj_tdRqzIkKS5c_GZWVwh1FUAqIwIVqHbL8gAU5aFYY71LQeN1c4x3EyNfaP3m6IotZtvwiKYANvuVHBeXKiLbuWOER6TaMCu1iUObBK9iSN4RFUZhwNHWpv2YdGwjZIwLwTXiAs8IZXwCf870KNMvAMnJBRUbUIkt7orwCeArqUU0ZcBTsfnGetnjpDuHnZ7YDypkxVwFQDCezBscQOBxQNO7F0-MqOa42lN6XSRK7GHnmF1v9k" alt="d.wright profile" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-secondary rounded-full border border-surface-container"></span>
                  </div>
                  <div className="flex-1 min-width-0">
                    <p className="text-xs font-bold truncate">d.wright</p>
                    <p className="text-[9px] text-outline truncate">Exporting Global Logs</p>
                  </div>
                  <span className="text-[9px] text-outline">14m ago</span>
                </div>
                <button className="w-full py-2 bg-surface-bright/50 rounded-lg text-[9px] font-bold text-outline uppercase hover:text-white transition-colors">
                  View All Sessions
                </button>
              </div>
            </section>

            {/* Recent Critical Events Alerts */}
            <section className="glass-panel rounded-xl p-4">
              <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm">notifications_active</span>
                CRITICAL LOG Telemetry
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] p-2 hover:bg-white/5 rounded transition-colors group">
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                  <span className="font-semibold text-on-surface truncate">DB Connection Dropped</span>
                  <span className="text-outline ml-auto text-[9px]">12:04</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] p-2 hover:bg-white/5 rounded transition-colors group">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                  <span className="font-semibold text-on-surface truncate">API Limit Exceeded</span>
                  <span className="text-outline ml-auto text-[9px]">11:55</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] p-2 hover:bg-white/5 rounded transition-colors group">
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                  <span className="font-semibold text-on-surface truncate">Unauthorized Shell Access</span>
                  <span className="text-outline ml-auto text-[9px]">10:42</span>
                </div>
              </div>
            </section>

          </aside>

        </div>

        {/* Audit Compliance & Statistics Footer */}
        <footer className="h-16 glass-panel flex items-center justify-between px-6 bg-surface-container-low/80 rounded-xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-secondary text-sm">verified</span>
              <span className="text-outline">Compliance Status:</span>
              <span className="font-bold text-on-surface">SOC2 TYPE II COMPLIANT</span>
            </div>
            <div className="hidden sm:block h-4 w-[1px] bg-white/10"></div>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-primary text-sm">history_edu</span>
              <span className="text-outline">Last Export:</span>
              <span className="font-bold text-on-surface">2 hours ago (CSV)</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-4 items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-outline">Audit Volume (24h)</span>
              <div className="flex gap-0.5 items-end h-6">
                <div className="w-1.5 bg-secondary/20 h-[30%]"></div>
                <div className="w-1.5 bg-secondary/30 h-[45%]"></div>
                <div className="w-1.5 bg-secondary/40 h-[60%]"></div>
                <div className="w-1.5 bg-secondary/50 h-[80%]"></div>
                <div className="w-1.5 bg-secondary/30 h-[50%]"></div>
                <div className="w-1.5 bg-secondary/40 h-[70%]"></div>
                <div className="w-1.5 bg-secondary/60 h-[95%]"></div>
                <div className="w-1.5 bg-secondary h-[85%]"></div>
                <div className="w-1.5 bg-secondary/40 h-[40%]"></div>
              </div>
            </div>
            <button className="bg-surface-bright px-3 py-1.5 rounded text-[10px] font-bold text-on-surface hover:bg-surface-bright/80 transition-all border border-white/10">
              Full Statistics
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
