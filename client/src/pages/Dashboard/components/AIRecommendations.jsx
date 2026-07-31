import React from 'react';
import { Lightbulb } from 'lucide-react';

export default function AIRecommendations() {
  return (
    <div className="col-span-12 md:col-span-4">
      <div className="soc-card min-h-[300px] flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 select-none border-b border-white/5 pb-3 mb-3 text-white">
            <Lightbulb className="w-4 h-4 text-[#aec6ff]" />
            <h2 className="text-xs font-bold uppercase tracking-wider">AI Recommendations</h2>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5">
              <span className="text-[10.5px] font-bold text-white block">Tighten EDR Host Isolation Rule</span>
              <span className="text-[10px] text-[#cbd5e1]/60 mt-0.5 block">Restrict DC outbound connections to authorized gateways only.</span>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5">
              <span className="text-[10.5px] font-bold text-white block">Audit VPN Session Limits</span>
              <span className="text-[10px] text-[#cbd5e1]/60 mt-0.5 block">Kill admin accounts active beyond 2 hours continuously.</span>
            </div>
          </div>
        </div>

        <button 
          type="button" 
          className="w-full mt-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg shadow transition-colors duration-200"
        >
          Apply Global Policies
        </button>
      </div>
    </div>
  );
}
