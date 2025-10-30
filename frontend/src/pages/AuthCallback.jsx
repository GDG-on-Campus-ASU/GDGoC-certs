import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import './AuthCallback.css';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get code or token from URL (support both authorization code and implicit flows)
      const code = searchParams.get('code');
      
      // Parse tokens from URL fragment (implicit flow)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessTokenFromHash = hashParams.get('access_token');
      const idTokenFromHash = hashParams.get('id_token');
      
      // Also check query params for backward compatibility
      const tokenFromQuery = searchParams.get('token');

      // Determine which token to use
      let accessToken = idTokenFromHash || accessTokenFromHash || tokenFromQuery;

      if (!accessToken && !code) {
        setError('No authentication code or token received from authentik');
        return;
      }

      // If we have a code, exchange it for a token via backend (authorization code flow)
      if (code && !accessToken) {
        setStatus('Exchanging authorization code...');

        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
          setError('API URL is not configured. Please contact support.');
          return;
        }

        try {
          const response = await fetch(`${apiUrl}/api/auth/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              redirect_uri: `${window.location.origin}/auth/callback`,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Token exchange failed' }));
            const errorMessage = errorData.error || 'Failed to exchange authorization code for token';
            
            // Provide helpful guidance for token exchange errors
            const helpText = errorMessage.includes('Token exchange not implemented') || errorMessage.includes('token exchange')
              ? '\n\nThis error typically occurs when using authorization code flow without proper backend configuration. To fix this:\n1. Set VITE_AUTHENTIK_RESPONSE_TYPE=id_token token in your .env file\n2. Or configure authentik with Client Type: Confidential and set AUTHENTIK_CLIENT_SECRET in backend'
              : '';
            
            throw new Error(errorMessage + helpText);
          }

          const tokenData = await response.json();
          accessToken = tokenData.access_token;
        } catch (err) {
          console.error('Token exchange error:', err);
          setError(err.message || 'Failed to exchange authorization code for token');
          return;
        }
      }

      setStatus('Validating credentials...');

      // Call backend login endpoint with the token
      const response = await authAPI.login(accessToken);

      setStatus('Authentication successful!');

      // Check if user needs to complete profile setup
      if (!response.user.org_name) {
        navigate('/profile-setup');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="auth-callback-page">
      <div className="callback-container">
        {error ? (
          <div className="callback-card error">
            <div className="callback-icon">❌</div>
            <h2>Authentication Failed</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/login')} className="retry-button">
              Back to Login
            </button>
          </div>
        ) : (
          <div className="callback-card loading">
            <div className="spinner"></div>
            <h2>{status}</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
