import { useEffect, useState } from "react";
import { FiPause, FiPlay, FiSearch, FiTerminal, FiTrash2 } from "react-icons/fi";

const INITIAL_LOGS = [
  { id: "101", timestamp: "18:14:02.102", level: "CRITICAL", source: "EDR_AGENT_WS204", message: "Suspicious DLL injection in lsass.exe process space. PID: 4092" },
  { id: "102", timestamp: "18:14:00.892", level: "WARN", source: "C2_SENTINEL", message: "Outbound HTTP POST to 185.220.101.4:443 with high entropy payload" },
  { id: "103", timestamp: "18:13:58.450", level: "INFO", source: "VOLATILITY_ENGINE", message: "Memory dump acquisition completed for host DFIR-12 (Size: 16.4GB)" },
  { id: "104", timestamp: "18:13:55.120", level: "INFO", source: "ARCLIGHT_CORE", message: "SHA256 hash verified against VirusTotal database (Detection score: 48/72)" },
  { id: "105", timestamp: "18:13:49.004", level: "WARN", source: "KERBEROS_AUDIT", message: "Golden ticket kerberos request ticket granting service (TGS) mismatch" },
];

const STREAMING_POOL = [
  { level: "CRITICAL", source: "SYSKEY_MONITOR", message: "Attempted SAM database hives extraction detected via reg.exe" },
  { level: "WARN", source: "FIREWALL_RULE", message: "Port 445 SMB traffic spike detected across internal subnet" },
  { level: "INFO", source: "EDR_HEURISTIC", message: "User elevated privileges through sudoers policy modification" },
  { level: "DEBUG", source: "YARA_SCANNER", message: "Scanning pattern block 0x00FF800 with 1,420 signatures" },
];

export default function LiveLogTerminal() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("ALL");

  useEffect(() => {
    if (isPaused) return undefined;

    const interval = setInterval(() => {
      const randomItem = STREAMING_POOL[Math.floor(Math.random() * STREAMING_POOL.length)];
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;

      const newLogItem = {
        id: String(Date.now()),
        timestamp,
        level: randomItem.level,
        source: randomItem.source,
        message: randomItem.message,
      };

      setLogs((prev) => [newLogItem, ...prev.slice(0, 49)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === "ALL" || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="terminal-card">
      <div className="terminal-card__header">
        <div className="terminal-title-group">
          <FiTerminal className="terminal-icon" />
          <div>
            <h3 className="terminal-title">Real-Time Forensic Event Stream</h3>
            <span className="terminal-status">
              <span className={`status-dot ${isPaused ? "status-dot--paused" : "status-dot--live"}`} />
              {isPaused ? "Stream Paused" : "Live Streaming (SOC Feed)"}
            </span>
          </div>
        </div>

        <div className="terminal-controls">
          <div className="terminal-search">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Filter logs by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="terminal-level-select"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="ALL">All Levels</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
            <option value="DEBUG">DEBUG</option>
          </select>

          <button
            type="button"
            className="terminal-btn"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Resume Stream" : "Pause Stream"}
          >
            {isPaused ? <FiPlay /> : <FiPause />}
          </button>

          <button
            type="button"
            className="terminal-btn"
            onClick={() => setLogs([])}
            title="Clear Stream"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className="terminal-window">
        {filteredLogs.length === 0 ? (
          <div className="terminal-empty">No event logs matching filter criteria...</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className={`log-row log-row--${log.level.toLowerCase()}`}>
              <span className="log-timestamp">[{log.timestamp}]</span>
              <span className={`log-level log-level--${log.level.toLowerCase()}`}>{log.level}</span>
              <span className="log-source">[{log.source}]</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
