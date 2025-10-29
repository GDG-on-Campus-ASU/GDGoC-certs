import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

/**
 * GET /api/validate/:unique_id
 * Public endpoint to validate a certificate by its unique ID
 */
router.get('/:unique_id', async (req, res) => {
  try {
    const { unique_id } = req.params;

    if (!unique_id) {
      return res.status(400).json({ error: 'Certificate ID is required' });
    }

    const result = await pool.query(
      `SELECT unique_id, recipient_name, recipient_email, event_type, 
              event_name, issue_date, issuer_name, org_name, pdf_url
       FROM certificates
       WHERE unique_id = $1`,
      [unique_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Certificate not found',
        message: 'No certificate exists with this ID. Please check the ID and try again.'
      });
    }

    const certificate = result.rows[0];

    return res.json({
      valid: true,
      certificate: {
        unique_id: certificate.unique_id,
        recipient_name: certificate.recipient_name,
        event_type: certificate.event_type,
        event_name: certificate.event_name,
        issue_date: certificate.issue_date,
        issuer_name: certificate.issuer_name,
        org_name: certificate.org_name,
        pdf_url: certificate.pdf_url,
      },
    });
  } catch (error) {
    console.error('Validate certificate error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
