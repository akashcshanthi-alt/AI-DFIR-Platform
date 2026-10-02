import React from 'react';
import { PlusCircle } from 'lucide-react';

export default function CasesHeader({ onNewCaseClick }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none text-left">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Cases</h1>
        <p className="text-xs md:text-sm text-[#94a3b8] mt-0.5">
          Incident Response & Forensic Case Management
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button 
          type="button" 
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#3B82F6] hover:brightness-110 active:scale-95 text-[#0A0F1E] font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)] flex items-center gap-2 cursor-pointer"
          onClick={onNewCaseClick}
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Case</span>
        </button>
      </div>
    </div>
  );
}
