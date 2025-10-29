import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdminGroup } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/token
 * OAuth 2.0 token exchange endpoint
 * Exchanges authorization code for access token
 */
router.post('/token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Prepare token exchange request
    const tokenEndpoint = `${process.env.AUTHENTIK_ISSUER.replace(/\/$/, '')}/token/`;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`,
      client_id: process.env.AUTHENTIK_CLIENT_ID,
      client_secret: process.env.AUTHENTIK_CLIENT_SECRET,
    });

    // Exchange code for token
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Token exchange failed' }));
      console.error('Token exchange error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error || 'Failed to exchange authorization code for token' 
      });
    }

    const tokenData = await response.json();
    
    // Return the access token to the frontend
    return res.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ error: 'Internal server error during token exchange' });
  }
});

/**
 * POST /api/auth/login
 * Login endpoint - validates JWT and provisions user in database
 * Requires valid JWT token with GDGoC-Admins group membership
 */
router.post('/login', authenticateToken, requireAdminGroup, async (req, res) => {
  try {
    const { sub: ocid, name, email } = req.user;

    if (!ocid || !email) {
      return res.status(400).json({ error: 'Invalid token: missing required claims' });
    }

    // Check if user exists in allowed_leaders
    const existingUser = await pool.query(
      'SELECT * FROM allowed_leaders WHERE ocid = $1',
      [ocid]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      
      // Check if user can login
      if (!user.can_login) {
        return res.status(403).json({ 
          error: 'Access denied. Your account has been disabled.' 
        });
      }

      // Return existing user data
      return res.json({
        success: true,
        user: {
          ocid: user.ocid,
          name: user.name,
          email: user.email,
          org_name: user.org_name,
          can_login: user.can_login,
        },
      });
    }

    // User doesn't exist - create new leader with org_name as NULL
    const newUser = await pool.query(
      `INSERT INTO allowed_leaders (ocid, name, email, org_name, can_login)
       VALUES ($1, $2, $3, NULL, true)
       RETURNING *`,
      [ocid, name || email, email]
    );

    // Log new user provisioning for audit/notification purposes
    console.log('NEW USER AUTO-PROVISIONED:', {
      ocid: newUser.rows[0].ocid,
      name: newUser.rows[0].name,
      email: newUser.rows[0].email,
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      user: {
        ocid: newUser.rows[0].ocid,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
        org_name: newUser.rows[0].org_name,
        can_login: newUser.rows[0].can_login,
      },
      message: 'New user created. Please complete your profile setup.',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { sub: ocid } = req.user;

    const result = await pool.query(
      'SELECT ocid, name, email, org_name, can_login FROM allowed_leaders WHERE ocid = $1',
      [ocid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (name and org_name)
 * org_name can only be set once (if currently NULL)
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { sub: ocid } = req.user;
    const { name, org_name } = req.body;

    // Get current user data
    const currentUser = await pool.query(
      'SELECT * FROM allowed_leaders WHERE ocid = $1',
      [ocid]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = currentUser.rows[0];

    // Prepare update fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    // org_name can only be set if it's currently NULL
    if (org_name !== undefined) {
      if (user.org_name !== null) {
        return res.status(400).json({ 
          error: 'Organization name cannot be changed once set' 
        });
      }
      updates.push(`org_name = $${paramCount}`);
      values.push(org_name);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(ocid);
    const query = `
      UPDATE allowed_leaders 
      SET ${updates.join(', ')}
      WHERE ocid = $${paramCount}
      RETURNING ocid, name, email, org_name, can_login
    `;

    const result = await pool.query(query, values);

    return res.json({
      success: true,
      user: result.rows[0],
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
