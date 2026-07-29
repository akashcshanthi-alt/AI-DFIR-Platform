// server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

// Enable JSON request parsing
app.use(express.json());

// Small helpers for dynamic mock dashboard values.
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(values) {
  return values[randomInt(0, values.length - 1)];
}

// TODO: Replace this mock alert data with the real detection pipeline or MongoDB.
const dashboardAlerts = [
  {
    id: 'ALRT-4921',
    severity: 'CRITICAL',
    title: 'Suspicious PowerShell execution detected',
    description: 'Encoded PowerShell launched from a privileged workstation with script block logging enabled.',
    timestamp: '2026-07-19T09:42:10Z',
  },
  {
    id: 'ALRT-4918',
    severity: 'HIGH',
    title: 'Unauthorized privilege escalation attempt',
    description: 'Local admin token usage observed outside the approved maintenance window.',
    timestamp: '2026-07-19T09:28:45Z',
  },
  {
    id: 'ALRT-4912',
    severity: 'MEDIUM',
    title: 'Malicious outbound network connection',
    description: 'Beaconing pattern matches an IOC with low-confidence command-and-control overlap.',
    timestamp: '2026-07-19T08:56:33Z',
  },
  {
    id: 'ALRT-4907',
    severity: 'LOW',
    title: 'Evidence integrity verification completed',
    description: 'Disk image hashes match the expected case baseline with no variance detected.',
    timestamp: '2026-07-19T08:12:04Z',
  },
];

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'ARCLIGHT DFIR Backend API is running successfully' });
});

// Dynamic telemetry snapshot for the dashboard.
app.get('/api/dashboard/telemetry', (req, res) => {
  const activeAlerts = randomInt(2, 18);
  const networkState = randomChoice(['Stable', 'Monitoring', 'Elevated Traffic', 'Degraded']);
  const memoryChecked = randomInt(68, 99);
  const integrityIndex = randomInt(84, 100);
  const lastSynced = new Date(Date.now() - randomInt(5, 180) * 1000).toISOString();

  res.json({
    activeAlerts,
    networkState,
    memoryChecked,
    integrityIndex,
    lastSynced,
  });
});

app.get('/api/dashboard/alerts', (req, res) => {
  try {
    const alerts = [...dashboardAlerts].sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));

  res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard alerts' });
  }
});

// Mock Cases store
const dashboardCases = [
  {
    caseId: 'CASE-1042',
    title: 'Ransomware Investigation',
    status: 'Containment',
    severity: 'CRITICAL',
    assignedAnalyst: 'A. Patel',
    targetHost: 'SERVER-FIN-01',
    description: 'LockBit variant activity detected on core finance domain controller.',
    lastUpdated: '8m ago',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    caseId: 'CASE-1037',
    title: 'Suspicious Login Activity',
    status: 'Triage',
    severity: 'HIGH',
    assignedAnalyst: 'S. Rivera',
    targetHost: 'VPN-GW-04',
    description: 'Impossible travel anomaly logged from geographically disparate IPs within 5 minutes.',
    lastUpdated: '21m ago',
    timestamp: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
  },
  {
    caseId: 'CASE-1029',
    title: 'Data Exfiltration Investigation',
    status: 'Analysis',
    severity: 'HIGH',
    assignedAnalyst: 'M. Chen',
    targetHost: 'STORAGE-S3-BLOB',
    description: 'Unusual egress spike of 45GB over encrypted TLS channel.',
    lastUpdated: '1h ago',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    caseId: 'CASE-1021',
    title: 'Malware Analysis',
    status: 'Queued',
    severity: 'MEDIUM',
    assignedAnalyst: 'J. Okafor',
    targetHost: 'WS-EDR-209',
    description: 'Trojan downloader artifact isolated in temp folder during scheduled scan.',
    lastUpdated: '3h ago',
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
];

let caseCounter = 1043;

app.get('/api/dashboard/cases', (req, res) => {
  try {
    const cases = [...dashboardCases].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard cases' });
  }
});

app.post('/api/dashboard/cases', (req, res) => {
  try {
    const { title, status = 'Triage', severity = 'HIGH', assignedAnalyst = 'Analyst', targetHost = 'N/A', description = '' } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required for a new incident case.' });
    }

    const newCase = {
      caseId: `CASE-${caseCounter++}`,
      title: title.trim(),
      status,
      severity,
      assignedAnalyst: assignedAnalyst.trim(),
      targetHost: targetHost.trim(),
      description: description.trim(),
      lastUpdated: 'Just now',
      timestamp: new Date().toISOString(),
    };

    dashboardCases.unshift(newCase);
    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create new incident case' });
  }
});
// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`ARCLIGHT Server running on port ${PORT}`);
});
