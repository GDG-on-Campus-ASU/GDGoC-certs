# GDGoC Certificate Generator

A full-stack, self-hosted web application for Google Developer Groups on Campus (GDGoC) to generate, manage, and validate certificates.

## Overview

This application provides:
- **Admin Portal**: Authenticated interface for GDGoC leaders to generate certificates
- **Public Validation**: Public page to validate certificate authenticity
- **Email Notifications**: Automatic email delivery of certificates via Brevo SMTP
- **OIDC Authentication**: Secure authentication using authentik

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: authentik (OIDC)
- **Email**: Brevo (formerly Sendinblue) SMTP
- **Deployment**: Docker & Docker Compose with Nginx Proxy Manager

## Project Structure

This repository follows a monorepo structure on the `main` branch:

```
.
├── backend/          # Node.js/Express API
├── frontend/         # React application
└── README.md         # This file
```

The `deployment` branch contains Docker-related files:
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`

## Features

### Authentication & Authorization
- **OIDC Integration**: Uses authentik as the identity provider
- **Group-Based Access**: Only users in the "GDGoC-Admins" group can access the admin portal
- **Automatic Provisioning**: New users are automatically added to the database on first login
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
- authentik instance (for authentication)
- Brevo account (for email)

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
- `ocid` (TEXT, PRIMARY KEY): Unique authentik OCID
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
- `POST /api/auth/login` - Login with JWT (requires GDGoC-Admins group)
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update user profile

### Certificates (Protected)
- `POST /api/certificates/generate` - Generate single certificate
- `POST /api/certificates/generate-bulk` - Generate from CSV
- `GET /api/certificates` - List user's certificates

### Public
- `GET /api/validate/:unique_id` - Validate certificate (public)

## CORS Configuration

The backend API only accepts requests from:
- `https://sudo.certs-admin.certs.gdg-oncampus.dev`
- `https://certs.gdg-oncampus.dev`

This is configured in the backend via the `ALLOWED_ORIGINS` environment variable.

## Docker Deployment

Docker deployment files are maintained in the `deployment` branch. The setup includes:

1. **PostgreSQL**: Database service with persistent volume
2. **Backend API**: Node.js Express application
3. **Frontend**: React app served via Nginx
4. **Custom Network**: All services on `gdgoc-net` network
5. **Nginx Proxy Manager**: External reverse proxy for SSL and routing

No ports are exposed to the host. Nginx Proxy Manager routes traffic:
- Admin domain → Frontend service
- Public domain → Frontend service
- API domain → Backend service

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

1. **JWT Validation**: All protected endpoints validate JWT tokens
2. **Group Membership**: Only GDGoC-Admins can access admin portal
3. **CORS**: Strict CORS policy limiting allowed origins
4. **No Exposed Ports**: Services communicate via Docker network
5. **Environment Variables**: Sensitive data stored in environment variables

## License

MIT

## Contributing

This is a project for GDGoC. Please follow the established patterns and conventions when contributing.

## Support

For issues or questions, please contact the GDGoC team.
