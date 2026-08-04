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
        <button type="button" className="btn-secondary">
          <Upload className="w-4 h-4" />
          Import
        </button>
        <button type="button" className="btn-secondary">
          <Download className="w-4 h-4" />
          Export
        </button>
        <button type="button" className="btn-secondary">
          <UserPlus className="w-4 h-4" />
          Assign Analyst
        </button>
        <button 
          type="button" 
          className="btn-primary"
          onClick={onNewCaseClick}
        >
          <PlusCircle className="w-4 h-4" />
          New Case
        </button>
      </div>
    </div>
  );
}
