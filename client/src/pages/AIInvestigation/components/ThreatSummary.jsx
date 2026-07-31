import React from 'react';

export default function ThreatSummary() {
  return (
    <div className="glass-panel p-4 rounded-xl bg-[#101827] border border-[rgba(71,250,243,0.15)]">
      <p className="font-label-caps text-[11px] text-secondary mb-2 font-bold tracking-wide">LIVE THREAT SUMMARY</p>
      <p className="text-sm text-[#94A3B8] leading-relaxed">
        The observed behavior patterns strongly match <span className="text-[#47FAF3] font-semibold">APT28 (Fancy Bear)</span>. Recommend immediate isolation of <span className="text-[#F8FAFC] font-mono">SRV-PROD-SQL01</span> as data egress is currently active at 2.4MB/s.
      </p>
    </div>
  );
}
