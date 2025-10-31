/**
 * Authentication Middleware for authentik Proxy Provider
 * 
 * This middleware reads user information from HTTP headers set by
 * authentik proxy provider through Nginx Proxy Manager forward authentication.
 * 
 * Expected headers:
 * - X-authentik-username: Username
 * - X-authentik-email: User email
 * - X-authentik-name: User full name
 * - X-authentik-uid: User unique ID
 * - X-authentik-groups: Comma-separated list of groups
 */

/**
 * Middleware to authenticate user from proxy headers
 * Reads user information from headers set by authentik proxy provider
 */
export const authenticateFromProxy = async (req, res, next) => {
  // Read authentication headers set by authentik proxy
  const username = req.headers['x-authentik-username'];
  const email = req.headers['x-authentik-email'];
  const name = req.headers['x-authentik-name'];
  const uid = req.headers['x-authentik-uid'];
  const groupsHeader = req.headers['x-authentik-groups'];

  // Check if required headers are present
  if (!email || !uid) {
    console.error('Missing required authentik headers:', {
      hasEmail: !!email,
      hasUid: !!uid,
      hasUsername: !!username,
    });
    return res.status(401).json({ 
      error: 'Authentication required. Please ensure you are accessing through the authenticated proxy.' 
    });
  }

  // Parse groups from comma-separated string
  const groups = groupsHeader ? groupsHeader.split(',').map(g => g.trim()) : [];

  // Attach user information to request
  req.user = {
    sub: uid,           // Use uid as subject (similar to JWT sub claim)
    ocid: uid,          // Kept for backward compatibility: some legacy consumers expect 'ocid' instead of 'sub'.
                        // Remove this field only after all dependent code and clients have migrated to using 'sub'.
    email: email,
    name: name || email, // Fallback to email if name is not provided
    username: username || email,
    groups: groups,
  };

  console.log('Authenticated user from proxy headers:', {
    uid: req.user.sub,
    email: req.user.email,
    groups: req.user.groups,
  });

  next();
};

/**
 * Middleware to check if user is in GDGoC-Admins group
 * This check is enforced at the proxy level via authentik policies,
 * but we keep this as an additional validation layer
 */
export const requireAdminGroup = (req, res, next) => {
  const groups = req.user?.groups || [];
  
  // Check if user is in GDGoC-Admins group
  if (!groups.includes('GDGoC-Admins')) {
    console.warn('Access denied: User not in GDGoC-Admins group:', {
      uid: req.user?.sub,
      email: req.user?.email,
      groups: groups,
    });
    return res.status(403).json({ 
      error: 'Access denied. GDGoC-Admins group membership required.' 
    });
  }
  
  next();
};

// Backward compatibility: export authenticateFromProxy as authenticateToken
// This allows existing code to continue working without changes
export const authenticateToken = authenticateFromProxy;
