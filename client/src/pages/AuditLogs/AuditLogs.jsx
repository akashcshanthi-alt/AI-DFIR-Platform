import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Search, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  FileText, 
  X, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Activity,
  Globe,
  Tag
} from 'lucide-react';
import { auditService } from '../../services/audit.service';

const severityStyles = {
  Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
};

export default function AuditLogs() {
  const navigate = useNavigate();

  // Guard verification check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';
  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Query state parameters
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Data states
  const [logs, setLogs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Export menu & Details modal state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Fetch paginated real records from backend
  const fetchAuditLogs = useCallback(async () => {
    try {
      setIsFetching(true);
      setError(null);
      const params = {
        search: searchTerm.trim() || undefined,
        page: currentPage,
        limit,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      };

      const result = await auditService.getAuditLogs(params);
      setLogs(result.logs || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalCount(result.pagination?.total || 0);
    } catch (err) {
      console.error('[AuditLogs] Fetch error:', err);
      setError(err.message || 'Failed to load audit logs.');
    } finally {
      setIsFetching(false);
    }
  }, [searchTerm, currentPage]);

  useEffect(() => {
    if (hasSession) {
      fetchAuditLogs();
    }
  }, [hasSession, fetchAuditLogs]);

  // Export CSV / PDF
  const triggerExport = async (format) => {
    try {
      setShowExportMenu(false);
      setIsExporting(true);
      triggerToast(`Preparing ${format.toUpperCase()} export...`);

      const filters = {
        search: searchTerm.trim() || undefined
      };

      const blob = await auditService.exportAuditLogs(format, filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().getTime()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      triggerToast(`Audit logs exported as ${format.toUpperCase()}.`);
    } catch (err) {
      console.error('[AuditLogs] Export failure:', err);
      triggerToast(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
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
            <Shield className="w-6 h-6 text-[#38bdf8]" />
            Audit Logs
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Track security event history and actions performed across the platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchAuditLogs}
            disabled={isFetching}
            className="p-2.5 bg-[#0b0f19] border border-[#1e293b] hover:bg-[#1e293b] text-[#94a3b8] hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#38bdf8]' : ''}`} />
          </button>

          {/* Export Logs Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer border border-[#334155]"
            >
              <Download className="w-4 h-4 text-[#38bdf8]" />
              Export Logs
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 z-50 bg-[#0b0f19] border border-[#1e293b] rounded-xl shadow-2xl p-1.5 w-40 flex flex-col gap-1 text-left">
                <button
                  type="button"
                  onClick={() => triggerExport('csv')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1e293b] text-xs text-white font-medium cursor-pointer"
                >
                  Export as CSV
                </button>
                <button
                  type="button"
                  onClick={() => triggerExport('pdf')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1e293b] text-xs text-white font-medium cursor-pointer"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar: Search */}
      <div className="bg-[#0b0f19] border border-[#1e293b] rounded-xl p-3.5 mb-6 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, module, or keyword..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#111827] border border-[#1e293b] rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8]/60 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-[#64748b] font-mono pr-2">
          Total Events: <span className="text-white font-semibold">{totalCount}</span>
        </div>
      </div>

      {/* Main Audit Table / Empty State */}
      <div className="bg-[#0b0f19] border border-[#1e293b] rounded-xl overflow-hidden shadow-xl">
        {isFetching ? (
          /* Loading Skeleton */
          <div className="p-8 space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="animate-pulse flex items-center justify-between py-3 border-b border-[#1e293b]/50">
                <div className="h-4 w-32 bg-[#1e293b] rounded"></div>
                <div className="h-4 w-44 bg-[#1e293b] rounded"></div>
                <div className="h-5 w-24 bg-[#1e293b] rounded"></div>
                <div className="h-4 w-16 bg-[#1e293b] rounded"></div>
                <div className="h-4 w-16 bg-[#1e293b] rounded"></div>
                <div className="h-4 w-24 bg-[#1e293b] rounded"></div>
                <div className="h-8 w-16 bg-[#1e293b] rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-rose-300 mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          /* Clean Empty State */
          <div className="py-20 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-[#1e293b] flex items-center justify-center text-[#64748b] mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No audit activity yet.</h3>
            <p className="text-sm text-[#94a3b8] max-w-md">
              Your actions will appear here as you use the platform.
            </p>
          </div>
        ) : (
          /* Audit Logs Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#111827]/60 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Module</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Severity</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60 text-xs">
                {logs.map((log) => {
                  const isFailed = (log.status || '').toLowerCase() === 'failed';
                  const sevClass = severityStyles[log.severity] || severityStyles.Low;

                  return (
                    <tr
                      key={log._id || log.logId || log.eventId}
                      className={`hover:bg-[#111827]/40 transition-colors ${
                        isFailed ? 'bg-rose-500/[0.02]' : ''
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="px-6 py-4 font-mono text-[#94a3b8] whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white text-xs">
                          {log.action}
                        </div>
                        {log.description && (
                          <div className="text-[11px] text-[#64748b] max-w-xs truncate mt-0.5" title={log.description}>
                            {log.description}
                          </div>
                        )}
                      </td>

                      {/* Module */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] text-[#cbd5e1] bg-[#111827] border border-[#1e293b] px-2.5 py-1 rounded">
                          {log.module || 'SYSTEM'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 font-semibold text-[11px] ${
                            isFailed ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isFailed ? 'bg-rose-400' : 'bg-emerald-400'
                            }`}
                          />
                          {log.status || 'Success'}
                        </span>
                      </td>

                      {/* Severity */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sevClass}`}>
                          {log.severity || 'Low'}
                        </span>
                      </td>

                      {/* IP Address */}
                      <td className="px-6 py-4 font-mono text-[#94a3b8] whitespace-nowrap">
                        {log.ipAddress || log.ip || '127.0.0.1'}
                      </td>

                      {/* Action Details */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-white rounded text-xs font-medium transition-colors cursor-pointer"
                          title="View event details"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && !isFetching && (
          <div className="p-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-[#94a3b8]">
            <span>
              Showing page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({totalCount} records)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 bg-[#111827] border border-[#1e293b] rounded hover:bg-[#1e293b] text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 bg-[#111827] border border-[#1e293b] rounded hover:bg-[#1e293b] text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Audit Log Event Details                                            */}
      {/* ========================================================================= */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f19] border border-[#1e293b] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8]">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Audit Event Details</h3>
                  <p className="text-xs text-[#94a3b8] font-mono">{selectedLog.logId || selectedLog.eventId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-[#64748b] hover:text-white p-1 rounded hover:bg-[#1e293b] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#64748b] block mb-1">
                  Action
                </span>
                <p className="text-sm font-semibold text-white">{selectedLog.action}</p>
              </div>

              {selectedLog.description && (
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-[#64748b] block mb-1">
                    Description
                  </span>
                  <p className="text-xs text-[#cbd5e1] leading-relaxed bg-[#111827] border border-[#1e293b] p-3 rounded-lg">
                    {selectedLog.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-[#111827] border border-[#1e293b] rounded-xl p-4 text-xs">
                <div>
                  <span className="text-[#64748b] block text-[11px] mb-0.5">Module</span>
                  <span className="font-mono text-[#38bdf8] font-bold">{selectedLog.module || 'SYSTEM'}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px] mb-0.5">Status</span>
                  <span
                    className={`font-semibold ${
                      (selectedLog.status || '').toLowerCase() === 'failed'
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedLog.status || 'Success'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px] mb-0.5">Severity</span>
                  <span className="font-medium text-white">{selectedLog.severity || 'Low'}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[11px] mb-0.5">IP Address</span>
                  <span className="font-mono text-white">{selectedLog.ipAddress || selectedLog.ip || '127.0.0.1'}</span>
                </div>
                {selectedLog.resource && (
                  <div className="col-span-2">
                    <span className="text-[#64748b] block text-[11px] mb-0.5">Resource</span>
                    <span className="font-medium text-white">{selectedLog.resource}</span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-[#64748b] block text-[11px] mb-0.5">Timestamp</span>
                  <span className="font-medium text-white">{formatDate(selectedLog.timestamp)}</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#1e293b] flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
