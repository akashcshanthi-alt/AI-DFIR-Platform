import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FiTrendingUp } from "react-icons/fi";

const MOCK_TIME_DATA = [
  { time: "00:00", critical: 2, high: 4, medium: 7, low: 12, info: 18 },
  { time: "03:00", critical: 1, high: 3, medium: 6, low: 10, info: 15 },
  { time: "06:00", critical: 4, high: 6, medium: 8, low: 14, info: 22 },
  { time: "09:00", critical: 3, high: 9, medium: 12, low: 18, info: 25 },
  { time: "12:00", critical: 6, high: 14, medium: 15, low: 22, info: 30 },
  { time: "15:00", critical: 5, high: 11, medium: 14, low: 19, info: 28 },
  { time: "18:00", critical: 8, high: 16, medium: 18, low: 25, info: 35 },
  { time: "21:00", critical: 4, high: 8, medium: 10, low: 16, info: 20 },
];

export default function ThreatActivityChart() {
  const [timeRange, setTimeRange] = useState("24h");

  return (
    <div className="panel-3d threat-chart-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">IOC Correlation Stream</span>
          <h3 className="panel-title">Threat Activity Over Time</h3>
        </div>

        <div className="panel-controls">
          <div className="chart-legend-pills">
            <span className="legend-pill legend-pill--critical"><span className="dot" /> Critical</span>
            <span className="legend-pill legend-pill--high"><span className="dot" /> High</span>
            <span className="legend-pill legend-pill--medium"><span className="dot" /> Medium</span>
            <span className="legend-pill legend-pill--low"><span className="dot" /> Low</span>
            <span className="legend-pill legend-pill--info"><span className="dot" /> Info</span>
          </div>

          <div className="time-range-picker">
            {["1h", "6h", "24h", "7d"].map((range) => (
              <button
                key={range}
                type="button"
                className={`time-chip ${timeRange === range ? "time-chip--active" : ""}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-area-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={MOCK_TIME_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF3340" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#EF3340" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInfo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#252B3A" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#151A27",
                borderColor: "#252B3A",
                borderRadius: "10px",
                color: "#F8FAFC",
                fontSize: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            />

            <Area type="monotone" dataKey="critical" stroke="#EF3340" strokeWidth={2} fillOpacity={1} fill="url(#colorCritical)" />
            <Area type="monotone" dataKey="high" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#colorHigh)" />
            <Area type="monotone" dataKey="medium" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorMedium)" />
            <Area type="monotone" dataKey="low" stroke="#3B82F6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorLow)" />
            <Area type="monotone" dataKey="info" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorInfo)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
