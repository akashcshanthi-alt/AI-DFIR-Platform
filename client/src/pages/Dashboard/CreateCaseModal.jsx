import { useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiFileText, FiLoader, FiPlus, FiServer, FiUser, FiX } from "react-icons/fi";

export default function CreateCaseModal({ isOpen, onClose, onCaseCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    severity: "HIGH",
    status: "Triage",
    assignedAnalyst: "S. Rivera",
    targetHost: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Please provide a case title.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch("http://localhost:5000/api/dashboard/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create incident case");
      }

      const newCase = await response.json();
      setSuccessMsg(`Incident ${newCase.caseId} successfully created!`);
      
      onCaseCreated?.(newCase);

      setTimeout(() => {
        setSuccessMsg("");
        setFormData({
          title: "",
          severity: "HIGH",
          status: "Triage",
          assignedAnalyst: "S. Rivera",
          targetHost: "",
          description: "",
        });
        onClose();
      }, 900);
    } catch (err) {
      // Fallback local creation if server backend is offline during frontend dev mode
      const fallbackCase = {
        caseId: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formData.title.trim(),
        severity: formData.severity,
        status: formData.status,
        assignedAnalyst: formData.assignedAnalyst || "S. Rivera",
        targetHost: formData.targetHost || "WS-ENDPOINT-01",
        description: formData.description || "No description provided.",
        lastUpdated: "Just now",
        timestamp: new Date().toISOString(),
      };
      onCaseCreated?.(fallbackCase);
      setSuccessMsg(`Incident ${fallbackCase.caseId} logged locally!`);
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 900);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-case-title">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header__title-group">
            <div className="modal-header__icon">
              <FiPlus />
            </div>
            <div>
              <h2 id="create-case-title" className="modal-title">Create New Incident Case</h2>
              <p className="modal-subtitle">Log a new forensic investigation or security breach event</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX />
          </button>
        </div>

        {error && (
          <div className="modal-banner modal-banner--error" role="alert">
            <FiAlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="modal-banner modal-banner--success" role="status">
            <FiCheckCircle />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="case-title" className="form-label">
              Incident / Case Title *
            </label>
            <div className="input-with-icon">
              <FiFileText className="input-icon" />
              <input
                id="case-title"
                name="title"
                type="text"
                className="form-input"
                placeholder="e.g. Memory Dump Anomaly — DB Node 04"
                value={formData.title}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="case-severity" className="form-label">
                Initial Severity
              </label>
              <select
                id="case-severity"
                name="severity"
                className="form-select"
                value={formData.severity}
                onChange={handleChange}
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="case-status" className="form-label">
                Investigation Status
              </label>
              <select
                id="case-status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Triage">Triage</option>
                <option value="Containment">Containment</option>
                <option value="Analysis">Analysis</option>
                <option value="Queued">Queued</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="case-analyst" className="form-label">
                Assigned Lead Analyst
              </label>
              <div className="input-with-icon">
                <FiUser className="input-icon" />
                <input
                  id="case-analyst"
                  name="assignedAnalyst"
                  type="text"
                  className="form-input"
                  placeholder="Analyst name"
                  value={formData.assignedAnalyst}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="case-target" className="form-label">
                Affected System / Target Host
              </label>
              <div className="input-with-icon">
                <FiServer className="input-icon" />
                <input
                  id="case-target"
                  name="targetHost"
                  type="text"
                  className="form-input"
                  placeholder="e.g. WS-FINANCE-102 or IP"
                  value={formData.targetHost}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="case-desc" className="form-label">
              Initial Incident Scope & Triage Notes
            </label>
            <textarea
              id="case-desc"
              name="description"
              rows={3}
              className="form-textarea"
              placeholder="Detail observed IOCs, suspicious hash patterns, volatile memory artifacts, or C2 connections..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <FiLoader className="spin-icon" /> Creating Case...
                </>
              ) : (
                <>
                  <FiPlus /> Dispatch Investigation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
