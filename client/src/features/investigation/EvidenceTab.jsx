import React, { useState, useEffect } from 'react';
import { 
  FiUpload, 
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
  FiAlertTriangle
} from 'react-icons/fi';
import StatusBadge from '../../components/common/StatusBadge';
import { evidenceService } from '../../services/evidence.service';

export default function EvidenceTab({ caseId = 'DF-1001' }) {
  // Local state managers
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]); // Array to support multiple files
  const [evidenceType, setEvidenceType] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');

  // Loading, progress, and error managers
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

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

  // Dynamic metrics
  const totalEvidence = evidenceItems.length;
  const activeCount = evidenceItems.filter((i) => i.status.toLowerCase() === 'active').length;
  const integrityCount = evidenceItems.filter((i) => i.md5Hash && i.sha256Hash).length;

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
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

  // Drag and drop event handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).map(file => ({
        name: file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        rawType: file.type,
        file: file
      }));
      setSelectedFiles(prev => [...prev, ...files]);
      if (errors.file) setErrors((prev) => ({ ...prev, file: null }));
    }
  };

  // Manual browser input handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        rawType: file.type,
        file: file
      }));
      setSelectedFiles(prev => [...prev, ...files]);
      if (errors.file) setErrors((prev) => ({ ...prev, file: null }));
    }
  };

  const handleRemoveQueuedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
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
    setEditingItemId(null); // Cancel editing on toggle
    if (item) {
      setEditNotes(item.notes || '');
      setEditStatus(item.status || 'Active');
      setEditTags(item.tags ? item.tags.join(', ') : '');
    }
  };

  // Submission handler with XHR progress callback
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return;

    const tempErrors = {};
    if (selectedFiles.length === 0) tempErrors.file = 'Please queue at least one file for upload';
    if (!evidenceType) tempErrors.evidenceType = 'Please specify evidence classification type';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Compressing and initializing upload stream...');

    try {
      const formData = new FormData();
      formData.append('caseId', caseId);
      formData.append('fileType', evidenceType);
      formData.append('notes', description);
      
      if (tagsText) {
        const tagsArr = tagsText.split(',').map(t => t.trim()).filter(Boolean);
        formData.append('tags', JSON.stringify(tagsArr));
      }

      // Append all queued files
      selectedFiles.forEach(sf => {
        formData.append('files', sf.file);
      });

      await evidenceService.uploadEvidence(formData, (percent) => {
        setUploadProgress(percent);
        if (percent < 100) {
          setUploadStatus(`Uploading: ${percent}%`);
        } else {
          setUploadStatus('Synthesizing cryptographic SHA-256/SHA-1/MD5 checksum digests...');
        }
      });

      triggerToast(`${selectedFiles.length} evidence payload(s) ingested successfully!`);
      setSelectedFiles([]);
      setEvidenceType('');
      setDescription('');
      setTagsText('');
      fetchEvidence();
    } catch (err) {
      console.error('[EvidenceTab] Ingestion failure:', err);
      triggerToast(`Ingestion error: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
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
      const updated = await evidenceService.updateEvidence(id, {
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

  return (
    <div className="trace-evidence-tab text-left">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#47faf3] text-[#47faf3] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          {toastMsg}
        </div>
      )}

      {/* Component styles module */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-evidence-tab {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
            box-sizing: border-box;
          }

          /* Header & Stats segment */
          .trace-evidence-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            padding-bottom: 16px;
            box-sizing: border-box;
          }

          .trace-evidence-title-group {
            display: flex;
            flex-direction: column;
          }

          .trace-evidence-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            line-height: 1.2;
          }

          .trace-evidence-subtitle {
            font-size: 0.8125rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 4px 0 0 0;
            line-height: 1.4;
          }

          .trace-evidence-summary-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            user-select: none;
          }

          .trace-evidence-summary-pill {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 6px 12px;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-secondary, #cbd5e1);
            box-sizing: border-box;
          }

          .trace-evidence-summary-pill strong {
            color: var(--text-primary, #f8fafc);
            margin-left: 4px;
          }

          /* Grid layout workspace */
          .trace-evidence-workspace {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 20px;
            box-sizing: border-box;
          }

          /* Left column upload card */
          .trace-evidence-upload-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 20px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-sizing: border-box;
            height: fit-content;
          }

          .trace-evidence-upload-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            padding-bottom: 10px;
          }

          /* Dropzone block */
          .trace-evidence-dropzone {
            border: 1.5px dashed var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 24px 16px;
            text-align: center;
            cursor: pointer;
            background-color: var(--bg-secondary, #0a0f1d);
            transition: all var(--transition-speed, 200ms) ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            outline: none;
            box-sizing: border-box;
            user-select: none;
          }

          .trace-evidence-dropzone.active {
            border-color: var(--color-primary, #3b82f6);
            background-color: rgba(59, 130, 246, 0.03);
          }

          .trace-evidence-dropzone:hover {
            border-color: var(--color-primary, #3b82f6);
            background-color: rgba(59, 130, 246, 0.02);
          }

          .trace-evidence-dropzone-icon {
            font-size: 1.8rem;
            color: var(--text-muted, #64748b);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-evidence-dropzone-text {
            font-size: 0.8125rem;
            color: var(--text-secondary, #cbd5e1);
            font-weight: 600;
          }

          .trace-evidence-dropzone-subtext {
            font-size: 0.7rem;
            color: var(--text-muted, #64748b);
          }

          /* File selected indicator list */
          .trace-evidence-queue-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 150px;
            overflow-y: auto;
          }

          .trace-evidence-selected-file {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid rgba(59, 130, 246, 0.15);
            border-radius: var(--radius-sm, 4px);
            padding: 8px 12px;
            gap: 8px;
            box-sizing: border-box;
          }

          .trace-evidence-file-info {
            display: flex;
            flex-direction: column;
            min-width: 0;
            gap: 2px;
            text-align: left;
          }

          .trace-evidence-file-name {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .trace-evidence-file-meta {
            font-size: 0.7rem;
            color: var(--text-muted, #64748b);
          }

          .trace-evidence-remove-file-btn {
            background: transparent;
            border: none;
            color: var(--status-critical, #ef4444);
            font-weight: 600;
            font-size: 0.8125rem;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: var(--radius-xs, 2px);
            outline: none;
          }

          .trace-evidence-remove-file-btn:hover {
            background-color: rgba(239, 68, 68, 0.08);
          }

          /* Fields and controls styling */
          .trace-evidence-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            box-sizing: border-box;
            text-align: left;
          }

          .trace-evidence-label {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-evidence-select {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            padding: 8px 24px 8px 12px;
            height: 38px;
            outline: none;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
            background-repeat: no-repeat;
            background-position: right 10px center;
            background-size: 14px;
            box-sizing: border-box;
          }

          .trace-evidence-select:focus {
            border-color: var(--color-primary, #3b82f6);
          }

          .trace-evidence-select.error {
            border-color: var(--status-critical, #ef4444);
          }

          .trace-evidence-textarea {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 10px 12px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            height: 60px;
            box-sizing: border-box;
            resize: vertical;
            line-height: 1.4;
          }

          .trace-evidence-input {
            width: 100%;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 8px 12px;
            color: var(--text-primary, #f8fafc);
            font-size: 0.875rem;
            outline: none;
            height: 38px;
            box-sizing: border-box;
          }

          .trace-evidence-input:focus, .trace-evidence-textarea:focus {
            border-color: var(--color-primary, #3b82f6);
          }

          .trace-evidence-validation-error {
            font-size: 0.75rem;
            color: var(--status-critical, #ef4444);
            font-weight: 500;
            margin-top: 2px;
          }

          .trace-evidence-submit-btn {
            background-color: var(--color-primary, #3b82f6);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-sm, 4px);
            padding: 10px 16px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            outline: none;
            box-sizing: border-box;
            margin-top: 4px;
            user-select: none;
          }

          .trace-evidence-submit-btn:hover:not(:disabled) {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-evidence-submit-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }

          /* Interactive progress simulation bar */
          .trace-evidence-progress-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: 4px;
            background-color: var(--bg-secondary, #0a0f1d);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            padding: 12px;
            box-sizing: border-box;
          }

          .trace-evidence-progress-status-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.75rem;
            font-weight: 600;
          }

          .trace-evidence-progress-status {
            color: var(--color-secondary, #06b6d4);
          }

          .trace-evidence-progress-percent {
            color: var(--text-primary, #f8fafc);
            font-family: monospace;
          }

          .trace-evidence-progress-track {
            width: 100%;
            height: 4px;
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 999px;
            overflow: hidden;
          }

          .trace-evidence-progress-fill {
            height: 100%;
            background-color: var(--color-primary, #3b82f6);
            transition: width 100ms ease;
          }

          .trace-evidence-progress-fill.verified {
            background-color: #10b981;
          }

          /* Right column evidence list */
          .trace-evidence-list-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 20px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-width: 0;
            box-sizing: border-box;
          }

          .trace-evidence-table-container {
            width: 100%;
            overflow-x: auto;
          }

          .trace-evidence-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            min-width: 780px;
          }

          .trace-evidence-table th {
            padding: 10px 12px;
            font-size: 0.725rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted, #64748b);
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-evidence-table td {
            padding: 12px;
            font-size: 0.875rem;
            color: var(--text-secondary, #cbd5e1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.02);
            vertical-align: middle;
          }

          .trace-evidence-row {
            transition: background-color var(--transition-speed, 200ms) ease;
          }

          .trace-evidence-row:hover {
            background-color: rgba(255, 255, 255, 0.015);
          }

          .trace-evidence-row.expanded {
            background-color: rgba(255, 255, 255, 0.02);
          }

          .trace-evidence-file-cell {
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            max-width: 180px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .trace-evidence-hash-cell {
            font-family: 'SFMono-Regular', Consolas, monospace;
            font-size: 0.75rem;
            color: var(--color-secondary, #06b6d4);
            max-width: 120px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            vertical-align: middle;
          }

          .trace-evidence-copy-btn {
            background: transparent;
            border: none;
            color: var(--text-muted, #64748b);
            cursor: pointer;
            padding: 3px 5px;
            border-radius: var(--radius-xs, 2px);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            outline: none;
            font-size: 0.8rem;
          }

          .trace-evidence-copy-btn:hover {
            color: var(--color-primary, #3b82f6);
            background-color: var(--bg-surface-elevated, #162035);
          }

          .trace-evidence-row-btn {
            background: transparent;
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            color: var(--color-primary, #3b82f6);
            padding: 5px 10px;
            font-size: 0.725rem;
            font-weight: 600;
            cursor: pointer;
            height: 28px;
            box-sizing: border-box;
          }

          .trace-evidence-row-btn:hover {
            border-color: var(--color-primary, #3b82f6);
            background-color: rgba(59, 130, 246, 0.1);
            color: var(--text-primary, #f8fafc);
          }

          /* Expanded details panel in table */
          .trace-evidence-details-row td {
            padding: 16px 20px;
            background-color: rgba(0, 0, 0, 0.2);
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-evidence-details-panel {
            display: flex;
            flex-direction: column;
            gap: 12px;
            font-size: 0.8125rem;
          }

          .trace-evidence-details-item {
            display: flex;
            gap: 8px;
            line-height: 1.4;
          }

          .trace-evidence-details-label {
            font-weight: 600;
            color: var(--text-muted, #64748b);
            width: 110px;
            flex-shrink: 0;
          }

          .trace-evidence-details-value {
            color: var(--text-secondary, #cbd5e1);
            word-break: break-all;
          }

          .trace-evidence-details-value.monospace {
            font-family: monospace;
            color: var(--color-secondary, #06b6d4);
          }

          /* Timeline styling */
          .trace-evidence-timeline {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 6px;
            border-left: 1.5px solid rgba(255, 255, 255, 0.08);
            padding-left: 16px;
            margin-left: 6px;
          }

          .trace-evidence-timeline-node {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 2px;
            text-align: left;
          }

          .trace-evidence-timeline-bullet {
            position: absolute;
            left: -22px;
            top: 4px;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background-color: var(--color-secondary, #06b6d4);
            border: 2px solid #0a0f1d;
          }

          .trace-evidence-timeline-header {
            font-size: 0.775rem;
            color: var(--text-primary, #f8fafc);
          }

          .trace-evidence-timeline-header strong {
            color: var(--color-primary, #3b82f6);
          }

          .trace-evidence-timeline-header span {
            color: var(--text-secondary, #cbd5e1);
          }

          .trace-evidence-timeline-header em {
            font-style: normal;
            color: var(--text-muted, #64748b);
            margin-left: 4px;
          }

          .trace-evidence-timeline-notes {
            font-size: 0.75rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 2px 0;
          }

          .trace-evidence-timeline-ip {
            font-size: 0.675rem;
            color: var(--text-muted, #64748b);
            font-family: monospace;
          }

          /* Editing panel */
          .trace-evidence-edit-box {
            background-color: rgba(255, 255, 255, 0.015);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            padding: 14px;
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .trace-evidence-edit-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }

          .trace-evidence-edit-col {
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex: 1;
            min-width: 150px;
          }

          .trace-evidence-edit-buttons {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin-top: 4px;
          }

          .trace-evidence-inline-btn {
            background-color: transparent;
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            color: var(--text-primary, #f8fafc);
            padding: 5px 12px;
            font-size: 0.75rem;
            font-weight: 600;
            border-radius: 4px;
            cursor: pointer;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            outline: none;
          }

          .trace-evidence-inline-btn.save {
            background-color: var(--color-primary, #3b82f6);
            border-color: var(--color-primary, #3b82f6);
          }

          .trace-evidence-inline-btn.save:hover {
            background-color: var(--color-primary-hover, #2563eb);
          }

          .trace-evidence-inline-btn.cancel:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }

          /* Tag pills */
          .trace-evidence-tag-pill {
            background-color: rgba(6, 182, 212, 0.1);
            border: 1px solid rgba(6, 182, 212, 0.2);
            color: var(--color-secondary, #06b6d4);
            font-size: 0.7rem;
            padding: 2px 8px;
            border-radius: 99px;
            font-weight: 600;
          }

          /* Polished empty state placeholder */
          .trace-evidence-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 48px 24px;
            text-align: center;
            gap: 12px;
            background-color: var(--bg-surface, #0e1626);
            border: 1.5px dashed var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            box-sizing: border-box;
            user-select: none;
          }

          .trace-evidence-empty-icon {
            font-size: 2.5rem;
            color: var(--text-muted, #64748b);
            opacity: 0.5;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .trace-evidence-empty-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-primary, #f8fafc);
            margin: 0;
          }

          .trace-evidence-empty-desc {
            font-size: 0.8125rem;
            color: var(--text-secondary, #cbd5e1);
            margin: 0;
            max-width: 320px;
            line-height: 1.45;
          }

          .trace-evidence-hidden-input {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
          }

          .trace-evidence-spinner {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.15);
            border-top-color: #ffffff;
            animation: trace-btn-spin 0.75s linear infinite;
            flex-shrink: 0;
          }

          @keyframes trace-btn-spin {
            to { transform: rotate(360deg); }
          }

          @media (max-width: 992px) {
            .trace-evidence-workspace {
              grid-template-columns: 1fr;
            }
          }
        `
      }} />

      {/* Overview segment */}
      <div className="trace-evidence-header" role="region" aria-label="Evidence Overview Summary">
        <div className="trace-evidence-title-group text-left">
          <h3 className="trace-evidence-title">Evidence Intake Console</h3>
          <p className="trace-evidence-subtitle">
            Securely upload, hash verify, and track Chain of Custody for case #{caseId}.
          </p>
        </div>
        <div className="trace-evidence-summary-row">
          <span className="trace-evidence-summary-pill">
            Total Files: <strong>{totalEvidence}</strong>
          </span>
          <span className="trace-evidence-summary-pill">
            Active: <strong>{activeCount}</strong>
          </span>
          <span className="trace-evidence-summary-pill">
            Integrity Checked: <strong>{integrityCount}</strong>
          </span>
        </div>
      </div>

      {/* Main split workspace grid */}
      <div className="trace-evidence-workspace">
        
        {/* Left Side: Upload zone card */}
        <section className="trace-evidence-upload-card" aria-label="Forensic upload interface">
          <h4 className="trace-evidence-upload-title text-left">Upload Evidence</h4>
          
          <form onSubmit={handleUploadSubmit} className="trace-evidence-field" style={{ gap: '16px' }} noValidate>
            
            {/* File Dropzone / Select Area */}
            <div className="trace-evidence-field">
              <span className="trace-evidence-label">Select Files</span>
              
              {/* Drag and drop zone */}
              <div 
                className={`trace-evidence-dropzone ${isDragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('trace-file-select-input').click()}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.getElementById('trace-file-select-input').click();
                  }
                }}
                title="Click or drag files here to queue evidence"
              >
                <span className="trace-evidence-dropzone-icon" aria-hidden="true">
                  <FiUpload />
                </span>
                <span className="trace-evidence-dropzone-text">
                  Drag &amp; drop files here, or click to browse
                </span>
                <span className="trace-evidence-dropzone-subtext">
                  Queues multiple RAW, PCAP, EVTX, LOG, JSON, IMG files
                </span>
                <input
                  id="trace-file-select-input"
                  type="file"
                  multiple
                  className="trace-evidence-hidden-input"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  aria-label="Upload files input"
                />
              </div>

              {/* Upload queue list */}
              {selectedFiles.length > 0 && (
                <div className="trace-evidence-queue-list mt-2">
                  {selectedFiles.map((sf, idx) => (
                    <div key={idx} className="trace-evidence-selected-file">
                      <div className="trace-evidence-file-info">
                        <span className="trace-evidence-file-name" title={sf.name}>
                          {sf.name}
                        </span>
                        <span className="trace-evidence-file-meta">
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
                        aria-label="Remove queued file"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
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
                Evidence Type *
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
                <option value="">Select evidence type</option>
                <option value="Disk Image">Disk Image</option>
                <option value="Memory Dump">Memory Dump</option>
                <option value="Windows Event Log">Windows Event Log</option>
                <option value="Network Capture">Network Capture</option>
                <option value="Document">Document</option>
                <option value="Image">Image</option>
                <option value="Other">Other</option>
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
                placeholder="e.g. host-04, brute-force, web-server"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                disabled={isUploading}
              />
            </div>

            {/* Description / Analyst Notes */}
            <div className="trace-evidence-field">
              <label htmlFor="trace-evidence-description-field" className="trace-evidence-label">
                Analyst Notes / Origin Info (Optional)
              </label>
              <textarea
                id="trace-evidence-description-field"
                className="trace-evidence-textarea"
                placeholder="Add details about acquisition environment or custody chain..."
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
              <span>{isUploading ? 'Uploading...' : `Upload ${selectedFiles.length || ''} File(s)`}</span>
            </button>

            {/* Simulated progress tracker container */}
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
        
        {/* Right Side: Evidence list table */}
        <section className="trace-evidence-list-card" aria-label="Incident forensic items directory">
          <h4 className="trace-evidence-upload-title text-left" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            Forensic Evidence Directory
          </h4>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-primary animate-pulse">
              <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
              <p className="text-xs">Loading case forensic repository...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#ef4444] gap-2">
              <FiAlertTriangle className="text-[32px]" />
              <p className="text-sm font-bold">Failed to load evidence catalog</p>
              <p className="text-xs text-on-surface-variant max-w-sm">{error}</p>
            </div>
          ) : evidenceItems.length > 0 ? (
            <div className="trace-evidence-table-container">
              <table className="trace-evidence-table">
                <thead>
                  <tr>
                    <th scope="col" className="text-left">File Name</th>
                    <th scope="col">Type</th>
                    <th scope="col">Size</th>
                    <th scope="col">Ingested</th>
                    <th scope="col">SHA-256</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceItems.map((item) => {
                    const isExpanded = expandedRow === item._id || expandedRow === item.evidenceId;
                    const isCopied = copiedHash === item._id;
                    
                    return (
                      <React.Fragment key={item._id}>
                        {/* Summary Data Row */}
                        <tr className={`trace-evidence-row ${isExpanded ? 'expanded' : ''}`}>
                          <td className="trace-evidence-file-cell text-left" title={item.originalName}>
                            <div className="font-semibold text-xs text-on-surface leading-normal">{item.originalName}</div>
                            <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">{item.evidenceId}</div>
                          </td>
                          <td>{item.fileType}</td>
                          <td>{formatFileSize(item.fileSize)}</td>
                          <td>{new Date(item.uploadedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td>
                            <span 
                              className="trace-evidence-hash-cell" 
                              title={`SHA-256 Hash: ${item.sha256Hash}`}
                            >
                              {item.sha256Hash ? `${item.sha256Hash.slice(0, 10)}...` : 'N/A'}
                              {item.sha256Hash && (
                                <button
                                  type="button"
                                  className="trace-evidence-copy-btn"
                                  onClick={() => handleCopyHash(item.sha256Hash)}
                                  aria-label={`Copy SHA-256 hash`}
                                >
                                  {isCopied ? (
                                    <span className="trace-evidence-copied-feedback">Copied</span>
                                  ) : (
                                    <FiCopy />
                                  )}
                                </button>
                              )}
                            </span>
                          </td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              item.status === 'Active' ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30' : 'bg-white/5 text-on-surface-variant'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                className="trace-evidence-row-btn"
                                onClick={() => toggleRowDetails(item._id, item)}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? 'Hide' : 'Details'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(item)}
                                className="p-1 text-on-surface-variant hover:text-primary hover:bg-white/5 rounded transition-all cursor-pointer bg-transparent border-none"
                                title="Download File"
                              >
                                <FiDownload className="text-[16px]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="p-1 text-on-surface-variant hover:text-[#ef4444] hover:bg-white/5 rounded transition-all cursor-pointer bg-transparent border-none"
                                title="Delete Evidence"
                              >
                                <FiTrash2 className="text-[16px]" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr className="trace-evidence-details-row">
                            <td colSpan={7}>
                              <div className="trace-evidence-details-panel text-left">
                                {/* Metadata fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">Uploaded By:</span>
                                      <span className="trace-evidence-details-value">
                                        {item.uploadedBy?.fullName || 'Analyst'} ({item.uploadedBy?.email || 'N/A'})
                                      </span>
                                    </div>
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">Mime Type:</span>
                                      <span className="trace-evidence-details-value font-mono">{item.mimeType}</span>
                                    </div>
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">MD5 Checksum:</span>
                                      <span className="trace-evidence-details-value monospace font-mono">{item.md5Hash}</span>
                                    </div>
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">SHA-1 Checksum:</span>
                                      <span className="trace-evidence-details-value monospace font-mono">{item.sha1Hash}</span>
                                    </div>
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">SHA-256 Checksum:</span>
                                      <span className="trace-evidence-details-value monospace font-mono">{item.sha256Hash}</span>
                                    </div>
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">Description:</span>
                                      <span className="trace-evidence-details-value">{item.notes || 'No description logged.'}</span>
                                    </div>
                                    <div className="trace-evidence-details-item">
                                      <span className="trace-evidence-details-label">Tags:</span>
                                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                                        {item.tags && item.tags.length > 0 ? (
                                          item.tags.map((tag, tIdx) => (
                                            <span key={tIdx} className="trace-evidence-tag-pill">{tag}</span>
                                          ))
                                        ) : (
                                          <span className="text-on-surface-variant text-[11px]">No tags assigned.</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Chain of custody timeline */}
                                  <div>
                                    <span className="trace-evidence-details-label mb-2 block">Chain of Custody History:</span>
                                    <div className="trace-evidence-timeline">
                                      {item.chainOfCustody && item.chainOfCustody.map((coc, cIdx) => (
                                        <div key={cIdx} className="trace-evidence-timeline-node">
                                          <div className="trace-evidence-timeline-bullet" />
                                          <div className="trace-evidence-timeline-content">
                                            <div className="trace-evidence-timeline-header text-xs">
                                              <strong>{coc.action}</strong> by <span>{coc.performedBy}</span>
                                              <span className="text-[10px] text-on-surface-variant block font-medium mt-0.5">
                                                {new Date(coc.timestamp).toLocaleString()}
                                              </span>
                                            </div>
                                            <p className="trace-evidence-timeline-notes text-on-surface-variant leading-relaxed text-[11.5px] my-1">
                                              {coc.notes}
                                            </p>
                                            <div className="trace-evidence-timeline-ip text-[10px] text-on-surface-variant font-mono">
                                              IP Source: {coc.ipAddress}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Edit trigger button */}
                                {editingItemId !== item._id ? (
                                  <div className="pt-2 border-t border-white/5 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setEditingItemId(item._id)}
                                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
                                    >
                                      <FiEdit2 /> Edit Metadata
                                    </button>
                                  </div>
                                ) : (
                                  /* Inline editing fields */
                                  <form onSubmit={(e) => handleUpdateMetadataSubmit(e, item)} className="trace-evidence-edit-box">
                                    <h5 className="font-semibold text-xs text-on-surface mb-1">Modify Telemetry Parameters</h5>
                                    
                                    <div className="trace-evidence-edit-row">
                                      <div className="trace-evidence-edit-col">
                                        <label className="text-[10px] text-on-surface-variant uppercase font-bold" htmlFor="edit-status">Status</label>
                                        <select
                                          id="edit-status"
                                          className="trace-evidence-select mt-1"
                                          value={editStatus}
                                          onChange={(e) => setEditStatus(e.target.value)}
                                          disabled={isUpdatingMeta}
                                        >
                                          <option value="Active">Active</option>
                                          <option value="Archived">Archived</option>
                                          <option value="Processing">Processing</option>
                                        </select>
                                      </div>

                                      <div className="trace-evidence-edit-col">
                                        <label className="text-[10px] text-on-surface-variant uppercase font-bold" htmlFor="edit-tags">Tags (Comma-separated)</label>
                                        <input
                                          id="edit-tags"
                                          type="text"
                                          className="trace-evidence-input mt-1"
                                          value={editTags}
                                          onChange={(e) => setEditTags(e.target.value)}
                                          disabled={isUpdatingMeta}
                                        />
                                      </div>
                                    </div>

                                    <div className="trace-evidence-edit-col">
                                      <label className="text-[10px] text-on-surface-variant uppercase font-bold" htmlFor="edit-notes">Analyst Notes</label>
                                      <textarea
                                        id="edit-notes"
                                        className="trace-evidence-textarea mt-1"
                                        value={editNotes}
                                        onChange={(e) => setEditNotes(e.target.value)}
                                        disabled={isUpdatingMeta}
                                      />
                                    </div>

                                    <div className="trace-evidence-edit-buttons">
                                      <button
                                        type="button"
                                        onClick={() => setEditingItemId(null)}
                                        className="trace-evidence-inline-btn cancel"
                                        disabled={isUpdatingMeta}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        className="trace-evidence-inline-btn save"
                                        disabled={isUpdatingMeta}
                                      >
                                        {isUpdatingMeta ? 'Saving...' : 'Save telemetry'}
                                      </button>
                                    </div>
                                  </form>
                                )}
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
          ) : (
            /* Empty State block */
            <div className="trace-evidence-empty-state" role="region" aria-label="No evidence items found">
              <div className="trace-evidence-empty-icon" aria-hidden="true">
                <FiDatabase />
              </div>
              <p className="trace-evidence-empty-title">No evidence added</p>
              <p className="trace-evidence-empty-desc">
                No evidence has been added to this case folder. Choose files on the left to begin triangulation and cryptographic indexing.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
