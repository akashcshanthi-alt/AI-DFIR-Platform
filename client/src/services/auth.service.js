const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const extractErrorMessage = (data, defaultMessage) => {
  if (data?.error?.details && Array.isArray(data.error.details) && data.error.details.length > 0) {
    return data.error.details[0].message || data.error.message || defaultMessage;
  }
  return data?.error?.message || defaultMessage;
};

/**
 * Authentication Service
 * Communicates with the Express API server and manages local session credentials securely.
 */
export const authService = {
  /**
   * Store JWT access token in localStorage.
   */
  setToken(token) {
    localStorage.setItem('token', token);
  },

  getToken() {
    return localStorage.getItem('token');
  },

  setRefreshToken(token) {
    localStorage.setItem('refreshToken', token);
  },

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },

  /**
   * Reset all authentication keys and session variables.
   */
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('operatorName');
    localStorage.removeItem('operatorEmail');
    localStorage.removeItem('operatorRole');
    localStorage.removeItem('operatorAvatar');
    localStorage.removeItem('operatorOrg');
    localStorage.removeItem('rememberMe');
  },

  /**
   * Checks if user has a valid, unexpired token.
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        this.clearAuth();
        return false;
      }
      return localStorage.getItem('isAuthenticated') === 'true';
    } catch {
      this.clearAuth();
      return false;
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(email, password, remember = true) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(extractErrorMessage(data, 'Login failed. Invalid credentials.'));
    }

    // Capture response keys
    this.setToken(data.token);
    this.setRefreshToken(data.refreshToken);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('rememberMe', remember ? 'true' : 'false');
    localStorage.setItem('operatorName', data.user.fullName);
    localStorage.setItem('operatorEmail', data.user.email);
    localStorage.setItem('operatorRole', data.user.role);
    localStorage.setItem('operatorAvatar', data.user.profileImage || '');
    localStorage.setItem('operatorOrg', data.user.department || '');

    return data;
  },

  /**
   * POST /api/auth/google
   * Authenticate using cryptographic ID token
   */
  async googleLogin(idToken) {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idToken })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(extractErrorMessage(data, 'Google SSO login failed.'));
    }

    // Capture response keys
    this.setToken(data.token);
    this.setRefreshToken(data.refreshToken);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('operatorName', data.user.fullName);
    localStorage.setItem('operatorEmail', data.user.email);
    localStorage.setItem('operatorRole', data.user.role);
    localStorage.setItem('operatorAvatar', data.user.profileImage || '');
    localStorage.setItem('operatorOrg', data.user.department || '');

    return data;
  },

  /**
   * POST /api/auth/register
   */
  async register(fullName, email, password, role, department) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName,
        email,
        password,
        role,
        department
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(extractErrorMessage(data, 'Registration failed.'));
    }

    return data;
  },

  /**
   * POST /api/auth/verify-email
   */
  async verifyEmail(token) {
    const response = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(extractErrorMessage(data, 'Verification token is invalid or has expired.'));
    }

    return data;
  },

  /**
   * POST /api/auth/resend-verification
   */
  async resendVerification(email) {
    const response = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(extractErrorMessage(data, 'Failed to resend verification link.'));
    }

    return data;
  },

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(email) {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(extractErrorMessage(data, 'Failed to dispatch reset link.'));
    }

    return data;
  },

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(token, password) {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, password })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(extractErrorMessage(data, 'Reset password operation failed.'));
    }

    return data;
  },

  /**
   * GET /api/auth/profile
   */
  async getProfile() {
    const token = this.getToken();
    if (!token) throw new Error('Clearance token is missing.');

    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      if (response.status === 401) {
        this.clearAuth();
      }
      throw new Error(data.error?.message || 'Failed to verify operator profile.');
    }

    return data;
  },

  /**
   * PUT /api/users/profile
   */
  async updateProfile(fullName, department, phone, profileImage) {
    const token = this.getToken();
    if (!token) throw new Error('Clearance token is missing.');

    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName,
        department,
        phone,
        profileImage
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      if (response.status === 401) {
        this.clearAuth();
      }
      throw new Error(data.error?.message || 'Profile update rejected.');
    }

    // Refresh active details in local storage
    if (data.data) {
      localStorage.setItem('operatorName', data.data.fullName);
      localStorage.setItem('operatorEmail', data.data.email);
      localStorage.setItem('operatorOrg', data.data.department || '');
      localStorage.setItem('operatorAvatar', data.data.profileImage || '');
      localStorage.setItem('operatorRole', data.data.role);
    }

    return data;
  },

  /**
   * POST /api/auth/logout
   */
  async logout() {
    const token = this.getToken();
    try {
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.warn('Network issue during logout:', err);
    } finally {
      this.clearAuth();
    }
  }
};
