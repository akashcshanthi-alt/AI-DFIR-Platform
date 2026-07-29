import { useState } from "react";
import { FiCpu, FiPlay, FiCheck, FiRefreshCw, FiZap, FiShield, FiSend } from "react-icons/fi";

const INITIAL_RECOMMENDATIONS = [
  {
    id: "rec-1",
    action: "Isolate Endpoint WS-204",
    reason: "PowerShell base64 payload detected matches Lazarus Group IOC pattern.",
    severity: "CRITICAL",
    status: "pending",
  },
  {
    id: "rec-2",
    action: "Dump Volatile RAM — Host DFIR-12",
    reason: "Privilege escalation attempts detected in LSASS process memory.",
    severity: "HIGH",
    status: "pending",
  },
  {
    id: "rec-3",
    action: "Block C2 Subnet 194.26.29.0/24",
    reason: "Repeated beaconing with 30s jitter observed across 3 endpoints.",
    severity: "HIGH",
    status: "pending",
  },
];

export default function AiCopilotWidget() {
  const [recommendations, setRecommendations] = useState(INITIAL_RECOMMENDATIONS);
  const [userQuery, setUserQuery] = useState("");
  const [aiLogs, setAiLogs] = useState([
    { role: "assistant", text: "ARCLIGHT Neural DFIR Agent operational. Scanning active IOC feeds and node memory states..." }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunAction = (id) => {
    setRecommendations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "executing" } : item))
    );

    setTimeout(() => {
      setRecommendations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "completed" } : item))
      );
      setAiLogs((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Action executed successfully: Automated containment policy applied to target. Vector neutralized.`,
        },
      ]);
    }, 1200);
  };

  const handleSendPrompt = (e) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const query = userQuery;
    setUserQuery("");
    setAiLogs((prev) => [...prev, { role: "user", text: query }]);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      let reply = "Automated threat evaluation complete. Hash matched zero known benign binaries.";
      if (query.toLowerCase().includes("powershell")) {
        reply = "PowerShell script block analysis: Execution contained un-reflected DLL invocation in memory offset 0x7FFA. Containment advised.";
      } else if (query.toLowerCase().includes("memory") || query.toLowerCase().includes("ram")) {
        reply = "Memory Analysis AI Agent: Volatile RAM dump queued for volatility3 extraction (YARA rules loaded).";
      } else if (query.toLowerCase().includes("c2") || query.toLowerCase().includes("network")) {
        reply = "Network Intelligence: Host 192.168.1.104 established out-of-band TLS connection to suspicious ASN 49210.";
      }

      setAiLogs((prev) => [...prev, { role: "assistant", text: reply }]);
    }, 1000);
  };

  return (
    <div className="ai-copilot-card">
      <div className="ai-copilot-card__header">
        <div className="ai-copilot-card__title-group">
          <div className="ai-copilot-card__icon">
            <FiCpu />
          </div>
          <div>
            <span className="ai-copilot-card__kicker">Neural Triage Engine</span>
            <h3 className="ai-copilot-card__title">ARCLIGHT AI Threat Copilot</h3>
          </div>
        </div>
        <span className="ai-badge">
          <FiZap /> AI Autonomous Mode Active
        </span>
      </div>

      <div className="ai-copilot-card__body">
        <div className="ai-rec-section">
          <h4 className="ai-subheading">Recommended Immediate Containments</h4>
          <div className="ai-rec-list">
            {recommendations.map((item) => (
              <div key={item.id} className={`ai-rec-item ai-rec-item--${item.severity.toLowerCase()}`}>
                <div className="ai-rec-item__info">
                  <div className="ai-rec-item__meta">
                    <span className={`ai-severity-badge ai-severity-badge--${item.severity.toLowerCase()}`}>
                      {item.severity}
                    </span>
                    <strong className="ai-rec-item__action">{item.action}</strong>
                  </div>
                  <p className="ai-rec-item__reason">{item.reason}</p>
                </div>

                <button
                  type="button"
                  className={`ai-action-btn ${item.status === "completed" ? "ai-action-btn--done" : ""}`}
                  onClick={() => handleRunAction(item.id)}
                  disabled={item.status !== "pending"}
                >
                  {item.status === "pending" && (
                    <>
                      <FiPlay /> Execute AI Containment
                    </>
                  )}
                  {item.status === "executing" && (
                    <>
                      <FiRefreshCw className="spin-icon" /> Neutralizing...
                    </>
                  )}
                  {item.status === "completed" && (
                    <>
                      <FiCheck /> Containment Enforced
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="ai-chat-section">
          <h4 className="ai-subheading">Ask Forensic Intelligence Assistant</h4>
          <div className="ai-chat-window">
            {aiLogs.map((log, idx) => (
              <div key={idx} className={`ai-chat-bubble ai-chat-bubble--${log.role}`}>
                <span className="ai-chat-bubble__sender">
                  {log.role === "user" ? "Analyst" : "ARCLIGHT AI"}
                </span>
                <p className="ai-chat-bubble__text">{log.text}</p>
              </div>
            ))}
            {isProcessing && (
              <div className="ai-chat-bubble ai-chat-bubble--assistant">
                <span className="ai-chat-bubble__sender">ARCLIGHT AI</span>
                <p className="ai-chat-bubble__text ai-typing">
                  <FiRefreshCw className="spin-icon" /> Processing telemetry and correlating MITRE ATT&CK patterns...
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSendPrompt} className="ai-chat-input-bar">
            <input
              type="text"
              className="ai-chat-input"
              placeholder="Ask AI to investigate host, summarize YARA match, or decode payload..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
            />
            <button type="submit" className="ai-chat-send-btn" disabled={!userQuery.trim() || isProcessing}>
              <FiSend />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
