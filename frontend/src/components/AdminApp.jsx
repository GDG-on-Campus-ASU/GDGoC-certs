import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProfileSetup from '../pages/ProfileSetup';
import AdminDashboard from '../pages/AdminDashboard';
import Settings from '../pages/Settings';
import ProtectedRoute from './ProtectedRoute';

/**
 * Admin App Component
 * 
 * With authentik Proxy Provider, authentication is handled at the proxy level.
 * Users are automatically redirected to authentik login by Nginx if not authenticated.
 * No need for login page or auth callback routes in the application.
 */
const AdminApp = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AdminApp;
