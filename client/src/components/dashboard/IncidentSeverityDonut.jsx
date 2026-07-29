import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const SEVERITY_DATA = [
  { name: "Critical", value: 8, color: "#EF3340" },
  { name: "High", value: 14, color: "#F97316" },
  { name: "Medium", value: 19, color: "#F59E0B" },
  { name: "Low", value: 24, color: "#3B82F6" },
  { name: "Info", value: 32, color: "#10B981" },
];

export default function IncidentSeverityDonut({ cases = [] }) {
  const totalCases = SEVERITY_DATA.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="panel-3d donut-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Severity Breakdown</span>
          <h3 className="panel-title">Incident Distribution</h3>
        </div>
      </div>

      <div className="donut-body">
        <div className="donut-chart-container">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={SEVERITY_DATA}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
                stroke="#10141F"
                strokeWidth={3}
              >
                {SEVERITY_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#151A27",
                  borderColor: "#252B3A",
                  borderRadius: "8px",
                  color: "#F8FAFC",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center text overlay */}
          <div className="donut-center-label">
            <span className="center-value">{totalCases}</span>
            <span className="center-text">Total Events</span>
          </div>
        </div>

        <div className="donut-legend-grid">
          {SEVERITY_DATA.map((item) => (
            <div key={item.name} className="donut-legend-item">
              <span className="donut-dot" style={{ backgroundColor: item.color }} />
              <span className="legend-name">{item.name}</span>
              <span className="legend-val">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
