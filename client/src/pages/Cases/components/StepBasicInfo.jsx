import React from 'react';
import { FileText } from 'lucide-react';

export default function StepBasicInfo({ 
  title, setTitle,
  incidentType, setIncidentType,
  severity, setSeverity,
  department, setDepartment,
  priority, setPriority 
}) {
  return (
    <div className="step-transition">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="text-primary w-8 h-8" />
        <h2 className="text-2xl font-headline-md text-white font-bold">General Case Parameters</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Title */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label-caps text-on-surface-variant">Case Title</label>
          <input 
            className="bg-surface-container-lowest border-outline-variant focus:border-primary rounded-lg p-3 text-on-surface placeholder:opacity-30 outline-none w-full border" 
            placeholder="e.g. Operation Nightfall - SQL Injection" 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        {/* Type */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label-caps text-on-surface-variant">Incident Type</label>
          <select 
            className="bg-surface-container-lowest border-outline-variant focus:border-primary rounded-lg p-3 text-on-surface border outline-none w-full"
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
          >
            <option value="Malware Outbreak">Malware Outbreak</option>
            <option value="Data Exfiltration">Data Exfiltration</option>
            <option value="Denial of Service">Denial of Service</option>
            <option value="Phishing Campaign">Phishing Campaign</option>
            <option value="Unauthorized Access">Unauthorized Access</option>
          </select>
        </div>

        {/* Severity */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label-caps text-on-surface-variant">Severity Level</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { val: 'LOW', label: 'LOW', style: 'border border-outline-variant rounded-md text-xs font-bold hover:bg-white/5 text-outline' },
              { val: 'MED', label: 'MED', style: 'border border-outline-variant rounded-md text-xs font-bold hover:bg-white/5 text-outline' },
              { val: 'HIGH', label: 'HIGH', style: 'border border-primary bg-primary/10 text-primary rounded-md text-xs font-bold' },
              { val: 'CRIT', label: 'CRIT', style: 'border border-tertiary-container/30 text-tertiary-container rounded-md text-xs font-bold hover:bg-tertiary-container/10' }
            ].map((opt) => {
              const isSelected = severity === opt.val;
              let classes = opt.style;
              if (isSelected) {
                if (opt.val === 'LOW' || opt.val === 'MED') {
                  classes = 'border border-primary bg-primary/10 text-primary rounded-md text-xs font-bold';
                }
              } else {
                if (opt.val === 'HIGH') {
                  classes = 'border border-outline-variant rounded-md text-xs font-bold hover:bg-white/5 text-outline';
                }
              }
              return (
                <button 
                  key={opt.val}
                  type="button" 
                  className={`${classes} py-2 px-3 outline-none`}
                  onClick={() => setSeverity(opt.val)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Department */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label-caps text-on-surface-variant">Department</label>
          <input 
            className="bg-surface-container-lowest border-outline-variant focus:border-primary rounded-lg p-3 text-on-surface border outline-none w-full" 
            placeholder="Network Security Ops" 
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label-caps text-on-surface-variant">Priority Index</label>
          <input 
            className="accent-primary mt-2 cursor-pointer" 
            type="range"
            min="0"
            max="100"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
        </div>

        {/* Organization */}
        <div className="flex flex-col gap-2 select-none">
          <label className="text-xs font-label-caps text-on-surface-variant">Organization</label>
          <input 
            className="bg-surface-container/50 border-outline-variant rounded-lg p-3 text-on-surface-variant opacity-60 cursor-not-allowed border outline-none w-full" 
            readOnly 
            type="text" 
            value="TRACE AI Global"
          />
        </div>
      </div>
    </div>
  );
}
