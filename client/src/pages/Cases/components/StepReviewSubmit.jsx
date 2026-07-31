import React from 'react';
import { ClipboardCheck, CheckCircle2, Clock } from 'lucide-react';

export default function StepReviewSubmit({
  title = 'Operation Nightfall - SQL Injection',
  incidentType = 'Malware Outbreak',
  severity = 'HIGH',
  leadInvestigator = 'Dr. Elena Kozlov',
  collaborators = [],
  deadline = 'None',
  aiOptions = {}
}) {
  return (
    <div className="step-transition">
      <div className="flex items-center gap-3 mb-8">
        <ClipboardCheck className="text-secondary w-8 h-8" />
        <h2 className="text-2xl font-headline-md text-white font-bold">Final Review &amp; Verification</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left & Center Summary Columns */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 bg-white/5 rounded-xl border border-white/5 text-left">
            <h3 className="text-sm font-label-caps text-primary mb-4 font-bold tracking-wider">CASE OVERVIEW</h3>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase">Case Title</p>
                <p className="text-sm font-bold text-white mt-1">{title || 'Untitled Case'}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase">Incident Type</p>
                <p className="text-sm font-bold text-white mt-1">{incidentType}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase">Severity</p>
                <p className="text-sm font-bold text-primary mt-1">{severity}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase">Lead</p>
                <p className="text-sm font-bold text-white mt-1">{leadInvestigator}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/5 rounded-xl border border-white/5 text-left">
            <h3 className="text-sm font-label-caps text-primary mb-4 font-bold tracking-wider">FORENSIC ASSETS</h3>
            <ul className="space-y-2 font-mono text-xs text-outline">
              <li className="flex items-center justify-between">
                <span>memory_dump_20231124.bin</span>
                <span className="text-secondary font-bold">4.2 GB / VERIFIED</span>
              </li>
              <li className="flex items-center justify-between">
                <span>firewall_logs_export.csv</span>
                <span className="text-on-surface-variant font-bold">980 MB / READY</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Status Column */}
        <div className="space-y-6">
          <div className="p-6 bg-secondary/5 rounded-xl border border-secondary/20 h-full text-left">
            <h3 className="text-sm font-label-caps text-secondary mb-4 font-bold tracking-wider">AI PRE-FLIGHT CHECK</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-secondary w-4 h-4" />
                <p className="text-xs text-on-surface">Data integrity verified</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-secondary w-4 h-4" />
                <p className="text-xs text-on-surface">Timeline sync established</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-secondary w-4 h-4" />
                <p className="text-xs text-on-surface">Cloud analysis engine online</p>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <Clock className="text-on-surface-variant w-4 h-4" />
                <p className="text-xs text-on-surface">Team notifications queued</p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-surface rounded-lg border border-white/5 text-[10px] font-mono leading-relaxed select-none">
              [SYS]: CASE_INIT_PREFLIGHT_SUCCESS...<br/>
              [AI]: ENGINES_READY_FOR_DETONATION...<br/>
              [AUTH]: PERMISSIONS_GRANTED_BY_CSO.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
