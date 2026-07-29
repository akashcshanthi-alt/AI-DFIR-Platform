import { FiActivity, FiAlertOctagon, FiDatabase, FiShield, FiTrendingUp, FiZap } from "react-icons/fi";
import { ResponsiveContainer, LineChart, Line } from "recharts";

const SPARK_DATA_1 = [{ v: 4 }, { v: 6 }, { v: 5 }, { v: 8 }, { v: 7 }, { v: 12 }, { v: 14 }];
const SPARK_DATA_2 = [{ v: 2 }, { v: 5 }, { v: 3 }, { v: 9 }, { v: 6 }, { v: 8 }, { v: 6 }];
const SPARK_DATA_3 = [{ v: 12 }, { v: 18 }, { v: 24 }, { v: 31 }, { v: 29 }, { v: 42 }, { v: 48 }];
const SPARK_DATA_4 = [{ v: 120 }, { v: 185 }, { v: 210 }, { v: 290 }, { v: 340 }, { v: 410 }, { v: 452 }];
const SPARK_DATA_5 = [{ v: 98 }, { v: 99 }, { v: 97 }, { v: 99.2 }, { v: 98.8 }, { v: 99.4 }, { v: 99.8 }];

export default function StatCards3D({ telemetry, alertsCount, casesCount }) {
  const cards = [
    {
      id: "active-incidents",
      title: "Active Incidents",
      value: casesCount ?? 14,
      change: "+2 since 1h",
      isUp: true,
      color: "purple",
      accentHex: "#7C3AED",
      icon: FiAlertOctagon,
      sparkData: SPARK_DATA_1,
    },
    {
      id: "critical-alerts",
      title: "Critical Alerts",
      value: alertsCount ?? 8,
      change: "+4 since 15m",
      isUp: true,
      color: "red",
      accentHex: "#EF3340",
      icon: FiZap,
      sparkData: SPARK_DATA_2,
    },
    {
      id: "evidence-items",
      title: "Evidence Items",
      value: "48",
      change: "+11 dumps queued",
      isUp: true,
      color: "blue",
      accentHex: "#3B82F6",
      icon: FiDatabase,
      sparkData: SPARK_DATA_3,
    },
    {
      id: "threats-blocked",
      title: "Threats Blocked",
      value: "452",
      change: "+98.4% neutralized",
      isUp: true,
      color: "green",
      accentHex: "#10B981",
      icon: FiShield,
      sparkData: SPARK_DATA_4,
    },
    {
      id: "system-health",
      title: "System Health",
      value: "99.8%",
      change: "Optimal stability",
      isUp: true,
      color: "green",
      accentHex: "#10B981",
      icon: FiActivity,
      sparkData: SPARK_DATA_5,
    },
  ];

  return (
    <div className="stat-cards-3d-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.id} className={`stat-card-3d stat-card-3d--${card.color}`}>
            <div className="stat-card-top">
              <div className="stat-icon-3d">
                <Icon />
              </div>
              <span className={`stat-change stat-change--${card.isUp ? "up" : "down"}`}>
                <FiTrendingUp className="trend-icon" /> {card.change}
              </span>
            </div>

            <div className="stat-card-middle">
              <span className="stat-title">{card.title}</span>
              <h3 className="stat-value">{card.value}</h3>
            </div>

            <div className="stat-card-bottom">
              <div className="sparkline-wrap">
                <ResponsiveContainer width="100%" height={32}>
                  <LineChart data={card.sparkData}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={card.accentHex}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
