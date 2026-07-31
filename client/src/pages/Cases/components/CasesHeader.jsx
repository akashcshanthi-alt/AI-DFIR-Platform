import React from 'react';
import { Upload, Download, UserPlus, PlusCircle } from 'lucide-react';

export default function CasesHeader({ onNewCaseClick }) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8 select-none">
      <div>
        <h1 className="font-display-lg text-4xl font-bold text-on-surface tracking-tight">Cases</h1>
        <p className="text-on-surface-variant text-sm mt-1">Incident Response Lifecycle Management</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="bg-surface-variant/50 hover:bg-surface-variant text-on-surface px-4 py-2.5 rounded-lg border border-white/10 flex items-center gap-2 text-sm font-semibold transition-all">
          <Upload className="w-4 h-4" />
          Import
        </button>
        <button type="button" className="bg-surface-variant/50 hover:bg-surface-variant text-on-surface px-4 py-2.5 rounded-lg border border-white/10 flex items-center gap-2 text-sm font-semibold transition-all">
          <Download className="w-4 h-4" />
          Export
        </button>
        <button type="button" className="bg-surface-variant/50 hover:bg-surface-variant text-on-surface px-4 py-2.5 rounded-lg border border-white/10 flex items-center gap-2 text-sm font-semibold transition-all">
          <UserPlus className="w-4 h-4" />
          Assign Analyst
        </button>
        <button 
          type="button" 
          className="bg-[#3b82f6] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 glow-primary hover:opacity-90 active:scale-95 transition-all text-sm"
          onClick={onNewCaseClick}
        >
          <PlusCircle className="w-4 h-4" />
          New Case
        </button>
      </div>
    </div>
  );
}
