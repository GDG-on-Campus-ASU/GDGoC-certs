import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './ProtectedRoute.css';

/**
 * Protected Route Component
 * 
 * With authentik Proxy Provider, authentication is enforced at the proxy level.
 * This component verifies the user session with the backend and handles
 * profile setup redirection if needed.
 */
const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Call login endpoint to verify session and get/create user
        const response = await authAPI.login();
        setUser(response.user);
        setLoading(false);
      } catch (err) {
        console.error('Authentication check failed:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    checkAuthentication();
  }, []);

  if (loading) {
    return (
      <div className="protected-route-container">
        <div className="spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="protected-route-container with-padding error-message">
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <p>Please contact your administrator if this issue persists.</p>
      </div>
    );
  }

  // Redirect to profile setup if org_name is not set
  if (user && !user.org_name && window.location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

export default ProtectedRoute;
