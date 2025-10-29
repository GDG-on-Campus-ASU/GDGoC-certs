# GDGoC Certificate Generator - Docker Deployment

This branch contains the Docker deployment configuration for the GDGoC Certificate Generator application.

## Overview

The application is deployed using Docker Compose with three main services:
1. **PostgreSQL Database** - Data persistence
2. **Backend API** - Node.js/Express application
3. **Frontend** - React SPA served via Nginx

All services run on a custom Docker network (`gdgoc-net`) and **do not expose ports to the host**. Instead, traffic is routed through Nginx Proxy Manager.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Nginx Proxy Manager (running separately)
- authentik instance configured as OIDC provider
- Brevo account for SMTP

## Quick Start

1. Clone the repository and checkout the deployment branch:
```bash
git clone https://github.com/GDG-on-Campus-ASU/GDGoC-certs.git
cd GDGoC-certs
git checkout deployment
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Edit `.env` with your configuration:
```bash
nano .env
```

4. Start the services:
```bash
docker-compose up -d
```

5. Check service status:
```bash
docker-compose ps
docker-compose logs -f
```

## Environment Variables

All required environment variables are defined in `.env.example`. Copy this file to `.env` and update with your values.

### Required Variables

- **Database**: `DB_PASSWORD`
- **Authentik**: `AUTHENTIK_ISSUER`, `AUTHENTIK_JWKS_URI`, `AUTHENTIK_AUDIENCE`, `VITE_AUTHENTIK_URL`, `VITE_AUTHENTIK_CLIENT_ID`
- **SMTP**: `SMTP_USER`, `SMTP_PASSWORD`
- **API URL**: `VITE_API_URL`

See `.env.example` for all available configuration options.

## Network Configuration

The application uses a custom Docker network named `gdgoc-net`:

```yaml
networks:
  gdgoc-net:
    name: gdgoc-net
    driver: bridge
```

**Important**: No services expose ports to the host. All ingress traffic is handled by Nginx Proxy Manager.

## Nginx Proxy Manager Setup

Configure Nginx Proxy Manager to route traffic to the services on the `gdgoc-net` network:

### Admin Portal
- **Domain**: `sudo.certs-admin.certs.gdg-oncampus.dev`
- **Forward Hostname/IP**: `gdgoc-frontend` (service name)
- **Forward Port**: `80`
- **SSL**: Enable with Let's Encrypt
- **Websockets**: Disabled

### Public Validation
- **Domain**: `certs.gdg-oncampus.dev`
- **Forward Hostname/IP**: `gdgoc-frontend` (service name)
- **Forward Port**: `80`
- **SSL**: Enable with Let's Encrypt
- **Websockets**: Disabled

### Backend API
- **Domain**: `api.certs.gdg-oncampus.dev`
- **Forward Hostname/IP**: `gdgoc-backend` (service name)
- **Forward Port**: `3001`
- **SSL**: Enable with Let's Encrypt
- **Websockets**: Disabled

**Note**: Ensure Nginx Proxy Manager is connected to the `gdgoc-net` network:
```bash
docker network connect gdgoc-net <nginx-proxy-manager-container-name>
```

## Service Details

### Database (PostgreSQL)
- **Image**: `postgres:15-alpine`
- **Container Name**: `gdgoc-db`
- **Network**: `gdgoc-net`
- **Volume**: `gdgoc_postgres_data`
- **Initialization**: Automatically runs `schema.sql` on first start

### Backend API
- **Build Context**: `./backend`
- **Container Name**: `gdgoc-backend`
- **Network**: `gdgoc-net`
- **Port**: 3001 (internal only)
- **Health Check**: HTTP GET to `/health`

### Frontend
- **Build Context**: `./frontend`
- **Container Name**: `gdgoc-frontend`
- **Network**: `gdgoc-net`
- **Port**: 80 (internal only)
- **Nginx Config**: Custom configuration for SPA routing

## Building and Deployment

### Build Services
```bash
docker-compose build
```

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Restart a Service
```bash
docker-compose restart backend
```

### Update After Code Changes

After pulling new code from the repository:

```bash
# Rebuild and restart services
docker-compose build
docker-compose up -d
```

## Database Management

### Access PostgreSQL
```bash
docker-compose exec db psql -U postgres -d gdgoc_certs
```

### Backup Database
```bash
docker-compose exec db pg_dump -U postgres gdgoc_certs > backup.sql
```

### Restore Database
```bash
docker-compose exec -T db psql -U postgres gdgoc_certs < backup.sql
```

## Volumes

- **postgres_data**: Persistent storage for PostgreSQL database

To remove volumes (will delete all data):
```bash
docker-compose down -v
```

## Troubleshooting

### Services won't start
1. Check environment variables in `.env`
2. Verify Docker and Docker Compose versions
3. Check logs: `docker-compose logs`

### Database connection errors
1. Ensure database service is healthy: `docker-compose ps`
2. Check database logs: `docker-compose logs db`
3. Verify DB_PASSWORD matches in all services

### Frontend build fails
1. Check build arguments in docker-compose.yml
2. Ensure all VITE_* variables are set in `.env`
3. Check frontend logs during build: `docker-compose build frontend`

### Backend can't connect to database
1. Wait for database to be healthy (healthcheck)
2. Verify DB_HOST is set to `db` (service name)
3. Check network connectivity: `docker-compose exec backend ping db`

### CORS errors
1. Verify ALLOWED_ORIGINS in `.env` includes both domains
2. Ensure Nginx Proxy Manager is forwarding correct Host headers
3. Check backend logs for CORS-related errors

## Security Considerations

1. **No Exposed Ports**: Services only accessible via Nginx Proxy Manager
2. **Environment Variables**: Sensitive data stored in `.env` (not committed to git)
3. **CORS Policy**: Strict CORS configuration limiting allowed origins
4. **JWT Validation**: All protected endpoints validate authentik JWTs
5. **Non-Root Users**: All containers run as non-root users
6. **SSL/TLS**: All public endpoints secured with Let's Encrypt via Nginx Proxy Manager

## Maintenance

### Regular Updates
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Clean Up
```bash
# Remove stopped containers
docker-compose down

# Remove all (including volumes - WARNING: deletes data)
docker-compose down -v

# Remove unused images
docker image prune -a
```

## Monitoring

Health checks are configured for all services:
- **Database**: PostgreSQL `pg_isready` check
- **Backend**: HTTP GET to `/health`
- **Frontend**: HTTP GET to `/health`

Check service health:
```bash
docker-compose ps
```

## Support

For issues with the application, refer to the main README in the `main` branch.
For deployment-specific issues, check:
1. Docker logs
2. Environment variables
3. Network connectivity
4. Nginx Proxy Manager configuration

## Related Documentation

- **Main README**: Switch to `main` branch for application documentation
- **Backend README**: `backend/README.md` for API documentation
- **Frontend README**: `frontend/README.md` for frontend documentation
