import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Pencil, Trash2, Calendar, Shield } from 'lucide-react';

export default function CasesTable({
  cases,
  selectedCaseIds,
  handleCheckboxChange,
  handleMasterCheckboxChange,
  formatCaseId,
  getSeverityBadgeClass,
  getStatusBadgeClass,
  
  // Pagination
  currentPage,
  totalPages,
  totalCases,
  onPageChange,

  // Action Handlers
  onEditClick,
  onDeleteClick
}) {
  const navigate = useNavigate();

  return (
    <div className="glass-card rounded-2xl border border-white/10 flex flex-col overflow-hidden bg-[#0e1424]/90 shadow-xl">
      <div className="overflow-x-auto w-full scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-white/10 bg-[#070C16]/80 text-[#94a3b8] select-none">
              <th scope="col" className="px-5 py-4 w-12 text-center align-middle">
                <input 
                  type="checkbox" 
                  className="rounded bg-[#141C2B] border-white/20 text-[#00E5FF] focus:ring-0 cursor-pointer"
                  onChange={handleMasterCheckboxChange}
                  checked={cases.length > 0 && selectedCaseIds.size === cases.length}
                />
              </th>
              <th scope="col" className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Case ID</th>
              <th scope="col" className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Case Title</th>
              <th scope="col" className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Incident Type</th>
              <th scope="col" className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-center">Severity</th>
              <th scope="col" className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-center">Status</th>
              <th scope="col" className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Created Date</th>
              <th scope="col" className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-white">
            {cases.map((item) => {
              const isChecked = selectedCaseIds.has(item.caseId);
              const caseKey = item.caseId || item._id;

              return (
                <tr 
                  key={caseKey} 
                  className={`hover:bg-white/[0.03] transition-colors group ${item.status?.toLowerCase() === 'closed' ? 'opacity-70' : ''}`}
                >
                  <td className="px-5 py-4 text-center align-middle">
                    <input 
                      type="checkbox" 
                      className="rounded bg-[#141C2B] border-white/20 text-[#00E5FF] focus:ring-0 cursor-pointer align-middle"
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(item.caseId)}
                    />
                  </td>
                  
                  {/* Case ID */}
                  <td 
                    className="px-5 py-4 font-mono font-bold text-[#00E5FF] cursor-pointer align-middle whitespace-nowrap"
                    onClick={() => navigate(`/cases/${caseKey}`)}
                  >
                    {formatCaseId(item.caseId)}
                  </td>

                  {/* Case Title & optional description snippet */}
                  <td 
                    className="px-5 py-4 cursor-pointer align-middle text-left max-w-xs"
                    onClick={() => navigate(`/cases/${caseKey}`)}
                  >
                    <div className="flex flex-col">
                      <span className={`font-bold text-white group-hover:text-[#00E5FF] transition-colors truncate ${item.status?.toLowerCase() === 'closed' ? 'line-through opacity-70' : ''}`}>
                        {item.title}
                      </span>
                      {item.description && (
                        <span className="text-[10px] text-[#94a3b8] truncate mt-0.5 max-w-sm">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Incident Type */}
                  <td className="px-5 py-4 align-middle text-[#cbd5e1] whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#00E5FF] shrink-0 opacity-70" />
                      <span>{item.incidentType || 'General Security Incident'}</span>
                    </span>
                  </td>

                  {/* Severity Badge */}
                  <td className="px-5 py-4 text-center align-middle whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getSeverityBadgeClass(item.severity)}`}>
                      {item.severity}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-4 text-center align-middle whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>

                  {/* Created Date */}
                  <td className="px-5 py-4 align-middle text-[#94a3b8] font-mono text-[11px] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#64748b]" />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right pr-6 align-middle whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 text-[#00E5FF] font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                        onClick={() => navigate(`/cases/${caseKey}`)}
                        title="Open Case Investigation"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Case</span>
                      </button>
                      <button 
                        type="button"
                        className="p-1.5 text-[#94a3b8] hover:text-[#47faf3] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        onClick={() => onEditClick(item)}
                        title="Edit Case Details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button"
                        className="p-1.5 text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-colors cursor-pointer"
                        onClick={() => onDeleteClick(item.caseId || item._id)}
                        title="Delete Case"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="bg-[#070C16] p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#94a3b8] select-none">
        <span>
          Showing {totalCases > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, totalCases)} of {totalCases} cases
        </span>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            className="px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all text-xs disabled:opacity-30 font-semibold cursor-pointer disabled:cursor-not-allowed text-white border border-white/10" 
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </button>
          <span className="px-3 py-1 bg-[#00E5FF]/15 text-[#00E5FF] rounded-lg font-bold text-xs border border-[#00E5FF]/30">
            {currentPage} / {totalPages || 1}
          </span>
          <button 
            type="button" 
            className="px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all text-xs disabled:opacity-30 font-semibold cursor-pointer disabled:cursor-not-allowed text-white border border-white/10"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
