// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Get JWT token from localStorage
const getToken = () => {
  return localStorage.getItem('jwt_token');
};

// Set JWT token in localStorage
export const setToken = (token) => {
  localStorage.setItem('jwt_token', token);
};

// Remove JWT token from localStorage
export const removeToken = () => {
  localStorage.removeItem('jwt_token');
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: async (token) => {
    setToken(token);
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
