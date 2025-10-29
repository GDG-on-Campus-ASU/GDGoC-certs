import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateUniqueId, parseCSV } from '../utils/helpers.js';
import { sendCertificateEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * POST /api/certificates/generate
 * Generate a single certificate
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { sub: ocid } = req.user;
    const { recipient_name, recipient_email, event_type, event_name } = req.body;

    // Validation
    if (!recipient_name || !event_type || !event_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: recipient_name, event_type, event_name' 
      });
    }

    if (!['workshop', 'course'].includes(event_type)) {
      return res.status(400).json({ 
        error: 'event_type must be either "workshop" or "course"' 
      });
    }

    // Get user data for issuer_name and org_name
    const userData = await pool.query(
      'SELECT name, org_name FROM allowed_leaders WHERE ocid = $1',
      [ocid]
    );

    if (userData.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name: issuer_name, org_name } = userData.rows[0];

    if (!org_name) {
      return res.status(400).json({ 
        error: 'Please complete your profile setup before generating certificates' 
      });
    }

    // Generate unique certificate ID
    const unique_id = generateUniqueId();

    // Insert certificate into database
    const result = await pool.query(
      `INSERT INTO certificates 
       (unique_id, recipient_name, recipient_email, event_type, event_name, 
        issuer_name, org_name, generated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [unique_id, recipient_name, recipient_email, event_type, event_name, 
       issuer_name, org_name, ocid]
    );

    const certificate = result.rows[0];

    // Send email if recipient_email is provided
    if (recipient_email) {
      try {
        const validationUrl = `https://certs.gdg-oncampus.dev/?cert=${unique_id}`;
        await sendCertificateEmail({
          recipientEmail: recipient_email,
          recipientName: recipient_name,
          eventName: event_name,
          uniqueId: unique_id,
          validationUrl,
          pdfUrl: certificate.pdf_url,
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return res.status(201).json({
      success: true,
      certificate: {
        id: certificate.id,
        unique_id: certificate.unique_id,
        recipient_name: certificate.recipient_name,
        recipient_email: certificate.recipient_email,
        event_type: certificate.event_type,
        event_name: certificate.event_name,
        issue_date: certificate.issue_date,
        issuer_name: certificate.issuer_name,
        org_name: certificate.org_name,
      },
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/certificates/generate-bulk
 * Generate multiple certificates from CSV data
 */
router.post('/generate-bulk', authenticateToken, async (req, res) => {
  try {
    const { sub: ocid } = req.user;
    const { csv_content } = req.body;

    if (!csv_content) {
      return res.status(400).json({ error: 'CSV content is required' });
    }

    // Get user data
    const userData = await pool.query(
      'SELECT name, org_name FROM allowed_leaders WHERE ocid = $1',
      [ocid]
    );

    if (userData.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name: issuer_name, org_name } = userData.rows[0];

    if (!org_name) {
      return res.status(400).json({ 
        error: 'Please complete your profile setup before generating certificates' 
      });
    }

    // Parse CSV
    let certificateData;
    try {
      certificateData = parseCSV(csv_content);
    } catch (parseError) {
      return res.status(400).json({ error: parseError.message });
    }

    // Generate certificates
    const certificates = [];
    const errors = [];

    for (const data of certificateData) {
      try {
        const unique_id = generateUniqueId();

        const result = await pool.query(
          `INSERT INTO certificates 
           (unique_id, recipient_name, recipient_email, event_type, event_name, 
            issuer_name, org_name, generated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [unique_id, data.recipient_name, data.recipient_email, data.event_type, 
           data.event_name, issuer_name, org_name, ocid]
        );

        const certificate = result.rows[0];
        certificates.push(certificate);

        // Send email if recipient has email
        if (data.recipient_email) {
          try {
            const validationUrl = `https://certs.gdg-oncampus.dev/?cert=${unique_id}`;
            await sendCertificateEmail({
              recipientEmail: data.recipient_email,
              recipientName: data.recipient_name,
              eventName: data.event_name,
              uniqueId: unique_id,
              validationUrl,
              pdfUrl: certificate.pdf_url,
            });
          } catch (emailError) {
            console.error('Failed to send email to', data.recipient_email, emailError);
            // Don't fail the bulk operation if individual email fails
          }
        }
      } catch (certError) {
        console.error('Failed to generate certificate for', data.recipient_name, certError);
        errors.push({
          recipient_name: data.recipient_name,
          error: certError.message,
        });
      }
    }

    return res.status(201).json({
      success: true,
      generated: certificates.length,
      failed: errors.length,
      certificates: certificates.map(c => ({
        unique_id: c.unique_id,
        recipient_name: c.recipient_name,
        event_name: c.event_name,
      })),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Bulk generate error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/certificates
 * Get all certificates generated by the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { sub: ocid } = req.user;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, unique_id, recipient_name, recipient_email, event_type, 
              event_name, issue_date, issuer_name, org_name, pdf_url, created_at
       FROM certificates
       WHERE generated_by = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [ocid, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM certificates WHERE generated_by = $1',
      [ocid]
    );

    return res.json({
      certificates: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
