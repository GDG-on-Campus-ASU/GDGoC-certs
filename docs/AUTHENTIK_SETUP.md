# Setting Up authentik OIDC Provider

This guide explains how to configure authentik as an OIDC provider for the GDGoC Certificate Generator.

## Prerequisites

- Running authentik instance
- Admin access to authentik
- GDGoC Certificate Generator backend and frontend deployed

## Step 1: Create a Group

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
   - **Authorization Flow**: Select your default authorization flow
   - **Client Type**: `Confidential`
   - **Client ID**: Generate or enter a unique ID (save this for later)
   - **Client Secret**: Generate or enter a secret (save this for later)
   - **Redirect URIs**: Add these URIs:
     ```
     https://sudo.certs-admin.certs.gdg-oncampus.dev/auth/callback
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

1. Go back to your provider (**Applications > Providers**)
2. Edit the `GDGoC Certificates Provider`
3. Navigate to **Advanced protocol settings**
4. Ensure these claims are mapped:
   - `sub` (subject) - User's unique ID (OCID)
   - `name` - User's full name
   - `email` - User's email address
   - `groups` - User's group memberships

To add the groups claim:
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
AUTHENTIK_AUDIENCE=<your-client-id>

# Frontend
VITE_AUTHENTIK_URL=https://auth.your-domain.com
VITE_AUTHENTIK_CLIENT_ID=<your-client-id>
```

Replace:
- `auth.your-domain.com` with your authentik domain
- `<your-client-id>` with the Client ID from Step 2

## Step 7: Test Authentication

1. Navigate to `https://sudo.certs-admin.certs.gdg-oncampus.dev`
2. Click "Sign in with authentik"
3. You should be redirected to authentik login
4. After successful login, you should be redirected back
5. If you're in the `GDGoC-Admins` group, you'll see the dashboard
6. If not, you'll get a 403 error

## Troubleshooting

### "Invalid redirect URI"
- Ensure the redirect URI in authentik exactly matches: `https://sudo.certs-admin.certs.gdg-oncampus.dev/auth/callback`
- Check for trailing slashes

### "Invalid token"
- Verify AUTHENTIK_ISSUER and AUTHENTIK_JWKS_URI are correct
- Check that the token includes required claims (sub, email, name, groups)

### "Access denied"
- User must be in the `GDGoC-Admins` group
- Check group membership in authentik

### "CORS error"
- Ensure ALLOWED_ORIGINS includes both domains
- Verify Nginx Proxy Manager is forwarding correct headers

## Additional Security

Consider implementing:
1. **Token expiration**: Set appropriate token lifetime in authentik
2. **Refresh tokens**: Enable refresh token rotation
3. **MFA**: Require multi-factor authentication for admin users
4. **Session limits**: Configure session policies in authentik

## Resources

- [authentik Documentation](https://goauthentik.io/docs/)
- [OAuth 2.0 and OpenID Connect](https://oauth.net/2/)
