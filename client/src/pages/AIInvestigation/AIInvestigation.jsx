import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Upload, 
  Play, 
  CheckCircle, 
  User, 
  Clock, 
  Terminal, 
  Globe, 
  Network, 
  Cpu, 
  File, 
  Download, 
  ArrowRight,
  Send,
  MessageSquare,
  FileText,
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react';
import { casesService } from '../../services/cases.service';
import { evidenceService } from '../../services/evidence.service';
import { aiService } from '../../services/ai.service';
import './AIInvestigation.css';

export default function AIInvestigation() {
  const navigate = useNavigate();

  // Auth Guard check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // State variables
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [activeCaseDetails, setActiveCaseDetails] = useState(null);
  const [evidenceItems, setEvidenceItems] = useState([]);
  
  // Search & workspace tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceTab, setWorkspaceTab] = useState('timeline');
  const [dragActive, setDragActive] = useState(false);
  const [isLoadingCases, setIsLoadingCases] = useState(false);

  // AI analysis findings & indicators
  const [aiFindings, setAiFindings] = useState(null);
  const [isLoadingFindings, setIsLoadingFindings] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingProgress, setThinkingProgress] = useState(0);
  const [thinkingStep, setThinkingStep] = useState('');

  // Right panel toggle: 'analysis' or 'chat'
  const [rightPanelTab, setRightPanelTab] = useState('analysis');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const chatEndRef = useRef(null);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Scroll chat window to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Load cases catalog on mount
  const fetchCasesList = async () => {
    setIsLoadingCases(true);
    try {
      const res = await casesService.getCases({ limit: 100 });
      setCases(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedCaseId(res.data[0].caseId);
      }
    } catch (err) {
      console.error('[AIInvestigation] Failed to fetch cases list:', err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  useEffect(() => {
    fetchCasesList();
  }, []);

  // Fetch case details, evidence, and AI findings when selectedCaseId changes
  const fetchActiveCaseTelemetry = async () => {
    if (!selectedCaseId) return;
    try {
      // 1. Fetch case details
      const details = await casesService.getCaseById(selectedCaseId);
      setActiveCaseDetails(details);

      // 2. Fetch evidence list
      const evList = await evidenceService.getEvidenceByCase(selectedCaseId);
      setEvidenceItems(evList || []);

      // 3. Retrieve existing AI Analysis details in background
      setIsLoadingFindings(true);
      try {
        const findings = await aiService.analyzeCase(selectedCaseId);
        setAiFindings(findings);
        
        // Initialize default welcome message in chat matching case context
        const welcome = `Hello analyst. I have modeled the threat indicators for Case #${selectedCaseId} (${details.title}). The risk score is evaluated at ${findings.riskScore}%. I suggest isolates at host node [${details.targetHost || 'WORKSTATION'}]. Ask me anything about suspicious files, MITRE ATT&CK techniques, or response mitigation steps.`;
        setChatMessages([
          { role: 'assistant', content: welcome, timestamp: new Date() }
        ]);
      } catch (err) {
        setAiFindings(null);
        setChatMessages([
          { role: 'assistant', content: `Hello analyst. AI analysis has not been executed yet for Case #${selectedCaseId}. Click "Start Investigation" at the top of the console to correlate threat telemetry logs.`, timestamp: new Date() }
        ]);
      } finally {
        setIsLoadingFindings(false);
      }
    } catch (err) {
      console.error('[AIInvestigation] Failed to fetch case details:', err);
    }
  };

  useEffect(() => {
    fetchActiveCaseTelemetry();
  }, [selectedCaseId]);

  if (!hasSession) return null;

  // Search filter
  const filteredCases = cases.filter(c => 
    c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Trigger simulated AI Analysis run with progression bar
  const handleRunAIAnalysis = () => {
    if (isThinking || !selectedCaseId) return;
    setIsThinking(true);
    setThinkingProgress(0);
    
    const steps = [
      "Correlating IP threat signatures with global intelligence databases...",
      "Extracting cryptographic hash patterns from memory dump archives...",
      "Mapping network PCAP nodes to MITRE ATT&CK adversarial matrices...",
      "Analyzing user access directories and active session payloads...",
      "Compiling digital forensics summary and threat probability metrics..."
    ];

    let currentStepIdx = 0;
    setThinkingStep(steps[0]);

    const interval = setInterval(() => {
      setThinkingProgress(prev => {
        const nextProgress = prev + 5;
        if (nextProgress >= 100) {
          clearInterval(interval);
          // Trigger the actual API call once the loading animation completes
          aiService.analyzeCase(selectedCaseId)
            .then(findings => {
              setAiFindings(findings);
              setIsThinking(false);
              setThinkingStep('Analysis complete!');
              triggerToast('Incident analysis generated successfully!');
              
              // Also update chat
              setChatMessages(prevChat => [
                ...prevChat,
                { role: 'assistant', content: `Forensic analysis compiled. Threat signature identified: ${findings.summary}. Risk level calculated at ${findings.riskScore}%.`, timestamp: new Date() }
              ]);
            })
            .catch(err => {
              console.error('[AIInvestigation] Analysis failure:', err);
              setIsThinking(false);
              setThinkingStep('Analysis failed.');
              triggerToast(`Analysis failed: ${err.message}`);
            });
          return 100;
        }
        
        const stepIndex = Math.floor((nextProgress / 100) * steps.length);
        if (stepIndex !== currentStepIdx && steps[stepIndex]) {
          currentStepIdx = stepIndex;
          setThinkingStep(steps[stepIndex]);
        }
        return nextProgress;
      });
    }, 150);
  };

  // Close Case Action
  const handleCloseInvestigation = async () => {
    if (!activeCaseDetails) return;
    if (!window.confirm(`Are you sure you want to CLOSE case ${selectedCaseId}?`)) {
      return;
    }
    try {
      await casesService.updateCase(activeCaseDetails._id, {
        status: 'Closed'
      });
      triggerToast(`Case ${selectedCaseId} status updated to Closed.`);
      fetchCasesList();
    } catch (err) {
      console.error('[AIInvestigation] Close failure:', err);
      triggerToast(`Failed to close case: ${err.message}`);
    }
  };

  const handleGenerateTimeline = () => {
    triggerToast(`Interactive triage timeline generated for ${selectedCaseId}.`);
  };

  const handleExportReport = () => {
    triggerToast(`Redirecting to Reports center to compile summary for ${selectedCaseId}...`);
    setTimeout(() => {
      navigate('/reports');
    }, 1000);
  };

  // Chat message submit
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat || !selectedCaseId) return;

    const userPrompt = chatInput.trim();
    setChatInput('');
    
    const userMsg = { role: 'user', content: userPrompt, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsSendingChat(true);

    try {
      const updatedMessages = [...chatMessages, userMsg].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const assistantReply = await aiService.chatCopilot(selectedCaseId, updatedMessages);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantReply.content,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error('[AIInvestigation] Chat error:', err);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: Unable to connect with the AI security assistant. ${err.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Drag & drop upload handler
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await handleEvidenceUpload(file);
    }
  };

  const handleManualUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleEvidenceUpload(file);
    }
  };

  const handleEvidenceUpload = async (file) => {
    try {
      triggerToast(`Ingesting file ${file.name}...`);
      const formData = new FormData();
      formData.append('caseId', selectedCaseId);
      formData.append('fileType', 'Other');
      formData.append('files', file);

      await evidenceService.uploadEvidence(formData);
      triggerToast('Evidence file uploaded and hashed successfully.');
      
      // Refresh case files list
      fetchActiveCaseTelemetry();
    } catch (err) {
      console.error('[AIInvestigation] File upload failed:', err);
      triggerToast(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div className="trace-ai-investigation-layout flex flex-col min-h-screen text-[#F8FAFC]">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#47faf3] text-[#47faf3] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          {toastMsg}
        </div>
      )}

      {/* Scope-contained custom styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-right-panel-tabs {
            display: flex;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 3px;
            gap: 4px;
          }

          .trace-right-panel-tab {
            flex: 1;
            background: transparent;
            border: none;
            border-radius: 6px;
            color: #94A3B8;
            font-size: 0.725rem;
            font-weight: 600;
            padding: 6px 12px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .trace-right-panel-tab.active {
            background: #141C2B;
            color: #00E5FF;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
          }

          .trace-chat-container {
            display: flex;
            flex-direction: column;
            height: 380px;
            background: rgba(20, 28, 43, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            overflow: hidden;
            margin-top: 10px;
          }

          .trace-chat-messages {
            flex-grow: 1;
            overflow-y: auto;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .trace-chat-bubble {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 0.775rem;
            line-height: 1.45;
            display: flex;
            flex-direction: column;
            gap: 4px;
            text-align: left;
          }

          .trace-chat-bubble.user {
            background: rgba(0, 229, 255, 0.1);
            border: 1px solid rgba(0, 229, 255, 0.2);
            color: #FFFFFF;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
          }

          .trace-chat-bubble.assistant {
            background: #141C2B;
            border: 1px solid rgba(255, 255, 255, 0.05);
            color: #cbd5e1;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
          }

          .trace-chat-input-area {
            display: flex;
            gap: 8px;
            padding: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            background: rgba(10, 15, 30, 0.6);
          }

          .trace-chat-input {
            flex-grow: 1;
            background: #070C16;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 0.775rem;
            color: #FFFFFF;
            outline: none;
          }

          .trace-chat-input:focus {
            border-color: rgba(0, 229, 255, 0.3);
          }

          .trace-chat-send-btn {
            background: linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%);
            border: none;
            border-radius: 8px;
            color: #0A0F1E;
            padding: 8px 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-chat-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .trace-chat-typing {
            display: inline-flex;
            gap: 3px;
            align-items: center;
            padding: 10px 14px;
            background: #141C2B;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
          }

          .trace-chat-dot {
            width: 5px;
            height: 5px;
            background-color: #00E5FF;
            border-radius: 50%;
            animation: bounce-dot 1.4s infinite ease-in-out both;
          }

          .trace-chat-dot:nth-child(1) { animation-delay: -0.32s; }
          .trace-chat-dot:nth-child(2) { animation-delay: -0.16s; }

          @keyframes bounce-dot {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
          }
        `
      }} />
      
      {/* 1. TOP HEADER */}
      <header className="trace-ai-header flex flex-col md:flex-row justify-between items-stretch md:items-center px-6 py-4 border-b border-[#00E5FF]/15 gap-4">
        <div className="text-left">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-[#CBD5E1] bg-clip-text text-transparent">
              AI Investigation
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[10px] text-[#00E5FF] font-bold tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span>
              AI INSTANCE ONLINE
            </div>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">
            AI-Powered Threat Modeling & Incident Triage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center bg-[#070C16] px-4 py-2.5 rounded-xl border border-white/5 focus-within:border-[#00E5FF] focus-within:shadow-[0_0_15px_rgba(0,229,255,0.15)] transition-all duration-250">
            <Search className="text-[#94A3B8] w-4 h-4 mr-2" />
            <input
              type="text"
              placeholder="Search case queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-sm outline-none w-48 text-white placeholder:text-[#94A3B8]/40"
            />
          </div>

          <button
            type="button"
            disabled={isThinking || !selectedCaseId}
            onClick={handleRunAIAnalysis}
            className="flex items-center gap-2 px-4 py-2.5 trace-action-btn-primary text-xs border-none"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Investigation
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 trace-action-btn-secondary text-xs cursor-pointer border border-white/10 text-white rounded-lg">
            <Upload className="w-3.5 h-3.5" />
            Upload Evidence
            <input type="file" className="hidden" onChange={handleManualUpload} />
          </label>
        </div>
      </header>

      {/* THREE-PANEL CORE WORKSPACE */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden w-full h-[calc(100vh-77px)] bg-[#0A0F1E]">
        
        {/* 2. LEFT PANEL: Investigation Queue */}
        <aside className="w-full lg:w-80 flex-shrink-0 border-r border-[#00E5FF]/10 flex flex-col bg-[#080D18]">
          <div className="p-4 border-b border-white/5 text-left">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              Investigation Queue ({filteredCases.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoadingCases ? (
              <div className="text-center py-8 text-xs text-[#00E5FF] animate-pulse">
                Loading case queue...
              </div>
            ) : filteredCases.map((c) => {
              const active = c.caseId === selectedCaseId;
              const isClosed = c.status?.toLowerCase() === 'closed';
              const isCritical = c.severity?.toLowerCase() === 'critical';
              return (
                <div
                  key={c.caseId}
                  onClick={() => setSelectedCaseId(c.caseId)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 select-none text-left ${
                    active 
                      ? 'bg-[#141C2B] border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.08)]' 
                      : 'bg-[#111827]/40 border-white/5 hover:border-white/10 hover:bg-[#111827]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[#00E5FF] font-semibold">{c.caseId}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                      isClosed 
                        ? 'bg-white/5 border-white/10 text-[#94A3B8]' 
                        : isCritical 
                          ? 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]' 
                          : 'bg-[#00E5FF]/10 border-[#00E5FF]/20 text-[#00E5FF]'
                    }`}>
                      {c.severity}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white mt-2 truncate font-sans" title={c.title}>
                    {c.title}
                  </h3>
                  <div className="flex items-center justify-between text-[9px] text-[#94A3B8] mt-3 pt-3 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <User className="w-2.5 h-2.5" />
                      {c.assignedAnalyst || 'System Auto'}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredCases.length === 0 && !isLoadingCases && (
              <div className="p-8 text-center text-xs text-[#94A3B8]/60">
                No active cases found.
              </div>
            )}
          </div>
        </aside>

        {/* 3. CENTER PANEL: AI Investigation Workspace */}
        <main className="flex-grow flex flex-col overflow-hidden bg-[#0A0F1E] p-6 space-y-6">
          
          {/* Workspace Title & Risk Score Section */}
          {activeCaseDetails && (
            <div className="bg-[#141C2B] rounded-xl p-6 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 min-w-0 text-left">
                <span className="text-[10px] font-mono text-[#00E5FF] tracking-widest uppercase font-bold">Active Case workspace</span>
                <h2 className="text-base font-bold text-white mt-1 truncate" title={activeCaseDetails.title}>
                  {activeCaseDetails.title}
                </h2>
                <div className="text-xs text-[#94A3B8] mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="whitespace-nowrap">
                    <span className="font-semibold text-[#94A3B8]">Owner:</span> <span className="text-white">{activeCaseDetails.assignedAnalyst || 'Analyst'}</span>
                  </span>
                  <span className="text-white/10 hidden sm:inline">|</span>
                  <span className="whitespace-nowrap">
                    <span className="font-semibold text-[#94A3B8]">Target host:</span> <span className="text-white font-mono">{activeCaseDetails.targetHost || 'N/A'}</span>
                  </span>
                  <span className="text-white/10 hidden sm:inline">|</span>
                  <span className="whitespace-nowrap">
                    <span className="font-semibold text-[#94A3B8]">Status:</span> <span className="text-white">{activeCaseDetails.status}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-4">
                <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>
                <div className="flex items-center gap-3">
                  <div className="text-right min-w-[110px]">
                    <span className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-widest">Risk Level</span>
                    <p className="text-[10px] text-[#94A3B8] font-medium mt-0.5">Threat Level Assessed</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-[#00E5FF] flex items-center justify-center font-bold text-xs bg-[#00E5FF]/5 shadow-[0_0_15px_rgba(0,229,255,0.2)] flex-shrink-0">
                    {aiFindings ? aiFindings.riskScore : (activeCaseDetails.severity === 'Critical' ? 90 : 50)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workspace Tab Triggers */}
          <div className="flex border-b border-white/5 gap-6">
            <button
              type="button"
              onClick={() => setWorkspaceTab('timeline')}
              className={`trace-workspace-tab ${workspaceTab === 'timeline' ? 'active' : ''}`}
            >
              Timeline Summary
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab('evidence')}
              className={`trace-workspace-tab ${workspaceTab === 'evidence' ? 'active' : ''}`}
            >
              Correlated files ({evidenceItems.length})
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab('iocs')}
              className={`trace-workspace-tab ${workspaceTab === 'iocs' ? 'active' : ''}`}
            >
              Extracted IOCs
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab('mitre')}
              className={`trace-workspace-tab ${workspaceTab === 'mitre' ? 'active' : ''}`}
            >
              MITRE ATT&amp;CK Mapping
            </button>
          </div>

          {/* Active Workspace Viewport */}
          <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
            
            {/* VIEWPORT 1: Timeline */}
            {workspaceTab === 'timeline' && activeCaseDetails && (
              <div className="space-y-4">
                <div className="relative border-l border-[#00E5FF]/20 pl-6 ml-3 space-y-6 text-left">
                  <div className="relative group">
                    <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#00E5FF] border-2 border-[#0A0F1E] group-hover:scale-125 transition-transform duration-200"></span>
                    <div className="bg-[#141C2B] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <span className="text-[10px] font-mono text-[#00E5FF] font-semibold">
                        {new Date(activeCaseDetails.createdAt).toLocaleString()}
                      </span>
                      <p className="text-xs text-white mt-1 leading-relaxed">Incident case ingested into threat dashboard.</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-2">Source: {activeCaseDetails.sourceIP || 'N/A'} | Target: {activeCaseDetails.destinationIP || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="relative group">
                    <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#00E5FF] border-2 border-[#0A0F1E] group-hover:scale-125 transition-transform duration-200"></span>
                    <div className="bg-[#141C2B] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <span className="text-[10px] font-mono text-[#00E5FF] font-semibold">T+15 minutes</span>
                      <p className="text-xs text-[#cbd5e1] mt-1 leading-relaxed">Automated EDR agents compiled local process footprints.</p>
                    </div>
                  </div>

                  {aiFindings && (
                    <div className="relative group">
                      <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#00E5FF] border-2 border-[#0A0F1E] group-hover:scale-125 transition-transform duration-200"></span>
                      <div className="bg-[#141C2B] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <span className="text-[10px] font-mono text-[#00E5FF] font-semibold">AI MODEL TIMELINE</span>
                        <p className="text-xs text-[#cbd5e1] mt-1 leading-relaxed">{aiFindings.summary}</p>
                        <p className="text-[10px] text-[#00E5FF] font-medium mt-2">Root Cause identified: {aiFindings.rootCause}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEWPORT 2: Evidence & Files */}
            {workspaceTab === 'evidence' && (
              <div className="space-y-6 text-left">
                
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('ai-file-browser').click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                    dragActive 
                      ? 'border-[#00E5FF] bg-[#00E5FF]/5' 
                      : 'border-white/10 bg-[#141C2B] hover:border-[#00E5FF]/30'
                  }`}
                >
                  <Upload className="w-8 h-8 text-[#00E5FF] opacity-80 animate-bounce" />
                  <div>
                    <p className="text-xs font-semibold text-white">Drag &amp; drop forensic evidence files here, or click to browse</p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">Supports EVTX, Memory Dumps, raw text logs, and PCAP packets (Max 2GB)</p>
                  </div>
                  <input
                    id="ai-file-browser"
                    type="file"
                    className="hidden"
                    onChange={handleManualUpload}
                  />
                </div>

                {/* Evidence Artifacts List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-2">Linked Case Evidence ({evidenceItems.length})</span>
                  
                  {evidenceItems.map((file) => (
                    <div key={file._id} className="flex items-center justify-between p-3.5 bg-[#141C2B] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <File className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{file.originalName}</p>
                          <p className="text-[9px] text-[#94A3B8] mt-0.5">{file.fileType} | Size: {formatFileSize(file.fileSize)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-[#94A3B8] flex-shrink-0">
                        <span className="text-[10px] text-[#00E5FF]">{file.evidenceId}</span>
                        <span className="bg-white/5 px-2 py-0.5 rounded text-[9px] font-bold text-white opacity-60">CORRELATED</span>
                      </div>
                    </div>
                  ))}

                  {evidenceItems.length === 0 && (
                    <div className="bg-white/[0.01] border border-white/5 rounded-xl p-8 text-center text-xs text-on-surface-variant">
                      No physical evidence uploaded to this case yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEWPORT 3: Indicators of Compromise */}
            {workspaceTab === 'iocs' && (
              <div className="space-y-6 text-left">
                {!aiFindings ? (
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-8 text-center text-xs text-on-surface-variant">
                    Execute "Run AI Analysis" at the bottom of the dashboard to extract Threat Indicators (IOCs).
                  </div>
                ) : (
                  <div className="bg-[#141C2B] p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-3 border-b border-white/5 pb-2">
                      Correlated Indicators of Compromise (IOCs)
                    </span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="text-[#94A3B8] border-b border-white/5">
                            <th className="pb-2 font-bold uppercase text-[9px] tracking-wider w-[20%]">IOC Type</th>
                            <th className="pb-2 font-bold uppercase text-[9px] tracking-wider w-[50%]">Value</th>
                            <th className="pb-2 font-bold uppercase text-[9px] tracking-wider w-[30%]">Context</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {aiFindings.iocs && aiFindings.iocs.map((ioc, idx) => (
                            <tr key={idx} className="hover:bg-white/5">
                              <td className="py-2.5 font-bold text-[#00E5FF] uppercase text-[10px]">{ioc.type}</td>
                              <td className="py-2.5 text-white truncate max-w-xs pr-4 select-all" title={ioc.value}>{ioc.value}</td>
                              <td className="py-2.5 text-[#94A3B8]">{ioc.description}</td>
                            </tr>
                          ))}
                          {(!aiFindings.iocs || aiFindings.iocs.length === 0) && (
                            <tr>
                              <td colSpan="3" className="py-4 text-center text-[#94A3B8]">No critical indicators extracted.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEWPORT 4: MITRE ATT&CK Mapping */}
            {workspaceTab === 'mitre' && (
              <div className="space-y-4 text-left">
                {!aiFindings ? (
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-8 text-center text-xs text-on-surface-variant">
                    Execute "Run AI Analysis" to dynamically compile MITRE ATT&amp;CK mappings.
                  </div>
                ) : (
                  <div className="bg-[#141C2B] p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-3 border-b border-white/5 pb-2">
                      MITRE ATT&amp;CK Technique Mapping Matrix
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      {aiFindings.mitre && aiFindings.mitre.map((tech, idx) => (
                        <div key={idx} className="p-4 bg-[#070C16] border border-white/5 rounded-xl flex flex-col justify-between hover:border-[#00E5FF]/20 transition-all">
                          <div>
                            <span className="text-[9px] font-bold text-[#00E5FF] font-mono bg-[#00E5FF]/10 px-2 py-0.5 rounded">
                              {tech.id}
                            </span>
                            <h4 className="text-xs font-bold text-white mt-2 leading-snug">
                              {tech.name}
                            </h4>
                          </div>
                          <p className="text-[9px] text-[#94A3B8] mt-3 uppercase tracking-wider font-semibold">
                            Phase: {tech.phase}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* 5. BOTTOM SECTION: Action Buttons */}
          <footer className="border-t border-white/5 pt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isThinking || !selectedCaseId}
                onClick={handleRunAIAnalysis}
                className="flex items-center gap-2 px-4 py-2.5 trace-action-btn-primary text-xs border-none"
              >
                <Cpu className="w-3.5 h-3.5 fill-current" />
                Run AI Analysis
              </button>
              <button
                type="button"
                onClick={handleGenerateTimeline}
                className="flex items-center gap-2 px-4 py-2.5 trace-action-btn-secondary text-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                Generate Timeline
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportReport}
                className="flex items-center gap-2 px-4 py-2.5 trace-action-btn-secondary text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export Report
              </button>
              <button
                type="button"
                onClick={handleCloseInvestigation}
                className="flex items-center gap-2 px-4 py-2.5 trace-action-btn-danger text-xs border-none"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Close Investigation
              </button>
            </div>
          </footer>

        </main>

        {/* 4. RIGHT PANEL: AI Assistant Panel */}
        <aside className="w-full lg:w-96 flex-shrink-0 border-l border-[#00E5FF]/10 flex flex-col bg-[#080D18] p-6 space-y-4 overflow-hidden">
          
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 text-left flex-shrink-0">
            <Cpu className="w-5 h-5 text-[#00E5FF]" />
            <div>
              <h3 className="text-sm font-bold text-white">AI Copilot assistant</h3>
              <p className="text-[10px] text-[#94A3B8] font-medium mt-0.5">Incident correlation modeling</p>
            </div>
          </div>

          {/* Toggle Tab header: Report vs Chat */}
          <div className="trace-right-panel-tabs flex-shrink-0">
            <button
              type="button"
              className={`trace-right-panel-tab ${rightPanelTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('analysis')}
            >
              <span className="flex items-center justify-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Analysis Report
              </span>
            </button>
            <button
              type="button"
              className={`trace-right-panel-tab ${rightPanelTab === 'chat' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('chat')}
            >
              <span className="flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Interactive Chat
              </span>
            </button>
          </div>

          {/* Toggle Screen rendering */}
          {rightPanelTab === 'analysis' ? (
            /* SCREEN A: Analysis report dashboard list */
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              
              {/* AI Thinking Animation */}
              {isThinking ? (
                <div className="bg-[#141C2B] p-4 rounded-xl border border-[#00E5FF]/20 space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <div className="absolute inset-0 rounded-full border-2 border-t-[#00E5FF] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                      <Cpu className="w-3.5 h-3.5 text-[#00E5FF]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white animate-pulse">Copilot running heuristics...</h4>
                      <p className="text-[10px] text-[#00E5FF] truncate mt-0.5">{thinkingStep}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-[#94A3B8]">
                      <span>triaging telemetry logs</span>
                      <span>{thinkingProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#070C16] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00E5FF] to-[#3B82F6] transition-all duration-200" 
                        style={{ width: `${thinkingProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : !aiFindings ? (
                <div className="bg-[#141C2B] p-5 rounded-xl border border-white/5 space-y-3 text-left">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#00E5FF]" />
                    Analysis Pending
                  </h4>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                    Click <span className="text-[#00E5FF] font-semibold">Run AI Analysis</span> at the bottom of the workspace to build threat models and MITRE mappings.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Detailed Analysis */}
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-widest block">AI Threat Analysis</span>
                    <div className="bg-[#141C2B] p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-white leading-relaxed font-medium">
                        {aiFindings.analysis}
                      </p>
                    </div>
                  </div>

                  {/* Threat Summary */}
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-widest block">Incident Summary</span>
                    <div className="bg-[#141C2B] p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-[#94A3B8] leading-relaxed">
                        {aiFindings.summary}
                      </p>
                    </div>
                  </div>

                  {/* Root Cause */}
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-widest block">Root Cause</span>
                    <div className="bg-[#141C2B] p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-white opacity-90 leading-relaxed font-semibold">
                        {aiFindings.rootCause}
                      </p>
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-widest block">Recommended Mitigations</span>
                    <div className="bg-[#141C2B] p-4 rounded-xl border border-white/5 space-y-2">
                      {aiFindings.recommendedActions && aiFindings.recommendedActions.map((action, idx) => (
                        <div key={idx} className="flex gap-2 text-xs">
                          <span className="text-[#00E5FF] font-bold">{idx + 1}.</span>
                          <p className="text-[#94A3B8] leading-relaxed">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Next Steps */}
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-widest block">Suggested Next Steps</span>
                    <div className="bg-[#141C2B] p-4 rounded-xl border border-white/5">
                      <div className="flex gap-2 text-xs">
                        <ArrowRight className="w-4 h-4 text-[#00E5FF] flex-shrink-0 mt-0.5" />
                        <p className="text-white font-medium leading-relaxed">{aiFindings.nextSteps}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SCREEN B: Interactive AI Chat console */
            <div className="flex-1 flex flex-col min-h-0 bg-[#070c16]/50 border border-white/5 rounded-xl overflow-hidden">
              <div className="trace-chat-messages custom-scrollbar">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`trace-chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}
                  >
                    <p className="m-0 leading-normal">{msg.content}</p>
                    <span className="text-[8px] text-[#94A3B8] self-end mt-1 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                
                {isSendingChat && (
                  <div className="trace-chat-typing">
                    <span className="trace-chat-dot"></span>
                    <span className="trace-chat-dot"></span>
                    <span className="trace-chat-dot"></span>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChatMessage} className="trace-chat-input-area">
                <input
                  type="text"
                  placeholder="Ask about mitigations, IOCs, root causes..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isSendingChat || !selectedCaseId}
                  className="trace-chat-input"
                />
                <button
                  type="submit"
                  disabled={isSendingChat || !chatInput.trim() || !selectedCaseId}
                  className="trace-chat-send-btn"
                  title="Send prompt"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

        </aside>

      </div>
    </div>
  );
}

// Helpers
const formatFileSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
