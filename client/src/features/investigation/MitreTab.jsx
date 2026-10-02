import React, { useState, useEffect, useMemo } from 'react';
import {
  Crosshair,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Layers,
  ExternalLink,
  Clock,
  Check,
  XCircle,
  Tag,
  Activity,
  SlidersHorizontal,
  Eye,
  CheckSquare,
  ShieldCheck,
  Zap,
  HelpCircle,
  X
} from 'lucide-react';
import { mitreService } from '../../services/mitre.service';

export default function MitreTab({ caseId }) {
  const [mappings, setMappings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [tacticFilter, setTacticFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [detectionTypeFilter, setDetectionTypeFilter] = useState('all');

  // Modal / Drawer state for provenance inspection and analyst review
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('confirmed');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchMitreData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [listRes, statsRes] = await Promise.all([
        mitreService.getMappings({ caseId, limit: 100 }),
        mitreService.getMappingStats(caseId)
      ]);
      setMappings(listRes.items || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load MITRE ATT&CK data:', err);
      setError(err.message || 'Failed to load MITRE mappings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchMitreData();
    }
  }, [caseId]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      setActionSuccess(null);
      const res = await mitreService.generateMappings(caseId);
      setActionSuccess(
        `Generated ${res.totalMapped} technique mappings (${res.newMappings} new, ${res.updatedMappings} refreshed).`
      );
      await fetchMitreData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to generate MITRE mappings:', err);
      setError(err.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenReview = (mapping) => {
    setSelectedMapping(mapping);
    setReviewStatus(mapping.mappingStatus === 'candidate' ? 'confirmed' : mapping.mappingStatus);
    setReviewNotes(mapping.analystNotes || '');
  };

  const handleCloseReview = () => {
    setSelectedMapping(null);
    setReviewNotes('');
  };

  const handleQuickStatusUpdate = async (mappingId, newStatus) => {
    try {
      setSubmittingReview(true);
      await mitreService.updateMappingStatus(mappingId, newStatus, 'Quick status transition via investigation card.');
      setActionSuccess(`Mapping status updated to ${newStatus}.`);
      await fetchMitreData();
      if (selectedMapping && selectedMapping.mappingId === mappingId) {
        setSelectedMapping(prev => prev ? { ...prev, mappingStatus: newStatus } : null);
      }
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err.message || 'Failed to update mapping status.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitModalReview = async (e) => {
    e.preventDefault();
    if (!selectedMapping) return;

    try {
      setSubmittingReview(true);
      await mitreService.updateMappingStatus(selectedMapping.mappingId, reviewStatus, reviewNotes);
      setActionSuccess(`Mapping [${selectedMapping.techniqueId}] updated to ${reviewStatus}.`);
      await fetchMitreData();
      handleCloseReview();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to submit analyst review:', err);
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Client-side filtering
  const filteredMappings = useMemo(() => {
    return mappings.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = item.techniqueId.toLowerCase().includes(q);
        const matchesName = item.techniqueName.toLowerCase().includes(q);
        const matchesRule = item.matchedRules?.some(r =>
          r.ruleName.toLowerCase().includes(q) || r.rationale.toLowerCase().includes(q)
        );
        const matchesTactic = item.tactics?.some(t => t.tacticName.toLowerCase().includes(q));
        if (!matchesId && !matchesName && !matchesRule && !matchesTactic) return false;
      }

      // Tactic Filter
      if (tacticFilter !== 'all') {
        const hasTactic = item.tactics?.some(t => t.tacticId === tacticFilter || t.tacticName === tacticFilter);
        if (!hasTactic) return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && item.mappingStatus !== statusFilter) {
        return false;
      }

      // Confidence Filter
      if (confidenceFilter !== 'all' && item.confidence?.level !== confidenceFilter) {
        return false;
      }

      // Detection Type Filter
      if (detectionTypeFilter !== 'all' && item.detectionType !== detectionTypeFilter) {
        return false;
      }

      return true;
    });
  }, [mappings, searchQuery, tacticFilter, statusFilter, confidenceFilter, detectionTypeFilter]);

  // Extract unique tactics present in current dataset for filter dropdown
  const availableTactics = useMemo(() => {
    const map = new Map();
    mappings.forEach(m => {
      m.tactics?.forEach(t => {
        if (!map.has(t.tacticId)) {
          map.set(t.tacticId, t.tacticName);
        }
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [mappings]);

  return (
    <div className="space-y-6">
      {/* Toast / Alert Notifications */}
      {actionSuccess && (
        <div className="bg-[#10b981]/15 border border-[#10b981]/40 text-[#10b981] px-4 py-3 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-sm animate-fade-in text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10b981]" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-[#10b981] hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-error/15 border border-error/40 text-error px-4 py-3 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-sm animate-fade-in text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 shrink-0 text-error" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-error hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mandatory Operational Warning Banner: Candidate vs Confirmed */}
      <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed text-[#fcd34d]">
        <AlertTriangle className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-white mb-0.5 flex items-center gap-2">
            <span>Operational Doctrine: Inferred Candidate Techniques vs. Confirmed Attacks</span>
            <span className="bg-[#f59e0b]/20 text-[#f59e0b] text-[10px] font-mono px-2 py-0.5 rounded border border-[#f59e0b]/30">
              STRICT DFIR COMPLIANCE
            </span>
          </div>
          <p className="text-[#cbd5e1] text-[11px]">
            Automated correlation maps telemetry to candidate techniques with deterministic rationale. In accordance with forensic standards,
            candidate mappings remain preliminary inferences until an authorized investigator confirms them against contextual evidence.
          </p>
        </div>
      </div>

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2.5">
            <Crosshair className="w-5 h-5 text-[#47faf3]" />
            <span>MITRE ATT&amp;CK Mapping Engine</span>
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 bg-[#47faf3]/10 text-[#47faf3] rounded-full border border-[#47faf3]/20">
              v14.1 Enterprise
            </span>
          </h2>
          <p className="text-xs text-[#8b90a0] mt-1">
            Explainable, rule-based adversary technique mapping correlated from forensic evidence, timeline events, and IOC indicators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMitreData}
            disabled={loading || generating}
            className="p-2 rounded-lg bg-surface-container-high border border-white/10 text-outline hover:text-white hover:bg-white/5 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Mappings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded-lg bg-[#47faf3]/15 hover:bg-[#47faf3]/25 border border-[#47faf3]/40 text-[#47faf3] text-xs font-bold transition-all shadow-[0_0_15px_rgba(71,250,243,0.15)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${generating ? 'animate-bounce text-[#47faf3]' : ''}`} />
            <span>{generating ? 'Mapping Telemetry...' : 'Generate / Refresh Mappings'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Candidates Card */}
        <div className="glass-panel p-4 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8b90a0] text-xs font-semibold mb-1">
            <span>Candidates (Inferred)</span>
            <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#f59e0b] mt-1">
            {stats?.candidates ?? (mappings.filter(m => m.mappingStatus === 'candidate').length)}
          </div>
          <div className="text-[10px] text-[#fcd34d] mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse"></span>
            <span>Requires Analyst Review</span>
          </div>
        </div>

        {/* Confirmed Card */}
        <div className="glass-panel p-4 rounded-xl border border-[#10b981]/30 bg-[#10b981]/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8b90a0] text-xs font-semibold mb-1">
            <span>Confirmed Attacks</span>
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#10b981] mt-1">
            {stats?.confirmed ?? (mappings.filter(m => m.mappingStatus === 'confirmed').length)}
          </div>
          <div className="text-[10px] text-[#6ee7b7] mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
            <span>Analyst Cleared</span>
          </div>
        </div>

        {/* Tactics Coverage Card */}
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-surface-container-low relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8b90a0] text-xs font-semibold mb-1">
            <span>Tactics Covered</span>
            <Layers className="w-4 h-4 text-[#47faf3]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {stats?.tacticsCoverage?.covered ?? availableTactics.length}
            <span className="text-xs text-[#8b90a0] font-normal ml-1">/ 14</span>
          </div>
          <div className="text-[10px] text-[#8b90a0] mt-1.5">
            {stats?.tacticsCoverage?.percentage ?? Math.round((availableTactics.length / 14) * 100)}% Enterprise Matrix Coverage
          </div>
        </div>

        {/* Facts vs Inferences Card */}
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-surface-container-low relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8b90a0] text-xs font-semibold mb-1">
            <span>Telemetry Types</span>
            <Activity className="w-4 h-4 text-secondary" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-lg font-bold font-mono text-[#38bdf8]">
              {stats?.observedFacts ?? mappings.filter(m => m.detectionType === 'observed').length}
              <span className="text-[10px] font-normal text-[#8b90a0] ml-1">Observed</span>
            </div>
            <span className="text-[#8b90a0]">/</span>
            <div className="text-lg font-bold font-mono text-[#c084fc]">
              {stats?.inferredTechniques ?? mappings.filter(m => m.detectionType === 'inferred').length}
              <span className="text-[10px] font-normal text-[#8b90a0] ml-1">Inferred</span>
            </div>
          </div>
          <div className="text-[10px] text-[#8b90a0] mt-1.5">
            Facts distinguished from inference
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 bg-surface-container-low flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID (e.g. T1110), Technique name, or Rationale..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-highest border border-white/10 rounded-lg text-xs text-white placeholder:text-outline focus:outline-none focus:border-[#47faf3] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tactic Filter */}
          <select
            value={tacticFilter}
            onChange={(e) => setTacticFilter(e.target.value)}
            className="bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#47faf3]"
          >
            <option value="all">All Tactics ({availableTactics.length})</option>
            {availableTactics.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#47faf3]"
          >
            <option value="all">All Statuses</option>
            <option value="candidate">Candidate Only</option>
            <option value="analyst_review">Under Review</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Confidence Filter */}
          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
            className="bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#47faf3]"
          >
            <option value="all">All Confidence</option>
            <option value="High">High Confidence</option>
            <option value="Medium">Medium Confidence</option>
            <option value="Low">Low Confidence</option>
          </select>

          {/* Detection Type Filter */}
          <select
            value={detectionTypeFilter}
            onChange={(e) => setDetectionTypeFilter(e.target.value)}
            className="bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#47faf3]"
          >
            <option value="all">All Types</option>
            <option value="observed">Observed Facts</option>
            <option value="inferred">Inferred Techniques</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="glass-panel rounded-xl p-12 text-center text-[#8b90a0] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#47faf3]" />
          <p className="text-xs font-semibold text-white">Aggregating ATT&amp;CK mappings from forensic telemetry...</p>
        </div>
      ) : filteredMappings.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center text-[#8b90a0] flex flex-col items-center justify-center gap-3 border border-white/5">
          <Crosshair className="w-12 h-12 text-outline mb-1 opacity-50" />
          <h3 className="font-semibold text-white text-sm">No MITRE ATT&amp;CK Mappings Available</h3>
          <p className="text-xs max-w-md text-[#8b90a0] leading-relaxed">
            {mappings.length === 0
              ? 'No adversary techniques have been mapped yet for this case. Click "Generate / Refresh Mappings" above to correlate persisted evidence, timeline telemetry, and IOCs.'
              : 'No technique mappings matched your current active filter criteria. Try adjusting or clearing search terms.'}
          </p>
          {mappings.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="mt-2 px-4 py-2 rounded-lg bg-[#47faf3]/15 hover:bg-[#47faf3]/25 border border-[#47faf3]/30 text-[#47faf3] text-xs font-bold transition-all"
            >
              Generate Case Mappings Now
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8b90a0] px-1">
            <span>Displaying {filteredMappings.length} technique mappings</span>
            <span className="text-[11px] font-mono">Case ID: {caseId}</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredMappings.map((mapping) => {
              const status = mapping.mappingStatus;
              const isCandidate = status === 'candidate';
              const isConfirmed = status === 'confirmed';
              const isRejected = status === 'rejected';
              const isReview = status === 'analyst_review';

              const statusBadgeClass = isConfirmed
                ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
                : isRejected
                ? 'bg-slate-500/15 text-slate-400 border-slate-500/40'
                : isReview
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/40'
                : 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40';

              const statusLabel = isConfirmed
                ? 'Confirmed Attack'
                : isRejected
                ? 'Rejected Inference'
                : isReview
                ? 'Under Review'
                : 'Candidate Inference';

              const isObserved = mapping.detectionType === 'observed';

              return (
                <div
                  key={mapping.mappingId || mapping.techniqueId}
                  className={`glass-panel p-5 rounded-xl border transition-all duration-200 ${
                    isCandidate
                      ? 'border-[#f59e0b]/30 hover:border-[#f59e0b]/50 bg-gradient-to-r from-[#f59e0b]/5 to-transparent'
                      : isConfirmed
                      ? 'border-[#10b981]/30 hover:border-[#10b981]/50 bg-gradient-to-r from-[#10b981]/5 to-transparent'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Technique Identity, Tactics & Rationale */}
                    <div className="space-y-2.5 flex-grow">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Technique ID badge */}
                        <a
                          href={`https://attack.mitre.org/techniques/${mapping.techniqueId.replace('.', '/')}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-surface-container-highest hover:bg-white/10 text-white font-mono font-bold text-xs rounded-md border border-white/10 flex items-center gap-1.5 transition-colors group"
                          title="Open official MITRE ATT&CK reference page"
                        >
                          <span className="text-[#47faf3]">{mapping.techniqueId}</span>
                          <ExternalLink className="w-3 h-3 text-outline group-hover:text-white" />
                        </a>

                        {/* Technique Canonical Name */}
                        <h4 className="text-sm font-bold text-white tracking-wide">
                          {mapping.techniqueName}
                        </h4>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 uppercase tracking-wider ${statusBadgeClass}`}>
                          {isConfirmed && <Check className="w-3 h-3 text-[#10b981]" />}
                          {isCandidate && <AlertTriangle className="w-3 h-3 text-[#f59e0b]" />}
                          {isReview && <Clock className="w-3 h-3 text-blue-400" />}
                          {isRejected && <XCircle className="w-3 h-3 text-slate-400" />}
                          <span>{statusLabel}</span>
                        </span>

                        {/* Detection Type Badge (Observed vs Inferred) */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          isObserved
                            ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30'
                            : 'bg-[#c084fc]/10 text-[#c084fc] border-[#c084fc]/30'
                        }`}>
                          {isObserved ? 'Observed Fact' : 'Inferred Technique'}
                        </span>
                      </div>

                      {/* Tactics tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] uppercase font-bold text-[#8b90a0] mr-1">Tactics:</span>
                        {mapping.tactics?.map(tac => (
                          <span
                            key={tac.tacticId}
                            className="px-2 py-0.5 rounded bg-surface-container-high border border-white/10 text-[11px] text-[#cbd5e1] font-medium"
                          >
                            {tac.tacticName} <span className="text-[9px] text-[#8b90a0] font-mono">({tac.tacticId})</span>
                          </span>
                        ))}
                      </div>

                      {/* Rule & Explainable Rationale */}
                      {mapping.matchedRules && mapping.matchedRules.length > 0 && (
                        <div className="bg-black/30 border border-white/5 rounded-lg p-3 text-xs space-y-1.5">
                          <div className="flex items-center gap-2 text-[#cbd5e1] font-semibold">
                            <Tag className="w-3.5 h-3.5 text-[#47faf3]" />
                            <span>Rule: {mapping.matchedRules[0].ruleName}</span>
                            <span className="text-[10px] font-mono text-[#8b90a0]">({mapping.matchedRules[0].ruleId})</span>
                          </div>
                          <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                            {mapping.matchedRules[0].rationale}
                          </p>
                          {mapping.matchedRules[0].matchedTelemetry && (
                            <div className="font-mono text-[10px] text-[#a5f3fc] bg-[#0f172a] p-1.5 rounded border border-white/5 truncate max-w-2xl">
                              Telemetry: {mapping.matchedRules[0].matchedTelemetry}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Provenance References Counter Badges */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#8b90a0]">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
                          <span>Supporting Evidence: <strong className="text-white">{mapping.evidenceReferences?.length || 0}</strong> records</span>
                        </div>
                        <span className="text-white/20">•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
                          <span>Timeline Correlated: <strong className="text-white">{mapping.timelineEventIds?.length || 0}</strong> events</span>
                        </div>
                        {mapping.reviewedBy && (
                          <>
                            <span className="text-white/20">•</span>
                            <div className="flex items-center gap-1 text-[10px] text-[#94a3b8]">
                              <span>Reviewed by: <strong className="text-white">{mapping.reviewedBy}</strong></span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Confidence Score & Analyst Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3 shrink-0 lg:min-w-[190px]">
                      {/* Confidence meter */}
                      <div className="w-full bg-surface-container-highest/60 p-3 rounded-lg border border-white/5">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-[#8b90a0] font-medium text-[11px]">Confidence</span>
                          <span className={`font-bold font-mono text-xs ${
                            mapping.confidence?.level === 'High'
                              ? 'text-[#10b981]'
                              : mapping.confidence?.level === 'Medium'
                              ? 'text-[#f59e0b]'
                              : 'text-outline'
                          }`}>
                            {mapping.confidence?.score ?? 50}% ({mapping.confidence?.level ?? 'Medium'})
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              mapping.confidence?.level === 'High'
                                ? 'bg-[#10b981]'
                                : mapping.confidence?.level === 'Medium'
                                ? 'bg-[#f59e0b]'
                                : 'bg-outline'
                            }`}
                            style={{ width: `${mapping.confidence?.score ?? 50}%` }}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 w-full">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(mapping)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#47faf3]" />
                          <span>Inspect</span>
                        </button>

                        {/* Quick Confirm Button */}
                        {!isConfirmed && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusUpdate(mapping.mappingId, 'confirmed')}
                            disabled={submittingReview}
                            className="px-2.5 py-1.5 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/30 text-[#10b981] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            title="Confirm this attack technique"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Quick Reject Button */}
                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusUpdate(mapping.mappingId, 'rejected')}
                            disabled={submittingReview}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-500/15 hover:bg-slate-500/25 border border-slate-500/30 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            title="Reject candidate inference"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail & Analyst Review Modal Drawer */}
      {selectedMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0f1425] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-surface-container-low shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm px-2.5 py-1 bg-[#47faf3]/10 text-[#47faf3] rounded border border-[#47faf3]/30 font-bold">
                  {selectedMapping.techniqueId}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedMapping.techniqueName}</h3>
                  <p className="text-xs text-[#8b90a0]">
                    ATT&amp;CK Mapping ID: {selectedMapping.mappingId} • Case: {selectedMapping.caseId}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseReview}
                className="text-outline hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-grow text-xs">
              {/* Technique Classification Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-high/40 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-[#8b90a0] block text-[10px] uppercase font-bold">Current Status</span>
                  <span className="font-bold text-white capitalize mt-0.5 block">{selectedMapping.mappingStatus}</span>
                </div>
                <div>
                  <span className="text-[#8b90a0] block text-[10px] uppercase font-bold">Detection Type</span>
                  <span className="font-bold text-[#38bdf8] capitalize mt-0.5 block">{selectedMapping.detectionType}</span>
                </div>
                <div>
                  <span className="text-[#8b90a0] block text-[10px] uppercase font-bold">Confidence Score</span>
                  <span className="font-bold text-[#10b981] mt-0.5 block">
                    {selectedMapping.confidence?.score}% ({selectedMapping.confidence?.level})
                  </span>
                </div>
                <div>
                  <span className="text-[#8b90a0] block text-[10px] uppercase font-bold">Catalog Source</span>
                  <span className="font-bold text-white mt-0.5 block">{selectedMapping.attackVersion || 'v14.1 Enterprise'}</span>
                </div>
              </div>

              {/* Matched Rules and Transparent Rationale */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#47faf3]" />
                  <span>Deterministic Rule Rationale</span>
                </h4>
                {selectedMapping.matchedRules?.map((r, i) => (
                  <div key={i} className="bg-surface-container-low p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{r.ruleName}</span>
                      <span className="font-mono text-[10px] text-[#47faf3]">{r.ruleId}</span>
                    </div>
                    <p className="text-[#cbd5e1] leading-relaxed">{r.rationale}</p>
                    {r.matchedTelemetry && (
                      <div className="bg-black/50 p-2.5 rounded font-mono text-[11px] text-[#a5f3fc] border border-white/5">
                        Matched Telemetry: {r.matchedTelemetry}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Supporting Evidence Provenance */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#38bdf8]" />
                  <span>Supporting Evidence Records ({selectedMapping.evidenceReferences?.length || 0})</span>
                </h4>
                {selectedMapping.evidenceReferences && selectedMapping.evidenceReferences.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {selectedMapping.evidenceReferences.map((ref, idx) => (
                      <div key={idx} className="bg-black/40 p-3 rounded-lg border border-white/5 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-[#8b90a0]">
                          <span className="font-semibold text-white">
                            {ref.fileName} {ref.relativePath ? `(${ref.relativePath})` : ''}
                          </span>
                          <span className="font-mono text-[10px]">
                            {ref.lineNumber ? `Line ${ref.lineNumber}` : `Record #${ref.recordIndex || idx + 1}`}
                          </span>
                        </div>
                        {ref.excerpt && (
                          <div className="font-mono text-[10px] text-[#cbd5e1] bg-black/60 p-2 rounded truncate">
                            {ref.excerpt}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#8b90a0] italic">No granular file records attached.</p>
                )}
              </div>

              {/* Correlated Timeline Events */}
              {selectedMapping.timelineEventIds && selectedMapping.timelineEventIds.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#f59e0b]" />
                    <span>Correlated Timeline Events ({selectedMapping.timelineEventIds.length})</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMapping.timelineEventIds.map(eid => (
                      <span
                        key={eid}
                        className="px-2.5 py-1 bg-surface-container-high border border-white/10 rounded font-mono text-xs text-[#fcd34d]"
                      >
                        {eid}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyst Review Form */}
              <form onSubmit={handleSubmitModalReview} className="border-t border-white/10 pt-4 space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#10b981]" />
                  <span>Analyst Clearance &amp; Decision</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#8b90a0] text-[11px] font-semibold mb-1">
                      Set Mapping Status:
                    </label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      className="w-full bg-surface-container-highest border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#47faf3]"
                    >
                      <option value="confirmed">Confirmed Attack (Verified)</option>
                      <option value="candidate">Candidate (Unverified Inference)</option>
                      <option value="analyst_review">Under Review (Investigating)</option>
                      <option value="rejected">Rejected (False Positive / Unsubstantiated)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#8b90a0] text-[11px] font-semibold mb-1">
                      Analyst Review Notes:
                    </label>
                    <input
                      type="text"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="e.g. Corroborated by external firewall dump..."
                      className="w-full bg-surface-container-highest border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-outline focus:outline-none focus:border-[#47faf3]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseReview}
                    className="px-4 py-2 rounded-lg bg-surface-container-high text-outline hover:text-white border border-white/10 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 rounded-lg bg-[#47faf3]/20 hover:bg-[#47faf3]/30 border border-[#47faf3]/50 text-[#47faf3] text-xs font-bold transition-all shadow-[0_0_15px_rgba(71,250,243,0.15)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{submittingReview ? 'Saving Decision...' : 'Commit Analyst Clearance'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
