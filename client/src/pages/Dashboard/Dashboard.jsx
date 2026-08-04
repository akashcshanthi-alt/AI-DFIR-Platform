import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, ShieldAlert, Cpu } from 'lucide-react';
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
import { dashboardService } from '../../services/dashboard.service';

export default function Dashboard() {
  const navigate = useNavigate();

  // Guard verification checks
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Dashboard Data States
  const [cases, setCases] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [telemetry, setTelemetry] = useState({
    activeAlerts: 0,
    mttd: '1.2m',
    mttr: '14.8m',
    aiResolutions: '89%'
  });
  const [chartsData, setChartsData] = useState(null);
  
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Fetch unified dashboard data
  const fetchDashboardStats = async () => {
    try {
      setIsFetching(true);
      setError(null);
      
      const data = await dashboardService.getOverview();
      
      setCases(data.recentCases || []);
      setAlerts(data.recentAlerts || []);
      setActivities(data.activity || []);
      setTelemetry(data.telemetry || {
        activeAlerts: 0,
        mttd: '1.2m',
        mttr: '14.8m',
        aiResolutions: '89%'
      });
      setChartsData(data.charts || null);
    } catch (err) {
      console.error('Error fetching dashboard overview:', err);
      setError(err.message || 'Telemetry connection offline.');
    } finally {
      setIsFetching(false);
    }
  };

  // Sync button action
  const handleSyncAssets = async () => {
    await fetchDashboardStats();
    setToastMsg('SOC telemetry database synchronized successfully.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Auto Refresh Hook (every 30 seconds)
  useEffect(() => {
    if (!hasSession) return;
    fetchDashboardStats();

    const intervalId = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(intervalId);
  }, [hasSession]);

  // Formatters
  const formatCaseId = (id) => {
    if (!id) return '';
    if (id.startsWith('CASE-')) {
      return `#TR-${id.split('-')[1]}`;
    }
    if (!id.startsWith('#')) {
      return `#${id}`;
    }
    return id;
  };

  const getSeverityBadgeClass = (severity) => {
    if (!severity) return 'bg-[#aec6ff]/10 text-[#aec6ff] border border-[#aec6ff]/20';
    const s = severity.toUpperCase();
    if (s === 'CRITICAL') return 'bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20';
    if (s === 'HIGH') return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    return 'bg-[#aec6ff]/10 text-[#aec6ff] border border-[#aec6ff]/20';
  };

  const getOperatorInitial = (analyst) => {
    if (!analyst || analyst === 'Autonomous' || analyst === 'Unassigned') return 'AI';
    const parts = analyst.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return analyst.slice(0, 2).toUpperCase();
  };

  if (!hasSession) return null;

  // 1. Loading Skeleton View
  if (isFetching && cases.length === 0) {
    return (
      <div className="w-full bg-[#050814] text-[#dfe2f3] min-h-screen p-6 grid-bg box-border flex flex-col gap-6 select-none">
        
        {/* Header Skeleton */}
        <div className="animate-pulse flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-6 w-48 bg-white/10 rounded"></div>
            <div className="h-3 w-96 bg-white/5 rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-white/10 rounded-lg"></div>
            <div className="h-9 w-32 bg-white/10 rounded-lg"></div>
          </div>
        </div>

        {/* Bento Cards Skeleton */}
        <div className="grid grid-cols-12 gap-6 w-full animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-3 h-28 bg-white/5 rounded-2xl border border-white/5"></div>
          ))}
          <div className="col-span-12 lg:col-span-8 h-[460px] bg-white/5 rounded-2xl border border-white/5"></div>
          <div className="col-span-12 lg:col-span-4 h-[460px] bg-white/5 rounded-2xl border border-white/5"></div>
          <div className="col-span-12 lg:col-span-8 h-[360px] bg-white/5 rounded-2xl border border-white/5"></div>
          <div className="col-span-12 lg:col-span-4 h-[360px] bg-white/5 rounded-2xl border border-white/5"></div>
        </div>

      </div>
    );
  }

  // 2. Disconnected Error State View
  if (error && cases.length === 0) {
    return (
      <div className="w-full bg-[#050814] text-[#dfe2f3] min-h-screen p-6 grid-bg box-border flex items-center justify-center select-none">
        <div className="glass-card max-w-md p-8 rounded-2xl border border-error/20 bg-error/5 text-center flex flex-col items-center gap-4">
          <ShieldAlert className="w-12 h-12 text-error animate-bounce" />
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Uplink Terminated</h2>
          <p className="text-xs text-[#cbd5e1]/70 leading-relaxed">
            Failed to connect to the TRACE AI Security Command Center.
            <br />
            Reason: <span className="text-error font-mono font-bold">{error}</span>
          </p>
          <button
            type="button"
            onClick={fetchDashboardStats}
            className="mt-2 px-6 py-2 bg-error/20 hover:bg-error/30 text-error border border-error/30 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
          >
            Retry Connection Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trace-dashboard-layout relative">
      
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#47faf3] text-[#47faf3] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          {toastMsg}
        </div>
      )}

      <div className="w-full bg-[#050814] text-[#dfe2f3] min-h-screen p-6 grid-bg box-border flex flex-col gap-6">

        {/* Header Info Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
          <div className="flex flex-col text-left">
            <h1 className="text-2xl font-bold text-white tracking-tight">Security Operations Center</h1>
            <p className="text-sm text-[#cbd5e1]/60 mt-1">Real-time threat analytics and dynamic incident forensics monitoring.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0f1423]/80 border border-white/10 hover:bg-[#161d33] text-[#cbd5e1] text-[12.5px] font-semibold rounded-lg transition-colors duration-200 cursor-pointer"
              onClick={handleSyncAssets}
              disabled={isFetching}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#47faf3]' : ''}`} />
              <span>Sync Assets</span>
            </button>
            
            <button 
              type="button" 
              className="flex items-center gap-2 px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[13px] font-semibold rounded-lg shadow-sm transition-colors duration-200 cursor-pointer"
              onClick={() => navigate('/cases/new')}
            >
              <Plus className="w-4 h-4" />
              <span>New Incident</span>
            </button>
          </div>
        </div>

        {/* 12-Column CSS Grid Bento Layout */}
        <div className="grid grid-cols-12 gap-6 w-full auto-rows-min">
          
          {/* Row 1: KPI Stats */}
          <KPICards activeCount={telemetry.activeAlerts} telemetry={telemetry} />
          
          {/* Row 2: Maps and Intel */}
          <ThreatMap />
          <AIThreatPanel />
          
          {/* Row 3: Live Investigations & Visual Charts */}
          <InvestigationsTable 
            cases={cases} 
            formatCaseId={formatCaseId} 
            getSeverityBadgeClass={getSeverityBadgeClass} 
            getOperatorInitial={getOperatorInitial} 
          />
          <EventVelocityChart chartsData={chartsData} />
          
          {/* Row 4: Log Feeds & AI Suggestions */}
          <LiveSystemActivity activities={activities} />
          <RecentAlerts alerts={alerts} />
          <AIRecommendations />

        </div>

      </div>
    </div>
  );
}