import React from 'react';
import { Search, Bell, Settings, HelpCircle, User, Clock } from 'lucide-react';

export default function InvestigationHeader({ 
  caseId = '#TR-9902', 
  severity = 'CRITICAL', 
  status = 'ACTIVE', 
  analystName = 'J. Dorsey', 
  analystRole = 'Lead Analyst',
  lastUpdated = '2m ago',
  avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8JpoHIVNyVZeOI0c2OwXzHrsvviUzPYUJwPIiKGgCYFMMdz-spiuCG-yHtWKwNTlWC7t2-SQTBpq0MmAyuuHNVWC3_nC3MznNmcOuIZ5lSy3gu0irDnECsVM2RARL2JO1zbucWZz0qYfNAYM-_oXuwi0Xk8oCaTgPnhKV02gZ-wcHANtxn9eCVxGv3PaMr3Fj6Fu0xUgcBOkiRyrLlzWQCkvZLyE1h6c6kIe7LR7LZehfgr_feU2P' 
}) {
  return (
    <header className="flex justify-between items-center w-full px-6 h-16 bg-[#111827]/80 backdrop-blur-xl border-b border-[rgba(71,250,243,0.15)] z-40 shrink-0 select-none">
      
      {/* Left: Case Info Bar */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="font-label-caps text-[#94A3B8] text-xs">Case ID:</span>
          <span className="font-headline-md text-secondary tracking-tighter text-base font-bold">{caseId}</span>
        </div>
        <div className="h-6 w-[1px] bg-white/10"></div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-error/10 border border-error/20">
            <div className="w-1.5 h-1.5 bg-error rounded-full animate-pulse"></div>
            <span className="font-label-caps text-[10px] text-error font-bold">{severity}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20">
            <span className="font-label-caps text-[10px] text-secondary font-bold">{status}</span>
          </div>
        </div>
        
        {/* Analyst & Time indicators */}
        <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#94A3B8] font-mono">
          <User className="w-3.5 h-3.5 text-[#94A3B8]/60" />
          <span className="font-semibold text-[#94A3B8]/50 uppercase">Analyst:</span>
          <span className="text-[#F8FAFC] font-bold">{analystName}</span>
        </div>
        
        <div className="h-6 w-[1px] bg-white/10 hidden lg:block"></div>
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#94A3B8] font-mono">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]/60" />
          <span className="font-semibold text-[#94A3B8]/50 uppercase">Updated:</span>
          <span className="text-secondary font-bold">{lastUpdated}</span>
        </div>
      </div>
      
      {/* Right Actions & Search */}
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-2 bg-[#101827] px-4 py-2 rounded-xl border border-[rgba(255,255,255,0.08)] focus-within:border-[#47faf3] focus-within:shadow-[0_0_10px_rgba(71,250,243,0.2)] transition-all duration-200">
          <Search className="text-[#94A3B8] w-4 h-4" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8]/50 w-48 outline-none" 
            placeholder="Query forensics..." 
            type="text"
          />
        </div>
        
        {/* Compact action buttons */}
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            className="w-9 h-9 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#101827] text-[#F8FAFC] hover:bg-[#162033] hover:border-[#47FAF3] hover:shadow-[0_0_15px_rgba(71,250,243,0.15)] hover:translate-y-[-2px] transition-all duration-200 outline-none flex items-center justify-center cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          
          <button 
            type="button" 
            className="w-9 h-9 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#101827] text-[#F8FAFC] hover:bg-[#162033] hover:border-[#47FAF3] hover:shadow-[0_0_15px_rgba(71,250,243,0.15)] hover:translate-y-[-2px] transition-all duration-200 outline-none flex items-center justify-center cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button 
            type="button" 
            className="w-9 h-9 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#101827] text-[#F8FAFC] hover:bg-[#162033] hover:border-[#47FAF3] hover:shadow-[0_0_15px_rgba(71,250,243,0.15)] hover:translate-y-[-2px] transition-all duration-200 outline-none flex items-center justify-center cursor-pointer"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="text-right">
            <p className="font-label-caps text-label-caps text-[#F8FAFC] leading-none font-bold text-xs">{analystName}</p>
            <p className="font-label-caps text-[10px] text-[#94A3B8] mt-1 font-semibold">{analystRole}</p>
          </div>
          <img 
            className="w-10 h-10 rounded-full border border-secondary/30 object-cover" 
            alt={analystName} 
            src={avatarUrl} 
          />
        </div>
      </div>
    </header>
  );
}
