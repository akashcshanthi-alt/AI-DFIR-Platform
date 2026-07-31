import React from 'react';
import { Plus, Minus, Globe } from 'lucide-react';

export default function ThreatMap() {
  return (
    <div className="col-span-12 lg:col-span-8">
      <div className="soc-card flex flex-col min-h-[460px] relative overflow-hidden">
        <div className="flex justify-between items-start z-10 select-none">
          <div>
            <h2 className="text-lg font-bold text-white">Global Threat Map</h2>
            <p className="text-xs text-[#cbd5e1]/60 mt-0.5">Real-time telemetry and network threat vectors</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-[#0f1423]/80 px-2.5 py-1 rounded-md border border-white/5 text-[9.5px] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#47faf3] animate-ping"></span>
              ACTIVE NODES: 1,402
            </div>
            <div className="bg-[#0f1423]/80 px-2.5 py-1 rounded-md border border-white/5 text-[9.5px] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-ping"></span>
              BREACH ATTEMPTS: 42
            </div>
          </div>
        </div>

        {/* Map Cover Graphic */}
        <div className="flex-1 mt-4 relative rounded-xl overflow-hidden border border-white/5 bg-[#080d1a]">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 grayscale-0 mix-blend-screen"
            style={{ backgroundImage: "url('/global_map.png')" }}
          />
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 350">
            <path d="M150,180 Q400,30 650,180" fill="none" stroke="#47faf3" strokeDasharray="5,5" strokeWidth="1">
              <animate attributeName="stroke-dashoffset" dur="3s" from="100" repeatCount="indefinite" to="0"></animate>
            </path>
            <path d="M220,80 Q350,220 580,110" fill="none" stroke="#ffb4ab" strokeDasharray="4,4" strokeWidth="1">
              <animate attributeName="stroke-dashoffset" dur="2s" from="100" repeatCount="indefinite" to="0"></animate>
            </path>
            <circle cx="150" cy="180" fill="#47faf3" r="5" className="animate-pulse"></circle>
            <circle cx="650" cy="180" fill="#47faf3" r="5" className="animate-pulse"></circle>
            <circle cx="580" cy="110" fill="#ffb4ab" r="5" className="animate-pulse"></circle>
          </svg>
          
          {/* Map controls bottom-left */}
          <div className="absolute bottom-4 left-4 flex gap-1.5 z-20">
            <button type="button" className="w-8 h-8 rounded-lg bg-[#0f1423]/90 hover:bg-[#161d33] border border-white/10 flex items-center justify-center text-white transition-colors" title="Zoom In">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button type="button" className="w-8 h-8 rounded-lg bg-[#0f1423]/90 hover:bg-[#161d33] border border-white/10 flex items-center justify-center text-white transition-colors" title="Zoom Out">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button type="button" className="w-8 h-8 rounded-lg bg-[#0f1423]/90 hover:bg-[#161d33] border border-white/10 flex items-center justify-center text-white transition-colors" title="Locate Center">
              <Globe className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
