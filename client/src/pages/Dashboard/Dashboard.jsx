import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, ShieldAlert } from 'lucide-react';
import './Dashboard.css';

// Import the 5 focused dashboard sections
import ActiveIncidentsSection from './components/ActiveIncidentsSection';
import AIInvestigationSection from './components/AIInvestigationSection';
import ThreatsAndIOCsSection from './components/ThreatsAndIOCsSection';
import RecentAlertsSection from './components/RecentAlertsSection';
import IncidentTrendSection from './components/IncidentTrendSection';

import { dashboardService } from '../../services/dashboard.service';
import { aiService } from '../../services/ai.service';
import { iocService } from '../../services/ioc.service';
import { authService } from '../../services/auth.service';

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
  const [stats, setStats] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [incidentTrend, setIncidentTrend] = useState([]);
  const [iocsList, setIocsList] = useState([]);
  const [aiReadiness, setAiReadiness] = useState(null);
  const [latestInvestigationRun, setLatestInvestigationRun] = useState(null);

  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Fetch unified dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsFetching(true);
      setError(null);

      // 1. Fetch Primary Overview from backend
      const overview = await dashboardService.getOverview();
      setStats(overview.stats || null);
      setRecentCases(overview.recentCases || []);
      setRecentAlerts(overview.recentAlerts || []);
      setIncidentTrend(overview.charts?.incidentTrend || []);

      // 2. Fetch IOCs
      try {
        const iocData = await iocService.getIOCs({ limit: 4 });
        setIocsList(iocData?.items || []);
      } catch (iocErr) {
        console.warn('IOC fetch non-fatal error:', iocErr.message);
      }

      // 3. Fetch AI Readiness
      try {
        const readiness = await aiService.getReadiness();
        setAiReadiness(readiness);
      } catch (aiErr) {
        console.warn('AI Readiness non-fatal error:', aiErr.message);
      }

      // 4. Fetch latest investigation run for most recent case (if any)
      const topCases = overview.recentCases || [];
      if (topCases.length > 0) {
        for (const c of topCases.slice(0, 3)) {
          try {
            const runsData = await aiService.getInvestigationRuns({ caseId: c.caseId, limit: 1 });
            if (runsData?.items && runsData.items.length > 0) {
              setLatestInvestigationRun(runsData.items[0]);
              break;
            }
          } catch (runErr) {
            // Ignore case without runs
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard overview:', err);
      setError(err.message || 'Telemetry connection offline.');
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Sync button action
  const handleSyncAssets = async () => {
    await fetchDashboardData();
    setToastMsg('Security telemetry refreshed successfully.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Auto Refresh Hook (every 30 seconds)
  useEffect(() => {
    if (!hasSession) return;
    fetchDashboardData();

    const intervalId = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(intervalId);
  }, [hasSession, fetchDashboardData]);

  if (!hasSession) return null;

  // Loading Skeleton View
  if (isFetching && !stats) {
    return (
      <div className="w-full bg-[#050814] text-[#dfe2f3] min-h-screen p-6 grid-bg box-border flex flex-col gap-6 select-none">
        {/* Header Skeleton */}
        <div className="animate-pulse flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-7 w-56 bg-white/10 rounded"></div>
            <div className="h-3 w-80 bg-white/5 rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-white/10 rounded-lg"></div>
            <div className="h-9 w-32 bg-white/10 rounded-lg"></div>
          </div>
        </div>

        {/* 5-Section Skeleton Layout */}
        <div className="grid grid-cols-12 gap-6 w-full animate-pulse">
          <div className="col-span-12 lg:col-span-6 h-64 bg-white/5 rounded-2xl border border-white/5"></div>
          <div className="col-span-12 lg:col-span-6 h-64 bg-white/5 rounded-2xl border border-white/5"></div>
          <div className="col-span-12 h-72 bg-white/5 rounded-2xl border border-white/5"></div>
          <div className="col-span-12 lg:col-span-6 h-72 bg-white/5 rounded-2xl border border-white/5"></div>
          <div className="col-span-12 lg:col-span-6 h-72 bg-white/5 rounded-2xl border border-white/5"></div>
        </div>
      </div>
    );
  }

  // Disconnected Error State View
  if (error && !stats) {
    const isAuthError =
      error.toLowerCase().includes('token') ||
      error.toLowerCase().includes('clearance') ||
      error.toLowerCase().includes('401') ||
      error.toLowerCase().includes('unauthorized');

    return (
      <div className="w-full bg-[#050814] text-[#dfe2f3] min-h-screen p-6 grid-bg box-border flex items-center justify-center select-none">
        <div className="soc-card max-w-md p-8 border border-red-500/20 bg-red-500/5 text-center flex flex-col items-center gap-4">
          <ShieldAlert className="w-12 h-12 text-red-400 animate-bounce" />
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            {isAuthError ? 'Clearance Required' : 'Connection Failed'}
          </h2>
          <p className="text-xs text-[#cbd5e1]/70 leading-relaxed">
            {isAuthError
              ? 'Your security session has expired. Please sign in again.'
              : 'Failed to connect to the TRACE AI backend.'}
            <br />
            <span className="text-red-400 font-mono mt-1 inline-block">{error}</span>
          </p>
          <div className="flex items-center gap-3 mt-2">
            {isAuthError ? (
              <button
                type="button"
                onClick={() => {
                  authService.clearAuth();
                  navigate('/login', { replace: true });
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Sign In Again
              </button>
            ) : (
              <button
                type="button"
                onClick={fetchDashboardData}
                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Retry Connection
              </button>
            )}
          </div>
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Security Dashboard</h1>
            <p className="text-sm text-[#cbd5e1]/60 mt-0.5">
              Clear overview of active incidents, AI analysis, threat indicators, and recent alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0f1423]/90 border border-white/10 hover:border-[#00E5FF]/40 hover:bg-[#161d33] text-[#cbd5e1] hover:text-white text-[12.5px] font-semibold rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
              onClick={handleSyncAssets}
              disabled={isFetching}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#00E5FF]' : 'text-[#00E5FF]'}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#00E5FF] to-[#3B82F6] hover:brightness-110 active:scale-95 text-[#0A0F1E] text-[13px] font-bold rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
              onClick={() => navigate('/cases/new')}
            >
              <Plus className="w-4 h-4" />
              <span>New Incident</span>
            </button>
          </div>
        </div>

        {/* 5 Focused Dashboard Sections in Balanced Responsive Grid */}
        <div className="grid grid-cols-12 gap-6 w-full auto-rows-min">
          {/* Section 1: Active Incidents */}
          <div className="col-span-12 lg:col-span-6">
            <ActiveIncidentsSection stats={stats} recentCases={recentCases} />
          </div>

          {/* Section 2: AI Investigation */}
          <div className="col-span-12 lg:col-span-6">
            <AIInvestigationSection
              latestRun={latestInvestigationRun}
              readiness={aiReadiness}
              targetCaseId={recentCases[0]?.caseId}
            />
          </div>

          {/* Section 5: Incident Trend (Full-width for clear visual progression) */}
          <div className="col-span-12">
            <IncidentTrendSection trendData={incidentTrend} />
          </div>

          {/* Section 3: Threats & IOCs */}
          <div className="col-span-12 lg:col-span-6">
            <ThreatsAndIOCsSection iocs={iocsList} totalCount={stats?.totalIOCs} />
          </div>

          {/* Section 4: Recent Alerts */}
          <div className="col-span-12 lg:col-span-6">
            <RecentAlertsSection alerts={recentAlerts} />
          </div>
        </div>
      </div>
    </div>
  );
}