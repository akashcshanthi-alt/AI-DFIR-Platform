import React from 'react';
import { Server, User, AlertTriangle, Lock } from 'lucide-react';

export default function CriticalEntities({ targetHost = 'SRV-PROD-SQL01', compromiseUser = 'admin_local_svc' }) {
  return (
    <div className="glass-panel rounded-xl p-6">
      <h3 className="font-label-caps text-label-caps text-on-surface mb-4">CRITICAL ENTITIES</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-high/30 border border-white/5">
          <Server className="text-outline w-4 h-4" />
          <div>
            <p className="font-code-sm text-[13px] text-on-surface">{targetHost}</p>
            <p className="font-label-caps text-[10px] text-outline">Origin Endpoint</p>
          </div>
          <AlertTriangle className="ml-auto text-error w-4 h-4" />
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-high/30 border border-white/5">
          <User className="text-outline w-4 h-4" />
          <div>
            <p className="font-code-sm text-[13px] text-on-surface">{compromiseUser}</p>
            <p className="font-label-caps text-[10px] text-outline">Compromised User</p>
          </div>
          <Lock className="ml-auto text-error w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
