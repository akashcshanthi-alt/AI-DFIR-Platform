import { useEffect, useState } from "react";
import { FiRadio, FiAlertOctagon } from "react-icons/fi";

const DEFAULT_EVENTS = [
  "CRITICAL: Encoded PowerShell Launched on WS-FINANCE-104 (PID: 4092)",
  "HIGH: Brute Force Attempt Detected on VPN-GW-04 from 185.220.101.4",
  "MEDIUM: New IOC Matched — SHA256 Cobalt Strike Beacon Pattern",
  "HIGH: Unusual Egress Network Activity (45GB over TLS)",
  "INFO: Volatile RAM Dump Completed — Host DFIR-12 (16.4GB)",
  "CRITICAL: Kerberos Ticket TGS Mismatch on SERVER-FIN-DC01",
];

export default function AlertTicker({ events = DEFAULT_EVENTS }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % events.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [events.length]);

  return (
    <div className="alert-ticker-container">
      <div className="ticker-badge">
        <FiRadio className="ticker-signal-icon" />
        <span>LIVE SOC STREAM</span>
      </div>

      <div className="ticker-content">
        <FiAlertOctagon className="ticker-icon" />
        <span className="ticker-text">{events[index] || events[0]}</span>
      </div>

      <div className="ticker-meta">
        <span className="ticker-count">{index + 1} / {events.length}</span>
        <span className="ticker-pulse" />
      </div>
    </div>
  );
}
