const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const aiService = {
  /**
   * Run full AI incident correlation analysis
   * @param {string} caseId - Sequential case ID
   */
  async analyzeCase(caseId) {
    const response = await fetch(`${API_URL}/ai/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ caseId })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to complete AI Incident Correlation.');
    }
    return data.data; // Returns full analysis payload
  },

  /**
   * Send chat message prompt to the AI security assistant
   * @param {string} caseId - Sequential case ID
   * @param {Array} messages - Chat logs history
   */
  async chatCopilot(caseId, messages) {
    const response = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ caseId, messages })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to generate chat response.');
    }
    return data.data.message; // Returns assistant message { role, content, timestamp }
  },

  /**
   * Get executive summary summary
   */
  async summarizeCase(caseId) {
    const response = await fetch(`${API_URL}/ai/summarize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ caseId })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to retrieve quick summary.');
    }
    return data.data.summary;
  },

  /**
   * Get recommended response actions mitigations
   */
  async recommendMitigations(caseId) {
    const response = await fetch(`${API_URL}/ai/recommendations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ caseId })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch recommendations.');
    }
    return data.data.recommendations;
  },

  /**
   * Extract indicators of compromise (IOCs)
   */
  async detectIOCs(caseId) {
    const response = await fetch(`${API_URL}/ai/ioc-detection`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ caseId })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to run IOC detection.');
    }
    return data.data.iocs;
  }
};
