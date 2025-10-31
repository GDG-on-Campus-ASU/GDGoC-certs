/**
 * Authentication utilities for authentik Proxy Provider
 * 
 * With proxy authentication, the frontend doesn't need to manage tokens
 * or handle OAuth/OIDC flows. Authentication is handled by Nginx Proxy Manager
 * with authentik, and the backend receives user info from proxy headers.
 */

// Check if user is authenticated by checking if we have user session
// This is simplified - we just need to verify with backend
export const isAuthenticated = () => {
  // With proxy auth, if the user can access the page, they're authenticated
  // We'll verify with backend on first API call
  return true; // Session is managed by proxy
};

export default {
  isAuthenticated,
};
