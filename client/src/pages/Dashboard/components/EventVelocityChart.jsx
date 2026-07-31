import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function EventVelocityChart({ velocityData }) {
  return (
    <div className="col-span-12 lg:col-span-4">
      <div className="soc-card min-h-[360px] flex flex-col justify-between">
        <div className="select-none">
          <div className="flex items-center gap-2 text-white">
            <TrendingUp className="w-4 h-4 text-[#47faf3]" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Event Velocity</h2>
          </div>
          <p className="text-xs text-[#cbd5e1]/60 mt-0.5">Packet ingestion events per 10m window</p>
        </div>

        {/* Recharts Area Chart */}
        <div className="w-full h-[180px] flex items-center justify-center mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={velocityData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#47faf3" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#47faf3" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
              <XAxis dataKey="time" stroke="#cbd5e1" fontSize={8} opacity={0.5} tickLine={false} />
              <YAxis stroke="#cbd5e1" fontSize={8} opacity={0.5} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0c1322', borderColor: '#47faf3', borderRadius: '8px', fontSize: '10px', color: '#fff' }} />
              <Area type="monotone" dataKey="events" name="Event Count" stroke="#47faf3" strokeWidth={2} fillOpacity={1} fill="url(#colorVelocity)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="text-[10px] text-[#cbd5e1]/40 border-t border-white/5 pt-3 mt-4 text-center uppercase tracking-wider font-semibold font-mono">
          Live ingest interface socket pipeline active
        </div>
      </div>
    </div>
  );
}
