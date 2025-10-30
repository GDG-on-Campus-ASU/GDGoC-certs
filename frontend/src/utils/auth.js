import { getToken } from '../services/api';

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Get OIDC login URL
export const getLoginURL = () => {
  // This should be configured based on your authentik setup
  const authentikURL = import.meta.env.VITE_AUTHENTIK_URL || 'https://auth.your-domain.com';
  const clientId = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'your-client-id';
  const redirectUri = `${window.location.origin}/auth/callback`;
  
  // Support both authorization code flow and implicit flow
  // Use 'id_token token' for implicit flow which returns tokens directly in URL fragment
  // This avoids the "Token exchange not implemented" error
  const responseType = import.meta.env.VITE_AUTHENTIK_RESPONSE_TYPE || 'id_token token';
  
  return `${authentikURL}/application/o/authorize/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${encodeURIComponent(responseType)}&scope=openid%20profile%20email`;
};

// Parse JWT token (without verification - verification happens on backend)
export const parseJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
};

export default {
  isAuthenticated,
  getLoginURL,
  parseJWT,
};
