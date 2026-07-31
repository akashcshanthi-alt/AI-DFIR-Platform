import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AIInvestigation.css';
import { FolderClosed } from 'lucide-react';

// Import modular sub-components
import InvestigationHeader from './components/InvestigationHeader';
import InvestigationTabs from './components/InvestigationTabs';
import CaseSummary from './components/CaseSummary';
import CriticalEntities from './components/CriticalEntities';
import MitreMatrix from './components/MitreMatrix';
import InvestigationTimeline from './components/InvestigationTimeline';
import AIAssistantPanel from './components/AIAssistantPanel';

// Import existing feature tab views
import EvidenceTab from '../Cases/components/CasesTable'; // or fallback mockup views
import TimelineTab from '../Cases/components/CaseTimeline';

export default function AIInvestigation() {
  const navigate = useNavigate();

  // Auth Guard check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Tab controller state
  const [activeTab, setActiveTab] = useState('overview');

  if (!hasSession) return null;

  return (
    <div className="trace-details-layout flex flex-col min-h-screen w-full select-none ai-investigation-grid-bg box-border">
      
      <InvestigationHeader 
        caseId="#TR-9902" 
        severity="CRITICAL" 
        status="ACTIVE" 
        analystName="J. Dorsey" 
        analystRole="Lead Analyst"
      />
      
      <InvestigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace display area */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* Tab 1: Overview Panel */}
        {activeTab === 'overview' && (
          <div className="flex-grow flex flex-col xl:flex-row overflow-hidden w-full">
            
            {/* Scrollable Main body column */}
            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar min-w-0">
              <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto">
                
                {/* Left: Summary cards and assets */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <CaseSummary />
                  <CriticalEntities />
                </div>

                {/* Center: Matrix and timeline */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                  <MitreMatrix />
                  <InvestigationTimeline />
                </div>

              </div>
            </div>

            {/* Right: AI Panel recommendations & map */}
            <AIAssistantPanel />

          </div>
        )}

        {/* Dynamic sub-tab components */}
        {activeTab === 'timeline' && (
          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar w-full">
            <div className="max-w-4xl mx-auto">
              <InvestigationTimeline />
            </div>
          </div>
        )}

        {/* Placeholders for secondary tabs in standalone mockup */}
        {['evidence', 'ai-analysis', 'artifacts', 'iocs', 'report'].includes(activeTab) && (
          <div className="flex-grow p-6 flex items-center justify-center w-full">
            <div className="glass-panel rounded-xl p-8 text-center text-[#8b90a0] flex flex-col items-center justify-center gap-4 max-w-md select-none">
              <FolderClosed className="w-12 h-12 text-outline/40" />
              <h3 className="font-semibold text-white text-base">No Data Correlated</h3>
              <p className="text-xs leading-relaxed">
                There are no forensic artifacts or indicators of compromise extracted for this mock view yet. Run active response agent telemetry scan to populate details.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
