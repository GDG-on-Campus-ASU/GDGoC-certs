import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './ProfileSetup.css';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    org_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.org_name.trim()) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);

    try {
      await authAPI.updateProfile(formData);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-page">
      <div className="profile-setup-container">
        <div className="profile-setup-card">
          <div className="profile-setup-header">
            <h1>Complete Your Profile</h1>
            <p>Please provide your organization information to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="profile-setup-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Your Name (Optional)</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                disabled={loading}
              />
              <small>This name will appear as the issuer on certificates</small>
            </div>

            <div className="form-group">
              <label htmlFor="org_name">Organization Name *</label>
              <input
                type="text"
                id="org_name"
                name="org_name"
                value={formData.org_name}
                onChange={handleChange}
                placeholder="e.g., GDG on Campus - University Name"
                required
                disabled={loading}
              />
              <small>This cannot be changed later</small>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>

          <div className="profile-setup-note">
            <p><strong>Note:</strong> Your organization name will be displayed on all certificates you generate and cannot be changed once set.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
