import React from 'react';
import { Server, User, AlertTriangle, Lock } from 'lucide-react';

export default function CriticalEntities() {
  return (
    <div className="glass-panel rounded-xl p-6">
      <h3 className="font-label-caps text-label-caps text-[#F8FAFC] mb-4 text-left">CRITICAL ENTITIES</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#101827] border border-[rgba(71,250,243,0.15)]">
          <Server className="text-[#94A3B8] w-4 h-4" />
          <div className="text-left">
            <p className="font-code-sm text-[13px] text-[#F8FAFC]">SRV-PROD-SQL01</p>
            <p className="font-label-caps text-[10px] text-[#94A3B8] mt-0.5">Origin Endpoint</p>
          </div>
          <AlertTriangle className="ml-auto text-error w-4 h-4 animate-pulse" />
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#101827] border border-[rgba(71,250,243,0.15)]">
          <User className="text-[#94A3B8] w-4 h-4" />
          <div className="text-left">
            <p className="font-code-sm text-[13px] text-[#F8FAFC]">admin_local_svc</p>
            <p className="font-label-caps text-[10px] text-[#94A3B8] mt-0.5">Compromised User</p>
          </div>
          <Lock className="ml-auto text-error w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
