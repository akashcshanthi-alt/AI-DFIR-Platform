import React from 'react';
import { UploadCloud, Upload, Cpu, Database, Network, FileJson, Trash2 } from 'lucide-react';

export default function StepEvidenceIntake() {
  return (
    <div className="step-transition">
      <div className="flex items-center gap-3 mb-8">
        <UploadCloud className="text-primary w-8 h-8" />
        <h2 className="text-2xl font-headline-md text-white font-bold">Forensic Evidence Intake</h2>
      </div>

      <div className="border-2 border-dashed border-primary/20 rounded-xl p-12 flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group mb-8 select-none">
        <Upload className="text-5xl text-primary mb-4 group-hover:scale-110 transition-transform w-12 h-12" />
        <p className="text-on-surface text-lg font-bold">Drag &amp; Drop Forensic Artifacts</p>
        <p className="text-on-surface-variant text-sm mt-1">Supports E01, VMDK, MEMDUMP, PCAP, EVTX</p>
        
        <div className="flex gap-4 mt-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-surface rounded border border-white/5 text-xs text-on-surface-variant">
            <Cpu className="w-3.5 h-3.5" /> Memory
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-surface rounded border border-white/5 text-xs text-on-surface-variant">
            <Database className="w-3.5 h-3.5" /> Disk
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-surface rounded border border-white/5 text-xs text-on-surface-variant">
            <Network className="w-3.5 h-3.5" /> PCAP
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-label-caps text-on-surface-variant uppercase tracking-widest font-bold">Active Queue (3 Items)</label>
        
        {/* Memory dump */}
        <div className="flex items-center justify-between p-4 bg-surface-container-low border border-white/5 rounded-lg">
          <div className="flex items-center gap-4">
            <FileJson className="text-secondary w-5 h-5" />
            <div>
              <p className="text-sm font-bold text-white">memory_dump_20231124.bin</p>
              <p className="text-[10px] text-on-surface-variant font-mono">MD5: a8b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2 py-1 bg-secondary/10 text-secondary text-[10px] rounded border border-secondary/20 font-bold select-none">VERIFIED</span>
            <span className="text-xs text-on-surface-variant font-mono">4.2 GB</span>
            <button type="button" className="text-on-surface-variant hover:text-error transition-colors outline-none cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Upload progress */}
        <div className="flex items-center justify-between p-4 bg-surface-container-low border border-white/5 rounded-lg opacity-60">
          <div className="flex items-center gap-4">
            <FileJson className="text-primary w-5 h-5 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-white">firewall_logs_export.csv</p>
              <p className="text-[10px] text-on-surface-variant font-mono">Hashing in progress...</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[65%]"></div>
            </div>
            <span className="text-xs text-on-surface-variant font-mono">65%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
