import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export default function RecentAlertsSection({ alerts }) {
  const navigate = useNavigate();

  const getSeverityBadge = (severity) => {
    const s = (severity || '').toUpperCase();
    if (s === 'CRITICAL') return 'bg-red-500/15 text-red-400 border-red-500/30';
    if (s === 'HIGH') return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    if (s === 'MEDIUM') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="soc-card flex flex-col justify-between p-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Recent Alerts</h2>
              <p className="text-xs text-[#cbd5e1]/60">Latest important security alerts.</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#cbd5e1]/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            {alerts?.length || 0} Alerts
          </span>
        </div>

        {/* Alerts List */}
        <div className="space-y-2.5">
          {!alerts || alerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#cbd5e1]/40 flex flex-col items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400/60" />
              <span>No critical or high security alerts recorded.</span>
            </div>
          ) : (
            alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id || alert._id}
                className="p-3 rounded-lg bg-[#0a0f1d]/60 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">
                      {alert.title}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-[#cbd5e1]/40 font-mono flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(alert.timestamp)}</span>
                  </span>
                </div>
                <p className="text-xs text-[#cbd5e1]/70 line-clamp-1 leading-snug">
                  {alert.description}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Navigation Button */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-[#cbd5e1]/50">Audit & Alert Stream</span>
        <button
          type="button"
          onClick={() => navigate('/audit')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#47faf3] hover:text-[#47faf3]/80 transition-colors cursor-pointer"
        >
          <span>View Audit Logs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
