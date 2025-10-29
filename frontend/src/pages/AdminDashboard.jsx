import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, certificateAPI, removeToken } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [certificates, setCertificates] = useState([]);

  // Single certificate form
  const [singleForm, setSingleForm] = useState({
    recipient_name: '',
    recipient_email: '',
    event_type: 'workshop',
    event_name: '',
  });

  // CSV upload
  const [csvContent, setCsvContent] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.user);
    } catch (error) {
      console.error('Failed to load user data:', error);
      handleLogout();
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const handleSingleFormChange = (e) => {
    setSingleForm({
      ...singleForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await certificateAPI.generate(singleForm);
      setMessage({
        type: 'success',
        text: `Certificate generated successfully! ID: ${response.certificate.unique_id}`,
      });
      setSingleForm({
        recipient_name: '',
        recipient_email: '',
        event_type: 'workshop',
        event_name: '',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to generate certificate',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await certificateAPI.generateBulk(csvContent);
      setMessage({
        type: 'success',
        text: `Successfully generated ${response.generated} certificates${
          response.failed > 0 ? `, ${response.failed} failed` : ''
        }`,
      });
      setCsvContent('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to generate certificates',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'recipient_name,recipient_email,event_type,event_name\nJohn Doe,john@example.com,workshop,Introduction to Web Development\nJane Smith,jane@example.com,course,Advanced React Patterns';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <div className="nav-content">
          <h1 className="nav-title">GDGoC Certificates</h1>
          <div className="nav-actions">
            {user && (
              <>
                <span className="user-info">{user.name}</span>
                <button onClick={() => navigate('/admin/settings')} className="nav-button">
                  Settings
                </button>
                <button onClick={handleLogout} className="nav-button logout">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Certificate Generator</h2>
          {user && <p>Organization: {user.org_name}</p>}
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
          >
            Single Certificate
          </button>
          <button
            className={`tab ${activeTab === 'bulk' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk')}
          >
            Bulk Upload
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'single' && (
            <form onSubmit={handleSingleSubmit} className="cert-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="recipient_name">Recipient Name *</label>
                  <input
                    type="text"
                    id="recipient_name"
                    name="recipient_name"
                    value={singleForm.recipient_name}
                    onChange={handleSingleFormChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recipient_email">Recipient Email</label>
                  <input
                    type="email"
                    id="recipient_email"
                    name="recipient_email"
                    value={singleForm.recipient_email}
                    onChange={handleSingleFormChange}
                    disabled={loading}
                  />
                  <small>Optional - email will be sent if provided</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="event_type">Event Type *</label>
                  <select
                    id="event_type"
                    name="event_type"
                    value={singleForm.event_type}
                    onChange={handleSingleFormChange}
                    required
                    disabled={loading}
                  >
                    <option value="workshop">Workshop</option>
                    <option value="course">Course</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="event_name">Event Name *</label>
                  <input
                    type="text"
                    id="event_name"
                    name="event_name"
                    value={singleForm.event_name}
                    onChange={handleSingleFormChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Certificate'}
              </button>
            </form>
          )}

          {activeTab === 'bulk' && (
            <div className="bulk-upload">
              <div className="bulk-header">
                <h3>CSV Bulk Upload</h3>
                <button onClick={downloadTemplate} className="template-button">
                  Download Template
                </button>
              </div>

              <form onSubmit={handleBulkSubmit}>
                <div className="form-group">
                  <label htmlFor="csv_content">CSV Content</label>
                  <textarea
                    id="csv_content"
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    rows="10"
                    placeholder="Paste your CSV content here or download the template..."
                    required
                    disabled={loading}
                  />
                  <small>Format: recipient_name,recipient_email,event_type,event_name</small>
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Certificates'}
                </button>
              </form>

              <div className="csv-info">
                <h4>CSV Format</h4>
                <ul>
                  <li>First row must be the header: recipient_name,recipient_email,event_type,event_name</li>
                  <li>Event type must be either "workshop" or "course"</li>
                  <li>Recipient email is optional</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
