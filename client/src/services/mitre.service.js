const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const mitreService = {
  /**
   * Deterministically generate or refresh candidate MITRE ATT&CK mappings for a case
   */
  async generateMappings(caseId) {
    const res = await fetch(`${API_URL}/mitre/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ caseId })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to generate MITRE ATT&CK mappings.');
    }
    return data.data;
  },

  /**
   * Fetch paginated and filtered MITRE ATT&CK technique mappings
   */
  async getMappings(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    const res = await fetch(`${API_URL}/mitre?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch MITRE mappings.');
    }
    return data.data;
  },

  /**
   * Fetch case-level MITRE ATT&CK metrics, coverage, and breakdown
   */
  async getMappingStats(caseId) {
    const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : '';
    const res = await fetch(`${API_URL}/mitre/stats${query}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch MITRE stats.');
    }
    return data.data;
  },

  /**
   * Retrieve single mapping details with complete provenance
   */
  async getMappingById(mappingId) {
    const res = await fetch(`${API_URL}/mitre/${encodeURIComponent(mappingId)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch mapping details.');
    }
    return data.data;
  },

  /**
   * Transition mapping status (Analyst Review, Confirm, Reject)
   */
  async updateMappingStatus(mappingId, status, notes = '') {
    const res = await fetch(`${API_URL}/mitre/${encodeURIComponent(mappingId)}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to update mapping status.');
    }
    return data.data;
  },

  /**
   * Fetch verified MITRE catalog provenance metadata and standard tactics
   */
  async getCatalogInfo() {
    const res = await fetch(`${API_URL}/mitre/catalog`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch catalog info.');
    }
    return data.data;
  }
};
