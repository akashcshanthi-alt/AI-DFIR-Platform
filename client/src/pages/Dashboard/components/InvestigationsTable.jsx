import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';

export default function InvestigationsTable({ cases, formatCaseId, getSeverityBadgeClass, getOperatorInitial }) {
  const navigate = useNavigate();

  return (
    <div className="col-span-12 lg:col-span-8">
      <div className="soc-card min-h-[360px]">
        <div className="flex justify-between items-center select-none border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-2 text-white">
            <FolderOpen className="w-4 h-4 text-[#3b82f6]" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Active Investigations</h2>
          </div>
          <button 
            type="button" 
            className="px-3 py-1 rounded bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 hover:bg-[#3b82f6]/20 text-[10.5px] font-semibold uppercase tracking-wider transition-colors"
            onClick={() => navigate('/cases')}
          >
            All Cases
          </button>
        </div>

        <div className="overflow-x-auto w-full flex-grow">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-[#cbd5e1]/55">
                <th scope="col" className="pb-3 pl-2">Case ID</th>
                <th scope="col" className="pb-3">Title</th>
                <th scope="col" className="pb-3">Severity</th>
                <th scope="col" className="pb-3">Operator</th>
                <th scope="col" className="pb-3 text-right pr-2">Confidence</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-white/5">
              {cases.map((item) => (
                <tr 
                  key={item.caseId} 
                  className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => navigate(`/cases/${item.caseId}`)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/cases/${item.caseId}`);
                    }
                  }}
                >
                  <td className="py-3 pl-2 font-mono text-[#3b82f6] font-semibold">{formatCaseId(item.caseId)}</td>
                  <td className="py-3 font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]" title={item.title}>
                    {item.title}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getSeverityBadgeClass(item.severity)}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] text-[#47faf3] font-mono font-bold select-none">
                      {getOperatorInitial(item.assignedAnalyst)}
                    </div>
                    <span className="text-[#cbd5e1]/80">{item.assignedAnalyst || 'Autonomous'}</span>
                  </td>
                  <td className="py-3 text-right pr-2 font-mono text-[#47faf3] font-semibold">
                    {item.confidence || '84.5%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
