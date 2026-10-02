import React, { useState, useEffect, useRef } from 'react';
import { 
  FiUpload, 
  FiFolder, 
  FiFolderPlus,
  FiFile, 
  FiDatabase, 
  FiCheck, 
  FiCopy, 
  FiInfo, 
  FiTrash2,
  FiDownload, 
  FiClock, 
  FiTag, 
  FiEdit2,
  FiAlertTriangle,
  FiLayers,
  FiTerminal,
  FiShield,
  FiFilter,
  FiSearch
} from 'react-icons/fi';
import StatusBadge from '../../components/common/StatusBadge';
import { evidenceService } from '../../services/evidence.service';
import { iocService } from '../../services/ioc.service';
import { timelineService } from '../../services/timeline.service';
import { mitreService } from '../../services/mitre.service';
import { aiService } from '../../services/ai.service';

export default function EvidenceTab({ caseId = 'DF-1001' }) {
  // Local state managers
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]); // Array to support multiple files & folders
  const [evidenceType, setEvidenceType] = useState('Log File');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');

  // Loading, progress, and error managers
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Batch summary state after upload
  const [lastBatchSummary, setLastBatchSummary] = useState(null);

  // End-to-end pipeline execution and final result state
  const [pipelineResult, setPipelineResult] = useState(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [parserFilter, setParserFilter] = useState('');

  // Drag over dropzone highlight state
  const [isDragActive, setIsDragActive] = useState(false);

  // UI interaction states
  const [errors, setErrors] = useState({});
  const [copiedHash, setCopiedHash] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // Inline Editing state
  const [editingItemId, setEditingItemId] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editTags, setEditTags] = useState('');
  const [isUpdatingMeta, setIsUpdatingMeta] = useState(false);

  // Hidden input refs
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Dynamic metrics
  const totalEvidence = evidenceItems.length;
  const activeCount = evidenceItems.filter((i) => i.status.toLowerCase() === 'active').length;
  const parsedCount = evidenceItems.filter((i) => i.parsing && (i.parsing.status === 'Parsed' || i.parsing.status === 'Partially Parsed')).length;
  const integrityCount = evidenceItems.filter((i) => i.md5Hash && i.sha256Hash).length;

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Helper: Format raw file sizes
  const formatFileSize = (bytes) => {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Retrieve evidence files list for this case
  const fetchEvidence = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await evidenceService.getEvidenceByCase(caseId);
      setEvidenceItems(res || []);
    } catch (err) {
      console.error('[EvidenceTab] List fetch error:', err);
      setError(err.message || 'Failed to retrieve case evidence.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchEvidence();
    }
  }, [caseId]);

  // Drag and drop event handlers with recursive directory traversal
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const traverseFileTree = async (item, path = '') => {
    if (item.isFile) {
      return new Promise((resolve) => {
        item.file((file) => {
          resolve([{
            file,
            name: file.name,
            relativePath: path + file.name,
            size: file.size,
            formattedSize: formatFileSize(file.size)
          }]);
        });
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const entries = await new Promise((resolve) => {
        dirReader.readEntries((ents) => resolve(ents));
      });
      const subFiles = await Promise.all(
        entries.map((entry) => traverseFileTree(entry, path + item.name + '/'))
      );
      return subFiles.flat();
    }
    return [];
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (isUploading) return;

    try {
      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        const filePromises = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
          if (entry) {
            filePromises.push(traverseFileTree(entry));
          } else if (items[i].kind === 'file') {
            const f = items[i].getAsFile();
            if (f) {
              filePromises.push(Promise.resolve([{
                file: f,
                name: f.name,
                relativePath: f.name,
                size: f.size,
                formattedSize: formatFileSize(f.size)
              }]));
            }
          }
        }

        const nestedResults = await Promise.all(filePromises);
        const flattened = nestedResults.flat();
        if (flattened.length > 0) {
          setSelectedFiles(prev => [...prev, ...flattened]);
          if (errors.file) setErrors(prev => ({ ...prev, file: null }));
        }
      } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).map(file => ({
          file,
          name: file.name,
          relativePath: file.name,
          size: file.size,
          formattedSize: formatFileSize(file.size)
        }));
        setSelectedFiles(prev => [...prev, ...files]);
        if (errors.file) setErrors(prev => ({ ...prev, file: null }));
      }
    } catch (err) {
      console.warn('[EvidenceTab] Directory drop parse warning:', err);
    }
  };

  // Standard multi-file input handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        relativePath: file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size)
      }));
      setSelectedFiles(prev => [...prev, ...files]);
      if (errors.file) setErrors(prev => ({ ...prev, file: null }));
    }
    e.target.value = '';
  };

  // Directory / Folder input handler (webkitdirectory)
  const handleFolderChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        relativePath: file.webkitRelativePath || file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size)
      }));
      setSelectedFiles(prev => [...prev, ...files]);
      if (errors.file) setErrors(prev => ({ ...prev, file: null }));
    }
    e.target.value = '';
  };

  const handleRemoveQueuedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleClearQueue = () => {
    setSelectedFiles([]);
  };

  // Copy Hash action with browser API fallback
  const handleCopyHash = (hash) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hash).then(() => {
        setCopiedHash(hash);
        setTimeout(() => setCopiedHash(null), 1500);
      });
    }
  };

  // Row expand toggle
  const toggleRowDetails = (itemId, item) => {
    setExpandedRow((prev) => (prev === itemId ? null : itemId));
    setEditingItemId(null);
    if (item) {
      setEditNotes(item.notes || '');
      setEditStatus(item.status || 'Active');
      setEditTags(item.tags ? item.tags.join(', ') : '');
    }
  };

  // Submission handler with XHR progress and batch summary
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return;

    const tempErrors = {};
    if (selectedFiles.length === 0) tempErrors.file = 'Please queue at least one file or folder for upload';
    if (!evidenceType) tempErrors.evidenceType = 'Please specify evidence classification type';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing forensic batch payload...');

    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      const formData = new FormData();
      formData.append('caseId', caseId);
      formData.append('batchId', batchId);
      formData.append('fileType', evidenceType);
      formData.append('notes', description);

      if (tagsText) {
        const tagsArr = tagsText.split(',').map(t => t.trim()).filter(Boolean);
        formData.append('tags', JSON.stringify(tagsArr));
      }

      // Preserve relative paths for folder uploads
      const relativePaths = selectedFiles.map(sf => sf.relativePath);
      formData.append('relativePaths', JSON.stringify(relativePaths));

      // Append all queued files
      selectedFiles.forEach(sf => {
        formData.append('files', sf.file);
      });

      const response = await evidenceService.uploadEvidence(formData, (percent) => {
        setUploadProgress(percent);
        if (percent < 100) {
          setUploadStatus(`Transferring payload: ${percent}%`);
        } else {
          setUploadStatus('Computing cryptographic hashes & running forensic parsers...');
        }
      });

      setLastBatchSummary({
        batchId: response.batchId || batchId,
        summary: response.summary || { total: selectedFiles.length, success: selectedFiles.length, failed: 0 },
        failedFiles: response.failedFiles || []
      });

      triggerToast(`${selectedFiles.length} file(s) ingested & parsed successfully.`);
      setSelectedFiles([]);
      setDescription('');
      setTagsText('');
      await fetchEvidence();

      const uploadedList = response.data || [];
      const primaryItem = uploadedList[0];

      if (primaryItem) {
        if (primaryItem.parsing?.status === 'Unsupported') {
          setPipelineResult({
            fileName: primaryItem.originalName,
            fileType: primaryItem.fileType,
            fileSize: primaryItem.fileSize,
            sha256: primaryItem.sha256Hash,
            parsingStatus: 'unsupported',
            artifactsCount: 0,
            iocCount: 0,
            timelineCount: 0,
            mitreCount: 0,
            aiStatus: 'skipped',
            aiModel: 'mistral:latest',
            summary: 'File uploaded successfully, but content parsing for this format is not currently supported.'
          });
        } else {
          // Trigger the real end-to-end pipeline: IOC Detection -> Timeline -> MITRE -> Ollama Mistral LangGraph
          executeEndToEndPipeline(primaryItem, caseId);
        }
      }
    } catch (err) {
      console.error('[EvidenceTab] Ingestion failure:', err);
      triggerToast(`Ingestion error: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const executeEndToEndPipeline = async (item, cId) => {
    if (!item) return;
    setIsPipelineRunning(true);
    setPipelineStep('Initiating deterministic forensic analysis pipeline...');
    try {
      const artCount = item.parsing?.artifacts 
        ? ((item.parsing.artifacts.ips?.length || 0) + 
           (item.parsing.artifacts.domains?.length || 0) + 
           (item.parsing.artifacts.urls?.length || 0) + 
           (item.parsing.artifacts.emails?.length || 0) + 
           (item.parsing.artifacts.users?.length || 0) + 
           (item.parsing.artifacts.hosts?.length || 0) + 
           (item.parsing.artifacts.processes?.length || 0) + 
           (item.parsing.artifacts.eventIds?.length || 0))
        : 0;

      let pStatus = 'success';
      if (item.parsing?.status === 'Partially Parsed') pStatus = 'partial';
      else if (item.parsing?.status === 'Unsupported') pStatus = 'unsupported';
      else if (item.parsing?.status === 'Failed') pStatus = 'failed';

      setPipelineStep('Running IOC detection on parsed indicators...');
      const iocRes = await iocService.detectIOCs(cId).catch(err => {
        console.warn('IOC detection failed:', err);
        return { totalDetected: 0 };
      });

      setPipelineStep('Synthesizing chronological forensic timeline...');
      const tlRes = await timelineService.generateTimeline(cId).catch(err => {
        console.warn('Timeline generation failed:', err);
        return { totalEvents: 0 };
      });

      setPipelineStep('Correlating indicators to MITRE ATT&CK techniques...');
      const mitreRes = await mitreService.generateMappings(cId).catch(err => {
        console.warn('MITRE mapping failed:', err);
        return { totalMappings: 0 };
      });

      setPipelineStep('Executing Ollama (mistral:latest) LangGraph investigation workflow...');
      let aiStatus = 'completed';
      let summaryText = '';
      let runId = '';

      try {
        const aiRes = await aiService.startInvestigation(cId);
        runId = aiRes.runId || '';
        aiStatus = aiRes.status === 'completed' ? 'completed' : 'failed';
        summaryText = aiRes.executiveSummary || aiRes.candidateNarrative || 'Investigation completed successfully.';
      } catch (aiErr) {
        console.warn('AI Investigation error:', aiErr);
        aiStatus = 'failed';
        summaryText = `Ollama AI investigation unavailable: ${aiErr.message || 'Cannot connect to Ollama service'}`;
      }

      setPipelineResult({
        fileName: item.originalName,
        fileType: item.fileType,
        fileSize: item.fileSize,
        sha256: item.sha256Hash,
        parsingStatus: pStatus,
        artifactsCount: artCount,
        iocCount: iocRes?.totalDetected ?? iocRes?.newIndicators ?? 0,
        timelineCount: tlRes?.totalEvents ?? tlRes?.inserted ?? 0,
        mitreCount: mitreRes?.totalMappings ?? mitreRes?.newMappings ?? 0,
        aiStatus,
        aiModel: 'mistral:latest',
        runId,
        summary: summaryText
      });
      fetchEvidence();
    } catch (err) {
      console.error('End-to-end pipeline execution error:', err);
    } finally {
      setIsPipelineRunning(false);
      setPipelineStep('');
    }
  };

  const handleDownload = async (item) => {
    try {
      const id = item.evidenceId || item._id;
      triggerToast(`Downloading ${item.originalName}...`);
      await evidenceService.downloadEvidence(id, item.originalName);
    } catch (err) {
      console.error('[EvidenceTab] Download failure:', err);
      triggerToast(`Download failed: ${err.message}`);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to permanently delete evidence ${item.evidenceId}?`)) {
      return;
    }
    try {
      const id = item.evidenceId || item._id;
      await evidenceService.deleteEvidence(id);
      triggerToast(`Evidence ${item.evidenceId} deleted successfully.`);
      fetchEvidence();
    } catch (err) {
      console.error('[EvidenceTab] Delete failure:', err);
      triggerToast(`Delete failed: ${err.message}`);
    }
  };

  const handleUpdateMetadataSubmit = async (e, item) => {
    e.preventDefault();
    setIsUpdatingMeta(true);
    try {
      const id = item.evidenceId || item._id;
      await evidenceService.updateEvidence(id, {
        notes: editNotes,
        status: editStatus,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        chainAction: 'Metadata Updated'
      });
      triggerToast(`Metadata updated for ${item.evidenceId}`);
      setEditingItemId(null);
      fetchEvidence();
    } catch (err) {
      console.error('[EvidenceTab] Metadata update failure:', err);
      triggerToast(`Update failed: ${err.message}`);
    } finally {
      setIsUpdatingMeta(false);
    }
  };

  // Filtered evidence items
  const filteredEvidence = evidenceItems.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.originalName || '').toLowerCase().includes(q);
      const matchPath = (item.relativePath || '').toLowerCase().includes(q);
      const matchBatch = (item.batchId || '').toLowerCase().includes(q);
      const matchSha256 = (item.sha256Hash || '').toLowerCase().includes(q);
      const matchMd5 = (item.md5Hash || '').toLowerCase().includes(q);
      if (!matchName && !matchPath && !matchBatch && !matchSha256 && !matchMd5) return false;
    }
    if (statusFilter && item.status !== statusFilter) return false;
    if (parserFilter && (!item.parsing || item.parsing.status !== parserFilter)) return false;
    return true;
  });

  const queuedTotalSize = selectedFiles.reduce((acc, sf) => acc + (sf.size || 0), 0);

  return (
    <div className="trace-evidence-tab text-left">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#47faf3] text-[#47faf3] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          {toastMsg}
        </div>
      )}

      {/* Overview segment */}
      <div className="trace-evidence-header" role="region" aria-label="Evidence Overview Summary">
        <div className="trace-evidence-title-group text-left">
          <div className="flex items-center gap-2">
            <h3 className="trace-evidence-title">Evidence Intake &amp; Forensic Parsing</h3>
            <span className="px-2 py-0.5 text-[11px] bg-primary/10 text-primary border border-primary/20 rounded font-mono font-bold">
              Folder &amp; Multi-file
            </span>
          </div>
          <p className="trace-evidence-subtitle">
            Single-file, multi-file, or recursive folder ingestion with automatic SHA-256 integrity and forensic parsing for case #{caseId}.
          </p>
        </div>
        <div className="trace-evidence-summary-row">
          <span className="trace-evidence-summary-pill">
            Total Files: <strong>{totalEvidence}</strong>
          </span>
          <span className="trace-evidence-summary-pill">
            Parsed: <strong>{parsedCount}</strong>
          </span>
          <span className="trace-evidence-summary-pill">
            Integrity Checked: <strong>{integrityCount}</strong>
          </span>
        </div>
      </div>

      {/* Pipeline Progress Indicator */}
      {isPipelineRunning && (
        <div className="p-4 rounded-xl bg-[#0B1220] border border-[#00E5FF]/40 shadow-xl flex items-center gap-4 animate-pulse">
          <div className="trace-evidence-spinner border-primary w-6 h-6 border-2 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider font-mono">
                End-to-End Forensic Pipeline Active
              </span>
              <span className="text-[11px] text-white/60 font-mono">Ollama + Mistral</span>
            </div>
            <p className="text-xs text-white/90 mt-0.5">{pipelineStep}</p>
          </div>
        </div>
      )}

      {/* SECTION 9: FINAL RESULT CARD */}
      {pipelineResult && !isPipelineRunning && (
        <div className="p-6 rounded-2xl bg-[#0B1220]/95 border border-[#00E5FF]/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center text-[#10b981]">
                <FiCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Evidence uploaded successfully
                </h3>
                <p className="text-xs text-white/60">
                  Real evidence file ingested, verified with SHA-256 cryptographic digest, and processed through the DFIR pipeline.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPipelineResult(null)}
              className="text-xs text-white/40 hover:text-white px-2 py-1 rounded border border-white/10 hover:bg-white/5 cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          {pipelineResult.parsingStatus === 'unsupported' && (
            <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold flex items-center gap-2">
              <FiAlertTriangle className="flex-shrink-0" />
              <span>File uploaded successfully, but content parsing for this format is not currently supported.</span>
            </div>
          )}

          {/* Metric Grid Matching Specification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* File & SHA-256 */}
            <div className="p-3.5 rounded-xl bg-[#070C16] border border-white/5 space-y-1">
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">File</span>
              <p className="text-xs font-bold text-white truncate" title={pipelineResult.fileName}>
                {pipelineResult.fileName}
              </p>
              <span className="text-[10px] text-white/40 block">Size: {formatFileSize(pipelineResult.fileSize)}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070C16] border border-white/5 space-y-1">
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">SHA-256</span>
              <p className="text-[11px] font-mono text-[#00E5FF] truncate" title={pipelineResult.sha256}>
                {pipelineResult.sha256 || 'N/A'}
              </p>
              <button
                type="button"
                onClick={() => handleCopyHash(pipelineResult.sha256)}
                className="text-[10px] text-[#00E5FF]/70 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FiCopy className="w-3 h-3" />
                <span>Copy Hash</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070C16] border border-white/5 space-y-1">
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">Parsing</span>
              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold font-mono uppercase tracking-wider ${
                pipelineResult.parsingStatus === 'success'
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                  : pipelineResult.parsingStatus === 'partial'
                  ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                  : pipelineResult.parsingStatus === 'unsupported'
                  ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30'
                  : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
              }`}>
                {pipelineResult.parsingStatus}
              </span>
              <span className="text-[10px] text-white/40 block">Deterministic parser</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070C16] border border-white/5 space-y-1">
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">Extracted artifacts</span>
              <p className="text-base font-bold text-[#00E5FF] font-mono">
                {pipelineResult.artifactsCount}
              </p>
              <span className="text-[10px] text-white/40 block">IPs, hosts, users, hashes</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070C16] border border-white/5 space-y-1">
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">IOCs</span>
              <p className="text-base font-bold text-[#f59e0b] font-mono">
                {pipelineResult.iocCount}
              </p>
              <span className="text-[10px] text-white/40 block">Validated indicators</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070C16] border border-white/5 space-y-1">
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">Timeline events</span>
              <p className="text-base font-bold text-[#38bdf8] font-mono">
                {pipelineResult.timelineCount}
              </p>
              <span className="text-[10px] text-white/40 block">Normalized events</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070C16] border border-white/5 space-y-1">
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">MITRE mappings</span>
              <p className="text-base font-bold text-[#a855f7] font-mono">
                {pipelineResult.mitreCount}
              </p>
              <span className="text-[10px] text-white/40 block">Mapped techniques</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070C16] border border-white/5 space-y-1">
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">AI Investigation</span>
              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold font-mono uppercase tracking-wider ${
                pipelineResult.aiStatus === 'completed'
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                  : pipelineResult.aiStatus === 'skipped'
                  ? 'bg-white/10 text-white/60 border border-white/10'
                  : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
              }`}>
                {pipelineResult.aiStatus}
              </span>
              <span className="text-[10px] text-white/40 block">Model: {pipelineResult.aiModel}</span>
            </div>
          </div>

          {/* Investigation Summary */}
          <div className="p-4 rounded-xl bg-[#070C16] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#00E5FF] uppercase tracking-wider font-mono">
                Investigation Summary
              </span>
              {pipelineResult.runId && (
                <span className="text-[10px] font-mono text-white/50">Run ID: {pipelineResult.runId}</span>
              )}
            </div>
            <p className="text-xs text-[#cbd5e1] leading-relaxed whitespace-pre-line">
              {pipelineResult.summary}
            </p>
          </div>
        </div>
      )}

      {/* Batch summary notification alert */}
      {lastBatchSummary && (
        <div className="p-4 rounded-lg bg-surface-container-low border border-primary/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FiLayers className="text-primary text-xl flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-bold font-mono">Batch: {lastBatchSummary.batchId}</span>
                <span className="px-2 py-0.5 text-[10px] rounded bg-secondary/10 text-secondary border border-secondary/20 font-bold">
                  {lastBatchSummary.summary.success} / {lastBatchSummary.summary.total} Processed
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Deterministic forensic parsing completed. Artifacts extracted and stored in local MongoDB.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setLastBatchSummary(null)}
            className="text-xs text-on-surface-variant hover:text-white px-2 py-1 rounded border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main split workspace grid */}
      <div className="trace-evidence-workspace">
        
        {/* Left Side: Upload zone card */}
        <section className="trace-evidence-upload-card" aria-label="Forensic upload interface">
          <div className="trace-evidence-card-header">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
              <h4 className="trace-evidence-upload-title">Evidence Intake</h4>
            </div>
            <span className="trace-evidence-intake-badge">
              Forensic Ingestion
            </span>
          </div>
          
          <form onSubmit={handleUploadSubmit} className="trace-evidence-form" noValidate>
            
            {/* File Dropzone / Select Area */}
            <div className="trace-evidence-field">
              <div className="flex items-center justify-between">
                <span className="trace-evidence-label">Queue Artifacts &amp; Folders</span>
                {selectedFiles.length > 0 && (
                  <span className="text-[11px] font-mono text-[#00E5FF]">
                    {selectedFiles.length} item{selectedFiles.length > 1 ? 's' : ''} staged
                  </span>
                )}
              </div>
              
              {/* Drag and drop zone */}
              <div 
                className={`trace-evidence-dropzone ${isDragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                tabIndex={0}
                role="button"
                aria-label="Drag and drop files or folders here, or click to choose files"
                title="Drag & drop evidence files or folders, or click to choose"
              >
                <div className="trace-evidence-dropzone-icon-wrapper" aria-hidden="true">
                  <FiUpload className="trace-evidence-dropzone-icon" />
                </div>

                <div className="trace-evidence-dropzone-content">
                  <span className="trace-evidence-dropzone-heading">
                    Drag &amp; drop files or folders here
                  </span>
                  <span className="trace-evidence-dropzone-subheading">
                    or choose files from your computer
                  </span>

                  {/* Consolidated Action Buttons */}
                  <div className="trace-evidence-dropzone-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="trace-evidence-picker-btn"
                      title="Select individual or multiple forensic files"
                    >
                      <FiFile className="text-[#00E5FF] w-3.5 h-3.5" />
                      <span>Choose Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      disabled={isUploading}
                      className="trace-evidence-picker-btn folder"
                      title="Select an entire folder of evidence"
                    >
                      <FiFolderPlus className="text-[#38bdf8] w-3.5 h-3.5" />
                      <span>Choose Folder</span>
                    </button>
                  </div>

                  {/* Separate small muted supported formats line */}
                  <span className="trace-evidence-formats-line">
                    Supports TXT, LOG, SYSLOG, JSON, JSONL, CSV, PCAP, RAW, EVTX
                  </span>
                </div>

                {/* Completely Hidden Real File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="trace-evidence-hidden-input"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={isUploading}
                  aria-label="Upload files input"
                  tabIndex={-1}
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  webkitdirectory=""
                  directory=""
                  className="trace-evidence-hidden-input"
                  style={{ display: 'none' }}
                  onChange={handleFolderChange}
                  disabled={isUploading}
                  aria-label="Upload folder input"
                  tabIndex={-1}
                />
              </div>

              {/* Upload queue list */}
              {selectedFiles.length > 0 && (
                <div className="trace-evidence-queue-container">
                  <div className="trace-evidence-queue-header">
                    <div className="flex items-center gap-1.5">
                      <span className="trace-evidence-queue-pill">
                        {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} queued
                      </span>
                      <span className="text-[11px] font-mono text-[#94A3B8]">
                        ({formatFileSize(queuedTotalSize)})
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleClearQueue} 
                      className="trace-evidence-clear-btn"
                      disabled={isUploading}
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="trace-evidence-queue-list">
                    {selectedFiles.map((sf, idx) => (
                      <div key={idx} className="trace-evidence-selected-file">
                        <div className="trace-evidence-file-icon">
                          {sf.relativePath && sf.relativePath !== sf.name ? (
                            <FiFolder className="text-[#38bdf8] w-4 h-4 shrink-0" />
                          ) : (
                            <FiFile className="text-[#00E5FF] w-4 h-4 shrink-0" />
                          )}
                        </div>
                        <div className="trace-evidence-file-info">
                          <span className="trace-evidence-file-name" title={sf.relativePath}>
                            {sf.relativePath && sf.relativePath !== sf.name ? (
                              <span className="trace-evidence-file-dir">
                                {sf.relativePath.substring(0, sf.relativePath.lastIndexOf('/') + 1)}
                              </span>
                            ) : null}
                            <span className="trace-evidence-file-basename">{sf.name}</span>
                          </span>
                          <span className="trace-evidence-file-meta font-mono">
                            Size: {sf.formattedSize}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="trace-evidence-remove-file-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isUploading) handleRemoveQueuedFile(idx);
                          }}
                          disabled={isUploading}
                          title="Remove from queue"
                          aria-label={`Remove ${sf.name}`}
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.file && (
                <span className="trace-evidence-validation-error" role="alert">
                  {errors.file}
                </span>
              )}
            </div>

            {/* Evidence Classification Dropdown */}
            <div className="trace-evidence-field">
              <label htmlFor="trace-evidence-type-dropdown" className="trace-evidence-label">
                Evidence Classification *
              </label>
              <select
                id="trace-evidence-type-dropdown"
                className={`trace-evidence-select ${errors.evidenceType ? 'error' : ''}`}
                value={evidenceType}
                onChange={(e) => {
                  setEvidenceType(e.target.value);
                  if (errors.evidenceType) setErrors((prev) => ({ ...prev, evidenceType: null }));
                }}
                disabled={isUploading}
                required
              >
                <option value="Log File">Log File (Syslog / Web / Audit / Auth)</option>
                <option value="Structured Data">Structured Data (JSON / JSONL / CSV)</option>
                <option value="Disk Image">Disk Image (RAW / DD / E01 / VMDK)</option>
                <option value="Memory Dump">Memory Dump (.dmp / .raw / .vmem)</option>
                <option value="Windows Event Log">Windows Event Log (.evtx / .etl)</option>
                <option value="Network Capture">Network Capture (.pcap / .pcapng)</option>
                <option value="Document">Document / Report</option>
                <option value="Other">Other Binary Artifact</option>
              </select>
              {errors.evidenceType && (
                <span className="trace-evidence-validation-error" role="alert">
                  {errors.evidenceType}
                </span>
              )}
            </div>

            {/* Tags Input */}
            <div className="trace-evidence-field">
              <label htmlFor="trace-evidence-tags-field" className="trace-evidence-label">
                Tags (Comma separated)
              </label>
              <input
                id="trace-evidence-tags-field"
                type="text"
                className="trace-evidence-input"
                placeholder="e.g. dmz-gateway, nginx, lateral-movement"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                disabled={isUploading}
              />
            </div>

            {/* Description / Analyst Notes */}
            <div className="trace-evidence-field">
              <label htmlFor="trace-evidence-description-field" className="trace-evidence-label">
                Custody Notes / Origin Environment
              </label>
              <textarea
                id="trace-evidence-description-field"
                className="trace-evidence-textarea"
                placeholder="Details regarding folder capture, triage acquisition agent, or hash validation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
                maxLength={500}
              />
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              className="trace-evidence-submit-btn"
              disabled={isUploading || selectedFiles.length === 0}
            >
              {isUploading && <span className="trace-evidence-spinner" aria-hidden="true" />}
              <span>
                {isUploading 
                  ? 'Processing & Ingesting...' 
                  : `Ingest ${selectedFiles.length > 0 ? `${selectedFiles.length} Item(s)` : 'Evidence'}`}
              </span>
            </button>

            {/* Progress tracker container */}
            {isUploading && (
              <div 
                className="trace-evidence-progress-container text-left"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="trace-evidence-progress-status-row">
                  <span className="trace-evidence-progress-status text-xs">
                    {uploadStatus}
                  </span>
                  <span className="trace-evidence-progress-percent">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="trace-evidence-progress-track">
                  <div 
                    className={`trace-evidence-progress-fill ${uploadProgress === 100 ? 'verified' : ''}`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </form>
        </section>

        {/* Right Side: Evidence Catalog List & Inspector */}
        <section className="trace-evidence-list-card" aria-label="Evidence catalog list">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <h4 className="text-white text-base font-bold m-0">Case Evidence Catalog</h4>
            
            {/* Search & Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search files, paths, hashes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="trace-evidence-search-input"
                />
              </div>

              <select
                value={parserFilter}
                onChange={(e) => setParserFilter(e.target.value)}
                className="trace-evidence-filter-select"
              >
                <option value="">All Parsers</option>
                <option value="Parsed">Parsed</option>
                <option value="Partially Parsed">Partially Parsed</option>
                <option value="Unsupported">Unsupported</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-on-surface-variant text-sm flex flex-col items-center justify-center gap-3">
              <div className="trace-evidence-spinner border-primary w-6 h-6 border-2" />
              <span>Retrieving forensic evidence records...</span>
            </div>
          ) : filteredEvidence.length === 0 ? (
            <div className="trace-evidence-empty-state">
              <span className="trace-evidence-empty-icon">
                <FiDatabase />
              </span>
              <h5 className="trace-evidence-empty-title">No Evidence Artifacts Found</h5>
              <p className="trace-evidence-empty-desc">
                {searchQuery || parserFilter 
                  ? 'No evidence items match your active search or parser filter.'
                  : 'No forensic items have been ingested for this case yet. Use the upload panel on the left to queue files or folders.'}
              </p>
            </div>
          ) : (
            <div className="trace-evidence-table-container">
              <table className="trace-evidence-table">
                <thead>
                  <tr>
                    <th>Evidence ID / File</th>
                    <th>Folder Path</th>
                    <th>Format &amp; Parsing</th>
                    <th>Size</th>
                    <th>SHA-256 Hash</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvidence.map((item) => {
                    const isExpanded = expandedRow === item._id;
                    const parsing = item.parsing || {};
                    const parserStatus = parsing.status || 'Pending';
                    const hasArtifacts = parsing.artifacts && (
                      (parsing.artifacts.ips && parsing.artifacts.ips.length > 0) ||
                      (parsing.artifacts.domains && parsing.artifacts.domains.length > 0) ||
                      (parsing.artifacts.users && parsing.artifacts.users.length > 0)
                    );

                    return (
                      <React.Fragment key={item._id}>
                        <tr className={`trace-evidence-row ${isExpanded ? 'expanded' : ''}`}>
                          {/* Evidence ID & Name */}
                          <td>
                            <div className="flex flex-col">
                              <span className="font-mono text-xs text-primary font-bold">
                                {item.evidenceId}
                              </span>
                              <span className="trace-evidence-file-cell" title={item.originalName}>
                                {item.originalName}
                              </span>
                            </div>
                          </td>

                          {/* Relative Path */}
                          <td>
                            <span 
                              className="font-mono text-xs text-on-surface-variant max-w-[140px] truncate block" 
                              title={item.relativePath || item.originalName}
                            >
                              {item.relativePath && item.relativePath !== item.originalName ? (
                                <span className="text-secondary/80">
                                  {item.relativePath}
                                </span>
                              ) : (
                                <span className="text-on-surface-variant/60">Root</span>
                              )}
                            </span>
                          </td>

                          {/* Parser status */}
                          <td>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-mono text-white flex items-center gap-1">
                                {parsing.parserType || 'N/A'}
                                {parsing.recordCount !== undefined && parsing.recordCount > 0 && (
                                  <span className="text-[10px] text-on-surface-variant">
                                    ({parsing.recordCount} rec)
                                  </span>
                                )}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded w-fit ${
                                parserStatus === 'Parsed' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : parserStatus === 'Partially Parsed'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : parserStatus === 'Unsupported'
                                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {parserStatus}
                              </span>
                            </div>
                          </td>

                          {/* Size */}
                          <td className="font-mono text-xs">
                            {formatFileSize(item.fileSize)}
                          </td>

                          {/* Hash */}
                          <td>
                            <div className="trace-evidence-hash-cell">
                              <span title={item.sha256Hash}>
                                {item.sha256Hash ? `${item.sha256Hash.substring(0, 10)}...` : 'N/A'}
                              </span>
                              {item.sha256Hash && (
                                <button
                                  type="button"
                                  className="trace-evidence-copy-btn"
                                  onClick={() => handleCopyHash(item.sha256Hash)}
                                  title="Copy full SHA-256 hash"
                                >
                                  {copiedHash === item.sha256Hash ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            <StatusBadge status={item.status} />
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                className="trace-evidence-row-btn"
                                onClick={() => toggleRowDetails(item._id, item)}
                              >
                                {isExpanded ? 'Hide' : 'Details'}
                              </button>
                              {item.parsing?.status !== 'Unsupported' && (
                                <button
                                  type="button"
                                  className="trace-evidence-row-btn"
                                  style={{ color: '#00E5FF', borderColor: 'rgba(0,229,255,0.3)' }}
                                  onClick={() => executeEndToEndPipeline(item, caseId)}
                                  title="Run full IOC, Timeline, MITRE & AI Pipeline on this file"
                                >
                                  Pipeline
                                </button>
                              )}
                              <button
                                type="button"
                                className="p-1.5 text-on-surface-variant hover:text-primary rounded hover:bg-white/5 transition-colors"
                                onClick={() => handleDownload(item)}
                                title="Download evidence file"
                              >
                                <FiDownload className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                className="p-1.5 text-on-surface-variant hover:text-error rounded hover:bg-white/5 transition-colors"
                                onClick={() => handleDelete(item)}
                                title="Delete evidence"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr className="trace-evidence-details-row">
                            <td colSpan={7}>
                              <div className="trace-evidence-details-panel">
                                
                                {/* Section A: Metadata and Hashes */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-white/5">
                                  <div className="space-y-1.5">
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">Relative Path:</span>
                                      <span className="trace-evidence-details-value font-mono text-secondary">
                                        {item.relativePath || item.originalName}
                                      </span>
                                    </div>
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">Batch ID:</span>
                                      <span className="trace-evidence-details-value font-mono text-primary">
                                        {item.batchId || 'N/A'}
                                      </span>
                                    </div>
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">Uploaded By:</span>
                                      <span className="trace-evidence-details-value">
                                        {item.uploadedBy?.fullName || 'Analyst'} ({new Date(item.uploadedAt).toLocaleString()})
                                      </span>
                                    </div>
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">MIME Type:</span>
                                      <span className="trace-evidence-details-value font-mono">
                                        {item.mimeType}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">SHA-256:</span>
                                      <span className="trace-evidence-details-value monospace">
                                        {item.sha256Hash}
                                      </span>
                                    </div>
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">SHA-1:</span>
                                      <span className="trace-evidence-details-value monospace">
                                        {item.sha1Hash}
                                      </span>
                                    </div>
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">MD5:</span>
                                      <span className="trace-evidence-details-value monospace">
                                        {item.md5Hash}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Section B: Forensic Artifacts & IOC Extraction */}
                                <div className="py-2 border-b border-white/5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FiTerminal className="text-secondary text-sm" />
                                    <span className="text-white text-xs font-bold uppercase tracking-wider">
                                      Forensic Parser Extraction ({parsing.parserType || 'N/A'} — Status: {parserStatus})
                                    </span>
                                    {parsing.recordCount !== undefined && (
                                      <span className="text-xs text-on-surface-variant font-mono">
                                        • {parsing.recordCount} total records parsed
                                      </span>
                                    )}
                                  </div>

                                  {/* Warnings or Errors */}
                                  {parsing.warnings && parsing.warnings.length > 0 && (
                                    <div className="mb-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                                      <FiAlertTriangle className="flex-shrink-0" />
                                      <span>{parsing.warnings.join(' | ')}</span>
                                    </div>
                                  )}
                                  {parsing.errors && parsing.errors.length > 0 && (
                                    <div className="mb-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                                      <FiAlertTriangle className="flex-shrink-0" />
                                      <span>{parsing.errors.join(' | ')}</span>
                                    </div>
                                  )}

                                  {/* Artifacts grid */}
                                  {parsing.artifacts ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                                      {/* IPs */}
                                      <div className="p-2.5 rounded bg-surface border border-white/5">
                                        <div className="text-on-surface-variant font-bold text-[11px] mb-1">
                                          IPv4 Addresses ({parsing.artifacts.ips?.length || 0})
                                        </div>
                                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                          {parsing.artifacts.ips && parsing.artifacts.ips.length > 0 ? (
                                            parsing.artifacts.ips.map((ip, i) => (
                                              <span key={i} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] border border-blue-500/20">
                                                {ip}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-on-surface-variant/40 italic">None found</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Domains & URLs */}
                                      <div className="p-2.5 rounded bg-surface border border-white/5">
                                        <div className="text-on-surface-variant font-bold text-[11px] mb-1">
                                          Domains &amp; URLs ({(parsing.artifacts.domains?.length || 0) + (parsing.artifacts.urls?.length || 0)})
                                        </div>
                                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                          {parsing.artifacts.domains && parsing.artifacts.domains.length > 0 ? (
                                            parsing.artifacts.domains.map((dom, i) => (
                                              <span key={i} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-[10px] border border-cyan-500/20">
                                                {dom}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-on-surface-variant/40 italic">None found</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Users & Accounts */}
                                      <div className="p-2.5 rounded bg-surface border border-white/5">
                                        <div className="text-on-surface-variant font-bold text-[11px] mb-1">
                                          Users &amp; Hosts ({(parsing.artifacts.users?.length || 0) + (parsing.artifacts.hosts?.length || 0)})
                                        </div>
                                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                          {parsing.artifacts.users && parsing.artifacts.users.length > 0 ? (
                                            parsing.artifacts.users.map((u, i) => (
                                              <span key={i} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono text-[10px] border border-purple-500/20">
                                                {u}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-on-surface-variant/40 italic">None found</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Processes & Event IDs */}
                                      <div className="p-2.5 rounded bg-surface border border-white/5">
                                        <div className="text-on-surface-variant font-bold text-[11px] mb-1">
                                          Processes &amp; IDs ({(parsing.artifacts.processes?.length || 0) + (parsing.artifacts.eventIds?.length || 0)})
                                        </div>
                                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                          {parsing.artifacts.processes && parsing.artifacts.processes.length > 0 ? (
                                            parsing.artifacts.processes.map((p, i) => (
                                              <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                                                {p}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-on-surface-variant/40 italic">None found</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-on-surface-variant/60">No parsing telemetry available for this file.</span>
                                  )}

                                  {/* Sample Extracted Records */}
                                  {parsing.records && parsing.records.length > 0 && (
                                    <div className="mt-2.5">
                                      <span className="text-[11px] text-on-surface-variant font-mono block mb-1">
                                        Sample Parsed Records ({parsing.records.length} shown):
                                      </span>
                                      <div className="max-h-36 overflow-y-auto p-2 bg-surface-container-lowest rounded border border-white/5 font-mono text-[11px] text-on-surface-variant space-y-1">
                                        {parsing.records.slice(0, 10).map((rec, rIdx) => (
                                          <div key={rIdx} className="flex items-start gap-2 hover:bg-white/5 p-0.5 rounded">
                                            <span className="text-primary/70 shrink-0">L{rec.lineNumber}:</span>
                                            {rec.timestamp && (
                                              <span className="text-secondary shrink-0">[{rec.timestamp}]</span>
                                            )}
                                            <span className="text-white/80 break-all">{rec.raw}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Section C: Chain of Custody Timeline */}
                                <div className="pt-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <FiShield className="text-primary text-sm" />
                                      <span className="text-white text-xs font-bold uppercase tracking-wider">
                                        Chain of Custody Log ({item.chainOfCustody?.length || 0} events)
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      className="text-xs text-primary hover:underline flex items-center gap-1"
                                      onClick={() => setEditingItemId(editingItemId === item._id ? null : item._id)}
                                    >
                                      <FiEdit2 className="text-xs" />
                                      <span>{editingItemId === item._id ? 'Cancel Edit' : 'Edit Metadata'}</span>
                                    </button>
                                  </div>

                                  <div className="trace-evidence-timeline">
                                    {item.chainOfCustody && item.chainOfCustody.map((coc, cIdx) => (
                                      <div key={cIdx} className="trace-evidence-timeline-node">
                                        <div className="trace-evidence-timeline-bullet" />
                                        <div className="trace-evidence-timeline-header">
                                          <strong>{coc.action}</strong>
                                          <span> by {coc.performedBy}</span>
                                          <em>({new Date(coc.timestamp).toLocaleString()})</em>
                                        </div>
                                        {coc.notes && (
                                          <p className="trace-evidence-timeline-notes">{coc.notes}</p>
                                        )}
                                        <span className="trace-evidence-timeline-ip">Source Node: {coc.ipAddress}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Inline Metadata Editing Form */}
                                  {editingItemId === item._id && (
                                    <form onSubmit={(e) => handleUpdateMetadataSubmit(e, item)} className="trace-evidence-edit-box">
                                      <span className="text-xs font-bold text-white">Update Telemetry &amp; Log Custody Event</span>
                                      <div className="trace-evidence-edit-row">
                                        <div className="trace-evidence-edit-col">
                                          <label className="text-[11px] text-on-surface-variant font-bold">Status</label>
                                          <select
                                            className="trace-evidence-select text-xs h-8"
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                          >
                                            <option value="Active">Active</option>
                                            <option value="Archived">Archived</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Deleted">Deleted</option>
                                          </select>
                                        </div>
                                        <div className="trace-evidence-edit-col" style={{ flex: 2 }}>
                                          <label className="text-[11px] text-on-surface-variant font-bold">Tags</label>
                                          <input
                                            type="text"
                                            className="trace-evidence-input text-xs h-8"
                                            value={editTags}
                                            onChange={(e) => setEditTags(e.target.value)}
                                            placeholder="comma separated tags"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <label className="text-[11px] text-on-surface-variant font-bold">Analyst Notes</label>
                                        <textarea
                                          className="trace-evidence-textarea text-xs h-14"
                                          value={editNotes}
                                          onChange={(e) => setEditNotes(e.target.value)}
                                          placeholder="Enter update rationale for chain of custody..."
                                        />
                                      </div>
                                      <div className="trace-evidence-edit-buttons">
                                        <button
                                          type="button"
                                          className="trace-evidence-inline-btn cancel"
                                          onClick={() => setEditingItemId(null)}
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="submit"
                                          className="trace-evidence-inline-btn save"
                                          disabled={isUpdatingMeta}
                                        >
                                          {isUpdatingMeta ? 'Updating...' : 'Save & Append Custody'}
                                        </button>
                                      </div>
                                    </form>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
