import React from 'react';
import { Sparkles } from 'lucide-react';

export default function CaseSummaryCard({ title, description, progress = 65, phase = 'Exfiltration', priority = 'P0' }) {
  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-16 h-16 text-secondary" />
      </div>
      <h3 className="font-label-caps text-label-caps text-secondary mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-secondary" /> 
        AI CASE SUMMARY
      </h3>
      <p className="font-body-md text-on-surface/80 leading-relaxed mb-6">
        {description || `Detected anomalous traffic pattern consistent with ${title}. Unauthorized RDP session established from a sanctioned IP utilizing administrative credentials.`}
      </p>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="font-label-caps text-[11px] text-outline">INVESTIGATION PROGRESS</span>
            <span className="font-code-sm text-secondary">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-secondary-fixed-dim to-secondary shadow-[0_0_8px_rgba(71,250,243,0.4)]" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-surface-container-high/50 p-3 rounded-lg border border-white/5">
            <p className="font-label-caps text-[10px] text-outline">PHASE</p>
            <p className="font-headline-md text-[18px] text-secondary">{phase}</p>
          </div>
          <div className="bg-surface-container-high/50 p-3 rounded-lg border border-white/5">
            <p className="font-label-caps text-[10px] text-outline">PRIORITY</p>
            <p className="font-headline-md text-[18px] text-error">{priority}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
