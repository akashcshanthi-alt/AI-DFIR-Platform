import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  AlertTriangle,
  FileText,
  CheckCircle2,
  AlertOctagon,
  Info,
  RefreshCw,
  Clock,
  Layers,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Zap,
  Terminal,
  Server
} from 'lucide-react';
import { aiService } from '../../services/ai.service';

const WORKFLOW_STAGES = [
  'Load Case Context',
  'Prepare & Redact Evidence',
  'Build Candidate Hypotheses',
  'Validate Hypotheses & Provenance',
  'Synthesize Summary & Gaps',
  'Persist Run & Audit Trail'
];

export default function AIAnalysisTab({ caseId }) {
  const [readiness, setReadiness] = useState(null);
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Referenced evidence modal
  const [referencedEvidence, setReferencedEvidence] = useState(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  // Collapsible sections
  const [showRejected, setShowRejected] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [readinessRes, runsRes] = await Promise.all([
        aiService.getReadiness().catch(err => ({
          ready: false,
          status: 'OFFLINE',
          error: err.message
        })),
        aiService.getInvestigationRuns({ caseId, limit: 20 })
      ]);

      setReadiness(readinessRes);
      const fetchedRuns = runsRes.items || [];
      setRuns(fetchedRuns);

      if (fetchedRuns.length > 0) {
        setActiveRun(prev => prev || fetchedRuns[0]);
      }
    } catch (err) {
      console.error('Failed to load AI investigation data:', err);
      setError(err.message || 'Failed to load AI data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      loadData();
    }
  }, [caseId]);

  const handleStartInvestigation = async () => {
    let timerInterval = null;
    const stageTimeoutIds = [];
    try {
      setInvestigating(true);
      setError(null);
      setActionSuccess(null);
      setActiveStage(0);
      setElapsedSeconds(0);

      const startTime = Date.now();
      timerInterval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      // Realistic milestone progression:
      // Stage 0 (Load Case Context): 0 - 2s
      // Stage 1 (Prepare & Redact): 2 - 5s
      // Stage 2 (Build Candidate Hypotheses): 5 - 12s
      // Stage 3 (Validate Hypotheses & Provenance): 12 - 20s
      // Stage 4 (Synthesize Summary & Gaps with Ollama LLM): 20s+ (stays here until API responds!)
      stageTimeoutIds.push(setTimeout(() => setActiveStage(1), 2000));
      stageTimeoutIds.push(setTimeout(() => setActiveStage(2), 5000));
      stageTimeoutIds.push(setTimeout(() => setActiveStage(3), 12000));
      stageTimeoutIds.push(setTimeout(() => setActiveStage(4), 20000));

      const newRun = await aiService.startInvestigation(caseId);

      // Clear pending stage increments
      stageTimeoutIds.forEach(id => clearTimeout(id));
      if (timerInterval) clearInterval(timerInterval);

      // Upon API resolution, advance to final persist stage (100%)
      setActiveStage(WORKFLOW_STAGES.length - 1);
      setActionSuccess(`Investigation run [${newRun.runId}] completed successfully.`);
      setActiveRun(newRun);
      setRuns(prev => [newRun, ...prev.filter(r => r.runId !== newRun.runId)]);

      // Brief transition delay so operator sees 100% completion before settling
      await new Promise(r => setTimeout(r, 600));
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Investigation failed:', err);
      stageTimeoutIds.forEach(id => clearTimeout(id));
      if (timerInterval) clearInterval(timerInterval);
      setError(err.message || 'Investigation run failed.');
    } finally {
      if (timerInterval) clearInterval(timerInterval);
      setInvestigating(false);
      setActiveStage(0);
      setElapsedSeconds(0);
    }
  };

  const handleInspectReferencedEvidence = async (runId) => {
    try {
      setLoadingEvidence(true);
      setIsEvidenceModalOpen(true);
      const data = await aiService.getReferencedEvidence(runId);
      setReferencedEvidence(data.evidenceItems || []);
    } catch (err) {
      console.error('Failed to fetch evidence:', err);
      setError(err.message || 'Failed to fetch referenced evidence.');
    } finally {
      setLoadingEvidence(false);
    }
  };

  const isOllamaOnline = readiness?.ready === true;

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
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

      {/* Ollama Readiness Status Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        isOllamaOnline
          ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#6ee7b7]'
          : 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#fcd34d]'
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <Server className={`w-5 h-5 shrink-0 ${isOllamaOnline ? 'text-[#10b981]' : 'text-[#f59e0b]'}`} />
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Local Ollama LLM Service:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                isOllamaOnline ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
              }`}>
                {readiness?.status || 'OFFLINE'}
              </span>
              <span className="text-[#8b90a0] font-normal">({readiness?.model || 'mistral:latest'})</span>
            </div>
            <p className="text-[11px] text-[#cbd5e1] mt-0.5">
              {isOllamaOnline
                ? readiness.message || 'Ollama server is active and ready for local inference.'
                : 'Ollama is offline or unreachable. Start Ollama locally with: "ollama run mistral:latest". Ordinary DFIR ingestion, timeline, and MITRE mapping remain fully functional.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-surface-container-high border border-white/10 text-white hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Probe Status</span>
        </button>
      </div>

      {/* Mandatory Operational Warning Banner */}
      <div className="bg-surface-container-low border border-white/5 rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed text-[#94a3b8]">
        <Info className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-white mb-0.5 flex items-center gap-2">
            <span>AI Investigation Engine Architecture (LangGraph + Ollama)</span>
            <span className="bg-[#38bdf8]/15 text-[#38bdf8] text-[10px] font-mono px-2 py-0.5 rounded border border-[#38bdf8]/30">
              UNTRUSTED EVIDENCE SANDBOX
            </span>
          </div>
          <p className="text-[#cbd5e1] text-[11px]">
            The investigation workflow enforces deterministic stage gates. Evidence payloads are sandboxed as untrusted data with credentials redacted.
            Every candidate hypothesis is verified against persisted evidence IDs—unsupported or hallucinated claims are strictly rejected.
          </p>
        </div>
      </div>

      {/* Top Header & Investigation Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-[#47faf3]" />
            <span>AI Forensic Investigation Engine</span>
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 bg-[#47faf3]/10 text-[#47faf3] rounded-full border border-[#47faf3]/20">
              LangGraph DFIR Workflow
            </span>
          </h2>
          <p className="text-xs text-[#8b90a0] mt-1">
            Deterministic reasoning graph analyzing persisted evidence records, timeline chronology, and threat indicators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Previous runs selector */}
          {runs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8b90a0]">Run:</span>
              <select
                value={activeRun?.runId || ''}
                onChange={(e) => {
                  const selected = runs.find(r => r.runId === e.target.value);
                  if (selected) setActiveRun(selected);
                }}
                className="bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#47faf3]"
              >
                {runs.map(r => (
                  <option key={r.runId} value={r.runId}>
                    {r.runId} ({new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) - {r.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartInvestigation}
            disabled={investigating}
            className="px-4 py-2 rounded-lg bg-[#47faf3]/15 hover:bg-[#47faf3]/25 border border-[#47faf3]/40 text-[#47faf3] text-xs font-bold transition-all shadow-[0_0_15px_rgba(71,250,243,0.15)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${investigating ? 'animate-bounce text-[#47faf3]' : ''}`} />
            <span>{investigating ? 'Running LangGraph Workflow...' : 'Execute AI Investigation'}</span>
          </button>
        </div>
      </div>

      {/* Live Stage Progress Indicator while running */}
      {investigating && (
        <div className="glass-panel p-5 rounded-xl border border-[#47faf3]/30 bg-[#47faf3]/5 space-y-3 animate-fade-in">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#47faf3]" />
              <span>Executing Stage {activeStage + 1} of {WORKFLOW_STAGES.length}: {WORKFLOW_STAGES[activeStage]}</span>
            </span>
            <span className="font-mono text-[#47faf3] font-bold">
              {activeStage === WORKFLOW_STAGES.length - 1
                ? 100
                : Math.min(85, Math.round(((activeStage + 1) / WORKFLOW_STAGES.length) * 100))}%
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-1">
            {WORKFLOW_STAGES.map((stg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-center text-[10px] font-semibold border transition-all ${
                  i < activeStage
                    ? 'bg-[#10b981]/20 border-[#10b981]/40 text-[#10b981]'
                    : i === activeStage
                    ? 'bg-[#47faf3]/20 border-[#47faf3]/50 text-[#47faf3] animate-pulse'
                    : 'bg-surface-container-high border-white/5 text-[#8b90a0]'
                }`}
              >
                {stg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Display: Active Run Findings */}
      {investigating ? (
        <div className="glass-panel rounded-xl p-8 sm:p-12 text-center text-[#8b90a0] flex flex-col items-center justify-center gap-4 border border-[#47faf3]/30 bg-[#47faf3]/5 animate-fade-in">
          <div className="relative">
            <Cpu className="w-14 h-14 text-[#47faf3] animate-bounce" />
            <RefreshCw className="w-5 h-5 animate-spin text-white absolute -bottom-1 -right-1" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="font-bold text-white text-base">
              Executing LangGraph Multi-Stage Investigation
            </h3>
            <p className="text-xs text-[#8b90a0] leading-relaxed">
              Stage {activeStage + 1} of {WORKFLOW_STAGES.length}:{' '}
              <strong className="text-[#47faf3]">{WORKFLOW_STAGES[activeStage]}</strong>
            </p>
            <p className="text-[11px] text-[#cbd5e1]">
              Analyzing case evidence records, testing hypothesis provenance, and synthesizing incident narrative using local Ollama model <span className="font-mono text-white">mistral:latest</span>.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#47faf3] bg-surface-container-high/80 px-3 py-1.5 rounded-lg border border-white/10 mt-1">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Execution Elapsed: {elapsedSeconds}s</span>
          </div>
        </div>
      ) : loading ? (
        <div className="glass-panel rounded-xl p-12 text-center text-[#8b90a0] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#47faf3]" />
          <p className="text-xs font-semibold text-white">Loading forensic investigation findings...</p>
        </div>
      ) : !activeRun ? (
        <div className="glass-panel rounded-xl p-12 text-center text-[#8b90a0] flex flex-col items-center justify-center gap-3 border border-white/5">
          <Cpu className="w-12 h-12 text-outline mb-1 opacity-50" />
          <h3 className="font-semibold text-white text-sm">No AI Investigation Executed Yet</h3>
          <p className="text-xs max-w-md text-[#8b90a0] leading-relaxed">
            Execute the LangGraph investigation workflow to synthesize candidate hypotheses, validate evidence references, and identify visibility gaps for this case.
          </p>
          <button
            onClick={handleStartInvestigation}
            disabled={investigating}
            className="mt-2 px-4 py-2 rounded-lg bg-[#47faf3]/15 hover:bg-[#47faf3]/25 border border-[#47faf3]/30 text-[#47faf3] text-xs font-bold transition-all cursor-pointer"
          >
            Start Investigation Run
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Run Header Badges & Execution Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-surface-container-high/40 p-3.5 rounded-xl border border-white/5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-surface-container-highest border border-white/10">
                Run ID: {activeRun.runId}
              </span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] border ${
                activeRun.status === 'completed'
                  ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
                  : 'bg-error/15 text-error border-error/40'
              }`}>
                {activeRun.status}
              </span>
              <span className="text-[#8b90a0]">
                Model: <strong className="text-white font-mono">{activeRun.model}</strong>
              </span>
              <span className="text-[#8b90a0]">
                Workflow: <strong className="text-white">{activeRun.workflowVersion}</strong>
              </span>
              <span className="text-[#8b90a0]">
                Duration: <strong className="text-white">{activeRun.runDurationMs}ms</strong>
              </span>
            </div>

            <button
              onClick={() => handleInspectReferencedEvidence(activeRun.runId)}
              className="text-[#38bdf8] hover:underline flex items-center gap-1 font-semibold text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Inspect Analyzed Evidence ({activeRun.referencedEvidence?.length || 0} files)</span>
            </button>
          </div>

          {/* Executive Summary Card */}
          <div className="glass-panel p-6 rounded-xl border border-white/5 bg-surface-container-low space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#47faf3]" />
                <span>Executive Summary</span>
              </h3>
              <span className="text-[10px] font-mono text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded border border-[#f59e0b]/30">
                CANDIDATE AI SYNTHESIS
              </span>
            </div>
            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              {activeRun.executiveSummary}
            </p>

            {activeRun.candidateNarrative && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-secondary" />
                  <span>Adversary Intrusion Narrative Flow</span>
                </h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  {activeRun.candidateNarrative}
                </p>
              </div>
            )}
          </div>

          {/* Validated Candidate Hypotheses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#10b981]" />
                <span>Validated Candidate Hypotheses ({activeRun.hypotheses?.length || 0})</span>
              </h3>
              <span className="text-xs text-[#8b90a0]">
                Strict provenance verified: zero fabricated IDs
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {activeRun.hypotheses?.map((hyp, idx) => {
                const isObserved = hyp.classification === 'observed_fact';
                return (
                  <div
                    key={idx}
                    className="glass-panel p-5 rounded-xl border border-white/10 hover:border-white/20 transition-all space-y-3 bg-surface-container-low"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#47faf3]">
                            {hyp.hypothesisId}
                          </span>
                          <h4 className="text-sm font-bold text-white">{hyp.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            isObserved
                              ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30'
                              : 'bg-[#c084fc]/10 text-[#c084fc] border-[#c084fc]/30'
                          }`}>
                            {isObserved ? 'Observed Fact' : 'Candidate Hypothesis'}
                          </span>
                          {hyp.techniqueId && (
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-surface-container-highest rounded text-white border border-white/10">
                              {hyp.techniqueId}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#cbd5e1] leading-relaxed pt-1">
                          {hyp.statement}
                        </p>
                      </div>

                      {/* Confidence Gauge */}
                      <div className="bg-surface-container-highest/60 p-2.5 rounded-lg border border-white/5 shrink-0 min-w-[140px] text-right">
                        <span className="text-[10px] text-[#8b90a0] block">Confidence Estimate</span>
                        <span className="font-mono font-bold text-xs text-[#10b981]">
                          {hyp.confidence?.score}% ({hyp.confidence?.level})
                        </span>
                        <div className="w-full bg-surface-container-low h-1 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-[#10b981] h-full rounded-full"
                            style={{ width: `${hyp.confidence?.score || 50}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Supporting References */}
                    <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-xs space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#8b90a0]">Supporting Evidence:</span>
                        {hyp.supportingEvidenceIds?.map(id => (
                          <span key={id} className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 font-bold">
                            {id}
                          </span>
                        ))}
                        {hyp.supportingTimelineEventIds?.length > 0 && (
                          <>
                            <span className="text-white/20 mx-1">•</span>
                            <span className="text-[11px] font-semibold text-[#8b90a0]">Timeline Events:</span>
                            {hyp.supportingTimelineEventIds.map(tid => (
                              <span key={tid} className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 font-bold">
                                {tid}
                              </span>
                            ))}
                          </>
                        )}
                      </div>

                      {/* Uncertainty Rationale */}
                      {hyp.confidence?.uncertaintyRationale && (
                        <div className="text-[11px] text-[#94a3b8] italic">
                          Rationale: {hyp.confidence.uncertaintyRationale}
                        </div>
                      )}

                      {/* Missing Information / Contradictions */}
                      {(hyp.contradictoryEvidence !== 'None observed' || hyp.missingInformation !== 'None identified') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px]">
                          <div>
                            <span className="text-[#8b90a0]">Contradictory Telemetry:</span>{' '}
                            <span className="text-white">{hyp.contradictoryEvidence}</span>
                          </div>
                          <div>
                            <span className="text-[#8b90a0]">Missing Telemetry:</span>{' '}
                            <span className="text-white">{hyp.missingInformation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rejected Hypotheses (Hallucination Defense) */}
          {activeRun.rejectedHypotheses?.length > 0 && (
            <div className="glass-panel p-4 rounded-xl border border-error/30 bg-error/5">
              <button
                type="button"
                onClick={() => setShowRejected(!showRejected)}
                className="w-full flex items-center justify-between text-xs font-bold text-error cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-error" />
                  <span>Rejected Model Statements ({activeRun.rejectedHypotheses.length} unverified / fabricated references filtered out)</span>
                </div>
                {showRejected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showRejected && (
                <div className="mt-3 space-y-2 pt-2 border-t border-error/20">
                  {activeRun.rejectedHypotheses.map((rh, i) => (
                    <div key={i} className="bg-black/40 p-3 rounded text-xs space-y-1">
                      <div className="font-bold text-white">{rh.title}</div>
                      <div className="text-error text-[11px]">{rh.rejectionReason}</div>
                      {rh.invalidReferences?.length > 0 && (
                        <div className="font-mono text-[10px] text-slate-400">
                          Invalid IDs: {rh.invalidReferences.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Evidence Gaps & Recommended Analyst Checks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gaps */}
            <div className="glass-panel p-5 rounded-xl border border-white/5 bg-surface-container-low space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                <span>Evidence Visibility Gaps</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-[#cbd5e1]">
                {activeRun.evidenceGaps?.length > 0 ? (
                  activeRun.evidenceGaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#f59e0b] mt-0.5">•</span>
                      <span>{gap}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[#8b90a0] italic">No visibility blindspots identified.</li>
                )}
              </ul>
            </div>

            {/* Follow-ups */}
            <div className="glass-panel p-5 rounded-xl border border-white/5 bg-surface-container-low space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                <span>Recommended Analyst Verification</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-[#cbd5e1]">
                {activeRun.suggestedFollowUps?.length > 0 ? (
                  activeRun.suggestedFollowUps.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#10b981] mt-0.5 shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[#8b90a0] italic">No pending analyst verification tasks.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Referenced Evidence Modal */}
      {isEvidenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0f1425] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-surface-container-low">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#38bdf8]" />
                <span>Evidence Artifacts Analyzed in this Run</span>
              </h3>
              <button
                onClick={() => setIsEvidenceModalOpen(false)}
                className="text-outline hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs">
              {loadingEvidence ? (
                <div className="text-center py-8 text-[#8b90a0]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#47faf3] mb-2" />
                  <span>Loading evidence metadata...</span>
                </div>
              ) : referencedEvidence?.length > 0 ? (
                referencedEvidence.map((ev, idx) => (
                  <div key={idx} className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{ev.originalName || ev.fileName}</span>
                      <span className="font-mono text-[10px] text-[#38bdf8]">{ev.evidenceId}</span>
                    </div>
                    <div className="text-[#8b90a0] text-[11px]">
                      Path: <span className="font-mono text-white">{ev.relativePath || 'root'}</span> | Size: {ev.fileSize} bytes
                    </div>
                    {ev.sha256Hash && (
                      <div className="font-mono text-[10px] text-[#cbd5e1] bg-black/60 p-2 rounded truncate">
                        SHA-256: {ev.sha256Hash}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[#8b90a0] italic">No evidence items returned.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
