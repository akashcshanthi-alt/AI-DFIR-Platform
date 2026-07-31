import React from 'react';
import { Search, Tag } from 'lucide-react';

export default function CasesFilters({
  searchQuery,
  setSearchQuery,
  severityFilter,
  setSeverityFilter,
  statusFilter,
  setStatusFilter,
  analystFilter,
  setAnalystFilter,
  dateRangeFilter,
  setDateRangeFilter
}) {
  return (
    <div className="glass-card p-4 rounded-xl mb-6 flex flex-wrap items-center gap-4">
      <div className="relative flex-grow min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4 pointer-events-none" />
        <input 
          type="text" 
          className="bg-surface-container-low border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm w-full focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50" 
          placeholder="Search cases, hashes, IPs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <select 
          className="bg-surface-container-low border border-white/5 rounded-lg text-xs py-2 px-3 focus:ring-primary outline-none text-on-surface font-semibold cursor-pointer"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="All">Severity</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        
        <select 
          className="bg-surface-container-low border border-white/5 rounded-lg text-xs py-2 px-3 focus:ring-primary outline-none text-on-surface font-semibold cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>
        
        <select 
          className="bg-surface-container-low border border-white/5 rounded-lg text-xs py-2 px-3 focus:ring-primary outline-none text-on-surface font-semibold cursor-pointer"
          value={analystFilter}
          onChange={(e) => setAnalystFilter(e.target.value)}
        >
          <option value="All">Analyst</option>
          <option value="J. Dorsey">J. Dorsey</option>
          <option value="S. Kovac">S. Kovac</option>
          <option value="A. Miller">A. Miller</option>
        </select>
        
        <select 
          className="bg-surface-container-low border border-white/5 rounded-lg text-xs py-2 px-3 focus:ring-primary outline-none text-on-surface font-semibold cursor-pointer"
          value={dateRangeFilter}
          onChange={(e) => setDateRangeFilter(e.target.value)}
        >
          <option value="All">Date Range</option>
          <option value="Last 24h">Last 24h</option>
          <option value="Last 7d">Last 7d</option>
          <option value="Last 30d">Last 30d</option>
        </select>

        <button type="button" className="p-2 bg-surface-container border border-white/5 rounded-lg text-on-surface-variant hover:text-primary transition-all flex items-center">
          <Tag className="w-3.5 h-3.5" />
          <span className="ml-1 text-[10px] font-bold tracking-wider font-mono">TAGS</span>
        </button>
      </div>
    </div>
  );
}
