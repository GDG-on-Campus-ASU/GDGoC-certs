# Testing Guide for OAuth 2.0 Authentication

This guide helps you test the OAuth 2.0 authentication flow after implementing the token exchange endpoint.

## Prerequisites

Before testing, ensure you have:
1. Configured authentik with the correct OAuth 2.0 settings
2. Set all required environment variables in your `.env` file
3. Deployed or running the backend and frontend services

## Required Environment Variables

Make sure these are set in your backend `.env` file:
```env
AUTHENTIK_ISSUER=https://auth.your-domain.com/application/o/gdgoc-certs/
AUTHENTIK_JWKS_URI=https://auth.your-domain.com/application/o/gdgoc-certs/jwks/
AUTHENTIK_CLIENT_ID=your-authentik-client-id
AUTHENTIK_CLIENT_SECRET=your-authentik-client-secret
FRONTEND_URL=https://sudo.certs-admin.certs.gdg-oncampus.dev
ALLOWED_ORIGINS=https://sudo.certs-admin.certs.gdg-oncampus.dev,https://certs.gdg-oncampus.dev
```

⚠️ **Security Warning**: The `AUTHENTIK_CLIENT_SECRET` is sensitive information. Never commit it to version control, share it in logs, or expose it to the frontend. Keep it secure on the backend only.

## Test 1: Backend API Endpoint Availability

Test that all API endpoints are responding correctly:

```bash
# Replace $API_URL with your actual API URL (e.g., https://api.certs.gdg-oncampus.dev)
API_URL="https://api.certs.gdg-oncampus.dev"

# Test health check
curl $API_URL/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-XXT..."}

# Test 404 for non-existent endpoint
curl $API_URL/api/nonexistent

# Expected response:
# {"error":"Endpoint not found"}
```

## Test 2: Token Exchange Endpoint

Test the token exchange endpoint (requires a valid authorization code):

```bash
# Replace $API_URL and $FRONTEND_URL with your actual URLs
API_URL="https://api.certs.gdg-oncampus.dev"
FRONTEND_URL="https://sudo.certs-admin.certs.gdg-oncampus.dev"

# This will fail without a valid code, but should return a proper error
curl -X POST $API_URL/api/auth/token \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"invalid_code\",\"redirect_uri\":\"$FRONTEND_URL/auth/callback\"}"

# Expected response (from authentik):
# {"error":"Invalid authorization code"} or similar
```

## Test 3: Full Authentication Flow

### Step 1: Initiate Login
1. Open your browser to your frontend URL (e.g., `https://sudo.certs-admin.certs.gdg-oncampus.dev`)
2. Click "Sign in with authentik"
3. You should be redirected to authentik login page

### Step 2: Authenticate with authentik
1. Enter your authentik credentials
2. Complete any MFA if required
3. You should be redirected back to the callback URL

### Step 3: Verify Callback Processing
The URL will be: `https://your-frontend-url/auth/callback?code=XXXXX`

Watch for these status messages in the UI:
1. "Processing authentication..."
2. "Exchanging authorization code..."
3. "Validating credentials..."
4. "Authentication successful!"

### Step 4: Verify Dashboard Access
- If you're in the `GDGoC-Admins` group, you'll see the admin dashboard
- If not, you'll see an "Access denied" error
- If profile setup is needed, you'll be redirected to `/profile-setup`

## Test 4: Browser Console Verification

Open browser developer tools (F12) and check:

1. **Network Tab**: Look for these successful requests:
   - `POST /api/auth/token` (Status: 200)
   - `POST /api/auth/login` (Status: 200 or 201)

2. **Console Tab**: Should see no error messages

3. **Application/Storage Tab**: 
   - Check localStorage for `jwt_token`
   - Token should be a valid JWT (three parts separated by dots)

## Test 5: API Access with Token

After successful login, test authenticated endpoints:

```bash
# Replace $API_URL and TOKEN with your actual values
API_URL="https://api.certs.gdg-oncampus.dev"
TOKEN="your-jwt-token-from-localStorage"

# Get current user info
curl $API_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {"user":{"ocid":"...","name":"...","email":"...","org_name":"...","can_login":true}}
```

## Common Issues and Solutions

### Issue 1: "Token exchange not implemented"
**Cause**: This error should no longer appear after the fix.
**Solution**: Ensure you've deployed the latest version with the token exchange endpoint.

### Issue 2: "Endpoint not found"
**Cause**: Backend API is not accessible or CORS is blocking requests.
**Solutions**:
- Check that backend is running: `curl $API_URL/health` (replace $API_URL with your actual API URL)
- Verify ALLOWED_ORIGINS includes your frontend domain
- Check Nginx Proxy Manager configuration
- Review backend logs for CORS errors

### Issue 3: "Failed to exchange authorization code"
**Causes**:
- Invalid AUTHENTIK_CLIENT_ID or AUTHENTIK_CLIENT_SECRET
- Authorization code expired (codes expire after ~1 minute)
- Redirect URI mismatch between frontend and authentik config

**Solutions**:
- Double-check environment variables
- Ensure redirect URI in authentik exactly matches your frontend callback URL (e.g., `https://your-frontend-url/auth/callback`)
- Try the login flow again to get a fresh code

### Issue 4: "Invalid or expired token"
**Causes**:
- AUTHENTIK_ISSUER or AUTHENTIK_JWKS_URI incorrect
- Token doesn't include required claims (sub, email, name, groups)

**Solutions**:
- Verify AUTHENTIK_ISSUER and AUTHENTIK_JWKS_URI URLs
- Check authentik provider configuration includes all required scopes
- Verify groups scope mapping is configured correctly

### Issue 5: "Access denied. Admin group membership required"
**Cause**: User is not in the `GDGoC-Admins` group
**Solution**: Add user to the `GDGoC-Admins` group in authentik

## Debugging Tips

### Enable Verbose Logging

Check backend logs:
```bash
# Replace with your actual container name if different
docker logs gdgoc-certs-backend -f
```

Look for these messages:
- "Token exchange error:" - indicates problem with authentik communication
- "JWT verification error:" - indicates problem with token validation
- "NEW USER AUTO-PROVISIONED:" - indicates successful first-time login

### Test Token Validity

You can decode (but not verify) a JWT token locally to check its structure.

⚠️ **Security Warning**: Never paste production tokens into online services like jwt.io, as this exposes sensitive data to third parties. Instead, use local tools to decode tokens:

```bash
# Decode JWT token locally using Node.js
node -e "const token = process.argv[1]; const payload = Buffer.from(token.split('.')[1], 'base64').toString(); console.log(JSON.parse(payload));" "YOUR_TOKEN_HERE"
```

Or use the `jq` tool:
```bash
TOKEN="YOUR_TOKEN_HERE"
echo $TOKEN | cut -d. -f2 | base64 -d | jq .
```

Verify the token includes:
- Claims: `sub`, `email`, `name`, `groups`
- `groups` array includes "GDGoC-Admins"
- Token hasn't expired (`exp` claim is in the future)

### Manual Token Exchange Test

To test token exchange manually:
1. Start the login flow and stop at the callback URL
2. Copy the `code` parameter from the URL
3. Within 1 minute, use curl to exchange it:
```bash
# Replace $API_URL, $FRONTEND_URL, and CODE with your actual values
API_URL="https://api.certs.gdg-oncampus.dev"
FRONTEND_URL="https://sudo.certs-admin.certs.gdg-oncampus.dev"
CODE="<paste-code-here>"

curl -X POST $API_URL/api/auth/token \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$CODE\",\"redirect_uri\":\"$FRONTEND_URL/auth/callback\"}"
```

## Success Criteria

Authentication is working correctly when:
- ✅ Health check endpoint responds
- ✅ Login redirects to authentik
- ✅ Callback processes without errors
- ✅ Token exchange returns access_token
- ✅ Login endpoint provisions user
- ✅ Dashboard is accessible for admin group members
- ✅ JWT token is stored in localStorage
- ✅ Authenticated API calls succeed
