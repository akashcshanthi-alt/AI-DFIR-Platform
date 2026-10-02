import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  Info, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  Hash, 
  Mail, 
  Link2, 
  Layers, 
  ExternalLink,
  Clock,
  SlidersHorizontal,
  XCircle
} from 'lucide-react';
import { iocService } from '../../services/ioc.service';

export default function IOCTab({ caseId }) {
  const [iocs, setIocs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ipClassFilter, setIpClassFilter] = useState('all');

  // Expanded row tracking for provenance
  const [expandedIocId, setExpandedIocId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Status updating state
  const [updatingId, setUpdatingId] = useState(null);

  const fetchIOCData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [iocRes, statsRes] = await Promise.all([
        iocService.getIOCs({ caseId, limit: 200 }),
        iocService.getIOCStats(caseId)
      ]);
      setIocs(iocRes.items || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Error fetching IOCs:', err);
      setError(err.message || 'Failed to load indicators of compromise.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchIOCData();
    }
  }, [caseId]);

  const handleRunDetection = async () => {
    try {
      setDetecting(true);
      setError(null);
      const result = await iocService.detectIOCs(caseId);
      setActionSuccess(`Detection complete: ${result.totalDetected} indicators analyzed (${result.newIndicators} new, ${result.updatedIndicators} updated).`);
      setTimeout(() => setActionSuccess(null), 5000);
      await fetchIOCData();
    } catch (err) {
      console.error('Detection error:', err);
      setError(err.message || 'Failed to execute IOC detection.');
    } finally {
      setDetecting(false);
    }
  };

  const handleStatusChange = async (iocDoc, newStatus) => {
    try {
      setUpdatingId(iocDoc.iocId || iocDoc._id);
      await iocService.updateIOCStatus(iocDoc.iocId || iocDoc._id, newStatus);
      setIocs(prev => prev.map(item => {
        if ((item.iocId && item.iocId === iocDoc.iocId) || item._id === iocDoc._id) {
          return { ...item, status: newStatus };
        }
        return item;
      }));
      setActionSuccess(`Indicator [${iocDoc.iocId || iocDoc.normalizedValue}] transitioned to ${newStatus}.`);
      setTimeout(() => setActionSuccess(null), 4000);
      // Refresh stats in background
      iocService.getIOCStats(caseId).then(setStats).catch(() => {});
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered IOCs
  const filteredIOCs = useMemo(() => {
    return iocs.filter(ioc => {
      // Type
      if (typeFilter !== 'all' && ioc.indicatorType !== typeFilter) return false;
      // Severity
      if (severityFilter !== 'all' && ioc.severity !== severityFilter) return false;
      // Status
      if (statusFilter !== 'all' && ioc.status !== statusFilter) return false;
      // IP Classification
      if (ipClassFilter !== 'all' && ioc.ipClassification !== ipClassFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesVal = ioc.normalizedValue?.toLowerCase().includes(q);
        const matchesId = ioc.iocId?.toLowerCase().includes(q);
        const matchesRule = ioc.ruleMatches?.some(r => r.ruleName?.toLowerCase().includes(q) || r.ruleId?.toLowerCase().includes(q));
        const matchesNotes = ioc.notes?.toLowerCase().includes(q);
        if (!matchesVal && !matchesId && !matchesRule && !matchesNotes) return false;
      }
      return true;
    });
  }, [iocs, typeFilter, severityFilter, statusFilter, ipClassFilter, searchQuery]);

  // Helpers for UI badges
  const getTypeBadge = (type) => {
    switch (type) {
      case 'ipv4':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Globe className="w-3 h-3" /> IPv4</span>;
      case 'domain':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Globe className="w-3 h-3" /> Domain</span>;
      case 'url':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><Link2 className="w-3 h-3" /> URL</span>;
      case 'email':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20"><Mail className="w-3 h-3" /> Email</span>;
      case 'sha256':
      case 'sha1':
      case 'md5':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Hash className="w-3 h-3" /> {type.toUpperCase()}</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">{type}</span>;
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30"><AlertOctagon className="w-3 h-3" /> Critical</span>;
      case 'High':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30"><AlertTriangle className="w-3 h-3" /> High</span>;
      case 'Medium':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30"><AlertTriangle className="w-3 h-3" /> Medium</span>;
      case 'Low':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30"><Info className="w-3 h-3" /> Low</span>;
      case 'Informational':
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30"><Info className="w-3 h-3" /> Info</span>;
    }
  };

  const getIpClassificationBadge = (classification) => {
    if (!classification || classification === 'none') return null;
    switch (classification) {
      case 'private':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">RFC 1918 Private</span>;
      case 'public':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">Public Routable</span>;
      case 'loopback':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-500/10 text-slate-400 border border-slate-500/20">Loopback</span>;
      case 'link-local':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Link-Local</span>;
      case 'reserved':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-500/10 text-slate-400 border border-slate-500/20">Reserved</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-500/10 text-slate-400">{classification}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30">Confirmed Threat</span>;
      case 'Under Review':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">Under Review</span>;
      case 'False Positive':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">False Positive</span>;
      case 'Dismissed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">Dismissed</span>;
      case 'New':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">New</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs animate-in fade-in duration-200">
          <XCircle className="w-4 h-4 shrink-0" />
          <span className="flex-grow">{error}</span>
          <button 
            type="button" 
            onClick={() => setError(null)}
            className="text-red-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Banner & Detection Trigger */}
      <div className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-[#00E5FF]" />
            <h2 className="text-base font-bold text-white tracking-wide">IOC Detection Engine</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Phase 3</span>
          </div>
          <p className="text-xs text-[#8b90a0]">
            Deterministic, rule-based indicator extraction and provenance analysis across persisted forensic evidence records.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleRunDetection}
            disabled={detecting}
            className={`w-full md:w-auto px-4 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              detecting 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-not-allowed'
                : 'bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black shadow-cyan-500/20'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
            <span>{detecting ? 'Analyzing Forensic Evidence...' : 'Run IOC Detection'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="glass-panel p-3.5 rounded-lg border border-white/5">
            <span className="text-[10px] font-mono text-[#8b90a0] uppercase tracking-wider block">Total Findings</span>
            <div className="text-xl font-bold text-white mt-1">{stats.total || 0}</div>
          </div>
          <div className="glass-panel p-3.5 rounded-lg border border-red-500/20 bg-red-500/5">
            <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block">High / Critical</span>
            <div className="text-xl font-bold text-red-400 mt-1">
              {(stats.severity?.Critical || 0) + (stats.severity?.High || 0)}
            </div>
          </div>
          <div className="glass-panel p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Under Review</span>
            <div className="text-xl font-bold text-amber-400 mt-1">{stats.status?.['Under Review'] || 0}</div>
          </div>
          <div className="glass-panel p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Confirmed Threats</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{stats.status?.Confirmed || 0}</div>
          </div>
          <div className="glass-panel p-3.5 rounded-lg border border-blue-500/20 bg-blue-500/5">
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">Public IP Artifacts</span>
            <div className="text-xl font-bold text-blue-400 mt-1">{stats.ipClassification?.public || 0}</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Box */}
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-[#8b90a0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indicators by value, rule name, IOC ID..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-[#8b90a0] focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8b90a0] hover:text-white"
              >
                &times;
              </button>
            )}
          </div>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={fetchIOCData}
            title="Refresh IOC List"
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[#8b90a0] text-[11px] flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3 h-3" /> Filters:
          </span>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00E5FF]/50 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="ipv4">IPv4 Addresses</option>
            <option value="domain">Domains</option>
            <option value="url">URLs</option>
            <option value="email">Emails</option>
            <option value="sha256">SHA-256 Hashes</option>
            <option value="sha1">SHA-1 Hashes</option>
            <option value="md5">MD5 Hashes</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00E5FF]/50 cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Informational">Informational</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00E5FF]/50 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Confirmed">Confirmed</option>
            <option value="False Positive">False Positive</option>
            <option value="Dismissed">Dismissed</option>
          </select>

          {/* IP Classification Filter */}
          <select
            value={ipClassFilter}
            onChange={(e) => setIpClassFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00E5FF]/50 cursor-pointer"
          >
            <option value="all">All IP Scopes</option>
            <option value="public">Public Routable</option>
            <option value="private">RFC 1918 Private</option>
            <option value="loopback">Loopback</option>
          </select>

          {/* Active filter count & reset */}
          {(typeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all' || ipClassFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter('all');
                setSeverityFilter('all');
                setStatusFilter('all');
                setIpClassFilter('all');
                setSearchQuery('');
              }}
              className="text-[#00E5FF] hover:underline text-[11px] ml-auto"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Main IOC Table or Empty State */}
      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        
        {loading ? (
          <div className="p-12 text-center text-[#8b90a0] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#00E5FF] animate-spin" />
            <p className="text-xs">Loading indicators and evidence provenance...</p>
          </div>
        ) : filteredIOCs.length === 0 ? (
          <div className="p-12 text-center text-[#8b90a0] flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
            <ShieldAlert className="w-12 h-12 text-[#8b90a0]/60 mb-1" />
            <h3 className="font-semibold text-white text-base">No Indicators Found</h3>
            <p className="text-xs leading-relaxed">
              {iocs.length === 0
                ? "No indicators of compromise detected yet. Upload evidence files or folders and click 'Run IOC Detection' to correlate forensic artifacts."
                : "No indicators match the selected filter criteria."}
            </p>
            {iocs.length === 0 && (
              <button
                type="button"
                onClick={handleRunDetection}
                disabled={detecting}
                className="mt-2 px-4 py-2 rounded-lg bg-[#00E5FF] text-black font-semibold text-xs hover:bg-[#00E5FF]/90 transition-all cursor-pointer"
              >
                {detecting ? 'Analyzing...' : 'Run IOC Detection Now'}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[#8b90a0] text-[10px] font-mono uppercase tracking-wider">
                  <th className="py-3 px-4 w-12"></th>
                  <th className="py-3 px-4">Indicator ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 min-w-[240px]">Normalized Value</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Provenance</th>
                  <th className="py-3 px-4">First / Last Seen</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredIOCs.map((ioc) => {
                  const isExpanded = expandedIocId === (ioc.iocId || ioc._id);
                  const isCopied = copiedId === (ioc.iocId || ioc._id);
                  const isUpdating = updatingId === (ioc.iocId || ioc._id);
                  const refCount = ioc.evidenceReferences?.length || 0;

                  return (
                    <React.Fragment key={ioc.iocId || ioc._id}>
                      <tr 
                        className={`hover:bg-white/[0.03] transition-colors ${
                          isExpanded ? 'bg-white/[0.02]' : ''
                        }`}
                      >
                        {/* Expand toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedIocId(isExpanded ? null : (ioc.iocId || ioc._id))}
                            className="p-1 hover:bg-white/10 rounded text-[#8b90a0] hover:text-white transition-colors cursor-pointer"
                            title={isExpanded ? 'Collapse Provenance Details' : 'Expand Provenance & Rule Matches'}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                        {/* ID */}
                        <td className="py-3 px-4 font-mono font-medium text-white/90">
                          {ioc.iocId || 'IOC-GEN'}
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            {getTypeBadge(ioc.indicatorType)}
                            {getIpClassificationBadge(ioc.ipClassification)}
                          </div>
                        </td>

                        {/* Normalized Value & Copy */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 group max-w-md">
                            <span 
                              className="font-mono text-white text-xs truncate max-w-sm select-all cursor-text"
                              title={ioc.normalizedValue}
                            >
                              {ioc.normalizedValue}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(ioc.normalizedValue, ioc.iocId || ioc._id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded text-[#8b90a0] hover:text-[#00E5FF] cursor-pointer"
                              title="Copy to clipboard"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-4">
                          {getSeverityBadge(ioc.severity)}
                        </td>

                        {/* Confidence */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  ioc.confidenceScore >= 70 ? 'bg-emerald-400' :
                                  ioc.confidenceScore >= 40 ? 'bg-amber-400' : 'bg-blue-400'
                                }`}
                                style={{ width: `${ioc.confidenceScore || 50}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-[#8b90a0]">
                              {ioc.confidenceScore || 50}%
                            </span>
                          </div>
                        </td>

                        {/* Provenance Badge */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setExpandedIocId(isExpanded ? null : (ioc.iocId || ioc._id))}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 text-[11px] border border-white/10 transition-colors cursor-pointer"
                          >
                            <Layers className="w-3 h-3 text-[#00E5FF]" />
                            <span>{refCount} {refCount === 1 ? 'file' : 'files'}</span>
                          </button>
                        </td>

                        {/* First / Last Seen */}
                        <td className="py-3 px-4 text-[#8b90a0] text-[11px] font-mono whitespace-nowrap">
                          {ioc.firstSeen ? (
                            <div>
                              <div>{new Date(ioc.firstSeen).toLocaleDateString()}</div>
                              <div className="text-[9px] text-[#8b90a0]/60">
                                {new Date(ioc.firstSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#8b90a0]/50 italic">None reported</span>
                          )}
                        </td>

                        {/* Status Select */}
                        <td className="py-3 px-4">
                          <select
                            value={ioc.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(ioc, e.target.value)}
                            className="bg-black/60 border border-white/15 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#00E5FF]/50 cursor-pointer disabled:opacity-50"
                          >
                            <option value="New">New</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Confirmed">Confirmed Threat</option>
                            <option value="False Positive">False Positive</option>
                            <option value="Dismissed">Dismissed</option>
                          </select>
                        </td>
                      </tr>

                      {/* Expanded Provenance & Rule Matches Drawer */}
                      {isExpanded && (
                        <tr className="bg-black/30 border-b border-white/10">
                          <td colSpan="9" className="p-4 sm:p-6">
                            <div className="space-y-4 max-w-5xl mx-auto">
                              
                              {/* Section 1: Rule Matches & Detection Logic */}
                              <div>
                                <h4 className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <ShieldAlert className="w-3.5 h-3.5" /> Rule Matches & Detection Rationale
                                </h4>
                                {ioc.ruleMatches && ioc.ruleMatches.length > 0 ? (
                                  <div className="space-y-2">
                                    {ioc.ruleMatches.map((rule, rIdx) => (
                                      <div key={rIdx} className="p-3 bg-white/[0.03] border border-white/10 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-white text-xs font-semibold">{rule.ruleName}</span>
                                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-[#8b90a0]">{rule.ruleId}</span>
                                          </div>
                                          <p className="text-xs text-[#8b90a0] mt-1">{rule.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          {getSeverityBadge(rule.severity)}
                                          <span className="text-[10px] font-mono text-[#8b90a0]">Conf: {rule.confidence}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-[#8b90a0] italic">Baseline indicator observed in forensic evidence.</p>
                                )}
                              </div>

                              {/* Section 2: Detailed Evidence Provenance */}
                              <div>
                                <h4 className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" /> Evidence Provenance ({ioc.evidenceReferences?.length || 0} occurrences)
                                </h4>

                                {ioc.evidenceReferences && ioc.evidenceReferences.length > 0 ? (
                                  <div className="max-h-60 overflow-y-auto custom-scrollbar border border-white/10 rounded-lg divide-y divide-white/5">
                                    {ioc.evidenceReferences.map((ref, refIdx) => (
                                      <div key={refIdx} className="p-3 bg-black/40 hover:bg-white/[0.02] text-xs">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-[#00E5FF] font-semibold">{ref.evidenceId}</span>
                                            <span className="text-white font-medium">{ref.relativePath || ref.fileName}</span>
                                            {ref.lineNumber && (
                                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                                                Line {ref.lineNumber}
                                              </span>
                                            )}
                                          </div>
                                          {ref.timestamp && (
                                            <span className="text-[10px] font-mono text-[#8b90a0] flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {new Date(ref.timestamp).toLocaleString()}
                                            </span>
                                          )}
                                        </div>
                                        {ref.context && (
                                          <div className="mt-1 font-mono text-[11px] text-[#94a3b8] bg-black/60 p-2 rounded border border-white/5 select-all overflow-x-auto">
                                            {ref.context}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-[#8b90a0] italic">No line-level references recorded.</p>
                                )}
                              </div>

                              {/* Section 3: Analyst Notes */}
                              {ioc.notes && (
                                <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg">
                                  <span className="text-[10px] font-mono text-[#8b90a0] uppercase tracking-wider block mb-1">Analyst Review Notes</span>
                                  <p className="text-xs text-white/90">{ioc.notes}</p>
                                </div>
                              )}

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
