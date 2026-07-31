import React from 'react';

export default function InvestigationTimeline() {
  return (
    <div className="glass-panel rounded-xl p-6">
      <h3 className="font-label-caps text-label-caps text-[#F8FAFC] mb-6 text-left">INVESTIGATION TIMELINE</h3>
      <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-secondary before:via-error before:to-transparent select-none">
        
        {/* Event 1 */}
        <div className="relative">
          <div className="absolute -left-[28px] top-1.5 w-4 h-4 bg-[#0F172A] rounded-full border-2 border-secondary hover:scale-125 transition-transform duration-200"></div>
          <div className="flex justify-between items-start">
            <div className="text-left">
              <span className="font-code-sm text-[11px] text-secondary">14:22:15 UTC</span>
              <h4 className="font-body-md font-semibold text-[#F8FAFC] mt-1 text-sm">Suspicious RDP Login</h4>
              <p className="font-body-md text-xs text-[#94A3B8] mt-1">Source: 45.12.88.2 (Moscow, RU) to Host SRV-PROD-SQL01</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-secondary/10 border border-secondary/30 text-[10px] font-label-caps text-secondary select-none font-bold">VALIDATED</span>
          </div>
        </div>

        {/* Event 2 - Active / Pulsing */}
        <div className="relative">
          <div className="absolute -left-[28px] top-1.5 w-4 h-4 bg-[#0F172A] rounded-full border-2 border-error timeline-pulse-active hover:scale-125 transition-transform duration-200 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-error rounded-full" />
          </div>
          <div className="flex justify-between items-start">
            <div className="text-left">
              <span className="font-code-sm text-[11px] text-error font-bold">14:45:02 UTC</span>
              <h4 className="font-body-md font-semibold text-[#F8FAFC] mt-1 text-sm">Unusual DNS Query Pattern</h4>
              <p className="font-body-md text-xs text-[#94A3B8] mt-1">Detected potential DNS tunneling (340 queries/sec) to unknown TLD.</p>
            </div>
            <button type="button" className="px-2 py-0.5 rounded bg-error/10 border border-error/30 text-[10px] font-label-caps text-error hover:bg-error/20 font-bold outline-none cursor-pointer transition-colors">INVESTIGATE</button>
          </div>
        </div>

        {/* Event 3 */}
        <div className="relative">
          <div className="absolute -left-[28px] top-1.5 w-4 h-4 bg-[#0F172A] rounded-full border-2 border-outline/30 hover:scale-125 transition-transform duration-200"></div>
          <div className="flex justify-between items-start opacity-60">
            <div className="text-left">
              <span className="font-code-sm text-[11px] text-[#94A3B8]">15:10:00 UTC</span>
              <h4 className="font-body-md font-semibold text-[#F8FAFC] mt-1 text-sm">Automated Snapshot Triggered</h4>
              <p className="font-body-md text-xs text-[#94A3B8] mt-1">System policy triggered full backup of involved volumes.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
