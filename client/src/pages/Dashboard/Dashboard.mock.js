// TODO(stage 2): Replace this mock payload with the real dashboard API response.
export const dashboardMock = {
  meta: {
    environment: "development",
    generatedAt: "2026-07-18T00:00:00Z",
  },
  platform: {
    name: "ARCLIGHT",
    tagline: "AI-Driven DFIR Platform",
    version: "v1.0.0-stage1",
    status: "SYSTEM STABLE",
  },
  analyst: {
    email: "analyst.s.rivera@arclight.local",
    role: "Lead DFIR Analyst",
    initials: "SR",
  },
  telemetry: [
    {
      id: "active-alerts",
      label: "Active Alerts",
      value: 8,
      unit: "",
      trend: "+2 since 15m",
      trendTone: "critical",
      icon: "alerts",
      status: "IOC feed active",
      min: 3,
      max: 18,
      delta: 1,
    },
    {
      id: "network-state",
      label: "Network State",
      value: "Nominal",
      unit: "",
      trend: "Protected",
      trendTone: "ok",
      icon: "network",
      status: "Perimeter sealed",
      states: ["Nominal", "Protected", "Monitoring", "Degraded"],
    },
    {
      id: "memory-checked",
      label: "Memory Checked",
      value: "87%",
      unit: "%",
      trend: "+11 hosts scanned",
      trendTone: "info",
      icon: "memory",
      status: "Volatile dumps queued",
      min: 72,
      max: 96,
      delta: 2,
    },
    {
      id: "integrity-index",
      label: "Integrity Index",
      value: "99.2%",
      unit: "%",
      trend: "Within tolerance",
      trendTone: "ok",
      icon: "integrity",
      status: "Evidence chain healthy",
      min: 97.8,
      max: 99.9,
      delta: 0.1,
    },
  ],
  incomingEvents: [
    "New evidence uploaded — Case #4021",
    "Anomaly score updated — Node 7",
    "IOC match detected — Endpoint WS-204",
    "Memory acquisition completed — Host DFIR-12",
  ],
  alertsTrend: [
    { hour: "00", value: 4 },
    { hour: "02", value: 5 },
    { hour: "04", value: 4 },
    { hour: "06", value: 6 },
    { hour: "08", value: 7 },
    { hour: "10", value: 9 },
    { hour: "12", value: 8 },
    { hour: "14", value: 10 },
    { hour: "16", value: 9 },
    { hour: "18", value: 12 },
    { hour: "20", value: 11 },
    { hour: "22", value: 8 },
  ],
  alerts: [
    {
      id: "ALRT-4812",
      severity: "CRITICAL",
      title: "Suspicious PowerShell execution detected",
      description: "Encoded command line launched from a user workstation with script-block logging enabled.",
      timestamp: "2m ago",
    },
    {
      id: "ALRT-4789",
      severity: "HIGH",
      title: "Unauthorized privilege escalation attempt",
      description: "Local admin token use observed outside the approved maintenance window.",
      timestamp: "14m ago",
    },
    {
      id: "ALRT-4764",
      severity: "MEDIUM",
      title: "Malicious outbound network connection",
      description: "Beaconing pattern matches an IOC with low-confidence C2 infrastructure overlap.",
      timestamp: "28m ago",
    },
    {
      id: "ALRT-4758",
      severity: "LOW",
      title: "Evidence integrity verification completed",
      description: "Disk image hashes match the expected case baseline with no variance.",
      timestamp: "41m ago",
    },
  ],
  cases: [
    {
      caseId: "CASE-1042",
      title: "Ransomware Investigation",
      status: "Containment",
      assignedAnalyst: "A. Patel",
      lastUpdated: "8m ago",
    },
    {
      caseId: "CASE-1037",
      title: "Suspicious Login Activity",
      status: "Triage",
      assignedAnalyst: "S. Rivera",
      lastUpdated: "21m ago",
    },
    {
      caseId: "CASE-1029",
      title: "Data Exfiltration Investigation",
      status: "Analysis",
      assignedAnalyst: "M. Chen",
      lastUpdated: "1h ago",
    },
    {
      caseId: "CASE-1021",
      title: "Malware Analysis",
      status: "Queued",
      assignedAnalyst: "J. Okafor",
      lastUpdated: "3h ago",
    },
  ],
};

export function formatSyncTime(date) {
  return date.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function nextTelemetryValue(item, tick) {
  if (item.id === "network-state") {
    const states = item.states ?? ["Nominal"];
    return states[tick % states.length];
  }

  const numericValue = Number.parseFloat(String(item.value));
  const direction = tick % 2 === 0 ? 1 : -1;
  const nextValue = clamp(numericValue + direction * (item.delta ?? 1), item.min ?? numericValue, item.max ?? numericValue);

  if (item.id === "integrity-index") {
    return nextValue.toFixed(1);
  }

  return Math.round(nextValue);
}

function nextTrendTone(item, value) {
  if (item.id === "active-alerts" && Number(value) >= 12) return "critical";
  if (item.id === "memory-checked") return "info";
  return item.trendTone;
}

function nextTrendLabel(item, value) {
  if (item.id === "active-alerts") return `${value >= 12 ? "+4" : "+1"} since 15m`;
  if (item.id === "network-state") return value;
  if (item.id === "memory-checked") return `${value}% scanned`;
  if (item.id === "integrity-index") return `${value}% verified`;
  return item.trend;
}

export function createDashboardState(now = new Date()) {
  return {
    ...dashboardMock,
    telemetry: dashboardMock.telemetry.map((item) => {
      const value = nextTelemetryValue(item, 0);
      const formattedValue = item.unit ? `${value}${item.unit}` : value;

      return {
        ...item,
        value: formattedValue,
        trend: nextTrendLabel(item, value),
        trendTone: nextTrendTone(item, value),
      };
    }),
    currentEventIndex: 0,
    lastSynced: formatSyncTime(now),
  };
}

export function refreshDashboardState(previousState, now = new Date()) {
  const telemetry = previousState.telemetry.map((item, index) => {
    const template = dashboardMock.telemetry[index];
    const value = nextTelemetryValue({ ...template, value: item.value }, previousState.refreshTick ?? 0);
    const formattedValue = template.unit ? `${value}${template.unit}` : value;

    return {
      ...item,
      value: formattedValue,
      trend: nextTrendLabel(template, value),
      trendTone: nextTrendTone(template, value),
    };
  });

  return {
    ...previousState,
    telemetry,
    lastSynced: formatSyncTime(now),
    refreshTick: (previousState.refreshTick ?? 0) + 1,
  };
}
