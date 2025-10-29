import React, { useState } from 'react';
import { getLoginURL } from '../utils/auth';
import './LoginPage.css';

const LoginPage = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogin = () => {
    setIsRedirecting(true);
    const loginURL = getLoginURL();
    window.location.href = loginURL;
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>GDGoC Certificate System</h1>
            <p>Admin Portal</p>
          </div>
          
          <div className="login-content">
            <p className="login-description">
              Sign in with your GDGoC admin account to generate and manage certificates.
            </p>
            
            <button 
              className="login-button" 
              onClick={handleLogin}
              disabled={isRedirecting}
            >
              {isRedirecting ? 'Redirecting...' : 'Sign in with authentik'}
            </button>
            
            <div className="login-info">
              <p>Only authorized GDGoC leaders can access this portal.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
