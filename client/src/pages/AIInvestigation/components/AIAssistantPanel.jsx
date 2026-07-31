import React from 'react';
import { Bot } from 'lucide-react';
import ThreatSummary from './ThreatSummary';
import SuggestedActions from './SuggestedActions';
import NetworkPreview from './NetworkPreview';

export default function AIAssistantPanel() {
  return (
    <aside className="hidden xl:flex flex-col w-96 bg-[#111827]/80 border-l border-[rgba(71,250,243,0.15)] p-6 space-y-6 shrink-0 overflow-y-auto custom-scrollbar">
      
      {/* Title */}
      <div className="flex items-center justify-between mb-2 select-none">
        <h3 className="font-headline-md text-[20px] text-[#F8FAFC] flex items-center gap-2 font-bold">
          <Bot className="w-5 h-5 text-secondary" />
          AI ASSISTANT
        </h3>
        <span className="font-code-sm text-secondary bg-secondary/10 px-2 py-1 rounded text-[12px] font-bold">Confidence: 98%</span>
      </div>

      {/* Model Analytics Info Box */}
      <div className="glass-panel p-4 rounded-xl bg-[#101827] border border-[rgba(71,250,243,0.15)] space-y-2 text-[11px] font-mono text-[#94A3B8] select-none">
        <div className="flex justify-between">
          <span className="text-[#94A3B8]/60">MODEL VERSION:</span>
          <span className="text-[#F8FAFC] font-bold">TRACE AI v1.0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#94A3B8]/60">CONFIDENCE INDEX:</span>
          <span className="text-secondary font-bold">98%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#94A3B8]/60">LAST UPDATED:</span>
          <span className="text-[#F8FAFC] font-bold">14:45:02 UTC</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#94A3B8]/60">PROCESSING LATENCY:</span>
          <span className="text-secondary font-bold">184ms</span>
        </div>
      </div>

      <ThreatSummary />
      <SuggestedActions />
      <NetworkPreview />
    </aside>
  );
}
