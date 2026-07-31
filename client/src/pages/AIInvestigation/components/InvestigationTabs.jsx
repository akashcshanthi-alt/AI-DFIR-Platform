import React from 'react';
import { Share2, Download } from 'lucide-react';

export default function InvestigationTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'ai-analysis', label: 'AI Analysis' },
    { id: 'artifacts', label: 'Artifacts' },
    { id: 'iocs', label: 'IOCs' },
    { id: 'network', label: 'Network' }
  ];

  const buttonStyle = "px-4 py-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#101827] text-[#F8FAFC] font-label-caps text-[11px] hover:bg-[#162033] hover:border-[#47FAF3] hover:shadow-[0_0_15px_rgba(71,250,243,0.15)] hover:translate-y-[-2px] transition-all duration-200 outline-none flex items-center gap-2 cursor-pointer";

  return (
    <div className="bg-[#111827]/80 backdrop-blur-xl border-b border-[rgba(71,250,243,0.15)] px-6 shrink-0 select-none">
      <div className="flex items-center justify-between gap-8 h-12">
        <div className="flex items-end gap-8 h-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`investigation-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        
        <div className="pb-1.5 flex gap-2">
          <button 
            type="button" 
            className={buttonStyle}
          >
            <Share2 className="w-3.5 h-3.5" /> 
            Share
          </button>
          
          <button 
            type="button" 
            className={buttonStyle}
          >
            <Download className="w-3.5 h-3.5" /> 
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
