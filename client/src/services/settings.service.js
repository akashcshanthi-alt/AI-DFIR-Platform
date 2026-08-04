const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const settingsService = {
  /**
   * GET /api/settings
   */
  async getSettings() {
    const response = await fetch(`${API_URL}/settings`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to retrieve configuration settings.');
    }
    return data.data;
  },

  /**
   * PUT /api/settings
   * @param {Object} payload - Complete settings structure
   */
  async updateSettings(payload) {
    const response = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to persist configuration settings.');
    }
    return data.data;
  }
};
