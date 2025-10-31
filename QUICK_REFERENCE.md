# GDGoC Certificate Generator - Quick Reference

## URLs (Production)

| Service | URL | Purpose |
|---------|-----|---------|
| Admin Portal | https://sudo.certs-admin.certs.gdg-oncampus.dev | Certificate generation dashboard |
| Public Validation | https://certs.gdg-oncampus.dev | Public certificate validation |
| Backend API | https://api.certs.gdg-oncampus.dev | REST API |

## API Endpoints

### Authentication (Protected by authentik Proxy)
```bash
# Login (processes proxy headers, auto-provisions users)
POST /api/auth/login
# No Authorization header needed - authentication via proxy headers

# Get current user
GET /api/auth/me
# No Authorization header needed - user identified via proxy headers

# Update profile
PUT /api/auth/profile
# No Authorization header needed - user identified via proxy headers
Body: { "name": "John Doe", "org_name": "GDG XYZ" }
```

### Certificates (Protected by authentik Proxy)
```bash
# Generate single certificate
POST /api/certificates/generate
# No Authorization header needed - user identified via proxy headers
Body: {
  "recipient_name": "John Doe",
  "recipient_email": "john@example.com",
  "event_type": "workshop",
  "event_name": "Web Development Workshop"
}

# Generate bulk certificates
POST /api/certificates/generate-bulk
# No Authorization header needed - user identified via proxy headers
Body: {
  "csv_content": "recipient_name,recipient_email,event_type,event_name\n..."
}

# List certificates
GET /api/certificates?page=1&limit=50
# No Authorization header needed - user identified via proxy headers
```

### Public Endpoints
```bash
# Validate certificate
GET /api/validate/{unique_id}
# No authentication required

# Health check
GET /health
```

**Note:** Authentication is handled by Nginx Proxy Manager with authentik Proxy Provider. User information is passed via HTTP headers (`X-authentik-username`, `X-authentik-email`, etc.).

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose build
docker-compose up -d

# View service status
docker-compose ps

# Access database
docker-compose exec db psql -U postgres -d gdgoc_certs

# Backup database
docker-compose exec db pg_dump -U postgres gdgoc_certs > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres gdgoc_certs < backup.sql
```

## Environment Variables

### Required
```env
# Database
DB_PASSWORD=<strong_password>

# Frontend URL (for CORS)
FRONTEND_URL=https://sudo.certs-admin.certs.gdg-oncampus.dev

# CORS Configuration
ALLOWED_ORIGINS=https://sudo.certs-admin.certs.gdg-oncampus.dev,https://certs.gdg-oncampus.dev

# API URL (build-time for frontend)
VITE_API_URL=https://api.certs.gdg-oncampus.dev

# Brevo SMTP
SMTP_USER=<brevo_email>
SMTP_PASSWORD=<smtp_key>
SMTP_FROM_EMAIL=noreply@gdg-oncampus.dev
SMTP_FROM_NAME=GDGoC Certificate System
```

**Note:** With authentik Proxy Provider, OIDC-related environment variables are no longer needed. Authentication is handled at the Nginx Proxy Manager level.

See `.env.example` for all variables.

## CSV Format for Bulk Upload

```csv
recipient_name,recipient_email,event_type,event_name
John Doe,john@example.com,workshop,Introduction to Web Development
Jane Smith,jane@example.com,course,Advanced React Patterns
Bob Johnson,,workshop,Git and GitHub Basics
```

- First row must be header
- `event_type` must be "workshop" or "course"
- `recipient_email` is optional (leave empty if not provided)

## Certificate ID Format

```
GDGOC-YYYYMMDD-XXXXX
```

Example: `GDGOC-20240315-A1B2C`

- `GDGOC` - Prefix
- `YYYYMMDD` - Date (year, month, day)
- `XXXXX` - Random 5-character alphanumeric

## Common Tasks

### Add a New Admin User
1. Add user to `GDGoC-Admins` group in authentik
2. Configure access to the application in authentik (Application > Policy / Group / User Bindings)
3. User accesses admin portal - automatically redirected to authentik login
4. System automatically provisions user in database based on proxy headers
5. User completes profile setup (org name)

### Disable a User
```sql
-- Connect to database
docker-compose exec db psql -U postgres -d gdgoc_certs

-- Disable user
UPDATE allowed_leaders SET can_login = false WHERE email = 'user@example.com';
```

### Check Certificate Count
```sql
-- Total certificates
SELECT COUNT(*) FROM certificates;

-- By user
SELECT generated_by, COUNT(*) 
FROM certificates 
GROUP BY generated_by;

-- By event type
SELECT event_type, COUNT(*) 
FROM certificates 
GROUP BY event_type;
```

### View Recent Certificates
```sql
SELECT 
  unique_id,
  recipient_name,
  event_name,
  created_at
FROM certificates
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs <service_name>

# Check environment variables
docker-compose config

# Verify network
docker network inspect gdgoc-net
```

### Database connection error
```bash
# Check database is healthy
docker-compose ps

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec backend nc -zv db 5432
```

### Authentication failing
- Verify Nginx Proxy Manager forward auth is configured correctly
- Check authentik Proxy Provider and outpost are running
- Verify user is in GDGoC-Admins group
- Check authentik headers are being passed (`X-authentik-username`, `X-authentik-email`, etc.)
- Review backend logs to see which headers are received
- See `docs/AUTHENTIK_SETUP.md` and `docs/NGINX_PROXY_MANAGER.md` for detailed configuration
- See `docs/TROUBLESHOOTING.md` for detailed troubleshooting

### Email not sending
- Check Brevo credentials
- Verify sender email is verified in Brevo
- Check backend logs for SMTP errors
- Test with a known working email

### CORS error
- Verify ALLOWED_ORIGINS includes both domains
- Check Nginx Proxy Manager headers
- Look at browser console for specific error

## Monitoring

### Health Checks
```bash
# Backend health
curl https://api.certs.gdg-oncampus.dev/health

# Frontend health
curl https://sudo.certs-admin.certs.gdg-oncampus.dev/health
curl https://certs.gdg-oncampus.dev/health
```

### Service Status
```bash
# Docker health status
docker-compose ps

# View health check logs
docker inspect gdgoc-backend | grep -A 20 Health
```

## Security Checklist

- [ ] Strong database password set
- [ ] authentik Proxy Provider properly configured
- [ ] authentik access policies configured for GDGoC-Admins group
- [ ] Nginx Proxy Manager forward auth configured correctly
- [ ] Application not directly accessible (only via proxy)
- [ ] Brevo SMTP credentials secure
- [ ] SSL certificates active on all domains
- [ ] CORS origins correctly configured
- [ ] Nginx Proxy Manager access secured
- [ ] Regular database backups scheduled
- [ ] Log monitoring in place
- [ ] authentik session timeout configured appropriately

## Performance

### Database Indexes
All critical columns have indexes:
- `certificates.unique_id` (unique index)
- `certificates.generated_by` (index)
- `allowed_leaders.email` (unique index)

### Caching
- Frontend: Nginx caches static assets (1 year)
- Backend: No JWT/JWKS caching needed (authentication at proxy level)
- Database: Connection pooling (max 20 connections)

## Links

- [Full Documentation](README.md)
- [Deployment Guide](DEPLOYMENT.md)
- [authentik Proxy Provider Setup](docs/AUTHENTIK_SETUP.md)
- [Nginx Proxy Manager Setup](docs/NGINX_PROXY_MANAGER.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Brevo Setup](docs/BREVO_SETUP.md)
- [Backend API Docs](backend/README.md)
- [Frontend Docs](frontend/README.md)
