import React, { useState } from 'react';
import { 
  FiUpload, 
  FiFile, 
  FiDatabase, 
  FiCheck, 
  FiCopy, 
  FiInfo, 
  FiTrash2 
} from 'react-icons/fi';

import StatusBadge from '../../components/common/StatusBadge';

// Initial coherent mock evidence list
const INITIAL_EVIDENCE = [
  {
    name: 'security.evtx',
    type: 'Windows Event Log',
    size: '18.4 MB',
    uploaded: 'Jul 29, 2026 09:42',
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    status: 'Verified',
    description: 'System security audit logs extracted from core Active Directory Domain Controller sub-segment.',
  },
  {
    name: 'memory.raw',
    type: 'Memory Dump',
    size: '512 MB',
    uploaded: 'Jul 29, 2026 09:37',
    sha256: '57ac4568853b0f55aa0a6fef5f0f0c08b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8',
    status: 'Verified',
    description: 'Volatile RAM dump from compromised endpoint workstation for process tracing analysis.',
  },
  {
    name: 'network.pcap',
    type: 'Network Capture',
    size: '24.8 MB',
    uploaded: 'Jul 29, 2026 09:35',
    sha256: 'ec39f86d88c0a55ad081a2f0c55a015a3bf4f1b2b0b822cd15d6c15b0f00a082',
    status: 'Verified',
    description: 'Full packet payload capture from external egress perimeter router interfaces.',
  },
  {
    name: 'auth-log.txt',
    type: 'Document',
    size: '1.2 MB',
    uploaded: 'Jul 29, 2026 09:31',
    sha256: '7a08b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8',
    status: 'Verified',
    description: 'Filtered authentication logs containing list of multiple failed authorization attempts.',
  },
];

/**
 * EvidenceTab Component
 * Reusable workspace module containing forensic file uploads, integrity checklists,
 * and hash telemetry display tables.
 *
 * @param {Object} props
 * @param {string} [props.caseId] - Parent case unique identifier
 */
export default function EvidenceTab({ caseId = 'TRC-2026-0042' }) {
  // Local state managers
  const [evidenceItems, setEvidenceItems] = useState(INITIAL_EVIDENCE);
  const [selectedFile, setSelectedFile] = useState(null);
  const [evidenceType, setEvidenceType] = useState('');
  const [description, setDescription] = useState('');

  // Drag over dropzone highlight state
  const [isDragActive, setIsDragActive] = useState(false);

  // Upload Progress simulation state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  // UI interaction states
  const [errors, setErrors] = useState({});
  const [copiedHash, setCopiedHash] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // Dynamic summary values calculated locally from state
  const totalEvidence = evidenceItems.length;
  const verifiedCount = evidenceItems.filter((i) => i.status.toLowerCase() === 'verified').length;
  const integrityIssues = 0; // Hardcoded default for prototype nominal metrics

  // Helper: Format raw file sizes during manual browsing
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
      const file = e.dataTransfer.files[0];
      setSelectedFile({
        name: file.name,
        size: formatFileSize(file.size),
        rawType: file.type,
      });
      if (errors.file) setErrors((prev) => ({ ...prev, file: null }));
    }
  };

  // Manual browser input handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile({
        name: file.name,
        size: formatFileSize(file.size),
        rawType: file.type,
      });
      if (errors.file) setErrors((prev) => ({ ...prev, file: null }));
    }
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
  const toggleRowDetails = (sha256) => {
    setExpandedRow((prev) => (prev === sha256 ? null : sha256));
  };

  // Submission handler with ticks progress bar simulation
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (isUploading) return;

    const tempErrors = {};
    if (!selectedFile) tempErrors.file = 'A file must be selected for upload';
    if (!evidenceType) tempErrors.evidenceType = 'Please specify evidence classification type';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing evidence...');

    let progressVal = 0;
    const interval = setInterval(() => {
      progressVal += 10;
      if (progressVal <= 70) {
        setUploadProgress(progressVal);
        setUploadStatus('Uploading...');
      } else if (progressVal === 80) {
        setUploadProgress(progressVal);
        setUploadStatus('Verifying integrity...');
      } else if (progressVal === 90) {
        setUploadProgress(progressVal);
        setUploadStatus('Rebuilding case hashes...');
      } else if (progressVal >= 100) {
        setUploadProgress(100);
        setUploadStatus('Evidence verified');
        clearInterval(interval);

        // Generate mock SHA-256 hex string
        const mockHash = Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');

        // Date format string
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }) + ' ' + now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        // Construct new item structure
        const newItem = {
          name: selectedFile.name,
          type: evidenceType,
          size: selectedFile.size,
          uploaded: formattedDate,
          sha256: mockHash,
          status: 'Verified',
          description: description.trim() || 'No description provided.',
        };

        // Complete transition delay
        setTimeout(() => {
          setEvidenceItems((prev) => [newItem, ...prev]);
          setIsUploading(false);
          setUploadProgress(0);
          setUploadStatus('');
          setSelectedFile(null);
          setEvidenceType('');
          setDescription('');
        }, 600);
      }
    }, 150); // total transition time ~1.5s
  };

  return (
    <div className="trace-evidence-tab">
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

          .trace-evidence-dropzone:focus-visible {
            border-color: var(--color-primary, #3b82f6);
            outline: 2px solid var(--color-primary, #3b82f6);
            outline-offset: -2px;
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

          /* File selected indicator pill */
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

          .trace-evidence-remove-file-btn:focus-visible {
            outline: 2px solid var(--status-critical, #ef4444);
          }

          /* Fields and controls styling */
          .trace-evidence-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            box-sizing: border-box;
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
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.1));
          }

          .trace-evidence-select.error {
            border-color: var(--status-critical, #ef4444);
            box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
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
            transition: border-color var(--transition-speed, 200ms) ease;
            height: 60px;
            box-sizing: border-box;
            resize: vertical;
            line-height: 1.4;
            font-family: inherit;
          }

          .trace-evidence-textarea:focus {
            border-color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 0 1px var(--color-primary-light, rgba(59, 130, 246, 0.1));
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
            transition: background-color var(--transition-speed, 200ms) ease;
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
            background-color: var(--bg-surface-elevated, #162035);
            color: var(--text-muted, #64748b);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-evidence-submit-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 2px;
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
            user-select: none;
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
            border-radius: var(--radius-full, 9999px);
            overflow: hidden;
          }

          .trace-evidence-progress-fill {
            height: 100%;
            background-color: var(--color-primary, #3b82f6);
            transition: width 100ms ease;
          }

          .trace-evidence-progress-fill.verified {
            background-color: var(--status-low, #22c55e);
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
            user-select: none;
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
            transition: all var(--transition-speed, 200ms);
          }

          .trace-evidence-copy-btn:hover {
            color: var(--color-primary, #3b82f6);
            background-color: var(--bg-surface-elevated, #162035);
          }

          .trace-evidence-copy-btn:focus-visible {
            outline: 2px solid var(--color-primary, #3b82f6);
          }

          .trace-evidence-copied-feedback {
            font-size: 0.65rem;
            color: var(--status-low, #22c55e);
            font-weight: 600;
            margin-left: 2px;
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
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
            height: 28px;
            box-sizing: border-box;
            user-select: none;
          }

          .trace-evidence-row-btn:hover {
            border-color: var(--color-primary, #3b82f6);
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.1));
            color: var(--text-primary, #f8fafc);
          }

          .trace-evidence-row-btn:focus-visible {
            outline: 2px solid var(--color-secondary, #06b6d4);
            outline-offset: 1px;
          }

          /* Expanded details panel in table */
          .trace-evidence-details-row td {
            padding: 14px 20px;
            background-color: rgba(0, 0, 0, 0.14);
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          }

          .trace-evidence-details-panel {
            display: flex;
            flex-direction: column;
            gap: 8px;
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
            width: 100px;
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

          /* Scoped Visually Hidden inputs */
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

          /* Visually hidden spinner keyframes */
          .trace-evidence-spinner {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.15);
            border-top-color: #ffffff;
            animation: trace-btn-spin 0.75s linear infinite;
            flex-shrink: 0;
          }

          /* Responsive Layout */
          @media (max-width: 992px) {
            .trace-evidence-workspace {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 768px) {
            .trace-evidence-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }
          }
        `
      }} />

      {/* Overview segment */}
      <div className="trace-evidence-header" role="region" aria-label="Evidence Overview Summary">
        <div className="trace-evidence-title-group">
          <h3 className="trace-evidence-title">Evidence</h3>
          <p className="trace-evidence-subtitle">
            Upload, verify and manage forensic evidence for this investigation.
          </p>
        </div>
        <div className="trace-evidence-summary-row">
          <span className="trace-evidence-summary-pill">
            Total Evidence: <strong>{totalEvidence}</strong>
          </span>
          <span className="trace-evidence-summary-pill">
            Verified: <strong>{verifiedCount}</strong>
          </span>
          <span className="trace-evidence-summary-pill">
            Integrity Issues: <strong>{integrityIssues}</strong>
          </span>
        </div>
      </div>

      {/* Main split workspace grid */}
      <div className="trace-evidence-workspace">
        
        {/* Left Side: Upload zone card */}
        <section className="trace-evidence-upload-card" aria-label="Forensic upload interface">
          <h4 className="trace-evidence-upload-title">Upload Evidence</h4>
          
          <form onSubmit={handleUploadSubmit} className="trace-evidence-field" style={{ gap: '16px' }} noValidate>
            
            {/* File Dropzone / Select Area */}
            <div className="trace-evidence-field">
              <span className="trace-evidence-label">Select File</span>
              {!selectedFile ? (
                /* Drag and drop triggers manual input clicks */
                <label 
                  className={`trace-evidence-dropzone ${isDragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      document.getElementById('trace-file-select-input').click();
                    }
                  }}
                  title="Click or drag file here to load evidence"
                >
                  <span className="trace-evidence-dropzone-icon" aria-hidden="true">
                    <FiUpload />
                  </span>
                  <span className="trace-evidence-dropzone-text">
                    Drag &amp; drop file here, or click to browse
                  </span>
                  <span className="trace-evidence-dropzone-subtext">
                    Supports RAW, PCAP, EVTX, LOG, JSON, IMG (Max 2GB)
                  </span>
                  <input
                    id="trace-file-select-input"
                    type="file"
                    className="trace-evidence-hidden-input"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    aria-label="Upload file input"
                  />
                </label>
              ) : (
                /* Active file indicator badge */
                <div className="trace-evidence-selected-file">
                  <div className="trace-evidence-file-info">
                    <span className="trace-evidence-file-name" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                    <span className="trace-evidence-file-meta">
                      Size: {selectedFile.size}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="trace-evidence-remove-file-btn"
                    onClick={() => {
                      if (!isUploading) setSelectedFile(null);
                    }}
                    disabled={isUploading}
                    aria-label="Remove selected file"
                  >
                    Remove
                  </button>
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
                Evidence Type
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
                <span id="trace-evidence-type-error" className="trace-evidence-validation-error" role="alert">
                  {errors.evidenceType}
                </span>
              )}
            </div>

            {/* Description / Analyst Notes */}
            <div className="trace-evidence-field">
              <label htmlFor="trace-evidence-description-field" className="trace-evidence-label">
                Description (Optional)
              </label>
              <textarea
                id="trace-evidence-description-field"
                className="trace-evidence-textarea"
                placeholder="Add notes about forensic origin or source host..."
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
              disabled={isUploading}
            >
              {isUploading && <span className="trace-evidence-spinner" aria-hidden="true" />}
              <span>{isUploading ? 'Uploading...' : 'Upload Evidence'}</span>
            </button>

            {/* Simulated progress tracker container */}
            {isUploading && (
              <div 
                className="trace-evidence-progress-container"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="trace-evidence-progress-status-row">
                  <span className="trace-evidence-progress-status">
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
          <h4 className="trace-evidence-upload-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            Forensic Evidence Directory
          </h4>

          {evidenceItems.length > 0 ? (
            <div className="trace-evidence-table-container">
              <table className="trace-evidence-table">
                <thead>
                  <tr>
                    <th scope="col">File Name</th>
                    <th scope="col">Evidence Type</th>
                    <th scope="col">Size</th>
                    <th scope="col">Uploaded</th>
                    <th scope="col">SHA-256</th>
                    <th scope="col">Verification</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceItems.map((item) => {
                    const isExpanded = expandedRow === item.sha256;
                    const isCopied = copiedHash === item.sha256;
                    
                    return (
                      <React.Fragment key={item.sha256}>
                        {/* Summary Data Row */}
                        <tr className={`trace-evidence-row ${isExpanded ? 'expanded' : ''}`}>
                          <td className="trace-evidence-file-cell" title={item.name}>
                            {item.name}
                          </td>
                          <td>{item.type}</td>
                          <td>{item.size}</td>
                          <td>{item.uploaded}</td>
                          <td>
                            <span 
                              className="trace-evidence-hash-cell" 
                              title={`SHA-256 Hash: ${item.sha256}`}
                            >
                              {item.sha256.slice(0, 12)}...
                              <button
                                type="button"
                                className="trace-evidence-copy-btn"
                                onClick={() => handleCopyHash(item.sha256)}
                                aria-label={`Copy SHA-256 hash for ${item.name}`}
                              >
                                {isCopied ? (
                                  <span className="trace-evidence-copied-feedback">Copied</span>
                                ) : (
                                  <FiCopy />
                                )}
                              </button>
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={item.status} />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="trace-evidence-row-btn"
                              onClick={() => toggleRowDetails(item.sha256)}
                              aria-expanded={isExpanded}
                              title={`Toggle details view for ${item.name}`}
                            >
                              {isExpanded ? 'Hide' : 'Details'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr className="trace-evidence-details-row">
                            <td colSpan={7}>
                              <div className="trace-evidence-details-panel">
                                <div className="trace-evidence-details-item">
                                  <span className="trace-evidence-details-label">Description:</span>
                                  <span className="trace-evidence-details-value">{item.description}</span>
                                </div>
                                <div className="trace-evidence-details-item">
                                  <span className="trace-evidence-details-label">SHA-256 Hash:</span>
                                  <span className="trace-evidence-details-value monospace">{item.sha256}</span>
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
          ) : (
            /* Empty State block */
            <div className="trace-evidence-empty-state" role="region" aria-label="No evidence items found">
              <div className="trace-evidence-empty-icon" aria-hidden="true">
                <FiDatabase />
              </div>
              <p className="trace-evidence-empty-title">No evidence added</p>
              <p className="trace-evidence-empty-desc">
                No evidence has been added to this investigation. Choose a raw log or network dump file on the left to begin triangulation.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
