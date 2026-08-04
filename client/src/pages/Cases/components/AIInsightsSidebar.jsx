import React from 'react';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

export default function AIInsightsSidebar({ isSidebarCollapsed, setIsSidebarCollapsed }) {
  return (
    <aside 
      className="insight-sidebar border-l border-white/10 flex flex-col relative bg-surface-container-low/75 backdrop-blur-md h-[calc(100vh-70px)] transition-all duration-300 ease-in-out"
      style={{ 
        width: isSidebarCollapsed ? '0px' : '350px',
        borderLeftWidth: isSidebarCollapsed ? '0px' : '1px',
        boxShadow: isSidebarCollapsed ? 'none' : '0 0 20px rgba(34, 211, 238, 0.04)'
      }}
      aria-label="AI Insights Sidebar"
    >
      {/* Toggle Sidebar Button */}
      <button 
        type="button" 
        className="absolute top-1/2 w-6 h-12 bg-surface-container-high border border-white/10 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-[#47faf3] transition-all z-30" 
        style={{ 
          left: isSidebarCollapsed ? '-24px' : '-12px',
          transform: 'translateY(-50%)' 
        }}
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        title={isSidebarCollapsed ? 'Expand AI Insights' : 'Collapse AI Insights'}
      >
        {isSidebarCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* Sidebar scrollable contents */}
      <div className="p-6 space-y-8 overflow-y-auto h-full scrollbar-hide box-border">
        <div className="flex items-center justify-between select-none">
          <h3 className="font-headline-md text-sm text-secondary flex items-center gap-2 glow-text-cyan font-bold">
            <Sparkles className="w-4 h-4 text-secondary" />
            AI INSIGHTS
          </h3>
          <span className="text-[9px] px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 rounded uppercase font-bold tracking-wider">Real-time</span>
        </div>

        {/* Priority Recommendations */}
        <div className="space-y-4">
          <label className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider font-bold">Immediate Actions</label>
          <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/10 space-y-3">
            <div className="flex justify-between items-center font-mono">
              <span className="text-xs text-secondary font-bold">#DF-1037</span>
              <span className="text-[9px] bg-secondary text-on-secondary px-1.5 py-0.5 rounded font-bold">92% MATCH</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Detected pattern similar to 2023 REvil breach. Recommend lateral movement scan on <span className="text-on-surface font-semibold">V-SUITE-12</span>.
            </p>
            <button type="button" className="w-full h-[32px] bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary text-[10px] font-bold rounded-lg transition-colors uppercase tracking-widest select-none flex items-center justify-center">
              Escalate Investigation
            </button>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2 opacity-65">
            <div className="flex justify-between items-center font-mono">
              <span className="text-xs text-text-muted">#DF-1029</span>
              <span className="text-[9px] font-bold">71% Match</span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Low fidelity PowerShell activity. Historical data suggests false positive (System Maintenance).
            </p>
          </div>
        </div>

        {/* Active Analysts team */}
        <div className="space-y-4">
          <label className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider font-bold">Active Analysts</label>
          <div className="space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full border border-secondary/50 p-0.5">
                  <img className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmvPAjXL79P_B_jnx3DlixXyYffLTDVo5aP-RfRLE5EBu6BRMJhkUTENjxfJebSFRBBl49nzw04rRXsX3Gigi6mn9cma-llyR3sVx-k7gzYVlW2PMm3RvSxQo5HdW16LD4lgTQkPLzRNu0ZbYhqIVv3JJqFc1CZSKkG4XEQExON4GrBp5bnvm0jesOJbCAi4V_-fuSESBbSS3N3x-Vmnizx86smGGhqKl0As06RNE38Q7lw5DedG83" alt="J. Dorsey Profile" />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-[#1b1f2c]"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">J. Dorsey</span>
                <span className="text-[10px] text-on-surface-variant font-medium">Analyzing DF-1042</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full border border-primary/50 p-0.5">
                  <img className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuABxMX8aPA3SoIVNZo24ziAfJGEGiBnx3teieFU1oK615tfI2LgOAesbgxyzYJvL0q9PX94g3OEaFuEFnZSktfJAxBZ4UlW38mwCGIUowISAnr4pPnbWZLrE1BGn0trLOVuotwBifisX0CeXT31wx5jFLFILVyEk-pJ-eN3hc9yTu-uloqxt8xlarw6UFXOmAaUioRbtF_8PiTEmbMAH7fgg6hLvmmrkfLqyH8YLW8Eb4oaRKrwvBfm" alt="S. Kovac Profile" />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-[#1b1f2c]"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">S. Kovac</span>
                <span className="text-[10px] text-on-surface-variant font-medium">Live Memory Dump</span>
              </div>
            </div>

          </div>
        </div>

        {/* Resource Utilization */}
        <div className="pt-6 border-t border-white/5 space-y-4 select-none">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-label-caps font-bold">
              <span className="text-on-surface-variant">Storage Utilization</span>
              <span className="text-on-surface">4.2 / 10 TB</span>
            </div>
            <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: '42%' }}></div>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}
