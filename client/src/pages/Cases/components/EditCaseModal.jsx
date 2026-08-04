import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { casesService } from '../../../services/cases.service';

export default function EditCaseModal({ isOpen, onClose, caseItem, onUpdated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'High',
    status: 'Open',
    assignedAnalyst: 'Unassigned',
    sourceIP: '',
    destinationIP: '',
    evidenceCount: 0,
    targetHost: 'N/A'
  });
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync state with caseItem when it changes
  useEffect(() => {
    if (caseItem) {
      setFormData({
        title: caseItem.title || '',
        description: caseItem.description || '',
        severity: caseItem.severity || 'High',
        status: caseItem.status || 'Open',
        assignedAnalyst: caseItem.assignedAnalyst || 'Unassigned',
        sourceIP: caseItem.sourceIP || '',
        destinationIP: caseItem.destinationIP || '',
        evidenceCount: caseItem.evidenceCount || 0,
        targetHost: caseItem.targetHost || 'N/A'
      });
    }
    setErrorMsg('');
    setSuccessMsg('');
  }, [caseItem, isOpen]);

  if (!isOpen || !caseItem) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'evidenceCount' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('Please specify a Case Title.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const targetId = caseItem.caseId || caseItem._id;
      const updatedData = await casesService.updateCase(targetId, formData);
      setSuccessMsg('Case details updated successfully.');
      onUpdated(updatedData);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update case.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Edit Case Workspace</span>
              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-md font-mono">
                {caseItem.caseId}
              </span>
            </h2>
            <p className="text-xs text-on-surface-variant/70 mt-0.5">Modify parameters for active forensic incident</p>
          </div>
          <button 
            type="button" 
            className="text-on-surface-variant hover:text-white transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-5 text-left">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="bg-error/10 border border-error/30 text-error text-xs px-4 py-2.5 rounded-lg">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-xs px-4 py-2.5 rounded-lg font-bold">
              {successMsg}
            </div>
          )}

          {/* Row 1: Title & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10px] font-label-caps text-on-surface-variant uppercase font-bold">Case Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 focus:border-primary text-white rounded-lg p-2.5 text-sm outline-none transition-all w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-label-caps text-on-surface-variant uppercase font-bold">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="bg-slate-900 border border-white/10 focus:border-primary text-white rounded-lg p-2.5 text-sm outline-none cursor-pointer transition-all w-full"
              >
                <option value="Open">Open</option>
                <option value="Investigating">Investigating</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Row 2: Severity & Analyst */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-label-caps text-on-surface-variant uppercase font-bold">Severity *</label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="bg-slate-900 border border-white/10 focus:border-primary text-white rounded-lg p-2.5 text-sm outline-none cursor-pointer transition-all w-full"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-label-caps text-on-surface-variant uppercase font-bold">Assigned Analyst</label>
              <input
                type="text"
                name="assignedAnalyst"
                value={formData.assignedAnalyst}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 focus:border-primary text-white rounded-lg p-2.5 text-sm outline-none transition-all w-full"
              />
            </div>
          </div>

          {/* Row 3: IPs & Host */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-label-caps text-on-surface-variant uppercase font-bold">Source IP</label>
              <input
                type="text"
                name="sourceIP"
                value={formData.sourceIP}
                onChange={handleChange}
                placeholder="e.g. 192.168.1.10"
                className="bg-white/5 border border-white/10 focus:border-primary text-white rounded-lg p-2.5 text-sm outline-none transition-all w-full font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-label-caps text-on-surface-variant uppercase font-bold">Destination IP</label>
              <input
                type="text"
                name="destinationIP"
                value={formData.destinationIP}
                onChange={handleChange}
                placeholder="e.g. 10.0.0.5"
                className="bg-white/5 border border-white/10 focus:border-primary text-white rounded-lg p-2.5 text-sm outline-none transition-all w-full font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-label-caps text-on-surface-variant uppercase font-bold">Target Host</label>
              <input
                type="text"
                name="targetHost"
                value={formData.targetHost}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 focus:border-primary text-white rounded-lg p-2.5 text-sm outline-none transition-all w-full"
              />
            </div>
          </div>

          {/* Row 4: Evidence Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-label-caps text-on-surface-variant uppercase font-bold">Evidence Count</label>
              <input
                type="number"
                name="evidenceCount"
                value={formData.evidenceCount}
                onChange={handleChange}
                min="0"
                className="bg-white/5 border border-white/10 focus:border-primary text-white rounded-lg p-2.5 text-sm outline-none transition-all w-full"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-label-caps text-on-surface-variant uppercase font-bold">Case Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="bg-white/5 border border-white/10 focus:border-primary text-white rounded-lg p-2.5 text-sm outline-none transition-all w-full resize-none font-sans"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2 rounded-lg border border-white/10 text-on-surface-variant hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-primary hover:brightness-110 text-slate-900 font-bold transition-all text-xs flex items-center gap-2 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
