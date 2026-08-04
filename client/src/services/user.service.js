const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const userService = {
  /**
   * GET /api/users
   * Paginated list of operators with search/filtering parameters.
   */
  async getUsers(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });

    const response = await fetch(`${API_URL}/users?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to retrieve operator listing.');
    }
    return data; // Returns { success, data, pagination }
  },

  /**
   * GET /api/users/:id
   */
  async getUserById(id) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to retrieve operator details.');
    }
    return data.data;
  },

  /**
   * PUT /api/users/:id
   */
  async updateUser(id, payload) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update operator details.');
    }
    return data.data;
  },

  /**
   * DELETE /api/users/:id
   */
  async deleteUser(id) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to remove operator account.');
    }
    return data;
  },

  /**
   * PUT /api/users/:id/role
   */
  async updateUserRole(id, role) {
    const response = await fetch(`${API_URL}/users/${id}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update operator role.');
    }
    return data.data;
  },

  /**
   * PUT /api/users/:id/status
   */
  async updateUserStatus(id, status) {
    const response = await fetch(`${API_URL}/users/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update operator status.');
    }
    return data.data;
  },

  /**
   * PUT /api/users/profile/password
   */
  async changePassword(currentPassword, newPassword) {
    const response = await fetch(`${API_URL}/users/profile/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update clearance key.');
    }
    return data;
  }
};
