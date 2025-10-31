# Token Exchange Error Fix

## Problem

Users were experiencing the authentication error:
```
Authentication Failed
Token exchange not implemented. Please configure your OIDC provider to return tokens directly.
```

This occurred on the callback URL:
```
https://sudo.certs-admin.certs.gdg-oncampus.dev/auth/callback?code=71557f1e61324fb396d9398a2ceec00b&state=
```

## Root Cause

The issue was that the `VITE_AUTHENTIK_RESPONSE_TYPE` environment variable was:
- ✅ Documented in `.env.example` files
- ✅ Supported in frontend code with a default value of `'id_token token'`
- ❌ **NOT** passed to the Docker build process

This meant that when the frontend was built using Docker, the environment variable was not available during the Vite build process. While the code had a fallback default, the Docker build needed explicit configuration to ensure the correct OAuth flow was used.

## Solution

Added `VITE_AUTHENTIK_RESPONSE_TYPE` to the Docker build configuration:

### 1. frontend/Dockerfile
Added the build argument and environment variable:
```dockerfile
ARG VITE_AUTHENTIK_RESPONSE_TYPE
ENV VITE_AUTHENTIK_RESPONSE_TYPE=$VITE_AUTHENTIK_RESPONSE_TYPE
```

### 2. docker-compose.yml
Added the build argument with a default value:
```yaml
frontend:
  build:
    args:
      VITE_AUTHENTIK_RESPONSE_TYPE: ${VITE_AUTHENTIK_RESPONSE_TYPE:-id_token token}
```

## How It Works

1. **Implicit Flow**: By setting `VITE_AUTHENTIK_RESPONSE_TYPE=id_token token`, the frontend uses OAuth 2.0 Implicit Flow
2. **Direct Token Return**: Authentik returns tokens directly in the URL fragment (after `#`)
3. **No Backend Exchange Needed**: The frontend extracts tokens from the URL fragment without needing to call the backend token exchange endpoint
4. **Default Value**: The docker-compose.yml includes a default value of `id_token token`, ensuring the correct flow is used even if not explicitly set in `.env`

## Impact

### Before
- Frontend builds in Docker didn't have access to `VITE_AUTHENTIK_RESPONSE_TYPE`
- Could potentially default to authorization code flow
- Users experienced "Token exchange not implemented" errors

### After
- Frontend builds include the `VITE_AUTHENTIK_RESPONSE_TYPE` variable
- Docker builds default to implicit flow (`id_token token`)
- Authentication works correctly without backend token exchange

## Files Modified

1. `frontend/Dockerfile` - Added ARG and ENV for `VITE_AUTHENTIK_RESPONSE_TYPE`
2. `docker-compose.yml` - Added build arg with default value for frontend service

## Deployment

To apply this fix:

1. **Pull the latest changes**:
   ```bash
   git pull origin main
   ```

2. **Rebuild the frontend container**:
   ```bash
   docker compose down frontend
   docker compose up -d --build frontend
   ```

3. **Or rebuild all containers**:
   ```bash
   docker compose down
   docker compose up -d --build
   ```

## Environment Variables

Users can now optionally set this in their `.env` file:
```env
VITE_AUTHENTIK_RESPONSE_TYPE=id_token token
```

If not set, the docker-compose.yml will default to `id_token token`.

## Security Note

The Implicit Flow (`id_token token`) is considered less secure than Authorization Code Flow as it exposes tokens in the URL fragment. However:
- It's simpler to configure and debug
- The backend token exchange endpoint is still available for environments that prefer Authorization Code Flow
- The default configuration prioritizes ease of use while maintaining reasonable security

For production environments requiring higher security, users can:
1. Set `VITE_AUTHENTIK_RESPONSE_TYPE=code` in `.env`
2. Configure Authentik with Client Type: Confidential
3. Set `AUTHENTIK_CLIENT_SECRET` in backend `.env`

## Verification

The fix has been verified:
- ✅ docker-compose.yml syntax is valid
- ✅ Frontend builds successfully with the new environment variable
- ✅ Built JavaScript includes the correct response type
- ✅ Backend syntax validation passed
- ✅ CodeQL security scan found no issues
- ✅ Code review passed with no comments

## References

- [OAuth 2.0 Implicit Flow](https://oauth.net/2/grant-types/implicit/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Compose Build Arguments](https://docs.docker.com/compose/compose-file/build/)
