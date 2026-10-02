import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Pencil, 
  ShieldAlert, 
  Calendar, 
  User, 
  Server, 
  Globe, 
  FileText, 
  Cpu, 
  Activity, 
  Clock, 
  Zap, 
  Download, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import './CaseDetails.css';

// Import sub-components and modals
import EditCaseModal from './components/EditCaseModal';
import { casesService } from '../../services/cases.service';

// Import existing feature tab views
import EvidenceTab from '../../features/investigation/EvidenceTab';
import AIAnalysisTab from '../../features/investigation/AIAnalysisTab';
import TimelineTab from '../../features/investigation/TimelineTab';
import ReportTab from '../../features/investigation/ReportTab';
import IOCTab from '../../features/investigation/IOCTab';
import MitreTab from '../../features/investigation/MitreTab';

const formatCaseId = (id) => {
  if (!id) return '';
  if (id.startsWith('CASE-')) {
    return `#DF-${id.split('-')[1]}`;
  }
  if (!id.startsWith('#')) {
    return `#${id}`;
  }
  return id;
};

export default function CaseDetails() {
  const navigate = useNavigate();
  const { id, caseId } = useParams();
  const activeCaseId = id || caseId || '';

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
  const [loadingCase, setLoadingCase] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadActiveCase = async () => {
    if (!activeCaseId) return;
    try {
      setLoadingCase(true);
      setErrorMessage('');
      const data = await casesService.getCaseById(activeCaseId);
      setActiveCase(data);
    } catch (err) {
      console.error('Failed to load case details:', err);
      setErrorMessage(err.message || 'Incident case record could not be retrieved.');
    } finally {
      setLoadingCase(false);
    }
  };

  useEffect(() => {
    if (!hasSession) return;
    loadActiveCase();
  }, [activeCaseId, hasSession]);

  if (!hasSession) return null;

  const getSeverityBadgeClass = (sev) => {
    const s = sev?.toUpperCase();
    if (s === 'CRITICAL') return 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30';
    if (s === 'HIGH') return 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30';
    if (s === 'MEDIUM') return 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30';
    return 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30';
  };

  const getStatusBadgeClass = (st) => {
    const s = st?.toLowerCase();
    if (s === 'open') return 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30';
    if (s === 'investigating') return 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30';
    return 'bg-white/10 text-[#94a3b8] border border-white/10';
  };

  return (
    <div className="trace-details-layout flex flex-col min-h-screen w-full select-none bg-[#060913] text-white box-border relative">
      
      {/* Toast Notification Banner */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#10b981] text-[#10b981] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          {successMessage}
        </div>
      )}

      {/* Top Breadcrumb & Header Bar */}
      <div className="bg-[#0B1220] px-6 py-4 border-b border-white/10 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <Link 
              to="/cases" 
              className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#00E5FF] transition-all text-xs font-semibold py-1.5 px-3 rounded-xl bg-[#0F172A]/90 hover:bg-[#162238] border border-white/10 hover:border-[#00E5FF]/40 shadow-sm focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Cases</span>
            </Link>

            {activeCase && (
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-[#00E5FF]">
                  {formatCaseId(activeCase.caseId)}
                </span>
                <span className="text-white/20">|</span>
                <h1 className="text-sm md:text-base font-bold text-white truncate max-w-md">
                  {activeCase.title}
                </h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getSeverityBadgeClass(activeCase.severity)}`}>
                  {activeCase.severity}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(activeCase.status)}`}>
                  {activeCase.status}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button 
              type="button" 
              className="px-3.5 py-1.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#162238] active:bg-[#1c2c47] border border-[#00E5FF]/25 hover:border-[#00E5FF]/60 text-white hover:text-[#00E5FF] font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(0,229,255,0.2)] focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5 text-[#00E5FF]" /> 
              <span>Edit Case</span>
            </button>
            <button 
              type="button" 
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#3B82F6] hover:brightness-110 active:scale-95 text-[#0A0F1E] font-bold text-xs transition-all shadow-[0_0_15px_rgba(0,229,255,0.25)] flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:outline-none"
              onClick={() => setActiveTab('ai-analysis')}
            >
              <Zap className="w-3.5 h-3.5" /> 
              <span>AI Investigation</span>
            </button>
          </div>

        </div>

        {/* Tab Navigation (Essential 7 Tabs) */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-4 pt-3 pb-1 border-t border-white/5 overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'evidence', label: 'Evidence', icon: Server },
            { id: 'iocs', label: 'IOC Findings', icon: ShieldAlert },
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'mitre', label: 'MITRE ATT&CK', icon: Activity },
            { id: 'ai-analysis', label: 'AI Investigation', icon: Zap },
            { id: 'report', label: 'Reports', icon: Download }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`group flex items-center gap-2 text-xs font-bold py-2 px-3.5 rounded-xl outline-none cursor-pointer whitespace-nowrap transition-all duration-200 border select-none ${
                  isActive 
                    ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.25)]' 
                    : 'bg-[#0B1220]/80 hover:bg-[#111A2E] border-white/10 hover:border-[#00E5FF]/40 text-[#94a3b8] hover:text-white hover:shadow-[0_0_10px_rgba(0,229,255,0.1)]'
                } focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060913] disabled:opacity-40 disabled:cursor-not-allowed`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-[#00E5FF]' : 'text-[#64748b] group-hover:text-[#00E5FF]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          
          {loadingCase && !activeCase ? (
            <div className="glass-card rounded-2xl p-12 text-center text-[#94a3b8] flex flex-col items-center justify-center gap-3 bg-[#0B1220]/70">
              <Clock className="w-8 h-8 animate-spin text-[#00E5FF]" />
              <p className="text-xs font-semibold text-white">Loading case data...</p>
            </div>
          ) : errorMessage && !activeCase ? (
            <div className="glass-card rounded-2xl p-8 text-center bg-[#0B1220]/70 border border-[#ef4444]/30 text-[#fca5a5]">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-[#ef4444]" />
              <h3 className="font-bold text-white text-base">Unable to load case</h3>
              <p className="text-xs mt-1">{errorMessage}</p>
            </div>
          ) : activeCase && (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6 text-left animate-fade-in">
                  
                  {/* Case Summary Card */}
                  <div className="glass-card rounded-2xl p-6 md:p-8 bg-[#0B1220]/80 border border-white/10 shadow-xl space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                      <div>
                        <span className="text-[11px] font-bold text-[#00E5FF] uppercase tracking-wider font-mono">
                          Case Reference: {formatCaseId(activeCase.caseId)}
                        </span>
                        <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
                          {activeCase.title}
                        </h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getSeverityBadgeClass(activeCase.severity)}`}>
                          {activeCase.severity} Severity
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadgeClass(activeCase.status)}`}>
                          Status: {activeCase.status}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Incident Description</h3>
                      <p className="text-xs md:text-sm text-[#cbd5e1] leading-relaxed bg-[#070C16] p-4 rounded-xl border border-white/5">
                        {activeCase.description || 'No detailed incident description provided.'}
                      </p>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      <div className="bg-[#070C16] p-4 rounded-xl border border-white/5 space-y-1">
                        <div className="flex items-center gap-2 text-[#94a3b8] text-[11px] font-bold uppercase tracking-wider">
                          <ShieldAlert className="w-3.5 h-3.5 text-[#00E5FF]" />
                          <span>Incident Type</span>
                        </div>
                        <p className="text-sm font-semibold text-white">
                          {activeCase.incidentType || 'General Security Incident'}
                        </p>
                      </div>

                      <div className="bg-[#070C16] p-4 rounded-xl border border-white/5 space-y-1">
                        <div className="flex items-center gap-2 text-[#94a3b8] text-[11px] font-bold uppercase tracking-wider">
                          <Server className="w-3.5 h-3.5 text-[#00E5FF]" />
                          <span>Target Host / Asset</span>
                        </div>
                        <p className="text-sm font-semibold text-white font-mono">
                          {activeCase.targetHost || 'N/A'}
                        </p>
                      </div>

                      <div className="bg-[#070C16] p-4 rounded-xl border border-white/5 space-y-1">
                        <div className="flex items-center gap-2 text-[#94a3b8] text-[11px] font-bold uppercase tracking-wider">
                          <Globe className="w-3.5 h-3.5 text-[#00E5FF]" />
                          <span>Source / Dest IP</span>
                        </div>
                        <p className="text-xs font-semibold text-white font-mono">
                          {activeCase.sourceIP || 'N/A'} &rarr; {activeCase.destinationIP || 'N/A'}
                        </p>
                      </div>

                      <div className="bg-[#070C16] p-4 rounded-xl border border-white/5 space-y-1">
                        <div className="flex items-center gap-2 text-[#94a3b8] text-[11px] font-bold uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5 text-[#00E5FF]" />
                          <span>Created Date</span>
                        </div>
                        <p className="text-sm font-semibold text-white font-mono">
                          {new Date(activeCase.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Quick Investigation Actions */}
                    {/* Quick Investigation Actions */}
                    <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-[#94a3b8] mr-2">Investigation Actions:</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('evidence')}
                        className="px-4 py-2 rounded-xl bg-[#0F172A]/90 hover:bg-[#162238] border border-white/10 hover:border-[#00E5FF]/40 text-[#E2E8F0] hover:text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer hover:shadow-[0_0_10px_rgba(0,229,255,0.12)] focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#00E5FF]" />
                        <span>Manage Evidence</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('iocs')}
                        className="px-4 py-2 rounded-xl bg-[#0F172A]/90 hover:bg-[#162238] border border-white/10 hover:border-[#00E5FF]/40 text-[#E2E8F0] hover:text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer hover:shadow-[0_0_10px_rgba(0,229,255,0.12)] focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-[#00E5FF]" />
                        <span>Inspect IOCs</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('timeline')}
                        className="px-4 py-2 rounded-xl bg-[#0F172A]/90 hover:bg-[#162238] border border-white/10 hover:border-[#00E5FF]/40 text-[#E2E8F0] hover:text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer hover:shadow-[0_0_10px_rgba(0,229,255,0.12)] focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#00E5FF]" />
                        <span>View Timeline</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('ai-analysis')}
                        className="px-4 py-2 rounded-xl bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 border border-[#00E5FF]/40 hover:border-[#00E5FF] text-[#00E5FF] font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.2)] focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Run AI Investigation</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('report')}
                        className="px-4 py-2 rounded-xl bg-[#0F172A]/90 hover:bg-[#162238] border border-white/10 hover:border-[#00E5FF]/40 text-[#E2E8F0] hover:text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ml-auto hover:shadow-[0_0_10px_rgba(0,229,255,0.12)] focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
                      >
                        <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
                        <span>Generate Report</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: EVIDENCE */}
              {activeTab === 'evidence' && (
                <div className="animate-fade-in">
                  <EvidenceTab caseId={activeCase.caseId} />
                </div>
              )}

              {/* TAB 3: IOC FINDINGS */}
              {activeTab === 'iocs' && (
                <div className="animate-fade-in">
                  <IOCTab caseId={activeCase.caseId} />
                </div>
              )}

              {/* TAB 4: TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="animate-fade-in">
                  <TimelineTab caseId={activeCase.caseId} />
                </div>
              )}

              {/* TAB 5: MITRE ATT&CK */}
              {activeTab === 'mitre' && (
                <div className="animate-fade-in">
                  <MitreTab caseId={activeCase.caseId} />
                </div>
              )}

              {/* TAB 6: AI INVESTIGATION */}
              {activeTab === 'ai-analysis' && (
                <div className="animate-fade-in">
                  <AIAnalysisTab caseId={activeCase.caseId} />
                </div>
              )}

              {/* TAB 7: REPORTS */}
              {activeTab === 'report' && (
                <div className="animate-fade-in">
                  <ReportTab caseId={activeCase.caseId} />
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Reusable Edit Modal */}
      {activeCase && (
        <EditCaseModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          caseItem={activeCase}
          onUpdated={(updatedCase) => {
            setActiveCase(updatedCase);
            setSuccessMessage('Case details updated successfully.');
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
        />
      )}

    </div>
  );
}
