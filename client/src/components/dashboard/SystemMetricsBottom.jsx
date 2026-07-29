import { FiCpu, FiDatabase, FiHardDrive, FiRefreshCw, FiServer } from "react-icons/fi";

export default function SystemMetricsBottom({ lastSynced, platformVersion }) {
  const metrics = [
    {
      id: "ingestion-rate",
      title: "Data Ingestion Rate",
      value: "14.8 GB/s",
      subtitle: "3.2M Events/sec",
      color: "purple",
      icon: FiDatabase,
    },
    {
      id: "log-sources",
      title: "Active Log Sources",
      value: "142 Endpoints",
      subtitle: "EDR & Sysmon Feeds",
      color: "blue",
      icon: FiServer,
    },
    {
      id: "ai-engine",
      title: "AI Analysis Engine",
      value: "< 4ms Latency",
      subtitle: "Autonomous YARA",
      color: "indigo",
      icon: FiCpu,
    },
    {
      id: "storage-usage",
      title: "Evidence Storage",
      value: "64.2 TB / 100 TB",
      subtitle: "NVMe RAID Cluster",
      color: "amber",
      icon: FiHardDrive,
    },
    {
      id: "last-update",
      title: "Last System Sync",
      value: lastSynced || "Just now",
      subtitle: platformVersion || "v1.0.0-stage1",
      color: "green",
      icon: FiRefreshCw,
    },
  ];

  return (
    <div className="system-metrics-bottom-grid">
      {metrics.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id} className={`compact-metric-card-3d compact-metric-card-3d--${item.color}`}>
            <div className="compact-card-icon">
              <Icon />
            </div>
            <div className="compact-card-body">
              <span className="compact-title">{item.title}</span>
              <h4 className="compact-value">{item.value}</h4>
              <span className="compact-subtitle">{item.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
