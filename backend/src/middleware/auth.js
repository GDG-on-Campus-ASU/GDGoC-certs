import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Cache max age for JWKS client (6 hours)
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

// Create JWKS client for authentik
const client = jwksClient({
  jwksUri: process.env.AUTHENTIK_JWKS_URI,
  cache: true,
  cacheMaxAge: CACHE_MAX_AGE_MS,
});

// Get signing key from JWKS
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

// Middleware to validate JWT token
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify token
    jwt.verify(
      token,
      getKey,
      {
        audience: process.env.AUTHENTIK_AUDIENCE,
        issuer: process.env.AUTHENTIK_ISSUER,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          console.error('JWT verification error:', err);
          return res.status(403).json({ error: 'Invalid or expired token' });
        }

        // Attach decoded token to request
        req.user = decoded;
        next();
      }
    );
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is in GDGoC-Admins group
export const requireAdminGroup = (req, res, next) => {
  const groups = req.user?.groups || [];
  
  if (!groups.includes('GDGoC-Admins')) {
    return res.status(403).json({ error: 'Access denied. Admin group membership required.' });
  }
  
  next();
};
