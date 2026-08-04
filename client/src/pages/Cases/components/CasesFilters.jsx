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
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          input.trace-cases-filter-input {
            width: 100% !important;
            height: 48px !important;
            padding: 0 16px 0 48px !important;
            background-color: #0B1220 !important;
            border: 1px solid rgba(0, 255, 255, 0.12) !important;
            border-radius: 12px !important;
            color: #FFFFFF !important;
            font-size: 0.875rem !important;
            outline: none !important;
            transition: all 0.25s ease !important;
            box-sizing: border-box !important;
          }
          input.trace-cases-filter-input:focus {
            border-color: #00FFFF !important;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.2) !important;
          }
          input.trace-cases-filter-input::placeholder {
            color: #94A3B8 !important;
            opacity: 1 !important;
          }
          .trace-cases-filter-select {
            height: 48px !important;
            padding: 0 12px !important;
            background-color: #0B1220 !important;
            border: 1px solid rgba(0, 255, 255, 0.12) !important;
            border-radius: 12px !important;
            color: #FFFFFF !important;
            font-size: 0.875rem !important;
            outline: none !important;
            cursor: pointer !important;
            transition: all 0.25s ease !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .trace-cases-filter-select:focus {
            border-color: #00FFFF !important;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.2) !important;
          }
          .trace-cases-filter-btn {
            height: 48px !important;
            background-color: #0B1220 !important;
            border: 1px solid rgba(0, 255, 255, 0.12) !important;
            border-radius: 12px !important;
            color: #FFFFFF !important;
            font-size: 0.875rem !important;
            outline: none !important;
            cursor: pointer !important;
            transition: all 0.25s ease !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .trace-cases-filter-btn:hover {
            color: #00FFFF !important;
            border-color: #00FFFF !important;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.2) !important;
          }
        `
      }} />

      <div className="p-5 mb-6 flex flex-col gap-4" style={{
        background: '#141C2B',
        border: '1px solid rgba(0, 255, 255, 0.12)',
        borderRadius: '18px',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)'
      }}>
        {/* Row 1: Full-width search bar */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 pointer-events-none" />
          <input 
            type="text" 
            className="trace-cases-filter-input" 
            placeholder="Search cases, hashes, IPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Row 2: Grid-based filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <select 
            className="trace-cases-filter-select"
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
            className="trace-cases-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
          
          <select 
            className="trace-cases-filter-select"
            value={analystFilter}
            onChange={(e) => setAnalystFilter(e.target.value)}
          >
            <option value="All">Analyst</option>
            <option value="J. Dorsey">J. Dorsey</option>
            <option value="S. Kovac">S. Kovac</option>
            <option value="A. Miller">A. Miller</option>
          </select>
          
          <select 
            className="trace-cases-filter-select"
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
          >
            <option value="All">Date Range</option>
            <option value="Last 24h">Last 24h</option>
            <option value="Last 7d">Last 7d</option>
            <option value="Last 30d">Last 30d</option>
          </select>

          <button 
            type="button" 
            className="trace-cases-filter-btn"
          >
            <Tag className="w-4 h-4" />
            <span>Tags</span>
          </button>
        </div>
      </div>
    </>
  );
}
