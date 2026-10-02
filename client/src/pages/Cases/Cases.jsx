import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw, FolderPlus, ShieldAlert } from 'lucide-react';
import './Cases.css';

// Import sub-components
import CasesHeader from './components/CasesHeader';
import CasesFilters from './components/CasesFilters';
import CasesTable from './components/CasesTable';
import EditCaseModal from './components/EditCaseModal';
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

  // Edit Case Modal States
  const [activeEditCase, setActiveEditCase] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Checkbox multiselector state
  const [selectedCaseIds, setSelectedCaseIds] = useState(new Set());

  // Synchronize search query from URL search params changes
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q');
    if (q !== null) {
      setSearchQuery(q || '');
      setPage(1);
    }
  }, [location.search]);

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
      if (severityFilter !== 'All') {
        params.severity = severityFilter;
      }
      if (statusFilter !== 'All') {
        params.status = statusFilter;
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
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, severityFilter, statusFilter, page, hasSession]);

  const handleSeverityChange = (val) => {
    setSeverityFilter(val);
    setPage(1);
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
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
      setSuccessMessage(`Investigation case [${id}] successfully deleted.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      const nextSelected = new Set(selectedCaseIds);
      nextSelected.delete(id);
      setSelectedCaseIds(nextSelected);

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
    setSuccessMessage(`Case [${updatedCase.caseId || updatedCase._id}] details updated successfully.`);
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

  const getSeverityBadgeClass = (severity) => {
    if (!severity) return '';
    const s = severity.toUpperCase();
    if (s === 'CRITICAL') return 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
    if (s === 'HIGH') return 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30';
    if (s === 'MEDIUM') return 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30';
    return 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30';
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return '';
    const st = status.toLowerCase();
    if (st === 'open') return 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30';
    if (st === 'investigating') return 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30';
    return 'bg-white/10 text-[#94a3b8] border border-white/10';
  };

  if (!hasSession) return null;

  return (
    <div className="trace-cases-layout select-none w-full min-h-screen bg-[#060913] text-white p-6 box-border">
      
      {/* Toast Notification Banner */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#10b981] text-[#10b981] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold transition-all duration-300">
          {successMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <CasesHeader onNewCaseClick={() => navigate('/cases/new')} />
        
        {/* Filters */}
        <CasesFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          severityFilter={severityFilter}
          setSeverityFilter={handleSeverityChange}
          statusFilter={statusFilter}
          setStatusFilter={handleStatusChange}
        />

        {/* Content Viewport */}
        {isFetching && cases.length === 0 ? (
          <div className="glass-card rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[400px] bg-[#0B1220]/70">
            <Loader2 className="w-10 h-10 text-[#00E5FF] animate-spin mb-3" />
            <span className="text-xs font-semibold text-[#94a3b8]">Loading cases from MongoDB...</span>
          </div>
        ) : error ? (
          <div className="glass-card rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-[#0B1220]/70">
            <ShieldAlert className="w-12 h-12 text-[#ef4444]/80 mb-3" />
            <h3 className="font-bold text-white text-base">Backend Connection Error</h3>
            <p className="text-xs text-[#94a3b8] max-w-sm mt-1 mb-5">
              {error}
            </p>
            <button 
              type="button" 
              onClick={fetchCasesData}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : cases.length === 0 ? (
          /* Empty State Requirement: "No cases yet. Create your first case to begin an investigation." */
          <div className="glass-card rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[420px] p-8 text-center bg-[#0B1220]/70">
            <div className="w-16 h-16 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] mb-4">
              <FolderPlus className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-white text-lg">No cases yet.</h3>
            <p className="text-xs text-[#94a3b8] max-w-md mt-1.5 mb-6 leading-relaxed">
              No cases yet. Create your first case to begin an investigation.
            </p>
            <button 
              type="button"
              onClick={() => navigate('/cases/new')}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#3B82F6] hover:brightness-110 active:scale-95 text-[#0A0F1E] font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,229,255,0.25)] flex items-center gap-2 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Case</span>
            </button>
          </div>
        ) : (
          <CasesTable 
            cases={cases}
            selectedCaseIds={selectedCaseIds}
            handleCheckboxChange={handleCheckboxChange}
            handleMasterCheckboxChange={handleMasterCheckboxChange}
            formatCaseId={formatCaseId}
            getSeverityBadgeClass={getSeverityBadgeClass}
            getStatusBadgeClass={getStatusBadgeClass}
            
            currentPage={page}
            totalPages={totalPages}
            totalCases={totalCases}
            onPageChange={setPage}

            onEditClick={handleEditCaseClick}
            onDeleteClick={handleDeleteCase}
          />
        )}
      </div>

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
