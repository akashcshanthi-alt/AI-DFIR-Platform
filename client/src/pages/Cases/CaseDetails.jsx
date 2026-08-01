import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Download, Folder } from 'lucide-react';
import './CaseDetails.css';

// Import sub-components
import CaseSummaryCard from './components/CaseSummaryCard';
import CriticalEntities from './components/CriticalEntities';
import MitreAttackMatrix from './components/MitreAttackMatrix';
import CaseTimeline from './components/CaseTimeline';
import AIAssistantSidebar from './components/AIAssistantSidebar';

// Import existing feature tab views
import EvidenceTab from '../../features/investigation/EvidenceTab';
import AIAnalysisTab from '../../features/investigation/AIAnalysisTab';
import TimelineTab from '../../features/investigation/TimelineTab';
import ReportTab from '../../features/investigation/ReportTab';

const formatCaseId = (id) => {
  if (!id) return '';
  if (id.startsWith('CASE-')) {
    return `#TR-${id.split('-')[1]}`;
  }
  if (!id.startsWith('#')) {
    return `#${id}`;
  }
  return id;
};

export default function CaseDetails() {
  const navigate = useNavigate();
  const { id, caseId } = useParams();
  const activeCaseId = id || caseId || 'TRC-2026-0042';

  // Auth Guard check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Tab state controller
  const [activeTab, setActiveTab] = useState('overview');

  // Case details dynamic database hooks
  const [activeCase, setActiveCase] = useState(null);

  useEffect(() => {
    if (!hasSession) return;
    
    const loadActiveCase = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/dashboard/cases');
        const data = await res.json();
        
        // Find matching case from endpoint database
        const match = data.find(c => 
          c.caseId.toLowerCase() === activeCaseId.toLowerCase() ||
          c.caseId.replace('-', '').toLowerCase() === activeCaseId.toLowerCase()
        );
        
        if (match) {
          setActiveCase(match);
        } else {
          setActiveCase({
            caseId: activeCaseId,
            title: 'Suspicious Account Activity',
            severity: 'CRITICAL',
            status: 'ACTIVE',
            assignedAnalyst: 'J. Dorsey',
            targetHost: 'SRV-PROD-SQL01',
            description: 'Detected anomalous traffic pattern consistent with Data Exfiltration Alpha. Unauthorized RDP session established utilizing administrative credentials.'
          });
        }
      } catch (err) {
        console.warn('Endpoint API offline, fallback to template Case Details schema.');
        setActiveCase({
          caseId: activeCaseId,
          title: 'Suspicious Account Activity',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          assignedAnalyst: 'J. Dorsey',
          targetHost: 'SRV-PROD-SQL01',
          description: 'Detected anomalous traffic pattern consistent with Data Exfiltration Alpha. Unauthorized RDP session established utilizing administrative credentials.'
        });
      }
    };
    
    loadActiveCase();
  }, [activeCaseId, hasSession]);

  if (!hasSession) return null;
  if (!activeCase) return null;

  const targetHost = activeCase.targetHost || 'SRV-PROD-SQL01';
  const severityTag = activeCase.severity ? activeCase.severity.toUpperCase() : 'CRITICAL';
  
  return (
    <div className="trace-details-layout flex flex-col min-h-screen w-full select-none case-details-grid-bg box-border">
      
      {/* Sub-Navigation & Controls Header */}
      <div className="bg-surface-container-low px-6 border-b border-white/5 shrink-0 select-none">
        <div className="flex items-center gap-6 h-14">
          <Link to="/cases" className="flex items-center gap-2 text-outline hover:text-[#47faf3] transition-colors text-xs font-semibold mr-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cases</span>
          </Link>
          
          <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>

          <div className="flex items-end gap-6 h-full">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'evidence', label: 'Evidence' },
              { id: 'ai-analysis', label: 'AI Analysis' },
              { id: 'artifacts', label: 'Artifacts' },
              { id: 'iocs', label: 'IOCs' },
              { id: 'report', label: 'Report' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`font-label-caps text-xs font-semibold pb-3 hover:text-on-surface transition-colors border-b-2 outline-none ${
                    isActive ? 'text-secondary border-secondary' : 'text-outline border-transparent'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto pb-1 flex gap-2">
            <button type="button" className="px-4 py-1.5 rounded-lg border border-outline/20 text-outline font-label-caps text-[11px] hover:bg-white/5 transition-all flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5" /> 
              Share
            </button>
            <button type="button" className="px-4 py-1.5 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary font-label-caps text-[11px] hover:bg-secondary/20 transition-all flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> 
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Display Content Area */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* Tab 1: Overview Tab Panel Layout */}
        {activeTab === 'overview' && (
          <div className="flex-grow flex flex-col xl:flex-row overflow-hidden w-full">
            
            {/* Left/Center columns scrollable */}
            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar min-w-0">
              <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto">
                
                {/* Left Column: AI Case Summary & Critical Entities */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <CaseSummaryCard 
                    title={activeCase.title}
                    description={activeCase.description}
                    progress={activeCase.severity.toUpperCase() === 'CRITICAL' ? 92 : 65}
                    phase={activeCase.severity.toUpperCase() === 'CRITICAL' ? 'Exfiltration' : 'Triage'}
                    priority={activeCase.severity.toUpperCase() === 'CRITICAL' ? 'P0' : 'P1'}
                  />
                  <CriticalEntities 
                    targetHost={targetHost}
                    compromiseUser={activeCase.assignedAnalyst === 'Autonomous' ? 'system_daemon' : 'admin_local_svc'}
                  />
                </div>

                {/* Center Column: MITRE & Analysis Timeline */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                  <MitreAttackMatrix />
                  <CaseTimeline targetHost={targetHost} />
                </div>

              </div>
            </div>

            {/* Right Aside panel: AI recommendations & Topology */}
            <AIAssistantSidebar targetHost={targetHost} />

          </div>
        )}

        {/* Tab 2: Full Detailed Timeline Tab Panel */}
        {activeTab === 'timeline' && (
          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar w-full">
            <div className="max-w-4xl mx-auto">
              <TimelineTab caseId={activeCaseId} />
            </div>
          </div>
        )}

        {/* Tab 3: Detailed Evidence List Tab Panel */}
        {activeTab === 'evidence' && (
          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar w-full">
            <div className="max-w-6xl mx-auto">
              <EvidenceTab caseId={activeCaseId} />
            </div>
          </div>
        )}

        {/* Tab 4: AI Analysis Tab Panel */}
        {activeTab === 'ai-analysis' && (
          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar w-full">
            <div className="max-w-6xl mx-auto">
              <AIAnalysisTab caseId={activeCaseId} />
            </div>
          </div>
        )}

        {/* Tab 5: Report Export Panel */}
        {activeTab === 'report' && (
          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar w-full">
            <div className="max-w-4xl mx-auto">
              <ReportTab caseId={activeCaseId} />
            </div>
          </div>
        )}

        {/* Placeholders for Artifacts & IOCs tabs */}
        {(activeTab === 'artifacts' || activeTab === 'iocs') && (
          <div className="flex-grow p-6 flex items-center justify-center w-full">
            <div className="glass-panel rounded-xl p-8 text-center text-[#8b90a0] flex flex-col items-center justify-center gap-4 max-w-md">
              <Folder className="w-12 h-12 text-[#8b90a0] mb-1" />
              <h3 className="font-semibold text-white text-base">No Data Correlated</h3>
              <p className="text-xs leading-relaxed">
                There are no forensic artifacts or indicators of compromise extracted for {formatCaseId(activeCaseId)} yet. Run active response agent telemetry scan to populate details.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
