/**
 * API Service for GDGoC Certificate Generator
 * 
 * With authentik Proxy Provider, authentication is handled at the proxy level.
 * The frontend doesn't need to manage tokens - authentication headers are
 * automatically added by the proxy before requests reach the backend.
 */

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // No Authorization header needed - authentication via proxy headers
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for session management
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  // Login - verify session with backend (no token needed, uses proxy headers)
  login: async () => {
    return apiRequest('/api/auth/login', { method: 'POST' });
  },
  
  getMe: async () => {
    return apiRequest('/api/auth/me');
  },
  
  updateProfile: async (data) => {
    return apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Certificate API
export const certificateAPI = {
  generate: async (data) => {
    return apiRequest('/api/certificates/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  generateBulk: async (csvContent) => {
    return apiRequest('/api/certificates/generate-bulk', {
      method: 'POST',
      body: JSON.stringify({ csv_content: csvContent }),
    });
  },
  
  list: async (page = 1, limit = 50) => {
    return apiRequest(`/api/certificates?page=${page}&limit=${limit}`);
  },
};

// Validate API (public)
export const validateAPI = {
  validate: async (uniqueId) => {
    return apiRequest(`/api/validate/${uniqueId}`);
  },
};

export default {
  auth: authAPI,
  certificate: certificateAPI,
  validate: validateAPI,
};
