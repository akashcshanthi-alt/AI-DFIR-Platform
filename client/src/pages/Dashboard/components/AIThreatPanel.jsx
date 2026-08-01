import React, { useState } from 'react';
import { Brain, Lock, ArrowRight, Terminal, CheckCircle2 } from 'lucide-react';

export default function AIThreatPanel() {
  const [toastMsg, setToastMsg] = useState('');

  const handleAction = (actionName) => {
    setToastMsg(`Initiating Action: ${actionName}`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="col-span-12 lg:col-span-4 relative">
      {toastMsg && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-[#0f1425] border border-[#47faf3] text-[#47faf3] text-[10px] px-3 py-1.5 rounded-lg shadow-xl font-bold whitespace-nowrap">
          {toastMsg}
        </div>
      )}
      <div className="soc-card min-h-[460px] relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#47faf3] select-none">
            <Brain className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">AI Threat Intelligence</h2>
          </div>

          {/* Forensic Summary box */}
          <div className="bg-[#aec6ff]/5 border border-[#aec6ff]/10 rounded-xl p-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-bold text-white tracking-wide">Forensic Digest</span>
              <span className="bg-[#ffb4ab]/20 text-[#ffb4ab] text-[9px] px-2 py-0.5 rounded font-bold">CRITICAL</span>
            </div>
            <p className="text-xs text-[#cbd5e1]/75 leading-relaxed mt-2.5">
              Anomalous lateral movements observed on <span className="text-white font-mono font-semibold">DC-PROD-01</span>. Signatures indicate <span className="text-[#47faf3] italic font-semibold">"ShadowShift"</span> threat vector activity. Automatic quarantine is active.
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-[#aec6ff] font-semibold mb-1">
                <span>AI Confidence</span>
                <span>94%</span>
              </div>
              <div className="w-full bg-[#050814] h-1 rounded-full overflow-hidden">
                <div className="bg-[#3b82f6] h-full w-[94%]" />
              </div>
            </div>
          </div>

          {/* Recommended actions list */}
          <div className="mt-5 space-y-2.5">
            <span className="text-[10px] font-bold uppercase text-[#cbd5e1]/50 tracking-wider">Actions Suggested</span>
            <button 
              type="button" 
              onClick={() => handleAction('Revoke Access Tokens')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-xs group text-left text-white outline-none"
            >
              <span className="flex items-center gap-2.5">
                <Lock className="w-3.5 h-3.5 text-[#47faf3]" />
                Revoke Active Access Tokens
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#47faf3]" />
            </button>
            <button 
              type="button" 
              onClick={() => handleAction('Kernel Dump Analysis')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-xs group text-left text-white outline-none"
            >
              <span className="flex items-center gap-2.5">
                <Terminal className="w-3.5 h-3.5 text-[#47faf3]" />
                Deploy Kernel Dump Analysis
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#47faf3]" />
            </button>
          </div>
        </div>

        {/* Trace integrity segments */}
        <div className="border-t border-white/5 pt-4 mt-4 select-none">
          <div className="flex items-center justify-between text-[10px] text-[#cbd5e1]/60 font-semibold uppercase tracking-wider mb-2">
            <span>Surveillance Index Integrity</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#47faf3]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-1 bg-[#47faf3] rounded-full"></div>
            <div className="h-1 bg-[#47faf3] rounded-full"></div>
            <div className="h-1 bg-slate-800 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
