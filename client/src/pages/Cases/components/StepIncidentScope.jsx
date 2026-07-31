import React from 'react';
import { FileText } from 'lucide-react';

export default function StepIncidentScope({
  description, setDescription,
  timelineStart, setTimelineStart,
  mitreId, setMitreId,
  assets, setAssets,
  iocs, setIocs
}) {
  return (
    <div className="step-transition">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="text-primary w-8 h-8" />
        <h2 className="text-2xl font-headline-md text-white font-bold">Technical Incident Scope</h2>
      </div>
      
      <div className="flex flex-col gap-6">
        {/* Summary Description */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label-caps text-on-surface-variant">Executive Summary &amp; Description</label>
          <textarea 
            className="bg-surface-container-lowest border-outline-variant focus:border-primary rounded-lg p-3 text-on-surface resize-none border outline-none w-full" 
            placeholder="Detail the initial discovery, observed behavior, and immediate impact..." 
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Timeline Start */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-caps text-on-surface-variant">Attack Timeline Start (UTC)</label>
            <input 
              className="bg-surface-container-lowest border-outline-variant focus:border-primary rounded-lg p-3 text-on-surface border outline-none w-full" 
              type="datetime-local"
              value={timelineStart}
              onChange={(e) => setTimelineStart(e.target.value)}
            />
          </div>

          {/* MITRE ID */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-caps text-on-surface-variant">MITRE ATT&amp;CK Technique ID</label>
            <input 
              className="bg-surface-container-lowest border-outline-variant focus:border-primary rounded-lg p-3 text-on-surface font-mono border outline-none w-full" 
              placeholder="T1059.001" 
              type="text"
              value={mitreId}
              onChange={(e) => setMitreId(e.target.value)}
            />
          </div>

          {/* Affected Assets */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-caps text-on-surface-variant">Affected Assets (FQDN / IP)</label>
            <input 
              className="bg-surface-container-lowest border-outline-variant focus:border-primary rounded-lg p-3 text-on-surface border outline-none w-full" 
              placeholder="SRV-SQL-PROD-01.local, 10.0.4.12" 
              type="text"
              value={assets}
              onChange={(e) => setAssets(e.target.value)}
            />
          </div>

          {/* Initial IOCs */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-caps text-on-surface-variant">Initial IOCs (Comma Separated)</label>
            <input 
              className="bg-surface-container-lowest border-outline-variant focus:border-primary rounded-lg p-3 text-on-surface border outline-none w-full" 
              placeholder="8.8.8.8, malicious.exe, hash:..." 
              type="text"
              value={iocs}
              onChange={(e) => setIocs(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
