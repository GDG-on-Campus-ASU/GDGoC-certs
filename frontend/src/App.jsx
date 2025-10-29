import React from 'react';
import AdminApp from './components/AdminApp';
import PublicValidationPage from './pages/PublicValidationPage';

const App = () => {
  const hostname = window.location.hostname;

  // Check if we're on the admin domain
  if (hostname === 'sudo.certs-admin.certs.gdg-oncampus.dev' || hostname === 'localhost') {
    return <AdminApp />;
  }

  // Check if we're on the public validation domain
  if (hostname === 'certs.gdg-oncampus.dev') {
    return <PublicValidationPage />;
  }

  // Default to public validation page for any other hostname
  return <PublicValidationPage />;
};

export default App;
