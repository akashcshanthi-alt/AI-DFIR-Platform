import React from 'react';

export default function MitreAttackMatrix() {
  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-label-caps text-label-caps text-on-surface">MITRE ATT&amp;CK MATRIX</h3>
        <div className="flex gap-2">
          <span className="w-3 h-3 bg-error/80 rounded-sm"></span>
          <span className="font-label-caps text-[10px] text-outline">DETECTED</span>
          <span className="w-3 h-3 bg-surface-container-highest rounded-sm ml-2"></span>
          <span className="font-label-caps text-[10px] text-outline">NORMAL</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 select-none">
        <div className="space-y-2">
          <div className="bg-surface-container-highest p-2 rounded text-center border-b-2 border-white/5"><span class="font-label-caps text-[9px] text-outline">INITIAL ACCESS</span></div>
          <div className="bg-error/30 border border-error/40 p-2 rounded text-[10px] font-label-caps text-error">Valid Accounts</div>
          <div className="bg-surface-container-highest/50 p-2 rounded text-[10px] font-label-caps text-outline/50">Phishing</div>
        </div>
        <div className="space-y-2">
          <div className="bg-surface-container-highest p-2 rounded text-center border-b-2 border-white/5"><span class="font-label-caps text-[9px] text-outline">EXECUTION</span></div>
          <div className="bg-surface-container-highest/50 p-2 rounded text-[10px] font-label-caps text-outline/50">Command Line</div>
          <div className="bg-error/30 border border-error/40 p-2 rounded text-[10px] font-label-caps text-error">PowerShell</div>
        </div>
        <div className="space-y-2">
          <div className="bg-surface-container-highest p-2 rounded text-center border-b-2 border-white/5"><span class="font-label-caps text-[9px] text-outline">LATERAL MOVE</span></div>
          <div className="bg-error/30 border border-error/40 p-2 rounded text-[10px] font-label-caps text-error">Remote Desktop</div>
          <div className="bg-surface-container-highest/50 p-2 rounded text-[10px] font-label-caps text-outline/50">SMB/Windows Admin</div>
        </div>
        <div className="space-y-2">
          <div className="bg-surface-container-highest p-2 rounded text-center border-b-2 border-white/5"><span class="font-label-caps text-[9px] text-outline">C2</span></div>
          <div className="bg-error/60 border border-error/80 p-2 rounded text-[10px] font-label-caps text-on-error font-bold shadow-[0_0_10px_rgba(255,180,171,0.3)]">T1071.001 App Layer</div>
          <div className="bg-surface-container-highest/50 p-2 rounded text-[10px] font-label-caps text-outline/50">Fallback Channels</div>
        </div>
        <div className="space-y-2">
          <div className="bg-surface-container-highest p-2 rounded text-center border-b-2 border-white/5"><span class="font-label-caps text-[9px] text-outline">EXFILTRATION</span></div>
          <div className="bg-error/30 border border-error/40 p-2 rounded text-[10px] font-label-caps text-error">Exfil Over C2</div>
          <div className="bg-surface-container-highest/50 p-2 rounded text-[10px] font-label-caps text-outline/50">Data Compression</div>
        </div>
      </div>
    </div>
  );
}
