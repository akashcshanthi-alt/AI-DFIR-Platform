import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, Trash2, History } from 'lucide-react';

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
  allCases,
  selectedCaseIds,
  handleCheckboxChange,
  handleMasterCheckboxChange,
  formatCaseId,
  getSeverityBadgeClass,
  getStatusBadgeClass,
  getAnalystInitials,
  getRiskColor
}) {
  const navigate = useNavigate();

  return (
    <div className="glass-card rounded-xl border border-white/5 flex-grow flex flex-col min-h-[500px]">
      <div className="overflow-x-auto w-full flex-grow scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky-header border-b border-white/5">
            <tr className="select-none">
              <th scope="col" className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="rounded bg-surface-container-low border-white/10 text-primary focus:ring-0 cursor-pointer"
                  onChange={handleMasterCheckboxChange}
                  checked={allCases.length > 0 && selectedCaseIds.size === allCases.length}
                />
              </th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase">Case ID</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase">Incident Name</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase text-center">Severity</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase text-center">Status</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase">Analyst</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase text-center">AI Risk</th>
              <th scope="col" className="px-6 py-4 text-[11px] font-label-caps text-on-surface-variant uppercase text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {cases.map((item) => {
              const isChecked = selectedCaseIds.has(item.caseId);
              const risk = item.riskScore || (item.severity.toUpperCase() === 'CRITICAL' ? 98 : item.severity.toUpperCase() === 'HIGH' ? 74 : item.severity.toUpperCase() === 'MEDIUM' ? 32 : 5);
              const riskColor = getRiskColor(risk);
              const analystName = item.assignedAnalyst || 'Autonomous';

              return (
                <tr 
                  key={item.caseId} 
                  className={`table-row-hover transition-all duration-200 group ${item.status.toLowerCase() === 'closed' ? 'opacity-70' : ''}`}
                >
                  <td className="px-6 py-5 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded bg-surface-container-low border-white/10 text-primary focus:ring-0 cursor-pointer"
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(item.caseId)}
                    />
                  </td>
                  <td 
                    className="px-6 py-5 font-code-sm text-primary font-semibold cursor-pointer"
                    onClick={() => navigate(`/cases/${item.caseId}`)}
                  >
                    {formatCaseId(item.caseId)}
                  </td>
                  <td 
                    className="px-6 py-5 cursor-pointer"
                    onClick={() => navigate(`/cases/${item.caseId}`)}
                  >
                    <div className="flex flex-col">
                      <span className={`font-semibold text-on-surface ${item.status.toLowerCase() === 'closed' ? 'line-through' : ''}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/60 mt-0.5">
                        {item.lastUpdated ? `Updated ${item.lastUpdated}` : 'Active'} &bull; Host: {item.targetHost || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getSeverityBadgeClass(item.severity)}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <AnalystAvatar 
                        src={item.avatar} 
                        alt={analystName} 
                        initials={getAnalystInitials(analystName)} 
                      />
                      <span className="text-sm font-medium">{analystName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 flex justify-center">
                    <div 
                      className="risk-circle flex items-center justify-center select-none" 
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
                  <td className="px-6 py-5 text-right pr-6">
                    <div className="flex items-center justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                      {item.status.toLowerCase() === 'closed' ? (
                        <button
                          type="button"
                          className="p-1.5 text-on-surface-variant hover:text-primary cursor-pointer rounded-md hover:bg-primary/10 transition-colors"
                          title="View case history"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
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
                            title="Add analyst note"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            className="p-1.5 text-on-surface-variant hover:text-error cursor-pointer rounded-md hover:bg-error/10 transition-colors"
                            title="Delete case workspace"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
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
        <span className="text-xs font-label-caps">Showing {cases.length} of {allCases.length} cases</span>
        <div className="flex items-center gap-2">
          <button type="button" className="px-3 py-1 hover:bg-surface-variant rounded-md transition-all text-xs disabled:opacity-30 font-semibold" disabled>Previous</button>
          <button type="button" className="px-3 py-1 bg-primary/20 text-primary rounded-md font-bold text-xs">1</button>
          <button type="button" className="px-3 py-1 hover:bg-surface-variant rounded-md transition-all text-xs font-semibold">2</button>
          <span className="px-1 text-on-surface-variant/30 font-bold">&bull;&bull;&bull;</span>
          <button type="button" className="px-3 py-1 hover:bg-surface-variant rounded-md transition-all text-xs font-semibold">Next</button>
        </div>
      </div>
    </div>
  );
}
