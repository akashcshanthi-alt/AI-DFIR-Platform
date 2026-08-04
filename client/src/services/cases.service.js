const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Case Management Service
 * Communicates with the Express API server for Case-related operations.
 */
export const casesService = {
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },

  /**
   * GET /api/cases
   * Fetch cases list with query params (search, status, severity, page, limit, sortBy, sortOrder)
   */
  async getCases(params = {}) {
    const url = new URL(`${API_URL}/cases`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to retrieve cases.');
    }
    return data;
  },

  /**
   * GET /api/cases/:id
   */
  async getCaseById(id) {
    const response = await fetch(`${API_URL}/cases/${id}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || `Failed to retrieve case [${id}].`);
    }
    return data.data;
  },

  /**
   * POST /api/cases
   */
  async createCase(caseData) {
    const response = await fetch(`${API_URL}/cases`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(caseData)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to initiate case.');
    }
    return data.data;
  },

  /**
   * PUT /api/cases/:id
   */
  async updateCase(id, caseData) {
    const response = await fetch(`${API_URL}/cases/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(caseData)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update case.');
    }
    return data.data;
  },

  /**
   * DELETE /api/cases/:id
   */
  async deleteCase(id) {
    const response = await fetch(`${API_URL}/cases/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to delete case.');
    }
    return data;
  }
};
