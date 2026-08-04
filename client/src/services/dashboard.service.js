const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const dashboardService = {
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },

  /**
   * GET /api/dashboard/overview
   * Consolidated endpoint for performance optimization.
   */
  async getOverview() {
    const res = await fetch(`${API_URL}/dashboard/overview`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch dashboard overview.');
    }
    return data.data;
  },

  /**
   * GET /api/dashboard/stats
   */
  async getStats() {
    const res = await fetch(`${API_URL}/dashboard/stats`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch statistics.');
    }
    return data.data;
  },

  /**
   * GET /api/dashboard/recent-cases
   */
  async getRecentCases() {
    const res = await fetch(`${API_URL}/dashboard/recent-cases`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch recent cases.');
    }
    return data.data;
  },

  /**
   * GET /api/dashboard/recent-alerts
   */
  async getRecentAlerts() {
    const res = await fetch(`${API_URL}/dashboard/recent-alerts`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch recent alerts.');
    }
    return data.data;
  },

  /**
   * GET /api/dashboard/activity
   */
  async getActivity() {
    const res = await fetch(`${API_URL}/dashboard/activity`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch activity feed.');
    }
    return data.data;
  },

  /**
   * GET /api/dashboard/telemetry
   */
  async getTelemetry() {
    const res = await fetch(`${API_URL}/dashboard/telemetry`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch telemetry metrics.');
    }
    return data.data;
  },

  /**
   * GET /api/dashboard/charts
   */
  async getCharts() {
    const res = await fetch(`${API_URL}/dashboard/charts`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch charts data.');
    }
    return data.data;
  }
};
