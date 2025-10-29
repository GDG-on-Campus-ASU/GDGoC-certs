import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, removeToken } from '../services/api';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.user);
      setFormData({ name: response.user.name });
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await authAPI.updateProfile({ name: formData.name });
      setMessage({
        type: 'success',
        text: 'Profile updated successfully',
      });
      loadUserData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <div className="settings-page">
      <nav className="admin-nav">
        <div className="nav-content">
          <h1 className="nav-title">GDGoC Certificates</h1>
          <div className="nav-actions">
            <button onClick={() => navigate('/admin')} className="nav-button">
              Dashboard
            </button>
            <button onClick={handleLogout} className="nav-button logout">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="settings-container">
        <div className="settings-header">
          <h2>Account Settings</h2>
          <p>Manage your profile and preferences</p>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-content">
          <div className="settings-section">
            <h3>Profile Information</h3>
            
            {user && (
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <small>This name will appear as the issuer on certificates</small>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                  />
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    value={user.org_name}
                    disabled
                  />
                  <small>Organization name cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>User ID (OCID)</label>
                  <input
                    type="text"
                    value={user.ocid}
                    disabled
                  />
                  <small>Your unique authentik identifier</small>
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>

          <div className="settings-section danger-zone">
            <h3>Danger Zone</h3>
            <p>Once you logout, you'll need to sign in again to access your account.</p>
            <button onClick={handleLogout} className="danger-button">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
