const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const timelineService = {
  /**
   * Generate or refresh the forensic timeline for a case
   */
  async generateTimeline(caseId) {
    const res = await fetch(`${API_URL}/timeline/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ caseId })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to generate timeline.');
    }
    return data.data;
  },

  /**
   * Fetch paginated and filtered timeline events
   */
  async getTimelineEvents(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    const res = await fetch(`${API_URL}/timeline?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch timeline events.');
    }
    return data.data;
  },

  /**
   * Fetch aggregate metrics and bounds for a case timeline
   */
  async getTimelineStats(caseId) {
    const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : '';
    const res = await fetch(`${API_URL}/timeline/stats${query}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch timeline statistics.');
    }
    return data.data;
  },

  /**
   * Fetch details and complete evidence provenance of a specific timeline event
   */
  async getTimelineEventById(id) {
    const res = await fetch(`${API_URL}/timeline/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to fetch timeline event details.');
    }
    return data.data;
  }
};

export default timelineService;
