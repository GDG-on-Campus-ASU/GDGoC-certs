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
      // Get code or token from URL
      const code = searchParams.get('code');
      const token = searchParams.get('token') || window.location.hash.replace('#token=', '');

      if (!token && !code) {
        setError('No authentication code or token received');
        return;
      }

      // If we have a code, exchange it for a token via backend
      let accessToken = token;
      if (code && !token) {
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
            throw new Error(errorData.error || 'Failed to exchange authorization code for token');
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
