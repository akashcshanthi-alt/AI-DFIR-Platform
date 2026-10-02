import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, AlertCircle, Clock } from 'lucide-react';

export default function ActiveIncidentsSection({ stats, recentCases }) {
  const navigate = useNavigate();

  const activeCount = stats?.openCases ?? 0;
  const criticalCount = stats?.criticalCases ?? 0;
  const totalCount = stats?.totalCases ?? 0;

  // Filter to active cases (Open or Investigating)
  const activeCasesList = (recentCases || [])
    .filter(c => c.status !== 'Closed')
    .slice(0, 3);

  const getSeverityBadge = (severity) => {
    const s = (severity || '').toUpperCase();
    if (s === 'CRITICAL') {
      return 'bg-red-500/15 text-red-400 border border-red-500/30';
    }
    if (s === 'HIGH') {
      return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
    }
    if (s === 'MEDIUM') {
      return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
    }
    return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
  };

  return (
    <div className="soc-card flex flex-col justify-between p-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Active Incidents</h2>
              <p className="text-xs text-[#cbd5e1]/60">Security cases that need attention.</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#cbd5e1]/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            {totalCount} Total Cases
          </span>
        </div>

        {/* Primary Metric Banner */}
        <div className="flex items-baseline gap-4 mb-4 bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <div>
            <span className="text-3xl font-extrabold text-white tracking-tight">{activeCount}</span>
            <span className="text-xs text-[#cbd5e1]/60 ml-2 font-medium">Currently Active</span>
          </div>
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 ml-auto bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-bold text-red-400">{criticalCount} Critical</span>
            </div>
          )}
        </div>

        {/* Recent Active Cases Preview */}
        <div className="space-y-2">
          {activeCasesList.length === 0 ? (
            <p className="text-xs text-[#cbd5e1]/40 py-4 text-center">No active security cases requiring attention.</p>
          ) : (
            activeCasesList.map(c => (
              <div
                key={c._id || c.caseId}
                onClick={() => navigate(`/cases/${c.caseId}`)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#0a0f1d]/60 border border-white/5 hover:border-white/15 hover:bg-[#0f172a] transition-all cursor-pointer group"
              >
                <div className="flex flex-col min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#47faf3]">{c.caseId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${getSeverityBadge(c.severity)}`}>
                      {c.severity}
                    </span>
                  </div>
                  <span className="text-xs text-[#e2e8f0] font-medium truncate mt-1 group-hover:text-white">
                    {c.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-[#cbd5e1]/50 font-mono flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Navigation Button */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-[#cbd5e1]/50">Managed in Case Center</span>
        <button
          type="button"
          onClick={() => navigate('/cases')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#47faf3] hover:text-[#47faf3]/80 transition-colors cursor-pointer"
        >
          <span>View All Cases</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
