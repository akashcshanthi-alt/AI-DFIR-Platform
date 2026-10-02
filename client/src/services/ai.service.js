const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const aiService = {
  /**
   * Check Ollama connectivity, model availability, and readiness status
   */
  async getReadiness() {
    const res = await fetch(`${API_URL}/ai/readiness`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to check AI readiness.');
    }
    return data.data;
  },

  /**
   * Start a LangGraph multi-stage forensic investigation workflow
   */
  async startInvestigation(caseId, options = {}) {
    const res = await fetch(`${API_URL}/ai/investigate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ caseId, ...options })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Investigation run failed.');
    }
    return data.data;
  },

  /**
   * List previous investigation runs for a case
   */
  async getInvestigationRuns(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    const res = await fetch(`${API_URL}/ai/runs?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch investigation runs.');
    }
    return data.data;
  },

  /**
   * Retrieve single investigation run with full hypothesis validation details
   */
  async getInvestigationRun(runId) {
    const res = await fetch(`${API_URL}/ai/runs/${encodeURIComponent(runId)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch investigation run.');
    }
    return data.data;
  },

  /**
   * Retrieve granular evidence records referenced by a run
   */
  async getReferencedEvidence(runId) {
    const res = await fetch(`${API_URL}/ai/runs/${encodeURIComponent(runId)}/evidence`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch referenced evidence.');
    }
    return data.data;
  },

  /**
   * Interactive AI Copilot chat for a case
   */
  async chatCopilot(caseId, messages) {
    const res = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ caseId, messages })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'AI Chat request failed.');
    }
    return data.data?.message;
  },

  /**
   * Run structured AI case analysis
   */
  async analyzeCase(caseId) {
    const res = await fetch(`${API_URL}/ai/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ caseId })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Case analysis failed.');
    }
    return data.data;
  }
};
