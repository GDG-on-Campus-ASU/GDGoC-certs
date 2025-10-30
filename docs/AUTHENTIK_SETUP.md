# Setting Up authentik OIDC Provider

This guide explains how to configure authentik as an OIDC provider for the GDGoC Certificate Generator.

## Prerequisites

- Running authentik instance
- Admin access to authentik
- GDGoC Certificate Generator backend and frontend deployed

## Authentication Flow Options

The application supports two OIDC authentication flows:

1. **Implicit Flow (Default)**: Tokens are returned directly in the URL fragment. This is the recommended approach and avoids the "Token exchange not implemented" error.
2. **Authorization Code Flow**: Tokens are exchanged via the backend `/api/auth/token` endpoint. This requires additional backend configuration.

By default, the application uses the **Implicit Flow** (`response_type=id_token token`).

## Step 1: Create a Group (Optional)

**Note**: Group requirement can be disabled by setting `REQUIRE_ADMIN_GROUP=false` in your backend `.env` file.

If you want to restrict access to specific users:

1. Navigate to **Directory > Groups** in authentik
2. Click **Create**
3. Enter the following:
   - **Name**: `GDGoC-Admins`
   - **Parent**: (leave empty)
4. Click **Create**
5. Add authorized users to this group

## Step 2: Create an OAuth2/OIDC Provider

1. Navigate to **Applications > Providers** in authentik
2. Click **Create**
3. Select **OAuth2/OpenID Provider**
4. Configure the provider:
   - **Name**: `GDGoC Certificates Provider`
   - **Authorization Flow**: Select your default authorization flow (e.g., `default-authorization-flow`)
   - **Client Type**: 
     - Use `Public` for Implicit Flow (recommended)
     - Use `Confidential` for Authorization Code Flow
   - **Client ID**: Generate or enter a unique ID (save this for later)
   - **Client Secret**: Only needed if using `Confidential` client type
   - **Redirect URIs**: Add these URIs:
     ```
     https://sudo.certs-admin.certs.gdg-oncampus.dev/auth/callback
     http://localhost:5173/auth/callback  (for local development)
     ```
   - **Signing Key**: Select your default signing key
   - **Scopes**: 
     - `openid`
     - `email`
     - `profile`
5. Click **Create**

## Step 3: Create an Application

1. Navigate to **Applications > Applications** in authentik
2. Click **Create**
3. Configure the application:
   - **Name**: `GDGoC Certificates`
   - **Slug**: `gdgoc-certs`
   - **Provider**: Select the provider you just created
   - **Launch URL**: `https://sudo.certs-admin.certs.gdg-oncampus.dev`
4. Click **Create**

## Step 4: Configure Token Claims

**Note**: Groups claim is only needed if you set `REQUIRE_ADMIN_GROUP=true` (default).

1. Go back to your provider (**Applications > Providers**)
2. Edit the `GDGoC Certificates Provider`
3. Navigate to **Advanced protocol settings**
4. Ensure these claims are mapped:
   - `sub` (subject) - User's unique ID (OCID)
   - `name` - User's full name
   - `email` - User's email address
   - `groups` - User's group memberships (optional, only if using group-based access control)

To add the groups claim (if needed):
1. Navigate to **Customization > Property Mappings**
2. Click **Create**
3. Select **Scope Mapping**
4. Configure:
   - **Name**: `GDGoC Groups`
   - **Scope name**: `groups`
   - **Expression**:
     ```python
     return {
         "groups": [group.name for group in request.user.ak_groups.all()]
     }
     ```
5. Click **Create**
6. Go back to your provider and add this scope mapping

## Step 5: Get Configuration URLs

From your authentik instance, note these URLs:

1. **Issuer URL**: 
   ```
   https://auth.your-domain.com/application/o/gdgoc-certs/
   ```

2. **JWKS URI**: 
   ```
   https://auth.your-domain.com/application/o/gdgoc-certs/jwks/
   ```

3. **Authorization Endpoint**: 
   ```
   https://auth.your-domain.com/application/o/authorize/
   ```

## Step 6: Update Environment Variables

Update your `.env` file with the authentik configuration:

```env
# Backend
AUTHENTIK_ISSUER=https://auth.your-domain.com/application/o/gdgoc-certs/
AUTHENTIK_JWKS_URI=https://auth.your-domain.com/application/o/gdgoc-certs/jwks/
AUTHENTIK_CLIENT_ID=<your-client-id>
AUTHENTIK_CLIENT_SECRET=<your-client-secret>  # Only needed for Authorization Code Flow

# Optional: Require GDGoC-Admins group membership (default: true)
REQUIRE_ADMIN_GROUP=true

# Frontend
VITE_AUTHENTIK_URL=https://auth.your-domain.com
VITE_AUTHENTIK_CLIENT_ID=<your-client-id>

# Response type: 'id_token token' for Implicit Flow (recommended), 'code' for Authorization Code Flow
VITE_AUTHENTIK_RESPONSE_TYPE=id_token token

# Frontend URL (used by backend for OAuth redirect)
FRONTEND_URL=https://sudo.certs-admin.certs.gdg-oncampus.dev
```

Replace:
- `auth.your-domain.com` with your authentik domain
- `<your-client-id>` with the Client ID from Step 2
- `<your-client-secret>` with the Client Secret from Step 2 (only if using Authorization Code Flow)

## Step 7: Test Authentication

1. Navigate to `https://sudo.certs-admin.certs.gdg-oncampus.dev`
2. Click "Sign in with authentik"
3. You should be redirected to authentik login
4. After successful login, you should be redirected back
5. If `REQUIRE_ADMIN_GROUP=true` and you're in the `GDGoC-Admins` group, you'll see the dashboard
6. If `REQUIRE_ADMIN_GROUP=false`, any authenticated user can access the dashboard

## Troubleshooting

### "Token exchange not implemented"
This error occurs when using Authorization Code Flow but authentik is not configured to support it. Solutions:
- **Recommended**: Use Implicit Flow by setting `VITE_AUTHENTIK_RESPONSE_TYPE=id_token token` (default)
- Or configure authentik provider with `Client Type: Confidential` and ensure `AUTHENTIK_CLIENT_SECRET` is set

### "Invalid redirect URI"
- Ensure the redirect URI in authentik exactly matches: `https://sudo.certs-admin.certs.gdg-oncampus.dev/auth/callback`
- Check for trailing slashes

### "Invalid token"
- Verify AUTHENTIK_ISSUER and AUTHENTIK_JWKS_URI are correct
- Check that the token includes required claims (sub, email, name)
- If using group-based access control, ensure the token includes the groups claim

### "Access denied"
- If `REQUIRE_ADMIN_GROUP=true`, user must be in the `GDGoC-Admins` group
- Check group membership in authentik
- Or set `REQUIRE_ADMIN_GROUP=false` to allow all authenticated users

### "CORS error"
- Ensure ALLOWED_ORIGINS includes both domains
- Verify Nginx Proxy Manager is forwarding correct headers

### "Token exchange failed"
- Verify AUTHENTIK_CLIENT_ID and AUTHENTIK_CLIENT_SECRET are correct
- Check that the redirect_uri matches exactly what's configured in authentik
- Ensure the authorization code hasn't expired (codes typically expire after 1 minute)
- Check backend logs for detailed error messages from authentik

## Additional Security

Consider implementing:
1. **Token expiration**: Set appropriate token lifetime in authentik
2. **Refresh tokens**: Enable refresh token rotation
3. **MFA**: Require multi-factor authentication for admin users
4. **Session limits**: Configure session policies in authentik

## Resources

- [authentik Documentation](https://goauthentik.io/docs/)
- [OAuth 2.0 and OpenID Connect](https://oauth.net/2/)
