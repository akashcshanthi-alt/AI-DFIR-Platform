import { FiLayers } from "react-icons/fi";

const MITRE_TECHNIQUES = [
  { technique: "Command & Scripting Interpreter", id: "T1059", count: 42, percentage: 88, severity: "CRITICAL", color: "#EF3340" },
  { technique: "Valid Accounts Abuse", id: "T1078", count: 28, percentage: 65, severity: "HIGH", color: "#F97316" },
  { technique: "Phishing Payload Delivery", id: "T1566", count: 19, percentage: 48, severity: "HIGH", color: "#F59E0B" },
  { technique: "Remote Services Exploitation", id: "T1021", count: 14, percentage: 35, severity: "MEDIUM", color: "#3B82F6" },
  { technique: "Process Injection (LSASS)", id: "T1055", count: 9, percentage: 22, severity: "MEDIUM", color: "#7C3AED" },
];

export default function MitreAttackPanel() {
  return (
    <div className="panel-3d mitre-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">MITRE ATT&CK Framework</span>
          <h3 className="panel-title">Top Observed Attack Techniques</h3>
        </div>
        <span className="mitre-count-badge">5 Techniques Matched</span>
      </div>

      <div className="mitre-list">
        {MITRE_TECHNIQUES.map((tech) => (
          <div key={tech.id} className="mitre-item">
            <div className="mitre-item-header">
              <div className="mitre-item-title-group">
                <span className="tech-id">{tech.id}</span>
                <span className="tech-name">{tech.technique}</span>
              </div>
              <span className="tech-count" style={{ color: tech.color }}>
                {tech.count} Detections
              </span>
            </div>

            <div className="mitre-progress-bar-wrap">
              <div
                className="mitre-progress-bar-fill"
                style={{
                  width: `${tech.percentage}%`,
                  backgroundColor: tech.color,
                  boxShadow: `0 0 10px ${tech.color}66`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
