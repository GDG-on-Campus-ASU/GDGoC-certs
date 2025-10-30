# Troubleshooting Guide

This guide covers common issues and their solutions for the GDGoC Certificate Generator.

## Table of Contents
- [Authentication Errors](#authentication-errors)
- [CORS Errors](#cors-errors)
- [Database Errors](#database-errors)
- [Email Errors](#email-errors)

## Authentication Errors

### 🔥 "Token exchange not implemented"

**Error Message:**
```
Authentication Failed
Token exchange not implemented. Please configure your OIDC provider to return tokens directly.
```

**Cause:** The application is using Authorization Code Flow (`response_type=code`) but the backend token exchange is not properly configured or not reachable.

**Solution (Recommended):**

1. **Add environment variable to frontend `.env`:**
   ```env
   VITE_AUTHENTIK_RESPONSE_TYPE=id_token token
   ```

2. **Rebuild the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

3. **If using Docker:**
   ```bash
   docker compose down
   docker compose up -d --build frontend
   ```

4. **Clear browser cache** and try logging in again

**Why this works:** Using `id_token token` (Implicit Flow) returns tokens directly in the URL fragment, bypassing the need for backend token exchange.

**Alternative Solution (Advanced):**

If you specifically need Authorization Code Flow:

1. In authentik, configure your provider with:
   - **Client Type:** `Confidential`
   - Generate a **Client Secret**

2. Add to backend `.env`:
   ```env
   AUTHENTIK_CLIENT_SECRET=<your-client-secret>
   ```

3. Add to frontend `.env`:
   ```env
   VITE_AUTHENTIK_RESPONSE_TYPE=code
   ```

4. Restart services:
   ```bash
   docker compose restart backend frontend
   ```

### "Invalid redirect URI"

**Error Message:** Redirect URI mismatch or invalid

**Solution:**
1. Check that the redirect URI in authentik exactly matches your frontend URL
2. Ensure format: `https://sudo.certs-admin.certs.gdg-oncampus.dev/auth/callback`
3. No trailing slashes
4. Must use HTTPS in production (HTTP allowed for `localhost` only)

### "Access denied. Admin group membership required"

**Cause:** User is not in the `GDGoC-Admins` group and `REQUIRE_ADMIN_GROUP=true`

**Solution:**

**Option 1 - Add user to admin group:**
1. Go to authentik admin panel
2. Navigate to **Directory > Groups**
3. Click on `GDGoC-Admins` group
4. Add the user to the group

**Option 2 - Disable group requirement:**
1. Edit backend `.env`:
   ```env
   REQUIRE_ADMIN_GROUP=false
   ```
2. Restart backend service:
   ```bash
   docker compose restart backend
   ```

### "Invalid token" or "Token verification failed"

**Causes:**
- Token expired
- Wrong JWKS URI
- Token missing required claims

**Solution:**
1. Verify environment variables in backend `.env`:
   ```env
   AUTHENTIK_ISSUER=https://auth.your-domain.com/application/o/gdgoc-certs/
   AUTHENTIK_JWKS_URI=https://auth.your-domain.com/application/o/gdgoc-certs/jwks/
   AUTHENTIK_CLIENT_ID=<your-client-id>
   ```

2. Ensure authentik provider includes these scopes:
   - `openid`
   - `profile`
   - `email`

3. Check backend logs for detailed error:
   ```bash
   docker compose logs backend -f
   ```

## CORS Errors

### "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** Frontend origin is not in the allowed origins list

**Solution:**
1. Edit backend `.env`:
   ```env
   ALLOWED_ORIGINS=https://sudo.certs-admin.certs.gdg-oncampus.dev,https://certs.gdg-oncampus.dev
   ```

2. Ensure both admin and public domains are included (comma-separated, no spaces)

3. Restart backend:
   ```bash
   docker compose restart backend
   ```

4. If using Nginx Proxy Manager, ensure proxy headers are configured:
   - `X-Forwarded-For`
   - `X-Forwarded-Proto`
   - `X-Real-IP`

## Database Errors

### "Connection refused" or "Cannot connect to database"

**Solution:**
1. Verify database is running:
   ```bash
   docker compose ps db
   ```

2. Check database credentials in backend `.env`:
   ```env
   DB_NAME=gdgoc_certs
   DB_USER=postgres
   DB_PASSWORD=<your-password>
   ```

3. Ensure database container is on the same Docker network:
   ```bash
   docker network inspect gdgoc-network
   ```

4. Check database logs:
   ```bash
   docker compose logs db -f
   ```

### "Schema not found" or "Table does not exist"

**Solution:**
1. Run the database schema:
   ```bash
   docker compose exec db psql -U postgres -d gdgoc_certs -f /docker-entrypoint-initdb.d/schema.sql
   ```

2. Or manually run schema.sql:
   ```bash
   psql -U postgres -d gdgoc_certs -f backend/schema.sql
   ```

## Email Errors

### "Email sending failed"

**Cause:** SMTP credentials incorrect or Brevo service unavailable

**Solution:**
1. Verify SMTP settings in backend `.env`:
   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<your-brevo-email>
   SMTP_PASSWORD=<your-brevo-api-key>
   SMTP_FROM_EMAIL=noreply@gdg-oncampus.dev
   SMTP_FROM_NAME=GDGoC Certificate System
   ```

2. Test SMTP credentials in Brevo dashboard

3. Check backend logs for detailed error:
   ```bash
   docker compose logs backend -f | grep -i email
   ```

4. Ensure sender email is verified in Brevo

## Container Issues

### "Service won't start" or "Container keeps restarting"

**Solution:**
1. Check container logs:
   ```bash
   docker compose logs <service-name> -f
   ```

2. Verify all required environment variables are set:
   ```bash
   docker compose config
   ```

3. Check for port conflicts:
   ```bash
   docker ps
   netstat -tulpn | grep <port>
   ```

4. Rebuild container:
   ```bash
   docker compose down
   docker compose up -d --build <service-name>
   ```

### "Permission denied" errors

**Solution:**
1. Check file permissions in mounted volumes
2. Ensure Docker has permission to access directories:
   ```bash
   chmod -R 755 backend frontend
   ```

## Frontend Build Issues

### "Module not found" or build errors

**Solution:**
1. Clear node_modules and reinstall:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. Check Node.js version (requires Node 18+):
   ```bash
   node --version
   ```

3. Verify environment variables are set before build:
   ```bash
   cat frontend/.env
   ```

## Getting Additional Help

If your issue is not covered here:

1. **Check logs:**
   ```bash
   # Backend logs
   docker compose logs backend -f
   
   # Frontend logs
   docker compose logs frontend -f
   
   # All services
   docker compose logs -f
   ```

2. **Enable debug mode:**
   Add to backend `.env`:
   ```env
   NODE_ENV=development
   ```

3. **Browser console:**
   Open browser DevTools (F12) and check the Console tab for errors

4. **Network tab:**
   Check Network tab in DevTools to see failed requests and responses

5. **Contact support:**
   If issues persist, contact the GDGoC team with:
   - Error message
   - Relevant logs
   - Environment details (OS, Docker version, etc.)
   - Steps to reproduce

## Related Documentation

- [Authentik Setup Guide](AUTHENTIK_SETUP.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Brevo Setup Guide](BREVO_SETUP.md)
- [Nginx Proxy Manager Setup](NGINX_PROXY_MANAGER.md)
