# Nginx Proxy Manager Configuration

This guide explains how to configure Nginx Proxy Manager to route traffic to the GDGoC Certificate Generator services.

## Prerequisites

- Nginx Proxy Manager installed and running
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

## Step 2: Configure Admin Portal Domain

### Domain: `sudo.certs-admin.certs.gdg-oncampus.dev`

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

6. Configure **Advanced** tab (optional):
   ```nginx
   # Custom Nginx configuration (optional)
   client_max_body_size 10M;
   
   # Additional security headers
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-XSS-Protection "1; mode=block" always;
   add_header Referrer-Policy "strict-origin-when-cross-origin" always;
   ```

7. Click **Save**

## Step 3: Configure Public Validation Domain

### Domain: `certs.gdg-oncampus.dev`

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

4. Configure **Advanced** tab (same as admin portal)

5. Click **Save**

## Step 4: Configure API Domain

### Domain: `api.certs.gdg-oncampus.dev`

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
   # Allow larger request body for CSV uploads
   client_max_body_size 10M;
   
   # CORS headers (backend handles this, but can add here too)
   # Don't add CORS headers here if backend already handles them
   
   # Timeouts for API requests
   proxy_connect_timeout 60s;
   proxy_send_timeout 60s;
   proxy_read_timeout 60s;
   ```

5. Click **Save**

## Step 5: Verify Configuration

### Check DNS Resolution
```bash
# Verify DNS points to your server
nslookup sudo.certs-admin.certs.gdg-oncampus.dev
nslookup certs.gdg-oncampus.dev
nslookup api.certs.gdg-oncampus.dev
```

### Test Connectivity
```bash
# Test admin portal
curl -I https://sudo.certs-admin.certs.gdg-oncampus.dev

# Test public validation
curl -I https://certs.gdg-oncampus.dev

# Test API health endpoint
curl https://api.certs.gdg-oncampus.dev/health
```

### Check SSL Certificates
Visit each domain in a browser and verify:
- Green padlock icon appears
- Certificate is valid
- No security warnings

## Troubleshooting

### "502 Bad Gateway"
- Verify services are running: `docker-compose ps`
- Check service health: `docker-compose logs`
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

### "CORS Errors"
- Verify ALLOWED_ORIGINS in backend .env includes both domains
- Check browser console for specific CORS error
- Ensure NPM is not adding conflicting CORS headers

### "413 Request Entity Too Large"
- Increase `client_max_body_size` in Advanced tab
- Recommended: `10M` for CSV uploads

## Advanced Configuration

### Rate Limiting
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

### IP Whitelisting (Optional)
To restrict admin portal to specific IPs:
```nginx
# Allow specific IPs
allow 192.168.1.0/24;
allow 10.0.0.0/8;

# Deny all others
deny all;
```

## Monitoring

Nginx Proxy Manager provides:
- Access logs for each proxy host
- SSL certificate expiry warnings
- Real-time traffic monitoring

Regularly check:
1. **SSL Certificate Expiry**: NPM auto-renews Let's Encrypt certs
2. **Access Logs**: Monitor for suspicious activity
3. **Error Logs**: Identify and fix issues quickly

## Security Best Practices

1. **Enable Force SSL**: Always redirect HTTP to HTTPS
2. **Enable HSTS**: Prevent SSL stripping attacks
3. **Block Common Exploits**: Built-in protection
4. **Keep NPM Updated**: Regular security updates
5. **Use Strong Passwords**: For NPM admin interface
6. **Enable 2FA**: If available in your NPM version
7. **Regular Backups**: Backup NPM configuration

## Resources

- [Nginx Proxy Manager Documentation](https://nginxproxymanager.com/guide/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Configuration Reference](https://nginx.org/en/docs/)
