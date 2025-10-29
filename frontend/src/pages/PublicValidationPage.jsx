import React, { useState } from 'react';
import { validateAPI } from '../services/api';
import './PublicValidationPage.css';

const PublicValidationPage = () => {
  const [uniqueId, setUniqueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Check for cert parameter in URL on component mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const certId = params.get('cert');
    if (certId) {
      setUniqueId(certId);
      handleValidate(certId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidate = async (certId = null) => {
    const idToValidate = certId || uniqueId.trim();
    
    if (!idToValidate) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await validateAPI.validate(idToValidate);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to validate certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleValidate();
  };

  return (
    <div className="validation-page">
      <div className="validation-container">
        <div className="header">
          <h1>GDGoC Certificate Validation</h1>
          <p>Enter your certificate ID to validate its authenticity</p>
        </div>

        <form onSubmit={handleSubmit} className="validation-form">
          <div className="input-group">
            <input
              type="text"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              placeholder="Enter Certificate ID (e.g., GDGOC-20240101-A1B2C)"
              className="cert-input"
              disabled={loading}
            />
            <button type="submit" className="validate-button" disabled={loading}>
              {loading ? 'Validating...' : 'Validate'}
            </button>
          </div>
        </form>

        {error && (
          <div className="result-card error">
            <div className="result-icon">❌</div>
            <h2>Certificate Not Found</h2>
            <p>{error}</p>
          </div>
        )}

        {result && result.valid && (
          <div className="result-card success">
            <div className="result-icon">✓</div>
            <h2>Valid Certificate</h2>
            <div className="certificate-details">
              <div className="detail-row">
                <span className="detail-label">Certificate ID:</span>
                <span className="detail-value">{result.certificate.unique_id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Recipient:</span>
                <span className="detail-value">{result.certificate.recipient_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Event:</span>
                <span className="detail-value">{result.certificate.event_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{result.certificate.event_type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Issue Date:</span>
                <span className="detail-value">
                  {new Date(result.certificate.issue_date).toLocaleDateString()}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Issued By:</span>
                <span className="detail-value">{result.certificate.issuer_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Organization:</span>
                <span className="detail-value">{result.certificate.org_name}</span>
              </div>
              {result.certificate.pdf_url && (
                <div className="detail-row">
                  <a 
                    href={result.certificate.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="download-button"
                  >
                    Download Certificate PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="footer">
          <p>This certificate validation system is powered by GDGoC</p>
        </div>
      </div>
    </div>
  );
};

export default PublicValidationPage;
