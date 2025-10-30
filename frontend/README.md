# GDGoC Certs Frontend

Frontend application for the GDGoC Certificate Generator system built with React and Vite.

## Tech Stack

- React 18
- Vite
- React Router DOM
- Native CSS (no UI framework)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=https://api.certs.gdg-oncampus.dev
VITE_AUTHENTIK_URL=https://auth.your-domain.com
VITE_AUTHENTIK_CLIENT_ID=your-client-id
VITE_AUTHENTIK_RESPONSE_TYPE=id_token token
```

**Note**: `VITE_AUTHENTIK_RESPONSE_TYPE` defaults to `id_token token` (implicit flow) which is recommended. Use `code` for authorization code flow only if you've configured authentik accordingly.

## Hostname-Based Routing

The application uses hostname-based routing to serve different content:

- **`sudo.certs-admin.certs.gdg-oncampus.dev`**: Admin portal with authentication
  - Login page
  - Dashboard for certificate generation
  - Settings page
  - Profile setup

- **`certs.gdg-oncampus.dev`**: Public validation page
  - Certificate validation by unique ID
  - No authentication required

During local development (localhost), the admin portal is served by default.

## Features

### Admin Portal
- authentik OIDC authentication
- Single certificate generation
- Bulk CSV upload
- Profile management
- Settings page

### Public Validation
- Validate certificates by unique ID
- Display certificate details
- No authentication required

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── AdminApp.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/           # Page components
│   │   ├── LoginPage.jsx
│   │   ├── AuthCallback.jsx
│   │   ├── ProfileSetup.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── Settings.jsx
│   │   └── PublicValidationPage.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── utils/           # Utility functions
│   │   └── auth.js
│   ├── App.jsx          # Main app with hostname routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json
```

## Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Building

Build the production bundle:
```bash
npm run build
```

The built files will be in the `dist/` directory.

## Docker

See the deployment branch for Docker configuration.
