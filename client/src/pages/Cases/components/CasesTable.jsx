import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, History } from 'lucide-react';

const AnalystAvatar = ({ src, alt, initials }) => {
  const [error, setError] = useState(false);
  if (error || !src) {
    return (
      <div className="w-7 h-7 rounded-full bg-surface-bright flex items-center justify-center text-[10px] font-bold border border-white/10 select-none text-white">
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className="w-7 h-7 rounded-full object-cover border border-white/10"
    />
  );
};

export default function CasesTable({
  cases,
  selectedCaseIds,
  handleCheckboxChange,
  handleMasterCheckboxChange,
  formatCaseId,
  getSeverityBadgeClass,
  getStatusBadgeClass,
  getAnalystInitials,
  getRiskColor,
  
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
    <div className="glass-card rounded-xl border border-white/5 flex-grow flex flex-col min-h-[500px]">
      <div className="overflow-x-auto w-full flex-grow scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky-header border-b border-white/5">
            <tr className="select-none">
              <th scope="col" className="px-6 py-4 w-12 text-center align-middle">
                <input 
                  type="checkbox" 
                  className="rounded bg-surface-container-low border-white/10 text-primary focus:ring-0 cursor-pointer"
                  onChange={handleMasterCheckboxChange}
                  checked={cases.length > 0 && selectedCaseIds.size === cases.length}
                />
              </th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase align-middle">Case ID</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase align-middle">Incident Name</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase text-center align-middle">Severity</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase text-center align-middle">Status</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase align-middle">Analyst</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase text-center align-middle">AI Risk</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase text-right pr-6 align-middle">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {cases.map((item) => {
              const isChecked = selectedCaseIds.has(item.caseId);
              
              // Map risk score based on severity
              const severityUpper = item.severity ? item.severity.toUpperCase() : 'HIGH';
              const risk = item.riskScore || (severityUpper === 'CRITICAL' ? 98 : severityUpper === 'HIGH' ? 74 : severityUpper === 'MEDIUM' ? 32 : 5);
              const riskColor = getRiskColor(risk);
              const analystName = item.assignedAnalyst || 'Unassigned';

              // Fallback target display
              const target = item.targetHost && item.targetHost !== 'N/A' 
                ? item.targetHost 
                : item.destinationIP 
                  ? item.destinationIP 
                  : 'N/A';

              return (
                <tr 
                  key={item.caseId} 
                  className={`table-row-hover transition-all duration-200 group ${item.status.toLowerCase() === 'closed' ? 'opacity-70' : ''}`}
                >
                  <td className="px-6 py-5 text-center align-middle">
                    <input 
                      type="checkbox" 
                      className="rounded bg-surface-container-low border-white/10 text-primary focus:ring-0 cursor-pointer align-middle"
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(item.caseId)}
                    />
                  </td>
                  <td 
                    className="px-6 py-5 font-code-sm text-primary font-semibold cursor-pointer align-middle"
                    onClick={() => navigate(`/cases/${item.caseId}`)}
                  >
                    {formatCaseId(item.caseId)}
                  </td>
                  <td 
                    className="px-6 py-5 cursor-pointer align-middle text-left"
                    onClick={() => navigate(`/cases/${item.caseId}`)}
                  >
                    <div className="flex flex-col">
                      <span className={`font-semibold text-on-surface ${item.status.toLowerCase() === 'closed' ? 'line-through' : ''}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/60 mt-0.5 font-sans">
                        Updated {new Date(item.updatedAt || item.createdAt).toLocaleDateString()} &bull; Target: {target}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center align-middle">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getSeverityBadgeClass(item.severity)}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center align-middle">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle text-left">
                    <div className="flex items-center gap-2">
                      <AnalystAvatar 
                        src={item.avatar} 
                        alt={analystName} 
                        initials={getAnalystInitials(analystName)} 
                      />
                      <span className="text-sm font-medium">{analystName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <div 
                      className="risk-circle flex items-center justify-center select-none mx-auto" 
                      style={{ 
                        '--percentage': risk, 
                        '--risk-color': riskColor 
                      }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: riskColor }}>
                        {`${risk}%`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right pr-6 align-middle">
                    <div className="flex items-center justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                      <button 
                        type="button"
                        className="p-1.5 text-on-surface-variant hover:text-primary cursor-pointer rounded-md hover:bg-primary/10 transition-colors"
                        onClick={() => navigate(`/cases/${item.caseId}`)}
                        title="View case details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        className="p-1.5 text-on-surface-variant hover:text-secondary cursor-pointer rounded-md hover:bg-secondary/10 transition-colors"
                        onClick={() => onEditClick(item)}
                        title="Edit case details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        className="p-1.5 text-on-surface-variant hover:text-error cursor-pointer rounded-md hover:bg-error/10 transition-colors"
                        onClick={() => onDeleteClick(item.caseId)}
                        title="Delete case workspace"
                      >
                        <Trash2 className="w-4 h-4" />
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
      <div className="bg-surface-container-high/30 p-4 border-t border-white/5 flex items-center justify-between text-sm text-on-surface-variant select-none">
        <span className="text-xs font-label-caps">
          Showing {totalCases > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, totalCases)} of {totalCases} cases
        </span>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            className="px-3 py-1 hover:bg-surface-variant disabled:hover:bg-transparent rounded-md transition-all text-xs disabled:opacity-30 font-semibold cursor-pointer disabled:cursor-not-allowed" 
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </button>
          <span className="px-3 py-1 bg-primary/20 text-primary rounded-md font-bold text-xs">
            {currentPage} / {totalPages || 1}
          </span>
          <button 
            type="button" 
            className="px-3 py-1 hover:bg-surface-variant disabled:hover:bg-transparent rounded-md transition-all text-xs disabled:opacity-30 font-semibold cursor-pointer disabled:cursor-not-allowed"
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
