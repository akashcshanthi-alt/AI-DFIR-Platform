import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cases.css';

// Import sub-components
import CasesHeader from './components/CasesHeader';
import CasesFilters from './components/CasesFilters';
import CasesTable from './components/CasesTable';
import AIInsightsSidebar from './components/AIInsightsSidebar';
import ChatFAB from './components/ChatFAB';

export default function Cases() {
  const navigate = useNavigate();

  // Auth Guard verification check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Page dynamic states
  const [cases, setCases] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [analystFilter, setAnalystFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');

  // Sidebar collapsible state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Checkbox multiselector state
  const [selectedCaseIds, setSelectedCaseIds] = useState(new Set());

  // Fetch Cases from server
  const fetchCasesData = async () => {
    try {
      setIsFetching(true);
      const res = await fetch('http://localhost:5000/api/dashboard/cases');
      const data = await res.json();
      setCases(data);
      setIsFetching(false);
    } catch (err) {
      console.warn('API Endpoint offline, utilizing local mock cases store.');
      setCases([
        {
          caseId: 'CASE-1042',
          title: 'Data Exfiltration - APEX Server',
          status: 'Open',
          severity: 'Critical',
          assignedAnalyst: 'J. Dorsey',
          targetHost: 'SRV-049',
          lastUpdated: '2m ago',
          riskScore: 98,
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmvPAjXL79P_B_jnx3DlixXyYffLTDVo5aP-RfRLE5EBu6BRMJhkUTENjxfJebSFRBBl49nzw04rRXsX3Gigi6mn9cma-llyR3sVx-k7gzYVlW2PMm3RvSxQo5HdW16LD4lgTQkPLzRNu0ZbYhqIVv3JJqFc1CZSKkG4XEQExON4GrBp5bnvm0jesOJbCAi4V_-fuSESBbSS3N3x-Vmnizx86smGGhqKl0As06RNE38Q7lw5DedG83'
        },
        {
          caseId: 'CASE-1037',
          title: 'Unusual RDP Connection',
          status: 'In Progress',
          severity: 'High',
          assignedAnalyst: 'S. Kovac',
          targetHost: '192.168.1.104',
          lastUpdated: '15m ago',
          riskScore: 74,
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABxMX8aPA3SoIVNZo24ziAfJGEGiBnx3teieFU1oK615tfI2LgOAesbgxyzYJvL0q9PX94g3OEaFuEFnZSktfJAxBZ4UlW38mwCGIUowISAnr4pPnbWZLrE1BGn0trLOVuotwBifisX0CeXT31wx5jFLFILVyEk-pJ-eN3hc9yTu-uloqxt8xlarw6UFXOmAaUioRbtF_8PiTEmbMAH7fgg6hLvmmrkfLqyH8YLW8Eb4oaRKrwvBfm'
        },
        {
          caseId: 'CASE-1029',
          title: 'Suspicious PowerShell Script',
          status: 'Open',
          severity: 'Medium',
          assignedAnalyst: 'A. Miller',
          targetHost: 'WS-EDR-209',
          lastUpdated: '1h ago',
          riskScore: 32,
          avatar: null
        },
        {
          caseId: 'CASE-1021',
          title: 'Brute Force Attempt',
          status: 'Closed',
          severity: 'Low',
          assignedAnalyst: 'S. Kovac',
          targetHost: 'SQL-GATE-01',
          lastUpdated: 'Resolved 4h ago',
          riskScore: 5,
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABxMX8aPA3SoIVNZo24ziAfJGEGiBnx3teieFU1oK615tfI2LgOAesbgxyzYJvL0q9PX94g3OEaFuEFnZSktfJAxBZ4UlW38mwCGIUowISAnr4pPnbWZLrE1BGn0trLOVuotwBifisX0CeXT31wx5jFLFILVyEk-pJ-eN3hc9yTu-uloqxt8xlarw6UFXOmAaUioRbtF_8PiTEmbMAH7fgg6hLvmmrkfLqyH8YLW8Eb4oaRKrwvBfm'
        }
      ]);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!hasSession) return;
    fetchCasesData();
  }, [hasSession]);

  // Checkbox toggle logic
  const handleCheckboxChange = (caseId) => {
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  };

  const handleMasterCheckboxChange = (e) => {
    if (e.target.checked) {
      setSelectedCaseIds(new Set(cases.map((c) => c.caseId)));
    } else {
      setSelectedCaseIds(new Set());
    }
  };

  // Case ID formatter
  const formatCaseId = (id) => {
    if (id.startsWith('CASE-')) {
      return `#DF-${id.split('-')[1]}`;
    }
    if (!id.startsWith('#')) {
      return `#${id}`;
    }
    return id;
  };

  // Map case severity to CSS badge color classes
  const getSeverityBadgeClass = (severity) => {
    const s = severity.toUpperCase();
    if (s === 'CRITICAL') return 'bg-error/10 text-error border border-error/20 shadow-[0_0_10px_rgba(255,180,171,0.1)]';
    if (s === 'HIGH') return 'bg-tertiary-container/20 text-tertiary border border-tertiary/20';
    if (s === 'MEDIUM') return 'bg-primary-container/20 text-primary border border-primary/20';
    return 'bg-secondary/10 text-secondary border border-secondary/20';
  };

  // Map status badges
  const getStatusBadgeClass = (status) => {
    const st = status.toLowerCase();
    if (st === 'open') return 'bg-secondary/10 text-secondary border border-secondary/20';
    if (st === 'in progress' || st === 'analysis' || st === 'containment') return 'bg-primary/10 text-primary border border-primary/20';
    return 'bg-surface-variant text-on-surface-variant border border-white/10';
  };

  // Initials generator
  const getAnalystInitials = (analyst) => {
    if (!analyst || analyst === 'Autonomous') return 'AI';
    const parts = analyst.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return analyst.slice(0, 2).toUpperCase();
  };

  // Risk Score color decider
  const getRiskColor = (score) => {
    if (score >= 90) return '#ffb4ab';
    if (score >= 70) return '#ffb3ae';
    if (score >= 30) return '#aec6ff';
    return '#8b90a0';
  };

  if (!hasSession) return null;

  // Local filtering engine
  const filteredCases = cases.filter((item) => {
    const searchVal = searchQuery.trim().toLowerCase();
    const analystName = item.assignedAnalyst || 'Autonomous';
    const hostName = item.targetHost || '';
    
    const matchesSearch = !searchVal || 
      item.caseId.toLowerCase().includes(searchVal) ||
      item.title.toLowerCase().includes(searchVal) ||
      analystName.toLowerCase().includes(searchVal) ||
      hostName.toLowerCase().includes(searchVal);

    const matchesSeverity = severityFilter === 'All' || severityFilter === 'Severity' ||
      item.severity.toLowerCase() === severityFilter.toLowerCase();

    const matchesStatus = statusFilter === 'All' || statusFilter === 'Status' ||
      item.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesAnalyst = analystFilter === 'All' || analystFilter === 'Analyst' ||
      analystName.toLowerCase().includes(analystFilter.toLowerCase());

    return matchesSearch && matchesSeverity && matchesStatus && matchesAnalyst;
  });

  return (
    <div className="trace-cases-layout">
      <div className="w-full bg-surface-container-lowest text-on-surface font-body-md selection:bg-primary/30 min-h-screen cyber-grid overflow-x-hidden flex flex-row box-border">
        
        {/* Main Content Area */}
        <main className="flex-grow flex flex-col p-6 overflow-y-auto min-w-0">
          <CasesHeader onNewCaseClick={() => navigate('/cases/new')} />
          
          <CasesFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            severityFilter={severityFilter}
            setSeverityFilter={setSeverityFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            analystFilter={analystFilter}
            setAnalystFilter={setAnalystFilter}
            dateRangeFilter={dateRangeFilter}
            setDateRangeFilter={setDateRangeFilter}
          />

          <CasesTable 
            cases={filteredCases}
            allCases={cases}
            selectedCaseIds={selectedCaseIds}
            handleCheckboxChange={handleCheckboxChange}
            handleMasterCheckboxChange={handleMasterCheckboxChange}
            formatCaseId={formatCaseId}
            getSeverityBadgeClass={getSeverityBadgeClass}
            getStatusBadgeClass={getStatusBadgeClass}
            getAnalystInitials={getAnalystInitials}
            getRiskColor={getRiskColor}
          />
        </main>

        {/* Collapsible AI Insights Widget Panel (Right 25%) */}
        <AIInsightsSidebar 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

      </div>

      {/* Floating Action SOC Assistant Button */}
      <ChatFAB />

    </div>
  );
}
