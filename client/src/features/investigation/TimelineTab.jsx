import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Layers,
  ShieldAlert,
  SlidersHorizontal,
  ArrowDownUp,
  ExternalLink,
  Lock,
  Globe,
  Cpu,
  FolderOpen
} from 'lucide-react';
import { timelineService } from '../../services/timeline.service';

export default function TimelineTab({ caseId }) {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [includeUndated, setIncludeUndated] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' = oldest first
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Row expansion for deep provenance
  const [expandedEventId, setExpandedEventId] = useState(null);

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [timelineRes, statsRes] = await Promise.all([
        timelineService.getTimelineEvents({
          caseId,
          from: fromDate || undefined,
          to: toDate || undefined,
          eventType: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
          severity: severityFilter !== 'all' ? severityFilter : undefined,
          includeUndated: includeUndated ? 'true' : 'false',
          sortOrder,
          limit: 200
        }),
        timelineService.getTimelineStats(caseId)
      ]);

      setEvents(timelineRes.items || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Timeline fetch error:', err);
      setError(err.message || 'Failed to load forensic timeline events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchTimelineData();
    }
  }, [caseId, eventTypeFilter, severityFilter, includeUndated, sortOrder]);

  const handleGenerateTimeline = async () => {
    try {
      setGenerating(true);
      setError(null);
      const res = await timelineService.generateTimeline(caseId);
      setActionSuccess(`Timeline generated: ${res.totalEvents} events reconstructed (${res.datedEvents} chronological, ${res.undatedEvents} undated).`);
      setTimeout(() => setActionSuccess(null), 5000);
      await fetchTimelineData();
    } catch (err) {
      console.error('Timeline generation error:', err);
      setError(err.message || 'Failed to generate timeline from evidence.');
    } finally {
      setGenerating(false);
    }
  };

  // Local text search
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase().trim();
    return events.filter(e => {
      const matchDesc = e.description?.toLowerCase().includes(q);
      const matchExcerpt = e.rawExcerpt?.toLowerCase().includes(q);
      const matchFile = e.source?.fileName?.toLowerCase().includes(q);
      const matchRel = e.source?.relativePath?.toLowerCase().includes(q);
      const matchId = e.eventId?.toLowerCase().includes(q);
      const matchIoc = e.relatedIocs?.some(i => i.normalizedValue?.toLowerCase().includes(q));
      return matchDesc || matchExcerpt || matchFile || matchRel || matchId || matchIoc;
    });
  }, [events, searchQuery]);

  // Helpers for Badges & Icons
  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'AUTH':
        return <Lock className="w-3.5 h-3.5 text-amber-400" />;
      case 'NETWORK':
        return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      case 'PROCESS':
        return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
      case 'FILE':
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'ALERT':
        return <AlertOctagon className="w-3.5 h-3.5 text-red-400" />;
      case 'EVIDENCE_INGESTED':
        return <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />;
      case 'SYSTEM':
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30"><AlertOctagon className="w-2.5 h-2.5" /> Critical</span>;
      case 'High':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30"><AlertTriangle className="w-2.5 h-2.5" /> High</span>;
      case 'Medium':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">Medium</span>;
      case 'Low':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">Low</span>;
      case 'Informational':
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">Info</span>;
    }
  };

  const getTimezoneBadge = (tzStatus) => {
    switch (tzStatus) {
      case 'explicit_utc':
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">UTC (Z)</span>;
      case 'offset_provided':
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Offset Preserved</span>;
      case 'timezone_unknown':
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">TZ Unverified</span>;
      case 'undated':
      default:
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Undated</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast notifications */}
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
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-[#00E5FF]" />
            <h2 className="text-base font-bold text-white tracking-wide">Forensic Timeline Engine</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Phase 4</span>
          </div>
          <p className="text-xs text-[#8b90a0]">
            Deterministic event chronology synthesized from parsed evidence logs, acquisition timestamps, and correlated threat indicators.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateTimeline}
          disabled={generating}
          className={`w-full md:w-auto px-4 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
            generating
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-not-allowed'
              : 'bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black shadow-cyan-500/20'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
          <span>{generating ? 'Reconstructing Sequence...' : 'Generate Timeline'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-panel p-3.5 rounded-lg border border-white/5">
            <span className="text-[10px] font-mono text-[#8b90a0] uppercase tracking-wider block">Total Timeline Events</span>
            <div className="text-xl font-bold text-white mt-1">{stats.total || 0}</div>
          </div>
          <div className="glass-panel p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Dated Chronological</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{stats.dated || 0}</div>
          </div>
          <div className="glass-panel p-3.5 rounded-lg border border-red-500/20 bg-red-500/5">
            <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block">High / Critical Alerts</span>
            <div className="text-xl font-bold text-red-400 mt-1">
              {(stats.severity?.Critical || 0) + (stats.severity?.High || 0)}
            </div>
          </div>
          <div className="glass-panel p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Undated / Excluded</span>
            <div className="text-xl font-bold text-amber-400 mt-1">{stats.undated || 0}</div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Box */}
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-[#8b90a0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search timeline by description, file name, indicator, line text..."
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

          {/* Chronological Sort Toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title="Toggle Chronological Direction"
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>{sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}</span>
          </button>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={fetchTimelineData}
            title="Refresh Timeline"
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <span className="text-[#8b90a0] text-[11px] flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Filters:
          </span>

          {/* Event Type Filter */}
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00E5FF]/50 cursor-pointer"
          >
            <option value="all">All Event Types</option>
            <option value="AUTH">Authentication (AUTH)</option>
            <option value="NETWORK">Network Flow (NETWORK)</option>
            <option value="PROCESS">Process Execution (PROCESS)</option>
            <option value="FILE">Filesystem I/O (FILE)</option>
            <option value="ALERT">Threat Alert (ALERT)</option>
            <option value="EVIDENCE_INGESTED">Evidence Acquisition</option>
            <option value="SYSTEM">System Telemetry</option>
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

          {/* Include Undated Events Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[#8b90a0] hover:text-white">
            <input
              type="checkbox"
              checked={includeUndated}
              onChange={(e) => setIncludeUndated(e.target.checked)}
              className="rounded bg-black/40 border-white/20 text-[#00E5FF] focus:ring-0 cursor-pointer"
            />
            <span className="text-[11px]">Include Undated Records</span>
          </label>

          {/* Reset Filters */}
          {(eventTypeFilter !== 'all' || severityFilter !== 'all' || includeUndated || searchQuery || fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setEventTypeFilter('all');
                setSeverityFilter('all');
                setIncludeUndated(false);
                setSearchQuery('');
                setFromDate('');
                setToDate('');
              }}
              className="text-[#00E5FF] hover:underline text-[11px] ml-auto"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Main Timeline Stream */}
      <div className="glass-panel rounded-xl border border-white/5 p-4 sm:p-6">
        
        {loading ? (
          <div className="p-12 text-center text-[#8b90a0] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#00E5FF] animate-spin" />
            <p className="text-xs">Loading forensic timeline events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-[#8b90a0] flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
            <Clock className="w-12 h-12 text-[#8b90a0]/60 mb-1" />
            <h3 className="font-semibold text-white text-base">No Timeline Events</h3>
            <p className="text-xs leading-relaxed">
              {events.length === 0
                ? "No forensic timeline has been generated for this case yet. Click 'Generate Timeline' to reconstruct event chronology from evidence records."
                : "No events match the current filter criteria."}
            </p>
            {events.length === 0 && (
              <button
                type="button"
                onClick={handleGenerateTimeline}
                disabled={generating}
                className="mt-2 px-4 py-2 rounded-lg bg-[#00E5FF] text-black font-semibold text-xs hover:bg-[#00E5FF]/90 transition-all cursor-pointer"
              >
                {generating ? 'Reconstructing...' : 'Generate Timeline Now'}
              </button>
            )}
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l border-white/10 space-y-6">
            {filteredEvents.map((evt) => {
              const isExpanded = expandedEventId === (evt.eventId || evt._id);
              const hasWarnings = evt.provenanceWarnings && evt.provenanceWarnings.length > 0;
              const hasIocs = evt.relatedIocs && evt.relatedIocs.length > 0;

              return (
                <div key={evt.eventId || evt._id} className="relative group">
                  
                  {/* Timeline Node Dot */}
                  <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 border-[#10141d] flex items-center justify-center transition-transform group-hover:scale-110 ${
                    evt.severity === 'Critical' ? 'bg-red-400 shadow-lg shadow-red-500/50' :
                    evt.severity === 'High' ? 'bg-orange-400 shadow-lg shadow-orange-500/50' :
                    evt.severity === 'Medium' ? 'bg-amber-400' :
                    evt.severity === 'Informational' ? 'bg-slate-400' : 'bg-cyan-400'
                  }`} />

                  {/* Event Card Container */}
                  <div className={`glass-card p-4 rounded-xl border border-white/5 hover:border-white/15 transition-all ${
                    isExpanded ? 'bg-white/[0.03] ring-1 ring-[#00E5FF]/30' : ''
                  }`}>
                    
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                      
                      {/* Left: Timestamp & Timezone Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-white text-xs font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#00E5FF]" />
                          {evt.timestamp ? (
                            <>
                              <span>{new Date(evt.timestamp).toISOString().replace('T', ' ').slice(0, 19)} UTC</span>
                              {evt.originalTimestamp && evt.originalTimestamp !== new Date(evt.timestamp).toISOString() && (
                                <span className="text-[10px] text-[#8b90a0] font-normal" title="Original Evidence Timestamp">
                                  ({evt.originalTimestamp})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-red-400 italic">Undated Record</span>
                          )}
                        </span>
                        {getTimezoneBadge(evt.timezoneStatus)}
                      </div>

                      {/* Right: Badges & Severity */}
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(evt.severity)}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#8b90a0] border border-white/10 flex items-center gap-1">
                          {getEventTypeIcon(evt.eventType)}
                          <span>{evt.eventType}</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#8b90a0]">{evt.eventId}</span>
                      </div>

                    </div>

                    {/* Content Row */}
                    <div className="pt-2.5 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-xs text-white/95 font-medium leading-relaxed">
                          {evt.description}
                        </p>
                        <button
                          type="button"
                          onClick={() => setExpandedEventId(isExpanded ? null : (evt.eventId || evt._id))}
                          className="shrink-0 p-1 hover:bg-white/10 rounded text-[#8b90a0] hover:text-white transition-colors cursor-pointer"
                          title={isExpanded ? 'Collapse Details' : 'Expand Evidence Provenance'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Provenance Pills & Related IOCs */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        
                        {/* Source file */}
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 text-cyan-400 border border-white/10 font-mono text-[10px]">
                          <FileText className="w-3 h-3" />
                          <span>{evt.source?.relativePath || evt.source?.fileName}</span>
                          {evt.source?.lineNumber && (
                            <span className="text-[#8b90a0]">:L{evt.source.lineNumber}</span>
                          )}
                        </div>

                        {/* Correlated IOCs */}
                        {hasIocs && (
                          <div className="flex flex-wrap items-center gap-1">
                            {evt.relatedIocs.map((ioc, iIdx) => (
                              <span
                                key={iIdx}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono text-[10px]"
                                title={`Linked IOC: ${ioc.normalizedValue} (${ioc.severity})`}
                              >
                                <ShieldAlert className="w-2.5 h-2.5 text-purple-400" />
                                <span>{ioc.normalizedValue}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Provenance Warning Tag */}
                        {hasWarnings && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Warning</span>
                          </span>
                        )}

                      </div>

                    </div>

                    {/* Expandable Deep Provenance & Rule Drawer */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-3 bg-black/30 p-3 rounded-lg text-xs animate-in fade-in duration-150">
                        
                        {/* Warnings if any */}
                        {hasWarnings && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-300 space-y-1">
                            <span className="font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Timestamp Provenance Warning
                            </span>
                            {evt.provenanceWarnings.map((w, wIdx) => (
                              <p key={wIdx} className="text-[11px] leading-relaxed">{w}</p>
                            ))}
                          </div>
                        )}

                        {/* Raw Evidence Excerpt */}
                        <div>
                          <span className="text-[10px] font-mono text-[#8b90a0] uppercase tracking-wider block mb-1">
                            Original Evidence Context Excerpt
                          </span>
                          <pre className="font-mono text-[11px] text-white/90 bg-black/60 p-2.5 rounded border border-white/5 whitespace-pre-wrap select-all overflow-x-auto">
                            {evt.rawExcerpt || 'No raw snippet captured.'}
                          </pre>
                        </div>

                        {/* Rule Matches */}
                        {evt.ruleMatches && evt.ruleMatches.length > 0 && (
                          <div>
                            <span className="text-[10px] font-mono text-[#00E5FF] uppercase tracking-wider block mb-1">
                              Applied Detection Rules
                            </span>
                            <div className="space-y-1.5">
                              {evt.ruleMatches.map((rule, rIdx) => (
                                <div key={rIdx} className="p-2 bg-white/[0.02] border border-white/5 rounded text-[11px]">
                                  <div className="font-semibold text-white flex items-center gap-2">
                                    <span>{rule.ruleName}</span>
                                    <span className="text-[9px] font-mono text-[#8b90a0]">({rule.ruleId})</span>
                                  </div>
                                  <p className="text-[#8b90a0] mt-0.5">{rule.rationale}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Provenance Metadata footer */}
                        <div className="pt-1 flex flex-wrap items-center justify-between text-[10px] font-mono text-[#8b90a0] border-t border-white/5">
                          <span>Evidence ID: {evt.source?.evidenceId}</span>
                          <span>Precision: {evt.timestampPrecision}</span>
                          <span>Confidence: {evt.confidence} ({evt.confidenceScore || 50}%)</span>
                        </div>

                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
