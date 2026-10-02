const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const iocService = {
  /**
   * Run IOC detection on forensic evidence for a specific case
   */
  async detectIOCs(caseId, batchId = null) {
    const res = await fetch(`${API_URL}/ioc/detect`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ caseId, batchId })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to execute IOC detection.');
    }
    return data.data;
  },

  /**
   * Fetch paginated and filtered list of IOCs
   */
  async getIOCs(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    const res = await fetch(`${API_URL}/ioc?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch IOCs.');
    }
    return data.data;
  },

  /**
   * Fetch aggregate IOC metrics for a case
   */
  async getIOCStats(caseId) {
    const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : '';
    const res = await fetch(`${API_URL}/ioc/stats${query}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch IOC statistics.');
    }
    return data.data;
  },

  /**
   * Fetch details for a specific IOC finding
   */
  async getIOCById(id) {
    const res = await fetch(`${API_URL}/ioc/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch IOC details.');
    }
    return data.data;
  },

  /**
   * Update investigation status and review notes for an IOC
   */
  async updateIOCStatus(id, status, notes = '') {
    const res = await fetch(`${API_URL}/ioc/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to update IOC status.');
    }
    return data.data;
  }
};

export default iocService;
