import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  RefreshCw, 
  Sparkles, 
  ShieldAlert, 
  FolderPlus, 
  AlertCircle, 
  Server, 
  Zap, 
  HelpCircle, 
  FileText, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { casesService } from '../../services/cases.service';
import { aiService } from '../../services/ai.service';
import './AIInvestigation.css';

const QUICK_PROMPTS = [
  "Summarize this security incident and affected assets.",
  "What immediate containment and mitigation steps should I take?",
  "What indicators of compromise (IOCs) should I investigate?",
  "Explain the likely root cause and attack vector.",
  "Help me formulate a forensic evidence collection plan."
];

export default function AIInvestigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Auth Guard check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // State
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [loadingCases, setLoadingCases] = useState(true);

  // AI Readiness
  const [readiness, setReadiness] = useState(null);
  const [probingReadiness, setProbingReadiness] = useState(false);

  // Chat conversation
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRunningInvestigation, setIsRunningInvestigation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState('');

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Fetch AI readiness status
  const probeAIReadiness = async () => {
    try {
      setProbingReadiness(true);
      const res = await aiService.getReadiness().catch(err => ({
        ready: false,
        status: 'OFFLINE',
        message: err.message
      }));
      setReadiness(res);
    } catch (err) {
      setReadiness({ ready: false, status: 'OFFLINE', message: err.message });
    } finally {
      setProbingReadiness(false);
    }
  };

  // Load cases list
  const loadUserCases = async () => {
    try {
      setLoadingCases(true);
      setErrorMessage('');
      const res = await casesService.getCases({ limit: 100 });
      const items = res.data || [];
      setCases(items);

      // Check if URL search param specifies a caseId
      const urlParams = new URLSearchParams(location.search);
      const paramCaseId = urlParams.get('caseId');

      if (paramCaseId && items.some(c => c.caseId === paramCaseId || c._id === paramCaseId)) {
        setSelectedCaseId(paramCaseId);
      } else if (items.length > 0) {
        setSelectedCaseId(items[0].caseId || items[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch user cases:', err);
      setErrorMessage(err.message || 'Failed to load cases from database.');
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    if (hasSession) {
      probeAIReadiness();
      loadUserCases();
    }
  }, [hasSession]);

  // When selectedCaseId changes, load case context & reset or initialize chat
  useEffect(() => {
    if (!selectedCaseId) {
      setSelectedCase(null);
      setMessages([]);
      return;
    }

    const found = cases.find(c => c.caseId === selectedCaseId || c._id === selectedCaseId);
    setSelectedCase(found || null);

    if (found) {
      // Initialize friendly greeting grounded in actual case context
      const initialGreeting = {
        role: 'assistant',
        content: `👋 Hello! I am your TRACE AI DFIR Copilot. 

I am ready to assist you with **Case #${found.caseId}**: "${found.title}".
- **Severity**: ${found.severity}
- **Incident Type**: ${found.incidentType || 'General Security Incident'}
- **Target Host**: ${found.targetHost || 'N/A'}

You can ask me questions about triage steps, suspicious file artifacts, root cause hypotheses, or response playbooks. How can I help you investigate?`,
        timestamp: new Date()
      };
      setMessages([initialGreeting]);
    }
  }, [selectedCaseId, cases]);

  // Send Chat Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isSending || !selectedCaseId) return;

    const userText = inputPrompt.trim();
    setInputPrompt('');
    setErrorMessage('');

    const userMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date()
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsSending(true);

    try {
      // Map messages for backend API
      const apiMessages = newHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const assistantReply = await aiService.chatCopilot(selectedCaseId, apiMessages);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: assistantReply.content || 'Analysis complete.',
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.error('Chat Copilot failed:', err);
      setErrorMessage(`AI Chat error: ${err.message || 'Unable to connect to AI engine.'}`);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Failed to generate response. Please verify server connection.'}`,
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Run LangGraph Deep Investigation
  const handleRunLangGraphWorkflow = async () => {
    if (!selectedCaseId || isRunningInvestigation) return;
    setIsRunningInvestigation(true);
    setErrorMessage('');
    setNotification('Executing LangGraph multi-stage forensic reasoning graph...');

    const triggerMsg = {
      role: 'user',
      content: 'Execute full LangGraph forensic workflow investigation and hypothesis validation on this case.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, triggerMsg]);

    try {
      const result = await aiService.startInvestigation(selectedCaseId);
      
      const summaryContent = `🎯 **LangGraph AI Investigation Completed** [Run ID: \`${result.runId}\`]

**Executive Summary**:
${result.executiveSummary || 'Workflow completed.'}

${result.hypotheses && result.hypotheses.length > 0 ? `**Validated Candidate Hypotheses (${result.hypotheses.length})**:
${result.hypotheses.map((h, i) => `${i + 1}. **${h.title}** (Confidence: ${h.confidence?.score || 50}%) — ${h.statement}`).join('\n')}` : ''}

${result.evidenceGaps && result.evidenceGaps.length > 0 ? `**Visibility Blindspots & Gaps**:
${result.evidenceGaps.map(g => `- ${g}`).join('\n')}` : ''}

${result.suggestedFollowUps && result.suggestedFollowUps.length > 0 ? `**Recommended Next Steps**:
${result.suggestedFollowUps.map(s => `- ${s}`).join('\n')}` : ''}
`;

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: summaryContent,
          timestamp: new Date()
        }
      ]);
      setNotification('Investigation completed and findings persisted.');
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      console.error('LangGraph run error:', err);
      setErrorMessage(`Investigation workflow error: ${err.message}`);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Investigation workflow error: ${err.message}`,
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setIsRunningInvestigation(false);
    }
  };

  // New Chat action
  const handleNewChat = () => {
    if (!selectedCase) return;
    setMessages([
      {
        role: 'assistant',
        content: `New chat session started for Case #${selectedCase.caseId} (${selectedCase.title}). How can I assist your investigation?`,
        timestamp: new Date()
      }
    ]);
    setInputPrompt('');
    setErrorMessage('');
  };

  if (!hasSession) return null;

  const isOllamaOnline = readiness?.ready === true;

  return (
    <div className="trace-ai-chat-page flex flex-col h-[calc(100vh-70px)] w-full bg-[#060913] text-white select-none box-border overflow-hidden">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#10b981] text-[#10b981] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold animate-fade-in">
          {notification}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-[#0B1220] px-6 py-3.5 border-b border-white/10 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
          
          {/* Title & Engine Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">AI Copilot Chat</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                  isOllamaOnline 
                    ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30' 
                    : 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30'
                }`}>
                  {isOllamaOnline ? 'Ollama: Online' : 'DFIR Mode: Ready'}
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                Investigate security incidents using real LangGraph &amp; Ollama intelligence.
              </p>
            </div>
          </div>

          {/* Case Context Selector & Actions */}
          <div className="flex items-center gap-3">
            {cases.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94a3b8] font-semibold whitespace-nowrap">Case:</span>
                <select
                  className="h-9 px-3 bg-[#070C16] border border-white/15 focus:border-[#00E5FF] rounded-xl text-xs text-white outline-none cursor-pointer max-w-xs truncate"
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                >
                  {cases.map((c) => (
                    <option key={c.caseId || c._id} value={c.caseId || c._id}>
                      #{c.caseId} - {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleNewChat}
              disabled={!selectedCaseId || isSending}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              title="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>New Chat</span>
            </button>

            <button
              type="button"
              onClick={handleRunLangGraphWorkflow}
              disabled={!selectedCaseId || isRunningInvestigation || isSending}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#3B82F6] hover:brightness-110 active:scale-95 text-[#0A0F1E] font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Execute full autonomous LangGraph DFIR reasoning graph"
            >
              <Zap className={`w-3.5 h-3.5 ${isRunningInvestigation ? 'animate-bounce' : ''}`} />
              <span>{isRunningInvestigation ? 'Analyzing...' : 'Deep Investigation'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-grow flex flex-col max-w-5xl mx-auto w-full p-4 md:p-6 overflow-hidden">
        
        {/* If no cases in account */}
        {!loadingCases && cases.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 glass-card rounded-2xl border border-white/10 bg-[#0B1220]/70 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] mb-4">
              <FolderPlus className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-white text-lg">No cases found</h3>
            <p className="text-xs text-[#94a3b8] max-w-sm mt-1 mb-6">
              Please create a case first to start an AI forensic investigation.
            </p>
            <Link
              to="/cases/new"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#3B82F6] text-[#0A0F1E] font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,229,255,0.25)]"
            >
              Create First Case
            </Link>
          </div>
        ) : !selectedCase ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 glass-card rounded-2xl border border-white/10 bg-[#0B1220]/70 my-auto">
            <ShieldAlert className="w-12 h-12 text-[#00E5FF] opacity-60 mb-3" />
            <h3 className="font-bold text-white text-base">Select a case</h3>
            <p className="text-xs text-[#94a3b8] max-w-sm mt-1">
              Select an incident case from the dropdown above to begin an investigation.
            </p>
          </div>
        ) : (
          <div className="flex-grow flex flex-col min-h-0 glass-card rounded-2xl border border-white/10 bg-[#0B1220]/90 shadow-2xl overflow-hidden backdrop-blur-md">
            
            {/* Case Banner Context */}
            <div className="px-5 py-3 bg-[#070C16] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-left shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-white">Investigating:</span>
                <span className="font-mono text-[#00E5FF] font-semibold">#{selectedCase.caseId}</span>
                <span className="text-white truncate font-medium max-w-sm">{selectedCase.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#94a3b8]">
                  Type: <strong className="text-white">{selectedCase.incidentType || 'General'}</strong>
                </span>
                <span className="text-[11px] text-[#94a3b8]">
                  Host: <strong className="text-white font-mono">{selectedCase.targetHost || 'N/A'}</strong>
                </span>
              </div>
            </div>

            {/* Chat Message Scrollable Viewport */}
            <div className="flex-grow overflow-y-auto p-5 space-y-4 custom-scrollbar text-left">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-[#00E5FF]/20 to-[#3B82F6]/20 border border-[#00E5FF]/30 text-white rounded-br-none shadow-[0_0_15px_rgba(0,229,255,0.08)]'
                        : msg.isError
                        ? 'bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#fca5a5] rounded-bl-none'
                        : 'bg-[#070C16] border border-white/10 text-[#cbd5e1] rounded-bl-none shadow-md'
                    }`}>
                      <div className="whitespace-pre-wrap font-sans">
                        {msg.content}
                      </div>
                      <div className="text-[9px] text-[#64748b] mt-1.5 font-mono text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Thinking Indicator */}
              {(isSending || isRunningInvestigation) && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-8 h-8 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-[#070C16] border border-white/10 rounded-2xl px-4 py-3 text-xs text-[#00E5FF] flex items-center gap-2 shadow-md">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00E5FF]" />
                    <span className="font-medium animate-pulse">
                      {isRunningInvestigation 
                        ? 'LangGraph DFIR agent is reasoning over evidence & validating hypotheses...' 
                        : 'AI Copilot is analyzing case context and formulating response...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts Suggestions (if few messages) */}
            {messages.length <= 2 && !isSending && (
              <div className="px-5 py-2.5 bg-[#070C16]/60 border-t border-white/5 flex flex-wrap items-center gap-2 text-left shrink-0">
                <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-[#00E5FF]" />
                  Suggested Prompts:
                </span>
                {QUICK_PROMPTS.slice(0, 3).map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInputPrompt(prompt);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00E5FF]/10 border border-white/10 hover:border-[#00E5FF]/30 text-[#cbd5e1] hover:text-[#00E5FF] text-[11px] transition-all cursor-pointer truncate max-w-xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#070C16] border-t border-white/10 flex items-center gap-2 shrink-0">
              <input
                type="text"
                className="flex-grow bg-[#0B1220] border border-white/15 focus:border-[#00E5FF] focus:shadow-[0_0_12px_rgba(0,229,255,0.15)] rounded-xl px-4 py-3 text-xs text-white placeholder:text-[#64748b] outline-none transition-all"
                placeholder="Ask about suspicious files, MITRE tactics, mitigation playbooks, or evidence artifacts..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={isSending || isRunningInvestigation || !selectedCaseId}
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isSending || isRunningInvestigation || !selectedCaseId}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#3B82F6] hover:brightness-110 active:scale-95 text-[#0A0F1E] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}
