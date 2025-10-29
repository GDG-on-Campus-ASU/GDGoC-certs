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
      // In a real implementation, you would exchange the authorization code
      // for an access token here. For this example, we'll assume the token
      // is passed as a query parameter or hash fragment.
      
      // Get token from URL (adjust based on your authentik configuration)
      const code = searchParams.get('code');
      const token = searchParams.get('token') || window.location.hash.replace('#token=', '');

      if (!token && !code) {
        setError('No authentication token received');
        return;
      }

      // If we have a code, we need to exchange it for a token
      // This would typically be done by your backend
      if (code && !token) {
        setError('Token exchange not implemented. Please configure your OIDC provider to return tokens directly.');
        return;
      }

      setStatus('Validating credentials...');

      // Call backend login endpoint with the token
      const response = await authAPI.login(token);

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
