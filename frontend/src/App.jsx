import React from 'react';
import AdminApp from './components/AdminApp';
import PublicValidationPage from './pages/PublicValidationPage';

const App = () => {
  const hostname = window.location.hostname;
  
  // Get admin hostname from environment or use defaults
  const adminHostname = import.meta.env.VITE_ADMIN_HOSTNAME || 'sudo.certs-admin.certs.gdg-oncampus.dev';
  const publicHostname = import.meta.env.VITE_PUBLIC_HOSTNAME || 'certs.gdg-oncampus.dev';

  // Check if we're on the admin domain (or localhost for development)
  if (hostname === adminHostname || hostname === 'localhost') {
    return <AdminApp />;
  }

  // Check if we're on the public validation domain
  if (hostname === publicHostname) {
    return <PublicValidationPage />;
  }

  // Default to public validation page for any other hostname
  return <PublicValidationPage />;
};

export default App;
