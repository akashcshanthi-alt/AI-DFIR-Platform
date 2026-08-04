import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw, Database } from 'lucide-react';
import './Cases.css';

// Import sub-components
import CasesHeader from './components/CasesHeader';
import CasesFilters from './components/CasesFilters';
import CasesTable from './components/CasesTable';
import EditCaseModal from './components/EditCaseModal';
import AIInsightsSidebar from './components/AIInsightsSidebar';
import ChatFAB from './components/ChatFAB';
import { casesService } from '../../services/cases.service';

export default function Cases() {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);

  // Filters state
  const [searchQuery, setSearchQuery] = useState(() => {
    return new URLSearchParams(location.search).get('q') || '';
  });
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [analystFilter, setAnalystFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');

  // Edit Case Modal States
  const [activeEditCase, setActiveEditCase] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Synchronize search query from URL search params changes (e.g. from global header search)
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q');
    if (q !== null) {
      setSearchQuery(q || '');
      setPage(1);
    }
  }, [location.search]);

  // Sidebar collapsible state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Checkbox multiselector state
  const [selectedCaseIds, setSelectedCaseIds] = useState(new Set());

  // Fetch Cases from server
  const fetchCasesData = async () => {
    try {
      setIsFetching(true);
      setError(null);

      const params = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      if (severityFilter !== 'All' && severityFilter !== 'Severity') {
        params.severity = severityFilter;
      }
      if (statusFilter !== 'All' && statusFilter !== 'Status') {
        params.status = statusFilter;
      }
      if (analystFilter !== 'All' && analystFilter !== 'Analyst') {
        params.analyst = analystFilter;
      }

      const res = await casesService.getCases(params);
      if (res.success) {
        setCases(res.data || []);
        setTotalCases(res.pagination?.total || 0);
        setTotalPages(res.pagination?.pages || 1);
      } else {
        throw new Error(res.message || 'Failed to retrieve cases.');
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError(err.message || 'Failed to establish connection with security backend.');
    } finally {
      setIsFetching(false);
    }
  };

  // Debounced search / filter hook
  useEffect(() => {
    if (!hasSession) return;
    const delayDebounce = setTimeout(() => {
      fetchCasesData();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, severityFilter, statusFilter, analystFilter, page, hasSession]);

  // Reset page to 1 when filters change
  const handleSeverityChange = (val) => {
    setSeverityFilter(val);
    setPage(1);
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleAnalystChange = (val) => {
    setAnalystFilter(val);
    setPage(1);
  };

  // Delete case action
  const handleDeleteCase = async (id) => {
    if (!window.confirm(`Are you sure you want to permanently delete investigation case [${id}]?`)) {
      return;
    }
    try {
      setIsFetching(true);
      await casesService.deleteCase(id);
      setSuccessMessage(`Investigation case [${id}] successfully archived.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Update selected set
      const nextSelected = new Set(selectedCaseIds);
      nextSelected.delete(id);
      setSelectedCaseIds(nextSelected);

      // Check if page index needs correction
      if (cases.length === 1 && page > 1) {
        setPage(prev => prev - 1);
      } else {
        fetchCasesData();
      }
    } catch (err) {
      setError(err.message || 'Deletion attempt rejected.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleEditCaseClick = (item) => {
    setActiveEditCase(item);
    setIsEditModalOpen(true);
  };

  const handleCaseUpdated = (updatedCase) => {
    setSuccessMessage(`Case [${updatedCase.caseId}] details updated successfully.`);
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchCasesData();
  };

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
    if (!id) return '';
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
    if (!severity) return '';
    const s = severity.toUpperCase();
    if (s === 'CRITICAL') return 'bg-error/10 text-error border border-error/20 shadow-[0_0_10px_rgba(255,180,171,0.1)]';
    if (s === 'HIGH') return 'bg-tertiary-container/20 text-tertiary border border-tertiary/20';
    if (s === 'MEDIUM') return 'bg-primary-container/20 text-primary border border-primary/20';
    return 'bg-secondary/10 text-secondary border border-secondary/20';
  };

  // Map status badges
  const getStatusBadgeClass = (status) => {
    if (!status) return '';
    const st = status.toLowerCase();
    if (st === 'open') return 'bg-secondary/10 text-secondary border border-secondary/20';
    if (st === 'investigating') return 'bg-primary/10 text-primary border border-primary/20';
    return 'bg-surface-variant text-on-surface-variant border border-white/10';
  };

  // Initials generator
  const getAnalystInitials = (analyst) => {
    if (!analyst || analyst === 'Autonomous' || analyst === 'Unassigned') return 'AI';
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

  return (
    <div className="trace-cases-layout select-none">
      
      {/* Toast Notification Banner */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#10b981] text-[#10b981] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold transition-all duration-300">
          {successMessage}
        </div>
      )}

      <div className="w-full bg-surface-container-lowest text-on-surface font-body-md selection:bg-primary/30 min-h-screen cyber-grid overflow-x-hidden flex flex-row box-border">
        
        {/* Main Content Area */}
        <main className="flex-grow flex flex-col p-6 overflow-y-auto min-w-0">
          <CasesHeader onNewCaseClick={() => navigate('/cases/new')} />
          
          <CasesFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            severityFilter={severityFilter}
            setSeverityFilter={handleSeverityChange}
            statusFilter={statusFilter}
            setStatusFilter={handleStatusChange}
            analystFilter={analystFilter}
            setAnalystFilter={handleAnalystChange}
            dateRangeFilter={dateRangeFilter}
            setDateRangeFilter={setDateRangeFilter}
          />

          {/* Conditional Layout Rendering */}
          {isFetching && cases.length === 0 ? (
            <div className="glass-card rounded-xl border border-white/5 flex-grow flex flex-col items-center justify-center min-h-[500px]">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
              <span className="text-sm font-semibold text-on-surface-variant">Accessing MongoDB threat records...</span>
            </div>
          ) : error ? (
            <div className="glass-card rounded-xl border border-white/5 flex-grow flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
              <Database className="w-12 h-12 text-error/60 mb-4" />
              <h3 className="font-semibold text-white text-base">Backend Disconnected</h3>
              <p className="text-xs text-on-surface-variant/80 max-w-sm mt-1 mb-6">
                {error}
              </p>
              <button 
                type="button" 
                onClick={fetchCasesData}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Uplink
              </button>
            </div>
          ) : cases.length === 0 ? (
            <div className="glass-card rounded-xl border border-white/5 flex-grow flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
              <Database className="w-12 h-12 text-primary/40 mb-4" />
              <h3 className="font-semibold text-white text-base">No Incidents Documented</h3>
              <p className="text-xs text-on-surface-variant/80 max-w-sm mt-1">
                There are no incident response cases matching the active filter criteria. Click "New Case" to initiate an investigation.
              </p>
            </div>
          ) : (
            <CasesTable 
              cases={cases}
              allCases={cases}
              selectedCaseIds={selectedCaseIds}
              handleCheckboxChange={handleCheckboxChange}
              handleMasterCheckboxChange={handleMasterCheckboxChange}
              formatCaseId={formatCaseId}
              getSeverityBadgeClass={getSeverityBadgeClass}
              getStatusBadgeClass={getStatusBadgeClass}
              getAnalystInitials={getAnalystInitials}
              getRiskColor={getRiskColor}
              
              // Pagination values
              currentPage={page}
              totalPages={totalPages}
              totalCases={totalCases}
              onPageChange={setPage}

              // Event callbacks
              onEditClick={handleEditCaseClick}
              onDeleteClick={handleDeleteCase}
            />
          )}
        </main>

        {/* Collapsible AI Insights Widget Panel (Right 25%) */}
        <AIInsightsSidebar 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

      </div>

      {/* Floating Action SOC Assistant Button */}
      <ChatFAB />

      {/* Reusable Edit Modal */}
      <EditCaseModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        caseItem={activeEditCase}
        onUpdated={handleCaseUpdated}
      />

    </div>
  );
}
