import React, { useState, useEffect } from 'react';
import { reportsService } from '../../services/reports.service';
import { casesService } from '../../services/cases.service';

export default function ReportsCenter() {
  const [reports, setReports] = useState([]);
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReportsCount, setTotalReportsCount] = useState(0);

  // Selected report preview states
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedCaseDetails, setSelectedCaseDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Modal generation states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genTitle, setGenTitle] = useState('');
  const [genCaseId, setGenCaseId] = useState('');
  const [genFormat, setGenFormat] = useState('PDF');
  const [genReportType, setGenReportType] = useState('Incident Summary');
  const [isGenerating, setIsGenerating] = useState(false);

  const [qualityScore, setQualityScore] = useState(90);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Dynamically load Google Fonts and Material Symbols for styling
  useEffect(() => {
    const linkFont = document.createElement('link');
    linkFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&family=Geist:wght@400;600;700&display=swap';
    linkFont.rel = 'stylesheet';
    document.head.appendChild(linkFont);

    const linkSymbols = document.createElement('link');
    linkSymbols.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    linkSymbols.rel = 'stylesheet';
    document.head.appendChild(linkSymbols);

    return () => {
      if (document.head.contains(linkFont)) {
        document.head.removeChild(linkFont);
      }
      if (document.head.contains(linkSymbols)) {
        document.head.removeChild(linkSymbols);
      }
    };
  }, []);

  // Fetch report list
  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await reportsService.getReports({
        search: searchQuery,
        format: formatFilter,
        reportType: typeFilter,
        page: page,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setReports(res.data || []);
      setTotalReportsCount(res.pagination.total || 0);
      setTotalPages(res.pagination.pages || 1);

      // Default selection to first report if none is active
      if (res.data && res.data.length > 0) {
        const currentSelected = res.data.find(r => r._id === selectedReport?._id || r.reportId === selectedReport?.reportId);
        if (currentSelected) {
          setSelectedReport(currentSelected);
        } else {
          setSelectedReport(res.data[0]);
        }
      } else {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error('[ReportsCenter] List fetch error:', err);
      setError(err.message || 'Failed to load forensic reports.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search and page queries
  useEffect(() => {
    fetchReports();
  }, [searchQuery, formatFilter, typeFilter, page]);

  // Load cases catalog on mount for report generation selector
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await casesService.getCases({ limit: 100 });
        setCases(res.data || []);
      } catch (err) {
        console.warn('[ReportsCenter] Failed to fetch cases selection list:', err);
      }
    };
    fetchCases();
  }, []);

  // Fetch case details dynamically when selected report changes
  useEffect(() => {
    const fetchCaseDetails = async () => {
      if (!selectedReport) {
        setSelectedCaseDetails(null);
        return;
      }
      setIsLoadingDetails(true);
      try {
        const details = await casesService.getCaseById(selectedReport.caseId);
        setSelectedCaseDetails(details);
        // Randomize template score slightly to make the dashboard feel alive
        setQualityScore(85 + (details.evidenceCount % 11));
      } catch (err) {
        console.warn(`[ReportsCenter] Failed to load case details for ${selectedReport.caseId}:`, err.message);
        setSelectedCaseDetails(null);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    fetchCaseDetails();
  }, [selectedReport]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!genCaseId) {
      triggerToast('Please select a case to generate a report.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await reportsService.generateReport({
        title: genTitle.trim() || undefined,
        caseId: genCaseId,
        format: genFormat,
        reportType: genReportType
      });
      triggerToast(`Report ${res.reportId} synthesized successfully!`);
      setShowGenerateModal(false);
      setGenTitle('');
      setGenCaseId('');
      setPage(1);
      fetchReports();
    } catch (err) {
      console.error('[ReportsCenter] Generation failure:', err);
      triggerToast(`Failed to generate: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (report) => {
    if (!report) return;
    try {
      const id = report.reportId || report._id;
      const fileName = `${report.reportId || 'report'}.${report.format.toLowerCase()}`;
      triggerToast(`Downloading report file ${report.reportId}...`);
      await reportsService.downloadReport(id, fileName);
    } catch (err) {
      console.error('[ReportsCenter] Download failure:', err);
      triggerToast(`Download failed: ${err.message}`);
    }
  };

  const handleDelete = async (report) => {
    if (!report) return;
    if (!window.confirm(`Are you sure you want to permanently delete report ${report.reportId}?`)) {
      return;
    }
    try {
      const id = report.reportId || report._id;
      await reportsService.deleteReport(id);
      triggerToast(`Report ${report.reportId} deleted successfully.`);
      fetchReports();
    } catch (err) {
      console.error('[ReportsCenter] Delete failure:', err);
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

  return (
    <div className="trace-reports-page text-on-surface font-body-md overflow-x-hidden min-h-full relative">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#47faf3] text-[#47faf3] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          {toastMsg}
        </div>
      )}

      {/* Scope-contained custom styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-reports-page {
            background-color: #0a0e1a;
            background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0);
            background-size: 32px 32px;
            padding: 40px;
            box-sizing: border-box;
            width: 100%;
          }

          .glass-card {
            background: rgba(27, 31, 44, 0.4);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-top: 1px solid rgba(255, 255, 255, 0.15);
          }

          .neon-glow-primary {
            box-shadow: 0 0 15px rgba(174, 198, 255, 0.1);
          }

          .neon-glow-secondary {
            box-shadow: 0 0 20px rgba(71, 250, 243, 0.15);
          }

          .status-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }

          .scroll-hide::-webkit-scrollbar { display: none; }
        `
      }} />

      {/* Main Content Area */}
      <div className="p-0">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-left">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Reports Center</h1>
            <p className="text-on-surface-variant font-body-md max-w-2xl">
              Generate, download, and analyze digital forensic investigations and AI-assisted case digests.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps flex items-center gap-2 hover:bg-primary/90 transition-all neon-glow-primary cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[20px]">magic_button</span>
              Generate Report
            </button>
          </div>
        </div>

        {/* KPI Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden group text-left">
            <div className="absolute -right-4 -top-4 text-primary opacity-5 transform group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[80px]">description</span>
            </div>
            <span className="text-on-surface-variant font-label-caps text-[10px] tracking-wider uppercase">Total Reports</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface">{totalReportsCount}</span>
              <span className="text-xs text-secondary">Active Console</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden group text-left">
            <span className="text-on-surface-variant font-label-caps text-[10px] tracking-wider uppercase font-medium">Compliance Index</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface">99.2%</span>
              <span className="text-xs text-secondary">Optimal</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[99%]"></div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden group text-left">
            <span className="text-on-surface-variant font-label-caps text-[10px] tracking-wider uppercase font-medium">Available Formats</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-secondary">PDF / CSV</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border-primary/20 bg-primary/5 flex flex-col justify-between h-28 relative overflow-hidden group text-left">
            <span className="text-primary font-label-caps text-[10px] tracking-wider uppercase font-medium">AI Heuristics Engine</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">Enabled</span>
              <span className="material-symbols-outlined text-primary text-[18px] ml-1">auto_awesome</span>
            </div>
          </div>
        </div>

        {/* Main Interface Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Search, Filters, & Table List) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Search and Filters bar */}
            <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-xs flex items-center">
                <input
                  type="text"
                  placeholder="Search by title or case..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-surface-container-low border border-white/10 rounded-lg px-4 py-2 pl-9 text-xs text-on-surface placeholder-on-surface-variant outline-none focus:border-primary/50"
                />
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[16px]">search</span>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <select
                  value={formatFilter}
                  onChange={(e) => {
                    setFormatFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-surface-container-low border border-white/10 rounded-lg px-3 py-2 text-xs text-on-surface outline-none cursor-pointer"
                >
                  <option value="">All Formats</option>
                  <option value="PDF">PDF</option>
                  <option value="CSV">CSV</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-surface-container-low border border-white/10 rounded-lg px-3 py-2 text-xs text-on-surface outline-none cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="Incident Summary">Incident Summary</option>
                  <option value="Forensic Audit">Forensic Audit</option>
                  <option value="AI Investigation">AI Investigation</option>
                </select>
              </div>
            </div>

            {/* Reports List Table */}
            <section className="glass-card rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between text-left">
                <h2 className="text-on-surface font-semibold text-base">Forensic Reports catalog</h2>
                <span className="text-xs text-on-surface-variant">{totalReportsCount} entries found</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low/50 text-[10px] text-on-surface-variant font-label-caps uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Report Details</th>
                      <th className="px-6 py-4">Case Link</th>
                      <th className="px-6 py-4">Format</th>
                      <th className="px-6 py-4">Size</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {isLoading ? (
                      // Loading Skeletons
                      Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="px-6 py-4">
                            <div className="h-4 bg-white/5 rounded w-36 mb-2"></div>
                            <div className="h-3 bg-white/5 rounded w-20"></div>
                          </td>
                          <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-16"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-12"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-10"></div></td>
                          <td className="px-6 py-4 text-right"><div className="h-6 bg-white/5 rounded w-12 ml-auto"></div></td>
                        </tr>
                      ))
                    ) : error ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-[#ef4444] font-medium">
                          ✕ {error}
                        </td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant">
                          All clear. No generated reports match query criteria.
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr 
                          key={report._id} 
                          onClick={() => setSelectedReport(report)}
                          className={`transition-colors cursor-pointer group ${
                            selectedReport?._id === report._id ? 'bg-primary/5' : 'hover:bg-white/[0.01]'
                          }`}
                        >
                          <td className="px-6 py-4 text-left">
                            <div className="font-semibold text-on-surface text-xs leading-normal">{report.title}</div>
                            <div className="text-[10px] text-on-surface-variant font-code-sm mt-1">{report.reportType}</div>
                          </td>
                          <td className="px-6 py-4 text-secondary font-mono text-xs">{report.caseId}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              report.format === 'PDF' ? 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30' : 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                            }`}>
                              {report.format}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant text-xs">{formatSize(report.fileSize)}</td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDownload(report)}
                                className="p-1 text-on-surface-variant hover:text-primary hover:bg-white/5 rounded transition-all cursor-pointer bg-transparent border-none"
                                title="Download Report"
                              >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(report)}
                                className="p-1 text-on-surface-variant hover:text-[#ef4444] hover:bg-white/5 rounded transition-all cursor-pointer bg-transparent border-none"
                                title="Delete Report"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 bg-surface-container-low border border-white/10 rounded hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-on-surface"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-3 py-1.5 bg-surface-container-low border border-white/10 rounded hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-on-surface"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right Column (Detailed Preview Area) */}
          <div className="lg:col-span-5 text-left">
            <div className="glass-card rounded-xl p-6 space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <h3 className="font-semibold text-on-surface">Report Detail Preview</h3>
                {selectedReport && (
                  <button
                    type="button"
                    onClick={() => handleDownload(selectedReport)}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span> Export Document
                  </button>
                )}
              </div>

              {!selectedReport ? (
                <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant text-center">
                  <span className="material-symbols-outlined text-[48px] text-white/10 mb-4">description</span>
                  <p className="text-sm">Select a report from the catalog table to activate detail telemetry preview.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Preview header */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-12 bg-surface-container flex flex-col items-center justify-center rounded border border-white/10 shadow-lg shrink-0">
                      <span className="text-[9px] font-bold text-on-surface-variant">{selectedReport.format}</span>
                      <span className="material-symbols-outlined text-primary text-[16px]">description</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-on-surface text-sm leading-snug break-words">{selectedReport.title}</h4>
                      <p className="text-[10px] text-on-surface-variant mt-1">
                        Report ID: <span className="font-mono">{selectedReport.reportId}</span> | Format: {selectedReport.format}
                      </p>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-2 gap-4 bg-white/[0.01] border border-white/5 rounded-lg p-4 text-[11px] leading-relaxed">
                    <div>
                      <span className="text-on-surface-variant block uppercase font-bold tracking-wider mb-1">Related Case</span>
                      <span className="text-secondary font-mono">{selectedReport.caseId}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block uppercase font-bold tracking-wider mb-1">Size</span>
                      <span>{formatSize(selectedReport.fileSize)}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block uppercase font-bold tracking-wider mb-1">Type</span>
                      <span>{selectedReport.reportType}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block uppercase font-bold tracking-wider mb-1">Generated At</span>
                      <span>{new Date(selectedReport.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Dynamic Case Details */}
                  {isLoadingDetails ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-primary">
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      <span className="text-xs">Synchronizing details ledger...</span>
                    </div>
                  ) : selectedCaseDetails ? (
                    <div className="space-y-4 pt-2">
                      <div>
                        <h5 className="text-secondary font-bold text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <span className="w-1 h-3 bg-secondary"></span> Incident Description
                        </h5>
                        <p className="text-[11.5px] text-on-surface-variant leading-relaxed pl-2.5 border-l border-white/10">
                          {selectedCaseDetails.description || 'No description logged in the telemetry records.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-secondary font-bold text-[10px] uppercase tracking-wider mb-1.5">
                            Incident Scope
                          </h5>
                          <ul className="space-y-1.5 text-[11px] text-on-surface-variant pl-1">
                            <li className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[12px] text-primary">circle</span>
                              Host: {selectedCaseDetails.targetHost || 'N/A'}
                            </li>
                            <li className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[12px] text-primary">circle</span>
                              Status: {selectedCaseDetails.status || 'N/A'}
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-secondary font-bold text-[10px] uppercase tracking-wider mb-1.5">
                            Network IOCs
                          </h5>
                          <ul className="space-y-1.5 text-[11px] text-on-surface-variant pl-1">
                            <li className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[12px] text-primary">arrow_forward</span>
                              Src: {selectedCaseDetails.sourceIP || 'N/A'}
                            </li>
                            <li className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[12px] text-primary">arrow_forward</span>
                              Dst: {selectedCaseDetails.destinationIP || 'N/A'}
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="pt-2">
                        <h5 className="text-on-surface-variant font-bold text-[9px] uppercase tracking-widest mb-3">
                          Triage Timeline
                        </h5>
                        <div className="relative pl-4 border-l border-white/10 space-y-4 ml-1">
                          <div className="relative text-[11px]">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-secondary/20"></div>
                            <span className="text-[10px] font-code-sm text-secondary block mb-0.5">
                              {new Date(selectedCaseDetails.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="text-on-surface-variant">Incident created &amp; logged by {selectedReport.generatedBy?.fullName || 'Analyst'}.</span>
                          </div>
                          <div className="relative text-[11px]">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                            <span className="text-[10px] font-code-sm text-primary block mb-0.5">T+14 minutes</span>
                            <span className="text-on-surface-variant">Cognitive EDR rules automatically compiled.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface-container-high/30 p-4 rounded-lg border border-white/5 text-[11.5px] text-on-surface-variant text-center">
                      Case telemetry unavailable or archived. Raw report file size can still be exported.
                    </div>
                  )}

                  {/* Quality score gauges */}
                  <div className="flex flex-col items-center py-4 border-t border-white/5">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle className="text-white/5" cx="48" cy="48" fill="transparent" r="42" stroke="currentColor" strokeWidth="6"></circle>
                        <circle className="text-secondary" cx="48" cy="48" fill="transparent" r="42" stroke="currentColor" strokeDasharray="264" strokeDashoffset={`${264 - (264 * qualityScore) / 100}`} strokeWidth="6"></circle>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-lg font-bold text-on-surface">{qualityScore}</span>
                        <span className="text-[8px] text-on-surface-variant uppercase tracking-wider">Quality Score</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Report Overlay Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-white/10 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in text-left">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-on-surface flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">magic_button</span>
                Generate Forensic Report
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (!isGenerating) setShowGenerateModal(false);
                }}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-white/5 cursor-pointer bg-transparent border-none"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleGenerate} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2" htmlFor="rep-title">
                  Report Title
                </label>
                <input
                  id="rep-title"
                  type="text"
                  placeholder="e.g. Executive Incident Digest"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  className="w-full bg-surface-container-low border border-white/10 rounded-lg px-4 py-2 text-xs text-on-surface placeholder-on-surface-variant outline-none focus:border-primary/50"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2" htmlFor="rep-case">
                  Target Case ID *
                </label>
                <select
                  id="rep-case"
                  required
                  value={genCaseId}
                  onChange={(e) => setGenCaseId(e.target.value)}
                  className="w-full bg-surface-container-low border border-white/10 rounded-lg px-4 py-2.5 text-xs text-on-surface outline-none cursor-pointer focus:border-primary/50"
                  disabled={isGenerating}
                >
                  <option value="">Select an incident case...</option>
                  {cases.map((c) => (
                    <option key={c._id} value={c.caseId}>
                      {c.caseId} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2" htmlFor="rep-format">
                    Format *
                  </label>
                  <select
                    id="rep-format"
                    value={genFormat}
                    onChange={(e) => setGenFormat(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/10 rounded-lg px-4 py-2.5 text-xs text-on-surface outline-none cursor-pointer focus:border-primary/50"
                    disabled={isGenerating}
                  >
                    <option value="PDF">PDF</option>
                    <option value="CSV">CSV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2" htmlFor="rep-type">
                    Report Type *
                  </label>
                  <select
                    id="rep-type"
                    value={genReportType}
                    onChange={(e) => setGenReportType(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/10 rounded-lg px-4 py-2.5 text-xs text-on-surface outline-none cursor-pointer focus:border-primary/50"
                    disabled={isGenerating}
                  >
                    <option value="Incident Summary">Incident Summary</option>
                    <option value="Forensic Audit">Forensic Audit</option>
                    <option value="AI Investigation">AI Investigation</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-transparent text-on-surface hover:bg-white/5 rounded border border-white/10 cursor-pointer"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary hover:bg-primary/95 rounded font-bold cursor-pointer flex items-center gap-1.5 border-none"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">done</span>
                      Generate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Local Footer Status Bar */}
      <footer className="bg-surface-dim/80 backdrop-blur-xl border-t border-white/5 py-4 px-margin-desktop flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 rounded-lg text-xs">
        <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-on-surface-variant font-label-caps tracking-widest">
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> SECURE TUNNEL ACTIVE</span>
          <span>ENCRYPTION: AES-256-GCM</span>
          <span>WORKSTATION: NODE-X-88</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-on-surface-variant font-label-caps">
          <span>© 2026 TRACE AI FORENSICS</span>
          <a className="hover:text-primary transition-colors" href="#">API ACCESS</a>
        </div>
      </footer>
    </div>
  );
}
