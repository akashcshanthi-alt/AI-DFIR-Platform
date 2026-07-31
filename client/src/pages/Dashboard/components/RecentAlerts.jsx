import React from 'react';
import { Bell, AlertOctagon } from 'lucide-react';

export default function RecentAlerts({ alerts }) {
  return (
    <div className="col-span-12 md:col-span-4">
      <div className="soc-card min-h-[300px]">
        <div className="flex items-center justify-between select-none border-b border-white/5 pb-3 mb-3">
          <div className="flex items-center gap-2 text-white">
            <Bell className="w-4 h-4 text-orange-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Recent Alerts</h2>
          </div>
          <span className="text-[10px] text-[#cbd5e1]/40 font-mono font-semibold">Triage Queue</span>
        </div>

        <div className="flex-grow overflow-y-auto space-y-3 pr-1 max-h-[220px]">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex gap-2.5 border-b border-white/[0.02] pb-2.5 last:border-0 last:pb-0">
              <AlertOctagon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                alert.severity === 'CRITICAL' ? 'text-[#ffb4ab]' : 'text-orange-400'
              }`} />
              <div className="flex flex-col min-w-0">
                <span className="text-[11.5px] font-bold text-white truncate">{alert.title}</span>
                <span className="text-[10.5px] text-[#cbd5e1]/65 mt-0.5 leading-snug truncate">{alert.description}</span>
                <span className="text-[8.5px] text-[#cbd5e1]/40 font-mono mt-1">ID: {alert.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
