import React from 'react';
import { Slash, Key, FileText } from 'lucide-react';

export default function SuggestedActions() {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-label-caps text-[11px] text-outline tracking-wider font-bold">SUGGESTED COUNTERMEASURES</p>
      
      {/* Isolate Endpoint - Red Accent */}
      <button 
        type="button" 
        className="w-full flex items-center gap-4 p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[#101827]/80 backdrop-blur-md hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(71,250,243,0.15)] transition-all duration-300 group outline-none text-left"
      >
        <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444] group-hover:scale-110 transition-transform duration-300">
          <Slash className="w-4 h-4" />
        </div>
        <div>
          <p className="font-body-md font-semibold text-[#F8FAFC] text-sm">Isolate Endpoint</p>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">Disconnect host from VLAN</p>
        </div>
      </button>

      {/* Revoke Session Tokens - Cyan Accent */}
      <button 
        type="button" 
        className="w-full flex items-center gap-4 p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[#101827]/80 backdrop-blur-md hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(71,250,243,0.15)] transition-all duration-300 group outline-none text-left"
      >
        <div className="w-10 h-10 rounded-full bg-[#47FAF3]/10 flex items-center justify-center text-[#47FAF3] group-hover:scale-110 transition-transform duration-300">
          <Key className="w-4 h-4" />
        </div>
        <div>
          <p className="font-body-md font-semibold text-[#F8FAFC] text-sm">Revoke Session Tokens</p>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">Force re-auth for all users</p>
        </div>
      </button>

      {/* Generate Memo - Blue Accent */}
      <button 
        type="button" 
        className="w-full flex items-center gap-4 p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[#101827]/80 backdrop-blur-md hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(71,250,243,0.15)] transition-all duration-300 group outline-none text-left"
      >
        <div className="w-10 h-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] group-hover:scale-110 transition-transform duration-300">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <p className="font-body-md font-semibold text-[#F8FAFC] text-sm">Generate Memo</p>
          <p className="text-[12px] text-outline text-[#94A3B8] mt-0.5">Notify compliance officer</p>
        </div>
      </button>
    </div>
  );
}
