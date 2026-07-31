import React from 'react';
import { ShieldAlert, Search, Zap, Cpu, TrendingUp } from 'lucide-react';

export default function KPICards({ activeCount, telemetry }) {
  return (
    <>
      {/* KPI 1: Active Incidents */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <div className="soc-card hover:border-[#ffb4ab]/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1]/60">Active Incidents</span>
            <div className="w-8 h-8 rounded-lg bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-bold text-white tracking-tight">{activeCount}</span>
            <span className="text-[11px] text-[#cbd5e1]/40 mt-1">Requiring immediate containment</span>
          </div>
        </div>
      </div>

      {/* KPI 2: MTTD */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <div className="soc-card hover:border-[#47faf3]/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1]/60">Mean Time to Detect (MTTD)</span>
            <div className="w-8 h-8 rounded-lg bg-[#47faf3]/10 border border-[#47faf3]/20 flex items-center justify-center text-[#47faf3]">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-bold text-white tracking-tight">{telemetry.mttd}</span>
            <span className="text-[11px] text-[#cbd5e1]/40 mt-1">Average threat discovery speed</span>
          </div>
        </div>
      </div>

      {/* KPI 3: MTTR */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <div className="soc-card hover:border-orange-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1]/60">Mean Time to Resolve (MTTR)</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-bold text-white tracking-tight">{telemetry.mttr}</span>
            <span className="text-[11px] text-[#cbd5e1]/40 mt-1">Average patch remediation window</span>
          </div>
        </div>
      </div>

      {/* KPI 4: AI Resolution Rate */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <div className="soc-card hover:border-[#aec6ff]/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#cbd5e1]/60">AI Resolution Rate</span>
            <div className="w-8 h-8 rounded-lg bg-[#aec6ff]/10 border border-[#aec6ff]/20 flex items-center justify-center text-[#aec6ff]">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">{telemetry.aiResolutions}</span>
              <span className="text-[10px] text-[#47faf3] bg-[#47faf3]/10 px-1 py-0.5 rounded font-bold flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" />
                +4%
              </span>
            </div>
            <span className="text-[11px] text-[#cbd5e1]/40 mt-1">Autonomous orchestration matches</span>
          </div>
        </div>
      </div>
    </>
  );
}
