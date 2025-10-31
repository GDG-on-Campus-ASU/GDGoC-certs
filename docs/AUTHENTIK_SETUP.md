# Setting Up authentik Proxy Provider with Nginx Proxy Manager

This guide explains how to configure authentik as a Proxy Provider with Nginx Proxy Manager for the GDGoC Certificate Generator.

## Overview

Instead of using OIDC authentication directly in the application, we use **authentik's Proxy Provider** which integrates with Nginx Proxy Manager to handle authentication at the reverse proxy level. This approach:

- Simplifies application authentication code
- Centralizes authentication at the proxy layer
- Provides seamless SSO across multiple applications
- Reduces security surface area by keeping authentication logic in one place

## Prerequisites

- Running authentik instance
- Admin access to authentik
- Nginx Proxy Manager installed and running
- GDGoC Certificate Generator backend and frontend deployed
- Domain names configured (DNS pointing to your server)

## Step 1: Create a Group

Create a group to manage which users can access the application:

1. Navigate to **Directory > Groups** in authentik
2. Click **Create**
3. Enter the following:
   - **Name**: `GDGoC-Admins`
   - **Parent**: (leave empty)
4. Click **Create**
5. Add authorized users to this group

**Note**: Only users in this group will be able to access the admin portal through the proxy.

## Step 2: Create a Proxy Provider

1. Navigate to **Applications > Providers** in authentik
2. Click **Create**
3. Select **Proxy Provider**
4. Configure the provider:
   - **Name**: `GDGoC Certificates Proxy Provider`
   - **Authorization Flow**: Select your default authorization flow (e.g., `default-provider-authorization-implicit-consent`)
   - **Type**: `Forward auth (single application)`
   - **External host**: `https://sudo.certs-admin.certs.gdg-oncampus.dev`
   - **Internal host**: Leave blank (Nginx Proxy Manager handles forwarding)
   - **Internal host SSL Validation**: Unchecked (internal communication is HTTP)
   
5. Under **Advanced protocol settings**:
   - **Token validity**: `hours=24` (adjust as needed)
   - **Send HTTP-Basic Username**: Unchecked
   - **Send HTTP-Basic Password**: Unchecked
   - **Mode**: `Forward auth (single application)`
   
6. Click **Create**

**Important**: The proxy provider will set authentication headers that the application will read to identify users.

## Step 3: Create an Application

1. Navigate to **Applications > Applications** in authentik
2. Click **Create**
3. Configure the application:
   - **Name**: `GDGoC Certificates`
   - **Slug**: `gdgoc-certs`
   - **Provider**: Select the proxy provider you just created
   - **Launch URL**: `https://sudo.certs-admin.certs.gdg-oncampus.dev`
   - **Policy engine mode**: `any` (or configure according to your needs)
4. Click **Create**

## Step 4: Configure Access Control (Optional)

If you want to restrict access to only members of the `GDGoC-Admins` group:

1. Navigate to **Applications > Applications**
2. Click on the `GDGoC Certificates` application
3. Go to the **Policy / Group / User Bindings** tab
4. Click **Bind existing policy/group/user**
5. Select the `GDGoC-Admins` group
6. Set **Order**: `0`
7. Click **Create**

This ensures only users in the GDGoC-Admins group can access the application through the proxy.

## Step 5: Get Outpost Configuration

authentik uses "Outposts" to handle proxy authentication. You need to configure an outpost:

1. Navigate to **Applications > Outposts** in authentik
2. Click on the default **Embedded Outpost** or create a new one
3. Click **Edit**
4. Under **Applications**, add your `GDGoC Certificates` application
5. Click **Update**

Note the **Integration** settings - you'll need the authentik outpost endpoint URL for Nginx Proxy Manager configuration.

## Step 6: Configure Nginx Proxy Manager

Now configure Nginx Proxy Manager to use authentik for authentication. See the [Nginx Proxy Manager Setup Guide](NGINX_PROXY_MANAGER.md) for detailed instructions on:

1. Setting up forward authentication to authentik
2. Configuring proxy headers
3. Setting up the admin portal domain with authentik authentication
4. Configuring the public validation domain (no authentication required)

## Step 7: Update Environment Variables

Update your `.env` file with the simplified configuration for proxy authentication:

```env
# Database Configuration (unchanged)
DB_NAME=gdgoc_certs
DB_USER=postgres
DB_PASSWORD=your_secure_database_password_here

# Frontend URL (used for CORS)
FRONTEND_URL=https://sudo.certs-admin.certs.gdg-oncampus.dev

# CORS Configuration
ALLOWED_ORIGINS=https://sudo.certs-admin.certs.gdg-oncampus.dev,https://certs.gdg-oncampus.dev

# Brevo (Sendinblue) SMTP Configuration (unchanged)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_email@example.com
SMTP_PASSWORD=your_brevo_api_key_here
SMTP_FROM_EMAIL=noreply@gdg-oncampus.dev
SMTP_FROM_NAME=GDGoC Certificate System

# API URL for frontend
VITE_API_URL=https://api.certs.gdg-oncampus.dev
```

**Note**: You no longer need:
- `AUTHENTIK_ISSUER`
- `AUTHENTIK_JWKS_URI`
- `AUTHENTIK_CLIENT_ID`
- `AUTHENTIK_CLIENT_SECRET`
- `VITE_AUTHENTIK_URL`
- `VITE_AUTHENTIK_CLIENT_ID`
- `VITE_AUTHENTIK_RESPONSE_TYPE`
- `REQUIRE_ADMIN_GROUP`

Authentication is now handled entirely by the authentik proxy provider through Nginx Proxy Manager.

## Step 8: Test Authentication

1. Navigate to `https://sudo.certs-admin.certs.gdg-oncampus.dev`
2. You should be automatically redirected to authentik login page
3. After successful login, you should be redirected back to the application
4. If you're in the `GDGoC-Admins` group (and configured access control), you'll see the dashboard
5. The application will read your user information from proxy headers set by authentik

## How It Works

When a user accesses the admin portal:

1. **Request hits Nginx Proxy Manager** - User attempts to access `https://sudo.certs-admin.certs.gdg-oncampus.dev`
2. **Forward Auth to authentik** - Nginx Proxy Manager forwards the authentication request to authentik outpost
3. **authentik checks authentication** - If not authenticated, user is redirected to authentik login
4. **User logs in** - User provides credentials to authentik
5. **authentik sets session** - authentik creates a session and sets headers
6. **Headers forwarded to application** - Nginx Proxy Manager forwards the request with these headers:
   - `X-authentik-username` - Username
   - `X-authentik-email` - User email
   - `X-authentik-name` - User full name
   - `X-authentik-uid` - User unique ID
   - `X-authentik-groups` - User group memberships
7. **Application reads headers** - Backend reads these headers to identify and authorize the user

## Troubleshooting

### "Cannot access admin portal" or infinite redirect loop

**Cause**: Nginx Proxy Manager is not properly forwarding auth requests to authentik, or authentik outpost is not running.

**Solution**:
1. Verify authentik outpost is running and healthy
2. Check Nginx Proxy Manager configuration for forward auth settings
3. Ensure the forward auth URL points to your authentik outpost
4. Check authentik logs: `docker logs -f <authentik-server-container>`
5. Check Nginx Proxy Manager logs for authentication errors

### "Access denied" or user cannot log in

**Cause**: User is not in the `GDGoC-Admins` group or policy binding is misconfigured.

**Solution**:
1. Go to authentik admin panel
2. Navigate to **Directory > Users**
3. Find the user and verify they are in the `GDGoC-Admins` group
4. Check application policy bindings in **Applications > Applications > GDGoC Certificates > Policy / Group / User Bindings**

### Headers not being passed to application

**Cause**: Nginx Proxy Manager is not configured to forward authentik headers.

**Solution**:
1. Ensure all required headers are configured in Nginx Proxy Manager (see NGINX_PROXY_MANAGER.md)
2. Check that `proxy_set_header` directives are present in the advanced configuration
3. Restart Nginx Proxy Manager after configuration changes

### "User information not found" in application

**Cause**: Application cannot read authentication headers from the proxy.

**Solution**:
1. Check backend logs to see which headers are being received
2. Verify Nginx Proxy Manager is forwarding `X-authentik-*` headers
3. Ensure application is deployed behind the proxy (not directly accessible)

### Changes to authentik not taking effect

**Solution**:
1. Restart the authentik outpost
2. Clear browser cookies and cache
3. Try in an incognito/private browser window
4. Check authentik event logs for errors

## Security Considerations

1. **Application must only be accessible through proxy** - Never expose the application directly. All traffic must go through Nginx Proxy Manager with authentik authentication.
2. **Header trust** - The application trusts headers set by the proxy. Ensure only Nginx Proxy Manager can reach your application backend.
3. **Session timeout** - Configure appropriate session timeout in authentik (default is 24 hours)
4. **MFA** - Enable multi-factor authentication in authentik for additional security
5. **Audit logs** - Review authentik event logs regularly to monitor access

## Benefits of Proxy Authentication

- **Simpler application code** - No OAuth/OIDC complexity in the application
- **Centralized authentication** - Single point of authentication for multiple apps
- **Better security** - Authentication handled by dedicated security layer
- **Easier maintenance** - Authentication updates don't require application changes
- **Consistent UX** - Same login experience across all applications

## Resources

- [authentik Documentation](https://goauthentik.io/docs/)
- [OAuth 2.0 and OpenID Connect](https://oauth.net/2/)
