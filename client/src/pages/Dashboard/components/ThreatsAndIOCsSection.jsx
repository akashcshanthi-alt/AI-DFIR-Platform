import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ThreatsAndIOCsSection({ iocs, totalCount }) {
  const navigate = useNavigate();

  const getSeverityBadge = (severity) => {
    const s = (severity || '').toUpperCase();
    if (s === 'CRITICAL') return 'bg-red-500/15 text-red-400 border-red-500/30';
    if (s === 'HIGH') return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    if (s === 'MEDIUM') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  };

  const getTypeBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('ip')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if (t.includes('domain') || t.includes('url')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (t.includes('hash') || t.includes('sha') || t.includes('md5')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
  };

  return (
    <div className="soc-card flex flex-col justify-between p-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Threats & IOCs</h2>
              <p className="text-xs text-[#cbd5e1]/60">Detected threats and important Indicators of Compromise.</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#cbd5e1]/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            {totalCount ?? iocs?.length ?? 0} Detected
          </span>
        </div>

        {/* IOC List */}
        <div className="space-y-2.5">
          {!iocs || iocs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#cbd5e1]/40 flex flex-col items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400/60" />
              <span>No active Indicators of Compromise detected.</span>
            </div>
          ) : (
            iocs.slice(0, 4).map((ioc) => (
              <div
                key={ioc._id || ioc.iocId}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0a0f1d]/60 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex flex-col min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-bold ${getTypeBadge(ioc.indicatorType)}`}>
                      {ioc.indicatorType}
                    </span>
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${getSeverityBadge(ioc.severity)}`}>
                      {ioc.severity}
                    </span>
                    {ioc.caseId && (
                      <span
                        onClick={() => navigate(`/cases/${ioc.caseId}`)}
                        className="text-[10px] font-mono text-[#cbd5e1]/50 hover:text-[#47faf3] cursor-pointer transition-colors"
                      >
                        {ioc.caseId}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-white truncate select-all" title={ioc.normalizedValue || ioc.value}>
                    {ioc.normalizedValue || ioc.value}
                  </span>
                </div>

                <div className="text-[11px] font-medium text-[#cbd5e1]/40 flex-shrink-0">
                  {ioc.status || 'Active'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Navigation Button */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-[#cbd5e1]/50">Forensic Indicator Registry</span>
        <button
          type="button"
          onClick={() => navigate('/cases')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#47faf3] hover:text-[#47faf3]/80 transition-colors cursor-pointer"
        >
          <span>View In Cases</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
