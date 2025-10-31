# Nginx Proxy Manager Configuration with authentik Proxy Provider

This guide explains how to configure Nginx Proxy Manager to work with authentik Proxy Provider for the GDGoC Certificate Generator.

## Overview

Nginx Proxy Manager acts as the entry point for all traffic and integrates with authentik's Proxy Provider to handle authentication. This configuration:

- Routes all traffic through Nginx Proxy Manager
- Uses forward authentication to authentik for the admin portal
- Passes authentication headers to the application
- Keeps the public validation page accessible without authentication

## Prerequisites

- Nginx Proxy Manager installed and running
- authentik with Proxy Provider configured (see [AUTHENTIK_SETUP.md](AUTHENTIK_SETUP.md))
- Docker network access to services
- Domain names configured (DNS pointing to your server)
- SSL certificates (can be obtained via Let's Encrypt through NPM)

## Step 1: Connect Nginx Proxy Manager to Docker Network

Nginx Proxy Manager needs to be on the same Docker network as the application services.

```bash
# Find your Nginx Proxy Manager container name
docker ps | grep nginx-proxy-manager

# Connect it to the gdgoc-net network
docker network connect gdgoc-net <nginx-proxy-manager-container-name>

# Verify connection
docker network inspect gdgoc-net
```

You should see Nginx Proxy Manager listed in the network's containers.

## Step 2: Configure Admin Portal with authentik Authentication

### Domain: `sudo.certs-admin.certs.gdg-oncampus.dev`

This domain requires authentication through authentik.

1. Log in to Nginx Proxy Manager
2. Navigate to **Proxy Hosts**
3. Click **Add Proxy Host**
4. Configure **Details** tab:
   - **Domain Names**: `sudo.certs-admin.certs.gdg-oncampus.dev`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `gdgoc-frontend`
   - **Forward Port**: `80`
   - **Cache Assets**: ✓ (enabled)
   - **Block Common Exploits**: ✓ (enabled)
   - **Websockets Support**: ✗ (disabled)

5. Configure **SSL** tab:
   - **SSL Certificate**: Select existing or create new Let's Encrypt certificate
   - **Force SSL**: ✓ (enabled)
   - **HTTP/2 Support**: ✓ (enabled)
   - **HSTS Enabled**: ✓ (enabled)
   - **HSTS Subdomains**: ✓ (enabled)

6. Configure **Advanced** tab:
   Add the following custom Nginx configuration for authentik forward authentication:

   ```nginx
   # Forward authentication to authentik
   auth_request /outpost.goauthentik.io/auth/nginx;
   auth_request_set $auth_cookie $upstream_http_set_cookie;
   add_header Set-Cookie $auth_cookie;
   
   # Pass authentik headers to backend
   auth_request_set $authentik_username $upstream_http_x_authentik_username;
   auth_request_set $authentik_groups $upstream_http_x_authentik_groups;
   auth_request_set $authentik_email $upstream_http_x_authentik_email;
   auth_request_set $authentik_name $upstream_http_x_authentik_name;
   auth_request_set $authentik_uid $upstream_http_x_authentik_uid;
   
   proxy_set_header X-authentik-username $authentik_username;
   proxy_set_header X-authentik-groups $authentik_groups;
   proxy_set_header X-authentik-email $authentik_email;
   proxy_set_header X-authentik-name $authentik_name;
   proxy_set_header X-authentik-uid $authentik_uid;
   
   # Configuration for authentik forward auth endpoint
   location /outpost.goauthentik.io {
       proxy_pass https://auth.your-domain.com/outpost.goauthentik.io;
       proxy_set_header Host $host;
       proxy_set_header X-Original-URL $scheme://$http_host$request_uri;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header X-Forwarded-Host $http_host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_pass_request_body off;
       proxy_set_header Content-Length "";
   }
   
   # Additional security headers
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-XSS-Protection "1; mode=block" always;
   add_header Referrer-Policy "strict-origin-when-cross-origin" always;
   
   # Allow larger uploads for CSV files
   client_max_body_size 10M;
   ```

   **Important**: Replace `auth.your-domain.com` with your actual authentik domain.

7. Click **Save**

## Step 3: Configure Public Validation Domain (No Authentication)

### Domain: `certs.gdg-oncampus.dev`

This domain should remain publicly accessible without authentication.

1. Click **Add Proxy Host**
2. Configure **Details** tab:
   - **Domain Names**: `certs.gdg-oncampus.dev`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `gdgoc-frontend`
   - **Forward Port**: `80`
   - **Cache Assets**: ✓ (enabled)
   - **Block Common Exploits**: ✓ (enabled)
   - **Websockets Support**: ✗ (disabled)

3. Configure **SSL** tab:
   - **SSL Certificate**: Select existing or create new Let's Encrypt certificate
   - **Force SSL**: ✓ (enabled)
   - **HTTP/2 Support**: ✓ (enabled)
   - **HSTS Enabled**: ✓ (enabled)
   - **HSTS Subdomains**: ✓ (enabled)

4. Configure **Advanced** tab:
   ```nginx
   # Security headers
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-XSS-Protection "1; mode=block" always;
   add_header Referrer-Policy "strict-origin-when-cross-origin" always;
   ```

5. Click **Save**

**Note**: This domain does NOT have authentik forward authentication configured, so it remains publicly accessible for certificate validation.

## Step 4: Configure API Domain with authentik Authentication

### Domain: `api.certs.gdg-oncampus.dev`

The API should also be protected with authentik authentication.

1. Click **Add Proxy Host**
2. Configure **Details** tab:
   - **Domain Names**: `api.certs.gdg-oncampus.dev`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `gdgoc-backend`
   - **Forward Port**: `3001`
   - **Cache Assets**: ✗ (disabled - API responses shouldn't be cached)
   - **Block Common Exploits**: ✓ (enabled)
   - **Websockets Support**: ✗ (disabled)

3. Configure **SSL** tab:
   - **SSL Certificate**: Select existing or create new Let's Encrypt certificate
   - **Force SSL**: ✓ (enabled)
   - **HTTP/2 Support**: ✓ (enabled)
   - **HSTS Enabled**: ✓ (enabled)
   - **HSTS Subdomains**: ✓ (enabled)

4. Configure **Advanced** tab:
   ```nginx
   # Forward authentication to authentik for protected endpoints
   # Public validation endpoint should be excluded
   location /api/validate {
       # Public endpoint - no authentication required
       proxy_pass http://gdgoc-backend:3001;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   
   location / {
       # Protected endpoints - require authentication
       auth_request /outpost.goauthentik.io/auth/nginx;
       auth_request_set $auth_cookie $upstream_http_set_cookie;
       add_header Set-Cookie $auth_cookie;
       
       # Pass authentik headers to backend
       auth_request_set $authentik_username $upstream_http_x_authentik_username;
       auth_request_set $authentik_groups $upstream_http_x_authentik_groups;
       auth_request_set $authentik_email $upstream_http_x_authentik_email;
       auth_request_set $authentik_name $upstream_http_x_authentik_name;
       auth_request_set $authentik_uid $upstream_http_x_authentik_uid;
       
       proxy_set_header X-authentik-username $authentik_username;
       proxy_set_header X-authentik-groups $authentik_groups;
       proxy_set_header X-authentik-email $authentik_email;
       proxy_set_header X-authentik-name $authentik_name;
       proxy_set_header X-authentik-uid $authentik_uid;
       
       proxy_pass http://gdgoc-backend:3001;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   
   # Configuration for authentik forward auth endpoint
   location /outpost.goauthentik.io {
       proxy_pass https://auth.your-domain.com/outpost.goauthentik.io;
       proxy_set_header Host $host;
       proxy_set_header X-Original-URL $scheme://$http_host$request_uri;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header X-Forwarded-Host $http_host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_pass_request_body off;
       proxy_set_header Content-Length "";
   }
   
   # Allow larger request body for CSV uploads
   client_max_body_size 10M;
   
   # Timeouts for API requests
   proxy_connect_timeout 60s;
   proxy_send_timeout 60s;
   proxy_read_timeout 60s;
   ```

   **Important**: Replace `auth.your-domain.com` with your actual authentik domain.

5. Click **Save**

## Step 5: Verify Configuration

### Check DNS Resolution
```bash
# Verify DNS points to your server
nslookup sudo.certs-admin.certs.gdg-oncampus.dev
nslookup certs.gdg-oncampus.dev
nslookup api.certs.gdg-oncampus.dev
```

### Test Connectivity and Authentication

1. **Test public validation (no auth required)**:
   ```bash
   curl -I https://certs.gdg-oncampus.dev
   # Should return 200 OK
   ```

2. **Test admin portal (auth required)**:
   ```bash
   curl -I https://sudo.certs-admin.certs.gdg-oncampus.dev
   # Should return 302 redirect to authentik or 401 unauthorized
   ```

3. **Test API health endpoint**:
   ```bash
   # Public endpoint
   curl https://api.certs.gdg-oncampus.dev/api/validate/GDGOC-20240101-00001
   # Should work without authentication
   
   # Protected endpoint
   curl https://api.certs.gdg-oncampus.dev/api/certificates
   # Should return 401 or redirect to authentik
   ```

### Check SSL Certificates
Visit each domain in a browser and verify:
- Green padlock icon appears
- Certificate is valid
- No security warnings

### Verify authentik Integration

1. Visit `https://sudo.certs-admin.certs.gdg-oncampus.dev` in a browser
2. You should be redirected to authentik login page
3. After logging in, you should be redirected back to the application
4. Check browser developer tools > Network tab to see authentik headers being passed

## Troubleshooting

### "502 Bad Gateway"
- Verify services are running: `docker compose ps`
- Check service health: `docker compose logs`
- Ensure NPM is on gdgoc-net network
- Verify forward hostname matches service name exactly

### "SSL Certificate Error"
- Ensure Let's Encrypt can reach your server (port 80 must be accessible)
- Check domain DNS is correct
- Try regenerating the certificate

### "Connection Refused"
- Check if services are listening on correct ports
- Verify Docker network connectivity
- Check firewall rules

### "Authentication Loop" or "Too Many Redirects"
- Verify authentik outpost is running and accessible
- Check that the forward auth URL in Nginx config is correct
- Ensure authentik application is properly configured
- Clear browser cookies and try again in incognito mode

### "401 Unauthorized" on admin portal
- Verify authentik Proxy Provider is configured correctly
- Check that the application is bound to the authentik outpost
- Review authentik logs: `docker logs -f <authentik-server-container>`
- Ensure user is in the `GDGoC-Admins` group if access control is enabled

### "Headers not being passed to application"
- Verify `auth_request_set` directives are present in Nginx config
- Check that `proxy_set_header` directives are forwarding authentik headers
- Review backend logs to see which headers are received
- Ensure there are no conflicting proxy settings

### Public validation page requires authentication
- Verify that `certs.gdg-oncampus.dev` does NOT have `auth_request` directives
- Check that the public domain configuration doesn't include authentik forward auth
- Restart Nginx Proxy Manager after configuration changes

### "413 Request Entity Too Large"
- Increase `client_max_body_size` in Advanced tab
- Recommended: `10M` for CSV uploads

## Advanced Configuration

### Rate Limiting (Optional)
Add to Advanced tab to prevent abuse:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req zone=api_limit burst=20 nodelay;
```

### Custom Error Pages
```nginx
error_page 502 503 504 /50x.html;
location = /50x.html {
    return 503 "Service temporarily unavailable";
    add_header Content-Type text/plain;
}
```

### IP Whitelisting for Additional Security (Optional)
To restrict admin portal to specific IPs in addition to authentik authentication:
```nginx
# Allow specific IPs
allow 192.168.1.0/24;
allow 10.0.0.0/8;

# Deny all others
deny all;
```

## Understanding the Forward Auth Flow

1. **User requests admin portal** → `https://sudo.certs-admin.certs.gdg-oncampus.dev`
2. **Nginx intercepts** → `auth_request` directive sends request to authentik
3. **authentik checks session** → If no valid session, redirect to login
4. **User authenticates** → Logs in through authentik
5. **authentik creates session** → Sets authentication cookie
6. **authentik returns headers** → Includes user info in response headers
7. **Nginx forwards request** → Passes headers to application backend
8. **Application reads headers** → Extracts user info from `X-authentik-*` headers

## Monitoring

Nginx Proxy Manager provides:
- Access logs for each proxy host
- SSL certificate expiry warnings
- Real-time traffic monitoring

Regularly check:
1. **SSL Certificate Expiry**: NPM auto-renews Let's Encrypt certs
2. **Access Logs**: Monitor for suspicious activity
3. **Error Logs**: Identify and fix issues quickly
4. **authentik Session Logs**: Review authentik event logs for authentication issues

## Security Best Practices

1. **Enable Force SSL**: Always redirect HTTP to HTTPS
2. **Enable HSTS**: Prevent SSL stripping attacks
3. **Block Common Exploits**: Built-in protection
4. **Keep NPM Updated**: Regular security updates
5. **Use Strong Passwords**: For NPM admin interface
6. **Enable 2FA**: If available in your NPM version
7. **Regular Backups**: Backup NPM configuration
8. **Isolate Authentication**: Only expose applications through proxy with authentik
9. **Monitor Access**: Review authentik and NPM logs regularly
10. **Principle of Least Privilege**: Only grant access to users who need it

## Benefits of This Architecture

1. **Single Sign-On**: Users authenticate once for all applications
2. **Centralized Auth Management**: Manage all authentication in authentik
3. **Simplified Application Code**: No OAuth/OIDC complexity in apps
4. **Better Security**: Dedicated security layer at the edge
5. **Flexible Access Control**: Easy to add/remove user access
6. **Audit Trail**: Complete authentication logs in authentik

## Resources

- [Nginx Proxy Manager Documentation](https://nginxproxymanager.com/guide/)
- [authentik Forward Auth Documentation](https://goauthentik.io/docs/providers/proxy/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Configuration Reference](https://nginx.org/en/docs/)
