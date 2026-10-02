import React from 'react';
import { Search } from 'lucide-react';

export default function CasesFilters({
  searchQuery,
  setSearchQuery,
  severityFilter,
  setSeverityFilter,
  statusFilter,
  setStatusFilter
}) {
  return (
    <div 
      className="p-4 mb-6 flex flex-col md:flex-row items-center gap-4 rounded-xl border border-white/10 bg-[#0B1220]/80 shadow-lg backdrop-blur-md"
    >
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] w-4 h-4 pointer-events-none" />
        <input 
          type="text" 
          className="w-full h-11 pl-10 pr-4 bg-[#070C16] border border-white/10 focus:border-[#00E5FF] focus:shadow-[0_0_15px_rgba(0,229,255,0.15)] rounded-xl text-white text-xs placeholder:text-[#64748b] outline-none transition-all"
          placeholder="Search by case title, Case ID, incident type, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Filters: Severity & Status */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <select 
          className="h-11 px-3 bg-[#070C16] border border-white/10 focus:border-[#00E5FF] rounded-xl text-white text-xs outline-none cursor-pointer w-full md:w-40"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="All">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        
        <select 
          className="h-11 px-3 bg-[#070C16] border border-white/10 focus:border-[#00E5FF] rounded-xl text-white text-xs outline-none cursor-pointer w-full md:w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Investigating">Investigating</option>
          <option value="Closed">Closed</option>
        </select>
      </div>
    </div>
  );
}
