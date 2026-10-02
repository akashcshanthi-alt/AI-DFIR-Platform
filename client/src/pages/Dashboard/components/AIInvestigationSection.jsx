import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, Loader2, ArrowRight, Server, FileSearch } from 'lucide-react';

export default function AIInvestigationSection({ latestRun, readiness, targetCaseId }) {
  const navigate = useNavigate();

  // Determine status: Completed, Running, or Not Started
  let statusText = 'Not Started';
  let badgeStyle = 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  let StatusIcon = FileSearch;

  if (latestRun) {
    if (latestRun.status === 'completed') {
      statusText = 'Completed';
      badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      StatusIcon = CheckCircle2;
    } else if (latestRun.status === 'in_progress') {
      statusText = 'Running';
      badgeStyle = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 animate-pulse';
      StatusIcon = Loader2;
    } else if (latestRun.status === 'failed') {
      statusText = 'Failed';
      badgeStyle = 'bg-red-500/15 text-red-400 border-red-500/30';
      StatusIcon = CheckCircle2;
    }
  }

  const modelName = readiness?.model || latestRun?.model || 'mistral:latest';
  const isOnline = Boolean(readiness?.ready);

  const handleNavigate = () => {
    if (latestRun?.caseId) {
      navigate(`/cases/${latestRun.caseId}`);
    } else if (targetCaseId) {
      navigate(`/cases/${targetCaseId}`);
    } else {
      navigate('/cases');
    }
  };

  return (
    <div className="soc-card flex flex-col justify-between p-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[#47faf3]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">AI Investigation</h2>
              <p className="text-xs text-[#cbd5e1]/60">AI analysis of security evidence.</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${statusText === 'Running' ? 'animate-spin' : ''}`} />
            <span>{statusText}</span>
          </div>
        </div>

        {/* Engine Readiness Banner */}
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-400'}`} />
            <div>
              <span className="text-xs font-bold text-white tracking-wide">Local LLM Engine</span>
              <div className="text-[11px] text-[#cbd5e1]/60 font-mono mt-0.5">{modelName}</div>
            </div>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${isOnline ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Latest Run Findings / Summary */}
        <div className="bg-[#0a0f1d]/60 border border-white/5 rounded-xl p-3.5 space-y-2">
          {latestRun ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#47faf3]">
                  {latestRun.runId} • Case {latestRun.caseId}
                </span>
                <span className="text-[10px] text-[#cbd5e1]/40 font-mono">
                  {new Date(latestRun.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-[#cbd5e1]/80 line-clamp-2 leading-relaxed">
                {latestRun.executiveSummary || 'Automated multi-stage hypothesis validation completed.'}
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-[#cbd5e1]/60">
                <span>Validated Hypotheses: <strong className="text-white">{latestRun.hypotheses?.length ?? 0}</strong></span>
                <span>•</span>
                <span>Referenced Files: <strong className="text-white">{latestRun.referencedEvidence?.length ?? 0}</strong></span>
              </div>
            </>
          ) : (
            <div className="py-2 text-center text-xs text-[#cbd5e1]/50">
              No recent automated investigation run found. Start analysis from any incident case.
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation Button */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-[#cbd5e1]/50">LangGraph Forensics Pipeline</span>
        <button
          type="button"
          onClick={handleNavigate}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#47faf3] hover:text-[#47faf3]/80 transition-colors cursor-pointer"
        >
          <span>{latestRun ? 'Review Findings' : 'Start Investigation'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
