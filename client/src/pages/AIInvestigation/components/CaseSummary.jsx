import React from 'react';
import { Sparkles } from 'lucide-react';

export default function CaseSummary() {
  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-16 h-16 text-secondary" />
      </div>
      <h3 className="font-label-caps text-label-caps text-secondary mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-secondary" /> 
        AI CASE SUMMARY
      </h3>
      <p className="font-body-md text-[#94A3B8] leading-relaxed mb-6">
        Detected anomalous traffic pattern consistent with <span className="text-[#47FAF3] font-semibold">Data Exfiltration Alpha</span>. Unauthorized RDP session established from a sanctioned IP (192.168.1.144) utilizing administrative credentials. Current phase involves large-scale encrypted tunnel formation targeting external S3 buckets.
      </p>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-end mb-2 select-none">
            <span className="font-label-caps text-[11px] text-[#94A3B8]">INVESTIGATION PROGRESS</span>
            <span className="font-code-sm text-secondary">65%</span>
          </div>
          <div className="h-1.5 w-full bg-[#101827] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-secondary-fixed-dim to-secondary w-[65%] shadow-[0_0_8px_rgba(71,250,243,0.4)]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 select-none">
          <div className="bg-[#101827] p-3 rounded-xl border border-[rgba(71,250,243,0.15)] text-left">
            <p className="font-label-caps text-[10px] text-[#94A3B8]">PHASE</p>
            <p className="font-headline-md text-[18px] text-secondary mt-1">Exfiltration</p>
          </div>
          <div className="bg-[#101827] p-3 rounded-xl border border-[rgba(71,250,243,0.15)] text-left">
            <p className="font-label-caps text-[10px] text-[#94A3B8]">PRIORITY</p>
            <p className="font-headline-md text-[18px] text-error mt-1">P0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
