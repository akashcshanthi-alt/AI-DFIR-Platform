import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function IncidentTrendSection({ trendData }) {
  // Format trend data with simple, readable labels: Today, Yesterday, This Week
  const rawList = Array.isArray(trendData) ? trendData : [];

  const formattedData = rawList.map((item, index) => {
    let label = item.time || '';
    const totalItems = rawList.length;

    if (index === totalItems - 1) {
      label = 'Today';
    } else if (index === totalItems - 2) {
      label = 'Yesterday';
    } else {
      // Format as readable month-day or day
      const parts = (item.time || '').split('-');
      if (parts.length === 2) {
        label = `${parts[0]}/${parts[1]}`;
      }
    }

    return {
      name: label,
      rawDate: item.time,
      count: item.events ?? 0
    };
  });

  const totalThisWeek = formattedData.reduce((sum, d) => sum + d.count, 0);
  const todayCount = formattedData[formattedData.length - 1]?.count ?? 0;
  const yesterdayCount = formattedData[formattedData.length - 2]?.count ?? 0;

  return (
    <div className="soc-card p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Incident Trend</h2>
            <p className="text-xs text-[#cbd5e1]/60">Incidents logged over time.</p>
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
            <span className="text-[#cbd5e1]/60">Today:</span>
            <strong className="text-[#47faf3]">{todayCount}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
            <span className="text-[#cbd5e1]/60">Yesterday:</span>
            <strong className="text-white">{yesterdayCount}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold">{totalThisWeek} This Week</span>
          </div>
        </div>
      </div>

      {/* Simple Chart */}
      <div className="w-full h-[220px] relative">
        {formattedData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-[#cbd5e1]/40">
            No incident trend data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incidentTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#47faf3" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#47faf3" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c1322',
                  borderColor: 'rgba(71, 250, 243, 0.4)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  fontSize: '12px',
                  color: '#fff'
                }}
                formatter={(value) => [`${value} incidents`, 'Incident Count']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#47faf3"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incidentTrendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
