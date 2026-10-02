import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Trash2, 
  X, 
  Loader2, 
  AlertCircle, 
  FolderOpen,
  Calendar,
  CheckCircle2,
  FileCode,
  HardDrive
} from 'lucide-react';
import { reportsService } from '../../services/reports.service';
import { casesService } from '../../services/cases.service';

export default function ReportsCenter() {
  const navigate = useNavigate();

  // Authentication Guard Check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';
  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Reports data state
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReportsCount, setTotalReportsCount] = useState(0);

  // Generate Modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [userCases, setUserCases] = useState([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [genTitle, setGenTitle] = useState('');
  const [genCaseId, setGenCaseId] = useState('');
  const [genFormat, setGenFormat] = useState('PDF');
  const [genReportType, setGenReportType] = useState('Incident Summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  // View Details Modal state
  const [viewingReport, setViewingReport] = useState(null);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Fetch Reports from real backend API
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await reportsService.getReports({
        search: searchQuery.trim() || undefined,
        format: formatFilter || undefined,
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setReports(res.data || []);
      setTotalReportsCount(res.pagination?.total || 0);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      console.error('[Reports] Fetch error:', err);
      setError(err.message || 'Failed to load forensic reports.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, formatFilter, page]);

  useEffect(() => {
    if (hasSession) {
      fetchReports();
    }
  }, [hasSession, fetchReports]);

  // Load user's authorized cases when opening Generate Modal
  const loadUserCases = async () => {
    setIsLoadingCases(true);
    setGenerateError('');
    try {
      const res = await casesService.getCases({ limit: 100 });
      const casesList = res.data || [];
      setUserCases(casesList);
      if (casesList.length > 0 && !genCaseId) {
        setGenCaseId(casesList[0].caseId);
      }
    } catch (err) {
      console.error('[Reports] Error loading user cases:', err);
      setGenerateError('Failed to load your cases. Please try again.');
    } finally {
      setIsLoadingCases(false);
    }
  };

  const handleOpenGenerateModal = () => {
    setShowGenerateModal(true);
    setGenTitle('');
    setGenerateError('');
    loadUserCases();
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!genCaseId) {
      setGenerateError('Please select an authorized incident case.');
      return;
    }

    setIsGenerating(true);
    setGenerateError('');
    try {
      const newReport = await reportsService.generateReport({
        title: genTitle.trim() || undefined,
        caseId: genCaseId,
        format: genFormat,
        reportType: genReportType
      });
      triggerToast(`Report ${newReport.reportId || 'document'} generated successfully.`);
      setShowGenerateModal(false);
      setGenTitle('');
      setPage(1);
      fetchReports();
    } catch (err) {
      console.error('[Reports] Generation failure:', err);
      setGenerateError(err.message || 'Report generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (report) => {
    if (!report) return;
    try {
      const id = report.reportId || report._id;
      const fileName = `${report.reportId || 'report'}.${(report.format || 'pdf').toLowerCase()}`;
      triggerToast(`Downloading ${fileName}...`);
      await reportsService.downloadReport(id, fileName);
    } catch (err) {
      console.error('[Reports] Download failure:', err);
      triggerToast(`Download failed: ${err.message}`);
    }
  };

  const handleDelete = async (report) => {
    if (!report) return;
    if (!window.confirm(`Are you sure you want to permanently delete report ${report.reportId || report.title}?`)) {
      return;
    }
    try {
      const id = report.reportId || report._id;
      await reportsService.deleteReport(id);
      triggerToast(`Report ${report.reportId || ''} deleted.`);
      if (viewingReport?._id === report._id || viewingReport?.reportId === report.reportId) {
        setViewingReport(null);
      }
      fetchReports();
    } catch (err) {
      console.error('[Reports] Delete failure:', err);
      triggerToast(`Delete failed: ${err.message}`);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-[#f8fafc] p-6 lg:p-8 w-full box-border">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-[#0f172a] border border-[#38bdf8] text-[#38bdf8] text-xs font-semibold px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#38bdf8]" />
            Reports
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Generate, view, and download investigation reports from your incident cases.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenGenerateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#38bdf8] hover:bg-[#0284c7] text-[#060913] font-semibold text-sm rounded-lg transition-colors cursor-pointer shadow-lg shadow-[#38bdf8]/10"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Generate Report
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#0b0f19] border border-[#1e293b] rounded-xl p-3.5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by report name or case ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#111827] border border-[#1e293b] rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8]/60 transition-colors"
          />
        </div>

        {/* Format Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="format-filter" className="text-xs text-[#64748b] whitespace-nowrap">
            Format:
          </label>
          <select
            id="format-filter"
            value={formatFilter}
            onChange={(e) => {
              setFormatFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]/60 cursor-pointer"
          >
            <option value="">All Formats</option>
            <option value="PDF">PDF</option>
            <option value="CSV">CSV</option>
          </select>
        </div>
      </div>

      {/* Main Reports Table / Empty State */}
      <div className="bg-[#0b0f19] border border-[#1e293b] rounded-xl overflow-hidden shadow-xl">
        {isLoading ? (
          /* Loading Skeleton */
          <div className="p-8 space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="animate-pulse flex items-center justify-between py-3 border-b border-[#1e293b]/50">
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-[#1e293b] rounded"></div>
                  <div className="h-3 w-28 bg-[#1e293b]/60 rounded"></div>
                </div>
                <div className="h-4 w-20 bg-[#1e293b] rounded"></div>
                <div className="h-5 w-12 bg-[#1e293b] rounded"></div>
                <div className="h-4 w-28 bg-[#1e293b] rounded"></div>
                <div className="h-8 w-20 bg-[#1e293b] rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-rose-300 mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchReports}
              className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : reports.length === 0 ? (
          /* Clean Empty State */
          <div className="py-20 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-[#1e293b] flex items-center justify-center text-[#64748b] mb-4">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No reports yet.</h3>
            <p className="text-sm text-[#94a3b8] max-w-md mb-6">
              Generate a report from an investigation to see it here.
            </p>
            <button
              type="button"
              onClick={handleOpenGenerateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#38bdf8] hover:bg-[#0284c7] text-[#060913] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Generate Report
            </button>
          </div>
        ) : (
          /* Reports Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#111827]/60 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                  <th className="px-6 py-3.5">Report Name</th>
                  <th className="px-6 py-3.5">Case</th>
                  <th className="px-6 py-3.5">Format</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60 text-xs">
                {reports.map((report) => (
                  <tr
                    key={report._id || report.reportId}
                    className="hover:bg-[#111827]/40 transition-colors group"
                  >
                    {/* Report Name */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-white text-sm">
                        {report.title || 'Forensic Report'}
                      </div>
                      <div className="text-[11px] text-[#64748b] font-mono mt-0.5">
                        {report.reportId} • {report.reportType || 'Incident Summary'}
                      </div>
                    </td>

                    {/* Case */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-[#38bdf8] font-medium bg-[#38bdf8]/10 px-2.5 py-1 rounded text-xs border border-[#38bdf8]/20">
                        {report.caseId || 'N/A'}
                      </span>
                    </td>

                    {/* Format */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${
                          report.format === 'PDF'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {report.format || 'PDF'}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-[#94a3b8] whitespace-nowrap">
                      {formatDate(report.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingReport(report)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-white rounded text-xs font-medium transition-colors cursor-pointer"
                          title="View report details"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(report)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-white rounded text-xs font-medium transition-colors cursor-pointer"
                          title="Download document file"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(report)}
                          className="p-1.5 text-[#64748b] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          title="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="p-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-[#94a3b8]">
            <span>
              Showing page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({totalReportsCount} total)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 bg-[#111827] border border-[#1e293b] rounded hover:bg-[#1e293b] text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 bg-[#111827] border border-[#1e293b] rounded hover:bg-[#1e293b] text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Generate Report                                                    */}
      {/* ========================================================================= */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f19] border border-[#1e293b] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Generate Report</h3>
                  <p className="text-xs text-[#94a3b8]">Synthesize a forensic report from an authorized case.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isGenerating) setShowGenerateModal(false);
                }}
                className="text-[#64748b] hover:text-white p-1 rounded hover:bg-[#1e293b] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {isLoadingCases ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-[#38bdf8] animate-spin" />
                <span className="text-xs text-[#94a3b8]">Loading authorized cases...</span>
              </div>
            ) : userCases.length === 0 ? (
              /* If user has no cases */
              <div className="p-8 text-center">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-white mb-1.5">No Incident Cases Found</h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed max-w-sm mx-auto mb-6">
                  Report generation requires an active or investigated incident case. Please create a case first to synthesize forensic reports.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-xs font-semibold text-white rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGenerateModal(false);
                      navigate('/cases/new');
                    }}
                    className="px-4 py-2 bg-[#38bdf8] hover:bg-[#0284c7] text-xs font-semibold text-[#060913] rounded-lg cursor-pointer"
                  >
                    Create a Case
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="p-6 space-y-4">
                {generateError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{generateError}</span>
                  </div>
                )}

                {/* Target Case */}
                <div>
                  <label htmlFor="modal-case-id" className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                    Target Case <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="modal-case-id"
                    required
                    value={genCaseId}
                    onChange={(e) => setGenCaseId(e.target.value)}
                    disabled={isGenerating}
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#38bdf8] cursor-pointer"
                  >
                    {userCases.map((c) => (
                      <option key={c._id || c.caseId} value={c.caseId}>
                        {c.caseId} — {c.title} ({c.severity || 'Normal'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Report Title */}
                <div>
                  <label htmlFor="modal-report-title" className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                    Report Title <span className="text-[#64748b] font-normal">(Optional)</span>
                  </label>
                  <input
                    id="modal-report-title"
                    type="text"
                    placeholder="e.g. Incident Response Forensic Summary"
                    value={genTitle}
                    onChange={(e) => setGenTitle(e.target.value)}
                    disabled={isGenerating}
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3.5 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>

                {/* Format and Report Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="modal-format" className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                      Format <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id="modal-format"
                      value={genFormat}
                      onChange={(e) => setGenFormat(e.target.value)}
                      disabled={isGenerating}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#38bdf8] cursor-pointer"
                    >
                      <option value="PDF">PDF (Formatted Document)</option>
                      <option value="CSV">CSV (Raw Telemetry Data)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="modal-type" className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                      Report Type <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id="modal-type"
                      value={genReportType}
                      onChange={(e) => setGenReportType(e.target.value)}
                      disabled={isGenerating}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#38bdf8] cursor-pointer"
                    >
                      <option value="Incident Summary">Incident Summary</option>
                      <option value="Forensic Audit">Forensic Audit</option>
                      <option value="AI Investigation">AI Investigation</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-[#1e293b] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#38bdf8] hover:bg-[#0284c7] text-[#060913] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Synthesizing...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: View Report Details                                                */}
      {/* ========================================================================= */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f19] border border-[#1e293b] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Report Details</h3>
                  <p className="text-xs text-[#94a3b8] font-mono">{viewingReport.reportId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="text-[#64748b] hover:text-white p-1 rounded hover:bg-[#1e293b] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Real Report Metadata */}
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#64748b] block mb-1">
                  Report Title
                </span>
                <p className="text-sm font-semibold text-white">{viewingReport.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#111827] border border-[#1e293b] rounded-xl p-4 text-xs">
                <div>
                  <span className="text-[#64748b] block text-[11px] mb-0.5">Associated Case</span>
                  <span className="font-mono text-[#38bdf8] font-bold">{viewingReport.caseId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px] mb-0.5">Format &amp; Size</span>
                  <span className="font-medium text-white">
                    {viewingReport.format} • {formatSize(viewingReport.fileSize)}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px] mb-0.5">Report Type</span>
                  <span className="font-medium text-white">{viewingReport.reportType || 'Incident Summary'}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px] mb-0.5">Created Date</span>
                  <span className="font-medium text-white">{formatDate(viewingReport.createdAt)}</span>
                </div>
              </div>

              {viewingReport.generatedBy && (
                <div className="text-xs text-[#94a3b8]">
                  Generated by:{' '}
                  <strong className="text-white">
                    {viewingReport.generatedBy.fullName || viewingReport.generatedBy.email || 'Investigator'}
                  </strong>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDelete(viewingReport)}
                  className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Report
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingReport(null)}
                    className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(viewingReport)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#38bdf8] hover:bg-[#0284c7] text-[#060913] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
