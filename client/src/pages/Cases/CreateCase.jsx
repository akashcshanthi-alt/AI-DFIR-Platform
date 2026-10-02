import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Upload, 
  X, 
  File, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import './CreateCase.css';
import { casesService } from '../../services/cases.service';
import { evidenceService } from '../../services/evidence.service';

const INCIDENT_TYPES = [
  'General Security Incident',
  'Malware Outbreak',
  'Ransomware Attack',
  'Unauthorized Access',
  'Phishing & Credential Harvesting',
  'Data Exfiltration',
  'DDoS Attack',
  'Insider Threat',
  'Network Intrusion',
  'Cloud Infrastructure Compromise'
];

export default function CreateCase() {
  const navigate = useNavigate();

  // Auth Guard check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [incidentType, setIncidentType] = useState('General Security Incident');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusStep, setStatusStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);

  if (!hasSession) return null;

  // File selection handler
  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setEvidenceFiles(prev => [...prev, ...selected]);
    }
  };

  const removeFile = (indexToRemove) => {
    setEvidenceFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      setEvidenceFiles(prev => [...prev, ...dropped]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    if (!title.trim()) {
      setErrorMsg('Case Title is required. Please provide a descriptive incident name.');
      return;
    }

    setIsSubmitting(true);
    setStatusStep('Creating investigation case in MongoDB...');

    try {
      // 1. Create Case in database
      const payload = {
        title: title.trim(),
        incidentType,
        severity,
        status: 'Open',
        description: description.trim()
      };

      const createdCase = await casesService.createCase(payload);
      const caseRef = createdCase.caseId || createdCase._id;

      // 2. Upload Evidence if any files attached
      if (evidenceFiles.length > 0) {
        setStatusStep(`Uploading ${evidenceFiles.length} evidence file(s)...`);
        const formData = new FormData();
        formData.append('caseId', caseRef);
        formData.append('fileType', 'Other');
        evidenceFiles.forEach((file) => {
          formData.append('files', file);
        });

        await evidenceService.uploadEvidence(formData, (percent) => {
          setUploadProgress(percent);
        });
      }

      setSuccessMsg(`Case [${caseRef}] created successfully! Opening case workspace...`);
      
      // Navigate to the newly created case details page
      setTimeout(() => {
        navigate(`/cases/${caseRef}`);
      }, 1000);

    } catch (err) {
      console.error('Case creation error:', err);
      setErrorMsg(err.message || 'Failed to create case. Please try again.');
      setIsSubmitting(false);
      setStatusStep('');
    }
  };

  return (
    <div className="trace-create-case-page flex flex-col min-h-screen w-full box-border p-6 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 text-left">
          <Link to="/cases" className="inline-flex items-center gap-2 text-[#47faf3] text-xs font-semibold hover:underline transition-all">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cases</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Create New Case</h1>
              <p className="text-xs md:text-sm text-[#94a3b8] mt-0.5">
                Initiate a security investigation case and attach initial forensic evidence.
              </p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#fca5a5] text-xs flex items-center gap-3 animate-fade-in text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ef4444]" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 text-[#6ee7b7] text-xs flex items-center gap-3 animate-fade-in text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10b981]" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Single Create Case Form Card */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl border border-white/10 p-6 md:p-8 space-y-6 text-left bg-[#101726]/90 shadow-2xl backdrop-blur-md">
          
          {/* Field 1: Case Title */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              Case Title <span className="text-[#ef4444]">*</span>
            </label>
            <input 
              type="text" 
              className="trace-form-input w-full"
              placeholder="e.g. Unauthorized RDP Lateral Movement on DC-01"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
            <span className="text-[11px] text-[#94a3b8]">
              A concise, descriptive summary of the security incident.
            </span>
          </div>

          {/* Row: Incident Type & Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Field 2: Incident Type */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Incident Type
              </label>
              <select 
                className="trace-form-select w-full"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                disabled={isSubmitting}
              >
                {INCIDENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: Severity */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Severity Level
              </label>
              <select 
                className="trace-form-select w-full font-semibold"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="Low">Low - Minor anomaly or false positive</option>
                <option value="Medium">Medium - Suspicious single-host activity</option>
                <option value="High">High - Confirmed threat or breach attempt</option>
                <option value="Critical">Critical - Active breach, ransomware, or domain compromise</option>
              </select>
            </div>

          </div>

          {/* Field 4: Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              Incident Description
            </label>
            <textarea 
              rows={4}
              className="trace-form-textarea w-full"
              placeholder="Provide context regarding how the incident was detected, suspected compromised endpoints, observed attacker IPs, and initial findings..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Field 5: Upload Evidence (Optional) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Upload Evidence <span className="text-[#94a3b8] font-normal lowercase">(optional during case creation)</span>
              </label>
              {evidenceFiles.length > 0 && (
                <span className="text-xs text-[#00E5FF] font-semibold">
                  {evidenceFiles.length} file(s) selected
                </span>
              )}
            </div>

            {/* Dropzone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('evidence-upload-input').click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                dragActive 
                  ? 'border-[#00E5FF] bg-[#00E5FF]/10' 
                  : 'border-white/10 bg-[#0B1220]/60 hover:border-[#00E5FF]/40 hover:bg-[#0B1220]'
              }`}
            >
              <Upload className="w-7 h-7 text-[#00E5FF] opacity-80" />
              <p className="text-xs font-semibold text-white">
                Drag and drop forensic files here, or <span className="text-[#00E5FF] underline">browse files</span>
              </p>
              <p className="text-[11px] text-[#94a3b8]">
                Supports PCAP, EVTX, memory dumps, logs, and disk images.
              </p>
              <input 
                id="evidence-upload-input"
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
            </div>

            {/* Selected File List */}
            {evidenceFiles.length > 0 && (
              <div className="space-y-2 mt-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {evidenceFiles.map((file, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg bg-[#0B1220] border border-white/5 text-xs text-white"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <File className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-[10px] text-[#94a3b8] font-mono shrink-0">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      disabled={isSubmitting}
                      className="text-[#94a3b8] hover:text-[#ef4444] p-1 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions Bar */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/cases')}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-white/10 text-[#94a3b8] hover:text-white hover:bg-white/5 font-semibold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {isSubmitting && statusStep && (
                <span className="text-xs text-[#00E5FF] font-medium animate-pulse">
                  {statusStep} {uploadProgress > 0 && `(${uploadProgress}%)`}
                </span>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#3B82F6] hover:brightness-110 active:scale-95 text-[#0A0F1E] font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0A0F1E]" />
                    <span>Creating Case...</span>
                  </>
                ) : (
                  <span>Create Case</span>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
