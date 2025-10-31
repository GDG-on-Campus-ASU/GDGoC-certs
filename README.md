# GDGoC Certificate Generator

A full-stack, self-hosted web application for Google Developer Groups on Campus (GDGoC) to generate, manage, and validate certificates.

## Overview

This application provides:
- **Admin Portal**: Authenticated interface for GDGoC leaders to generate certificates (protected by authentik via Nginx Proxy Manager)
- **Public Validation**: Public page to validate certificate authenticity
- **Email Notifications**: Automatic email delivery of certificates via Brevo SMTP
- **Proxy Authentication**: Secure authentication using authentik Proxy Provider with Nginx Proxy Manager

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: authentik Proxy Provider with Nginx Proxy Manager
- **Email**: Brevo (formerly Sendinblue) SMTP
- **Deployment**: Docker & Docker Compose with Nginx Proxy Manager

## Project Structure

This repository follows a monorepo structure:

```
.
├── backend/              # Node.js/Express API
│   ├── src/             # Source code
│   ├── schema.sql       # Database schema
│   ├── Dockerfile       # Docker build configuration
│   └── package.json
├── frontend/            # React application
│   ├── src/            # Source code
│   ├── Dockerfile      # Docker build configuration
│   ├── nginx.conf      # Nginx configuration for production
│   └── package.json
├── docker-compose.yml   # Docker Compose configuration
├── .env.example        # Environment variables template
├── DEPLOYMENT.md       # Deployment documentation
└── README.md           # This file
```

All source code and deployment files are maintained in this branch.

## Features

### Authentication & Authorization
- **Proxy Authentication**: Uses authentik Proxy Provider with Nginx Proxy Manager for forward authentication
- **Header-Based Auth**: Application reads user information from proxy headers set by authentik
- **Group-Based Access Control**: Restrict access to users in the "GDGoC-Admins" group via authentik policies
- **Automatic Provisioning**: New users are automatically added to the database on first access
- **Profile Setup**: One-time organization name setup (cannot be changed later)

### Certificate Generation
- **Single Generation**: Create individual certificates via form
- **Bulk Upload**: Generate multiple certificates from CSV file
- **Unique IDs**: Each certificate gets a unique, human-readable ID (format: GDGOC-YYYYMMDD-XXXXX)
- **Email Delivery**: Automatic email notification with certificate details

### Certificate Validation
- **Public Access**: No authentication required
- **Simple Interface**: Enter certificate ID to validate
- **Detailed Information**: View all certificate details

### Hostname-Based Routing
The frontend uses hostname-based routing to serve different content:
- `sudo.certs-admin.certs.gdg-oncampus.dev` → Admin portal
- `certs.gdg-oncampus.dev` → Public validation page

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- authentik instance with Proxy Provider configured - [Setup Guide](docs/AUTHENTIK_SETUP.md)
- Brevo account (for email) - [Setup Guide](docs/BREVO_SETUP.md)
- Nginx Proxy Manager with forward authentication - [Setup Guide](docs/NGINX_PROXY_MANAGER.md)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
psql -U postgres -d gdgoc_certs -f schema.sql
```

5. Start the server:
```bash
npm start
```

See [backend/README.md](backend/README.md) for detailed backend documentation.

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

See [frontend/README.md](frontend/README.md) for detailed frontend documentation.

## Database Schema

### allowed_leaders
Stores authorized leaders who can generate certificates:
- `ocid` (TEXT, PRIMARY KEY): Unique user identifier from authentik headers
- `name` (TEXT): Leader's full name (appears as issuer on certificates)
- `email` (TEXT, UNIQUE): Leader's email
- `org_name` (TEXT, NULLABLE): Organization name (set once, cannot be changed)
- `can_login` (BOOLEAN): Enable/disable access

### certificates
Stores generated certificates:
- `id` (UUID, PRIMARY KEY): Internal ID
- `unique_id` (TEXT, UNIQUE): Human-readable certificate ID
- `recipient_name` (TEXT): Certificate recipient's name
- `recipient_email` (TEXT): Recipient's email (optional)
- `event_type` (TEXT): 'workshop' or 'course'
- `event_name` (TEXT): Name of the event
- `issue_date` (DATE): Date of issuance
- `issuer_name` (TEXT): Name of the issuing leader
- `org_name` (TEXT): Organization name
- `generated_by` (TEXT): OCID of the leader who generated it
- `pdf_url` (TEXT): URL to certificate PDF (optional)

## API Endpoints

### Authentication
**Note:** Authentication is handled by authentik Proxy Provider via Nginx Proxy Manager. The application reads user information from headers set by the proxy.

- `POST /api/auth/login` - Process login from proxy headers (auto-provision users)
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update user profile

### Certificates (Protected)
- `POST /api/certificates/generate` - Generate single certificate
- `POST /api/certificates/generate-bulk` - Generate from CSV
- `GET /api/certificates` - List user's certificates

### Public
- `GET /api/validate/:unique_id` - Validate certificate (public, no authentication required)

## CORS Configuration

The backend API only accepts requests from:
- `https://sudo.certs-admin.certs.gdg-oncampus.dev`
- `https://certs.gdg-oncampus.dev`

This is configured in the backend via the `ALLOWED_ORIGINS` environment variable.

## Docker Deployment

For production deployment with Docker, see the comprehensive [DEPLOYMENT.md](DEPLOYMENT.md) guide.

Quick start:
```bash
cp .env.example .env
# Edit .env with your configuration
docker compose up -d
```

The application uses Docker Compose with three services:
- PostgreSQL database
- Node.js backend API
- React frontend with Nginx

All services run on a custom Docker network and are accessed via Nginx Proxy Manager (no ports exposed to host).

## CSV Format for Bulk Upload

```csv
recipient_name,recipient_email,event_type,event_name
John Doe,john@example.com,workshop,Introduction to Web Development
Jane Smith,jane@example.com,course,Advanced React Patterns
```

Requirements:
- First row must be the header
- `event_type` must be either "workshop" or "course"
- `recipient_email` is optional

## Security Considerations

1. **Proxy-Based Authentication**: All authentication is handled at the proxy layer by authentik
2. **Header Trust**: Application trusts authentication headers set by Nginx Proxy Manager
3. **Group-Based Access**: Only users in GDGoC-Admins group can access admin portal (configured in authentik)
4. **CORS**: Strict CORS policy limiting allowed origins
5. **No Exposed Ports**: Services communicate via Docker network, accessed only through proxy
6. **Environment Variables**: Sensitive data stored in environment variables
7. **Application Isolation**: Backend and frontend are not directly accessible, only through authenticated proxy

## License

GNU AGPL v3

## Contributing

This is a project for GDGoC. Please follow the established patterns and conventions when contributing.

## Documentation

- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Deployment Guide](DEPLOYMENT.md) - Docker deployment and operations
- [authentik Proxy Provider Setup](docs/AUTHENTIK_SETUP.md) - Configure proxy authentication
- [Brevo Setup](docs/BREVO_SETUP.md) - Configure SMTP email service
- [Nginx Proxy Manager Setup](docs/NGINX_PROXY_MANAGER.md) - Configure forward authentication with authentik

## Support

For issues or questions:
1. Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. Review logs: `docker compose logs -f`
3. Contact the GDGoC team
