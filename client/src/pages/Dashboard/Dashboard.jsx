import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus } from 'lucide-react';
import './Dashboard.css';

// Import bento components
import KPICards from './components/KPICards';
import ThreatMap from './components/ThreatMap';
import AIThreatPanel from './components/AIThreatPanel';
import InvestigationsTable from './components/InvestigationsTable';
import EventVelocityChart from './components/EventVelocityChart';
import LiveSystemActivity from './components/LiveSystemActivity';
import RecentAlerts from './components/RecentAlerts';
import AIRecommendations from './components/AIRecommendations';

export default function Dashboard() {
  const navigate = useNavigate();

  // Guard verification checks
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Dashboard Data Hooks
  const [cases, setCases] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [telemetry, setTelemetry] = useState({
    activeAlerts: 14,
    mttd: '1.2m',
    mttr: '14.8m',
    aiResolutions: '89%'
  });
  const [isFetching, setIsFetching] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const handleSyncAssets = async () => {
    await fetchDashboardStats();
    setToastMsg('SOC telemetry database synchronized successfully.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Live Activity Logs Feed list
  const [activities, setActivities] = useState([
    { id: 1, time: '14:02:11', text: 'Agent deployed to node-14-west', type: 'info' },
    { id: 2, time: '14:01:45', text: 'AUTH_FAILURE on portal.admin', type: 'error' },
    { id: 3, time: '14:00:02', text: 'Regular health scan complete', type: 'success' },
    { id: 4, time: '13:58:12', text: 'New artifact indexed: trace.exe', type: 'info' },
    { id: 5, time: '13:55:00', text: 'Backup sync successful (US-EAST)', type: 'success' }
  ]);

  // Recharts Event Velocity data (1 hour window)
  const velocityData = [
    { time: '13:00', events: 120 },
    { time: '13:10', events: 145 },
    { time: '13:20', events: 110 },
    { time: '13:30', events: 210 },
    { time: '13:40', events: 290 },
    { time: '13:50', events: 340 },
    { time: '14:00', events: 180 }
  ];

  // Fetch Cases, Alerts, Telemetry from backend API endpoints
  const fetchDashboardStats = async () => {
    try {
      setIsFetching(true);
      
      const casesRes = await fetch('http://localhost:5000/api/dashboard/cases');
      const casesData = await casesRes.json();
      
      const alertsRes = await fetch('http://localhost:5000/api/dashboard/alerts');
      const alertsData = await alertsRes.json();

      const telemetryRes = await fetch('http://localhost:5000/api/dashboard/telemetry');
      const telemetryData = await telemetryRes.json();

      setCases(casesData.slice(0, 4));
      setAlerts(alertsData.slice(0, 4));
      setTelemetry({
        activeAlerts: casesData.length,
        mttd: '1.2m',
        mttr: '14.8m',
        aiResolutions: `${telemetryData.integrityIndex ?? 89}%`
      });
      setIsFetching(false);
    } catch (err) {
      console.warn('API endpoints offline, utilizing fallback mock security database.');
      setCases([
        { caseId: 'CASE-1042', title: 'Brute-Force Attack: SSH-Gate-04', severity: 'Critical', assignedAnalyst: 'V. Petrov', confidence: '98.2%' },
        { caseId: 'CASE-1037', title: 'Exfiltration attempt detected in S3', severity: 'High', assignedAnalyst: 'K. Sato', confidence: '84.5%' },
        { caseId: 'CASE-1029', title: 'Privilege Escalation: Root-A', severity: 'Medium', assignedAnalyst: 'Autonomous', confidence: '91.0%' },
        { caseId: 'CASE-1021', title: 'Cryptomining pattern on K8s cluster', severity: 'Medium', assignedAnalyst: 'L. Chen', confidence: '76.8%' }
      ]);

      setAlerts([
        { id: 'ALRT-4921', severity: 'CRITICAL', title: 'Suspicious PowerShell Execution', description: 'Encoded PowerShell launched from Domain Controller CORP-AD-DC-01.', timestamp: '2026-07-31T09:42:10Z' },
        { id: 'ALRT-4918', severity: 'HIGH', title: 'Admin Token Escalation Privilege', description: 'Local administrator token usage outside approval window.', timestamp: '2026-07-31T09:28:45Z' },
        { id: 'ALRT-4912', severity: 'MEDIUM', title: 'Malicious External Outbound IP', description: 'Beaconing pattern matches low-confidence command server.', timestamp: '2026-07-31T08:56:33Z' },
        { id: 'ALRT-4907', severity: 'LOW', title: 'Evidence Hash Check Verification', description: 'Disk image hashes match the expected case baseline hashes.', timestamp: '2026-07-31T08:12:04Z' }
      ]);
      
      setTelemetry({
        activeAlerts: 14,
        mttd: '1.2m',
        mttr: '14.8m',
        aiResolutions: '89%'
      });
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!hasSession) return;
    fetchDashboardStats();

    const intervalId = setInterval(fetchDashboardStats, 12000);
    return () => clearInterval(intervalId);
  }, [hasSession]);

  // Prepend simulated system activity logs dynamically every 5 seconds
  useEffect(() => {
    if (!hasSession) return;
    const logPool = [
      { text: 'Encrypted link established with EU-SO-1', type: 'info' },
      { text: 'Firewall rule #902 updated: Block 192.168.1.0', type: 'error' },
      { text: 'Kernel audit log rotation started', type: 'success' },
      { text: 'Credential verification scan initiated', type: 'info' },
      { text: 'New EDR quarantine node isolated: EDGE-LAN-04', type: 'error' }
    ];

    const intervalId = setInterval(() => {
      const entry = logPool[Math.floor(Math.random() * logPool.length)];
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setActivities((prev) => [
        {
          id: Date.now(),
          time,
          text: entry.text,
          type: entry.type
        },
        ...prev.slice(0, 19)
      ]);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [hasSession]);

  const formatCaseId = (id) => {
    if (id.startsWith('CASE-')) {
      return `#TR-${id.split('-')[1]}`;
    }
    if (!id.startsWith('#')) {
      return `#${id}`;
    }
    return id;
  };

  const getSeverityBadgeClass = (severity) => {
    const s = severity.toUpperCase();
    if (s === 'CRITICAL') return 'bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20';
    if (s === 'HIGH') return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    return 'bg-[#aec6ff]/10 text-[#aec6ff] border border-[#aec6ff]/20';
  };

  const getOperatorInitial = (analyst) => {
    if (!analyst || analyst === 'Autonomous') return 'AI';
    const parts = analyst.split('.');
    if (parts.length > 1) {
      return parts[1].trim()[0].toUpperCase();
    }
    return analyst[0].toUpperCase();
  };

  if (!hasSession) return null;

  return (
    <div className="trace-dashboard-layout relative">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#47faf3] text-[#47faf3] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          {toastMsg}
        </div>
      )}
      <div className="w-full bg-[#050814] text-[#dfe2f3] min-h-screen p-6 grid-bg box-border flex flex-col gap-6">

        {/* Header Info Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white tracking-tight">Security Operations Center</h1>
            <p className="text-sm text-[#cbd5e1]/60 mt-1">Real-time threat analytics and dynamic incident forensics monitoring.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0f1423]/80 border border-white/10 hover:bg-[#161d33] text-[#cbd5e1] text-[12.5px] font-semibold rounded-lg transition-colors duration-200"
              onClick={handleSyncAssets}
              disabled={isFetching}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#47faf3]' : ''}`} />
              <span>Sync Assets</span>
            </button>
            
            <button 
              type="button" 
              className="flex items-center gap-2 px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[13px] font-semibold rounded-lg shadow-sm transition-colors duration-200"
              onClick={() => navigate('/cases/new')}
            >
              <Plus className="w-4 h-4" />
              <span>New Incident</span>
            </button>
          </div>
        </div>

        {/* 12-Column CSS Grid Bento Layout */}
        <div className="grid grid-cols-12 gap-6 w-full auto-rows-min">
          <KPICards activeCount={telemetry.activeAlerts} telemetry={telemetry} />
          <ThreatMap />
          <AIThreatPanel />
          <InvestigationsTable 
            cases={cases} 
            formatCaseId={formatCaseId} 
            getSeverityBadgeClass={getSeverityBadgeClass} 
            getOperatorInitial={getOperatorInitial} 
          />
          <EventVelocityChart velocityData={velocityData} />
          <LiveSystemActivity activities={activities} />
          <RecentAlerts alerts={alerts} />
          <AIRecommendations />
        </div>

      </div>
    </div>
  );
}