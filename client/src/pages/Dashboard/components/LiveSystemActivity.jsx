import React from 'react';
import { Terminal } from 'lucide-react';

export default function LiveSystemActivity({ activities }) {
  return (
    <div className="col-span-12 md:col-span-4">
      <div className="soc-card min-h-[300px]">
        <div className="flex items-center justify-between select-none border-b border-white/5 pb-3 mb-3">
          <div className="flex items-center gap-2 text-white">
            <Terminal className="w-4 h-4 text-[#47faf3]" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Live System Activity</h2>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#47faf3] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#47faf3]"></span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[220px]">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                activity.type === 'error' ? 'bg-[#ffb4ab]' :
                activity.type === 'success' ? 'bg-[#47faf3]' : 'bg-[#aec6ff]'
              }`} />
              <div className="flex-grow min-w-0">
                <p className="text-[11px] font-mono text-[#cbd5e1] leading-tight break-words">{activity.text}</p>
                <p className="text-[9.5px] text-[#cbd5e1]/40 font-mono mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
