const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const auditService = {
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },

  /**
   * GET /api/audit-logs
   * Query logs with pagination, sorting, search, and filters.
   */
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });

    const res = await fetch(`${API_URL}/audit-logs?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch audit logs.');
    }
    return data.data;
  },

  /**
   * GET /api/audit-logs/:id
   */
  async getAuditLogById(id) {
    const res = await fetch(`${API_URL}/audit-logs/${id}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch audit log detail.');
    }
    return data.data;
  },

  /**
   * DELETE /api/audit-logs/:id
   */
  async deleteAuditLog(id) {
    const res = await fetch(`${API_URL}/audit-logs/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to delete audit log entry.');
    }
    return data;
  },

  /**
   * POST /api/audit-logs/export
   * Return the response raw binary blob stream (CSV or PDF).
   */
  async exportAuditLogs(format, filters = {}) {
    const res = await fetch(`${API_URL}/audit-logs/export`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ format, ...filters })
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error?.message || 'Failed to export audit logs.');
    }
    
    return res.blob();
  }
};
