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
```

**Note:** With authentik Proxy Provider, authentik-related environment variables are no longer needed. Authentication is handled at the Nginx Proxy Manager level before requests reach the frontend.

## Hostname-Based Routing

The application uses hostname-based routing to serve different content:

- **`sudo.certs-admin.certs.gdg-oncampus.dev`**: Admin portal with authentik authentication via proxy
  - Dashboard for certificate generation
  - Settings page
  - Profile setup
  - Authentication is handled by Nginx Proxy Manager + authentik before reaching the app

- **`certs.gdg-oncampus.dev`**: Public validation page
  - Certificate validation by unique ID
  - No authentication required

During local development (localhost), the admin portal is served by default.

## Features

### Admin Portal
- authentik authentication via Nginx Proxy Manager (forward auth)
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
