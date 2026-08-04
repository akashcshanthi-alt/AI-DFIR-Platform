const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const evidenceService = {
  /**
   * Get evidence catalog
   */
  async getEvidence(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });

    const response = await fetch(`${API_URL}/evidence?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to retrieve evidence catalog.');
    }
    return data; // returns { success: true, data: items, pagination }
  },

  /**
   * Fetch all evidence related to a specific case sequential ID
   */
  async getEvidenceByCase(caseId) {
    const response = await fetch(`${API_URL}/evidence/case/${caseId}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || `Failed to retrieve evidence for case ${caseId}`);
    }
    return data.data; // returns items array
  },

  /**
   * Get single evidence metadata by ID
   */
  async getEvidenceById(id) {
    const response = await fetch(`${API_URL}/evidence/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to retrieve evidence item details.');
    }
    return data.data;
  },

  /**
   * Securely upload forensic evidence files using XMLHttpRequest to report progress
   * @param {FormData} formData - Multipart data holding target files
   * @param {Function} onProgress - Progress callback function (percent)
   */
  uploadEvidence(formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/evidence/upload`);

      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        });
      }

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(res.data);
          } else {
            reject(new Error(res.error?.message || 'Forensic file ingestion failed.'));
          }
        } catch (err) {
          reject(new Error('Invalid response structure from backend.'));
        }
      };

      xhr.onerror = () => reject(new Error('Network communication error.'));
      xhr.send(formData);
    });
  },

  /**
   * Update evidence details
   */
  async updateEvidence(id, payload) {
    const response = await fetch(`${API_URL}/evidence/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update evidence metadata.');
    }
    return data.data;
  },

  /**
   * Download evidence file as a secure binary blob
   */
  async downloadEvidence(id, fileName) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/evidence/${id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Forensic download failed.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'evidence_attachment');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Delete evidence
   */
  async deleteEvidence(id) {
    const response = await fetch(`${API_URL}/evidence/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to delete forensic evidence.');
    }
    return data;
  }
};
