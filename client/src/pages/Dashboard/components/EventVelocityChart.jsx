import React, { useState } from 'react';
import { TrendingUp, PieChart as PieIcon, BarChart2, CheckCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function EventVelocityChart({ chartsData }) {
  const [activeTab, setActiveTab] = useState('trend');

  if (!chartsData) {
    return (
      <div className="col-span-12 lg:col-span-4 soc-card min-h-[360px] flex items-center justify-center">
        <span className="text-xs text-[#cbd5e1]/40">No chart data loaded.</span>
      </div>
    );
  }

  const { severityDistribution = [], casesByMonth = [], incidentTrend = [], resolutionRate = {} } = chartsData;

  const severityColors = {
    Critical: '#ffb4ab',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#3b82f6'
  };

  const severityPieData = severityDistribution.map(item => ({
    ...item,
    color: severityColors[item.name] || '#8b90a0'
  })).filter(item => item.value > 0);

  return (
    <div className="col-span-12 lg:col-span-4">
      <div className="soc-card min-h-[360px] flex flex-col justify-between p-6">
        
        {/* Header and Tab Selector */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-2 text-white">
              {activeTab === 'trend' && <TrendingUp className="w-4 h-4 text-[#47faf3]" />}
              {activeTab === 'severity' && <PieIcon className="w-4 h-4 text-[#aec6ff]" />}
              {activeTab === 'monthly' && <BarChart2 className="w-4 h-4 text-orange-400" />}
              {activeTab === 'resolution' && <CheckCircle className="w-4 h-4 text-[#10b981]" />}
              <h2 className="text-xs font-bold uppercase tracking-wider">
                {activeTab === 'trend' && 'Incident Trend'}
                {activeTab === 'severity' && 'Severity Distribution'}
                {activeTab === 'monthly' && 'Cases by Month'}
                {activeTab === 'resolution' && 'Resolution Rate'}
              </h2>
            </div>
            
            <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
              {[
                { id: 'trend', label: 'Trend' },
                { id: 'severity', label: 'Severity' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'resolution', label: 'Rate' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider outline-none cursor-pointer transition-all ${
                    activeTab === tab.id 
                      ? 'bg-primary/20 text-primary border border-primary/20' 
                      : 'text-[#cbd5e1]/50 hover:text-white border border-transparent'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Stage */}
        <div className="w-full h-[200px] flex items-center justify-center relative">
          
          {/* Incident Trend Area Chart */}
          {activeTab === 'trend' && (
            incidentTrend.length === 0 ? (
              <span className="text-xs text-[#cbd5e1]/40">No trend history logged.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incidentTrend} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#47faf3" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#47faf3" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                  <XAxis dataKey="time" stroke="#cbd5e1" fontSize={8} opacity={0.5} tickLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={8} opacity={0.5} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0c1322', borderColor: '#47faf3', borderRadius: '8px', fontSize: '10px', color: '#fff' }} />
                  <Area type="monotone" dataKey="events" name="Cases Logged" stroke="#47faf3" strokeWidth={2} fillOpacity={1} fill="url(#colorVelocity)" />
                </AreaChart>
              </ResponsiveContainer>
            )
          )}

          {/* Severity Breakdown Pie Chart */}
          {activeTab === 'severity' && (
            severityPieData.length === 0 ? (
              <span className="text-xs text-[#cbd5e1]/40">No severity metrics computed.</span>
            ) : (
              <div className="flex w-full h-full items-center justify-between">
                <ResponsiveContainer width="55%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {severityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0c1322', borderColor: '#aec6ff', borderRadius: '8px', fontSize: '10px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-[45%] flex flex-col gap-2 text-[10px] text-[#cbd5e1]/80 pl-2">
                  {severityPieData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate font-semibold">{`${item.name}: ${item.value}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Cases by Month Bar Chart */}
          {activeTab === 'monthly' && (
            casesByMonth.length === 0 ? (
              <span className="text-xs text-[#cbd5e1]/40">No monthly totals aggregated.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={casesByMonth} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                  <XAxis dataKey="name" stroke="#cbd5e1" fontSize={8} opacity={0.5} tickLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={8} opacity={0.5} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0c1322', borderColor: '#3b82f6', borderRadius: '8px', fontSize: '10px', color: '#fff' }} />
                  <Bar dataKey="count" name="Case Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          )}

          {/* Resolution Rate Radial KPI Chart */}
          {activeTab === 'resolution' && (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative w-28 h-28 flex items-center justify-center rounded-full border border-white/5 bg-black/20">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="6" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="42" 
                    fill="transparent" 
                    stroke="#10b981" 
                    strokeWidth="6" 
                    strokeDasharray={263.8} 
                    strokeDashoffset={263.8 - (263.8 * (resolutionRate.rate || 0)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-white font-mono">{resolutionRate.rate || 0}%</span>
                  <span className="text-[8px] font-label-caps text-[#10b981] font-bold mt-0.5">RESOLVED</span>
                </div>
              </div>
              
              <div className="flex gap-4 text-[10px] text-[#cbd5e1]/60 font-mono mt-1">
                <div>CLOSED: <span className="text-white font-bold">{resolutionRate.closed || 0}</span></div>
                <div>OPEN: <span className="text-white font-bold">{resolutionRate.open || 0}</span></div>
                <div>TOTAL: <span className="text-white font-bold">{resolutionRate.total || 0}</span></div>
              </div>
            </div>
          )}

        </div>

        {/* Chart footer detail info */}
        <div className="text-[9px] text-[#cbd5e1]/40 border-t border-white/5 pt-3 mt-4 text-center uppercase tracking-wider font-semibold font-mono select-none">
          {activeTab === 'trend' && 'Surveillance ingestion telemetry online'}
          {activeTab === 'severity' && 'Classified by prioritization severity'}
          {activeTab === 'monthly' && 'Correlated quarterly incident index'}
          {activeTab === 'resolution' && 'Remediation closed-ticket threshold'}
        </div>

      </div>
    </div>
  );
}
