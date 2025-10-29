# GDGoC Certs Backend API

Backend API for the GDGoC Certificate Generator application.

## Tech Stack

- Node.js with Express
- PostgreSQL database
- JWT authentication with authentik OIDC
- Nodemailer with Brevo (Sendinblue) SMTP

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Set up PostgreSQL database and run schema:
```bash
psql -U postgres -d gdgoc_certs -f schema.sql
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with JWT token (requires GDGoC-Admins group)
- `GET /api/auth/me` - Get current user information
- `PUT /api/auth/profile` - Update user profile

### Certificates
- `POST /api/certificates/generate` - Generate single certificate
- `POST /api/certificates/generate-bulk` - Generate certificates from CSV
- `GET /api/certificates` - Get user's certificates (paginated)

### Public
- `GET /api/validate/:unique_id` - Validate certificate (public endpoint)
- `GET /health` - Health check

## Environment Variables

See `.env.example` for all required environment variables.

### Key Variables:
- `DB_*`: Database connection settings
- `AUTHENTIK_*`: OIDC provider configuration
- `SMTP_*`: Email service configuration
- `ALLOWED_ORIGINS`: CORS allowed origins (comma-separated)

## Database Schema

The application uses two main tables:

1. **allowed_leaders** - Stores authorized users
2. **certificates** - Stores generated certificates

See `schema.sql` for full schema definition.

## CORS Configuration

The API only accepts requests from:
- `https://sudo.certs-admin.certs.gdg-oncampus.dev` (Admin interface)
- `https://certs.gdg-oncampus.dev` (Public validation page)

## CSV Format for Bulk Upload

```csv
recipient_name,recipient_email,event_type,event_name
John Doe,john@example.com,workshop,Introduction to Web Development
Jane Smith,jane@example.com,course,Advanced React Patterns
```

Event type must be either "workshop" or "course".
