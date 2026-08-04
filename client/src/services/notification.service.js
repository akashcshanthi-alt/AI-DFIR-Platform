const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const notificationService = {
  /**
   * Get all notifications with query parameters
   * @param {Object} params - { search, type, priority, isRead, page, limit, sortBy, sortOrder }
   */
  async getNotifications(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });

    const queryString = query.toString();
    const url = `${API_URL}/notifications${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch notifications.');
    }
    return data.data; // { notifications, unreadCount, pagination }
  },

  /**
   * Get unread notifications
   */
  async getUnreadNotifications() {
    const response = await fetch(`${API_URL}/notifications/unread`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch unread notifications.');
    }
    return data.data; // { notifications, unreadCount }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id) {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to mark notification as read.');
    }
    return data.data; // { notification, unreadCount }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to mark all notifications as read.');
    }
    return data.data; // { unreadCount }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id) {
    const response = await fetch(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to delete notification.');
    }
    return data.data; // { unreadCount }
  }
};
