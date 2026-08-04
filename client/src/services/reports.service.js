const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const reportsService = {
  /**
   * Get reports catalog
   * @param {Object} params - { search, format, reportType, page, limit, sortBy, sortOrder }
   */
  async getReports(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });

    const response = await fetch(`${API_URL}/reports?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to retrieve reports catalog.');
    }
    return data; // returns { success: true, data: reports, pagination }
  },

  /**
   * Generate report
   * @param {Object} payload - { title, caseId, format, reportType }
   */
  async generateReport(payload) {
    const response = await fetch(`${API_URL}/reports/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to synthesize report.');
    }
    return data.data; // returns report details
  },

  /**
   * Get report metadata details by ID
   */
  async getReportById(id) {
    const response = await fetch(`${API_URL}/reports/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch report metadata.');
    }
    return data.data;
  },

  /**
   * Securely download report file as a blob
   */
  async downloadReport(id, fileName) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/reports/${id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Physical report file download failed.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Default to pdf or csv depending on file extension
    link.setAttribute('download', fileName || `report_${id}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Delete report
   */
  async deleteReport(id) {
    const response = await fetch(`${API_URL}/reports/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to delete report.');
    }
    return data;
  }
};
