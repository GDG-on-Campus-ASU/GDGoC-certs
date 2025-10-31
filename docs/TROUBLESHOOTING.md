# Troubleshooting Guide

This guide covers common issues and their solutions for the GDGoC Certificate Generator.

## Table of Contents
- [Authentication Errors](#authentication-errors)
- [CORS Errors](#cors-errors)
- [Database Errors](#database-errors)
- [Email Errors](#email-errors)

## Authentication Errors

### 🔥 "Cannot access admin portal" or "Redirect loop"

**Error**: Cannot access admin portal, or browser shows "too many redirects" error.

**Cause:** authentik forward authentication is not configured correctly in Nginx Proxy Manager, or authentik outpost is not running.

**Solution:**

1. **Verify authentik outpost is running:**
   ```bash
   # Check authentik containers
   docker ps | grep authentik
   ```

2. **Check Nginx Proxy Manager configuration:**
   - Ensure `auth_request` directive is present in the Advanced tab
   - Verify the forward auth URL points to your authentik outpost: `https://auth.your-domain.com/outpost.goauthentik.io`
   - Confirm all `auth_request_set` and `proxy_set_header` directives are configured

3. **Check authentik logs:**
   ```bash
   docker logs -f <authentik-server-container>
   ```

4. **Clear browser cache and cookies**, then try in incognito mode

5. **Verify the application is bound to authentik outpost:**
   - In authentik, go to **Applications > Outposts**
   - Ensure your application is listed under the outpost

### "Access denied" or "Not authorized"

**Cause:** User is not in the `GDGoC-Admins` group or doesn't have permission to access the application.

**Solution:**

**Option 1 - Add user to admin group:**
1. Go to authentik admin panel
2. Navigate to **Directory > Users**
3. Find the user
4. Go to **Groups** tab
5. Add user to `GDGoC-Admins` group

**Option 2 - Check application policy bindings:**
1. Navigate to **Applications > Applications** in authentik
2. Click on `GDGoC Certificates`
3. Go to **Policy / Group / User Bindings** tab
4. Verify the user or their group is bound to the application

### "User information not found" or "Invalid user"

**Cause:** Application cannot read authentication headers from the proxy, or headers are not being passed correctly.

**Solution:**
1. **Check backend logs** to see which headers are being received:
   ```bash
   docker compose logs backend -f
   ```

2. **Verify Nginx Proxy Manager is forwarding headers:**
   - Review the Advanced configuration in NPM
   - Ensure all `proxy_set_header X-authentik-*` directives are present

3. **Test header forwarding:**
   - Use browser developer tools > Network tab
   - Check request headers sent to the backend
   - Look for `X-authentik-username`, `X-authentik-email`, etc.

4. **Ensure application is only accessible through proxy:**
   - Application should not be directly accessible without going through Nginx Proxy Manager
   - All traffic must pass through the proxy for headers to be set

## CORS Errors

**Note:** With authentik proxy provider, CORS should be less of an issue since authentication happens at the proxy level. However, you may still encounter CORS errors if the frontend and backend domains are not properly configured.

### "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** Frontend origin is not in the allowed origins list, or proxy is not forwarding headers correctly.

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
   - `Host`

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

- [authentik Setup Guide](AUTHENTIK_SETUP.md) - Configure authentik Proxy Provider
- [Deployment Guide](../DEPLOYMENT.md)
- [Brevo Setup Guide](BREVO_SETUP.md)
- [Nginx Proxy Manager Setup](NGINX_PROXY_MANAGER.md) - Configure forward authentication
