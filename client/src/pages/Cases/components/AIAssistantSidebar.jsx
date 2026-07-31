import React from 'react';
import { Bot, Slash, Key, FileText } from 'lucide-react';

export default function AIAssistantSidebar({ targetHost = 'SRV-PROD-SQL01' }) {
  return (
    <aside className="hidden xl:flex flex-col w-96 bg-surface-container-low/50 border-l border-white/5 p-6 space-y-8 shrink-0">
      <div className="flex items-center justify-between mb-2 select-none">
        <h3 className="font-headline-md text-[20px] text-on-surface flex items-center gap-2 font-bold">
          <Bot className="w-5 h-5 text-secondary" />
          AI ASSISTANT
        </h3>
        <span className="font-code-sm text-secondary bg-secondary/10 px-2 py-1 rounded text-[12px] font-bold">98% Confidence</span>
      </div>

      {/* Threat Intelligence */}
      <div className="glass-panel p-4 rounded-lg bg-primary-container/10 border-primary-container/20">
        <p className="font-label-caps text-[11px] text-primary-container mb-2 font-bold tracking-wide">LIVE THREAT SUMMARY</p>
        <p className="text-sm text-on-surface leading-relaxed">
          The observed behavior patterns strongly match <span className="text-secondary font-semibold">APT28 (Fancy Bear)</span>. Recommend immediate isolation of <span className="text-white font-mono">{targetHost}</span> as data egress is currently active at 2.4MB/s.
        </p>
      </div>

      {/* Suggested Actions */}
      <div className="space-y-4 pt-4">
        <p className="font-label-caps text-[11px] text-outline tracking-wider font-bold">SUGGESTED COUNTERMEASURES</p>
        
        <button type="button" className="w-full flex items-center gap-4 p-4 rounded-xl border border-error/20 bg-error/5 hover:bg-error/10 transition-all group outline-none">
          <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
            <Slash className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="font-body-md font-semibold text-error text-sm">Isolate Endpoint</p>
            <p className="text-[12px] text-outline">Disconnect host from VLAN</p>
          </div>
        </button>

        <button type="button" className="w-full flex items-center gap-4 p-4 rounded-xl border border-secondary/20 bg-secondary/5 hover:bg-secondary/10 transition-all group outline-none">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
            <Key className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="font-body-md font-semibold text-secondary text-sm">Revoke Session Tokens</p>
            <p className="text-[12px] text-outline">Force re-auth for all users</p>
          </div>
        </button>

        <button type="button" className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-surface-container-high/40 hover:bg-surface-container-high transition-all group outline-none">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-outline group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="font-body-md font-semibold text-on-surface text-sm">Generate Memo</p>
            <p className="text-[12px] text-outline">Notify compliance officer</p>
          </div>
        </button>
      </div>

      {/* Live Network Map Preview */}
      <div className="mt-auto glass-panel rounded-xl overflow-hidden aspect-video relative group select-none">
        <div 
          className="w-full h-full bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD1fCUBCySzKLTlzJ1-eWZBIx7X57MamBRokp7hX8XDUF8PqihLvVNSywe2Wz2O1Ud5533pwrwIoBwgxB6vYV_An_mGmm9P_KcS1Zxzt8Fnc0oS30BHtARbx4MxEKgu3e4DbIf3g5lFtU7_n5HTHzze9MLNNvoVstAMmaXAWBFfXxSTIKCWdETxSlBmpFWW1UcKrbWGDkqpYlyIq1jsEnwMIdTHtSGm3aXKD2DE9Hh8uTr7M4ruiuJK')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent"></div>
        <div className="absolute bottom-4 left-4">
          <p className="font-label-caps text-[10px] text-secondary tracking-wider font-bold">REAL-TIME TRAFFIC</p>
          <p className="font-body-md font-bold text-white text-sm">Interactive Topology</p>
        </div>
        <button type="button" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="font-label-caps text-[12px] text-white border border-white/40 px-4 py-2 rounded font-bold tracking-wider">EXPAND MAP</span>
        </button>
      </div>
    </aside>
  );
}
