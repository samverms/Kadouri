# Clerk Integration Guide - PACE CRM

## Overview

PACE CRM now uses **Clerk** for authentication with:
- ✅ Custom login page (not Clerk's default UI)
- ✅ Invitation-only registration (no public signup)
- ✅ Role-based access control (admin, manager, agent, readonly)
- ✅ Single-tenant configuration

## What Was Configured

### 1. Environment Variables

**Frontend** (`apps/web/.env.local` and `apps/sales/.env.local`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c3dlZXBpbmctbGFjZXdpbmctNjguY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_tILEN2OXDfPZoaRQKMWXdjKhb9oNCcj9b252oM4v4D
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/accept-invitation
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**Backend** (`apps/api/.env`):
```env
CLERK_SECRET_KEY=sk_test_tILEN2OXDfPZoaRQKMWXdjKhb9oNCcj9b252oM4v4D
CLERK_PUBLISHABLE_KEY=pk_test_c3dlZXBpbmctbGFjZXdpbmctNjguY2xlcmsuYWNjb3VudHMuZGV2JA
```

### 2. Backend Changes

- **`apps/api/src/main.ts`**: Added Clerk middleware
- **`apps/api/src/middleware/auth.ts`**: Replaced mock auth with Clerk authentication
  - Extracts user from Clerk session
  - Reads role from Clerk's `publicMetadata`
  - Provides `authorize()` middleware for role-based access
- **`apps/api/src/modules/users/invitation.service.ts`**: Updated to work with Clerk
  - Creates/updates Clerk users with roles
  - Stores role in Clerk's `publicMetadata`
- **`apps/api/src/modules/users/invitation.routes.ts`**: New API routes for invitations
- **`apps/api/src/routes/index.ts`**: Registered invitation routes

### 3. Frontend Changes

- **`apps/web/src/app/layout.tsx`**: Wrapped app in `ClerkProvider`
- **`apps/web/src/middleware.ts`**: Added Clerk route protection
- **`apps/web/src/app/login/page.tsx`**: Updated to use Clerk's `useSignIn` hook
- **`apps/web/src/app/logout/page.tsx`**: Updated to use Clerk's `useClerk` hook
- **`apps/web/src/app/accept-invitation/page.tsx`**: Integrated with Clerk's `useSignUp` hook

## User Flow

### 1. Admin Invites a User

```bash
POST /api/invitations
Authorization: Bearer <clerk-token>

{
  "email": "user@example.com",
  "role": "agent"  # admin | manager | agent | readonly
}
```

Response includes invitation token and URL (logged to console for now).

### 2. User Accepts Invitation

1. User receives email with invitation link: `/accept-invitation?token=<token>`
2. Frontend validates token via `/api/invitations/verify/<token>`
3. User fills in name and password
4. System creates Clerk account with `useSignUp`
5. System calls `/api/invitations/accept` to assign role
6. User redirected to `/dashboard`

### 3. User Logs In

1. User visits `/login`
2. Enters email/password
3. Clerk authenticates user
4. Redirected to `/dashboard`

## API Endpoints

### Invitations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/invitations` | admin | Create invitation |
| GET | `/api/invitations` | admin/manager | List all invitations |
| GET | `/api/invitations/verify/:token` | public | Verify token validity |
| POST | `/api/invitations/accept` | authenticated | Accept invitation |
| POST | `/api/invitations/:id/resend` | admin | Resend invitation |
| DELETE | `/api/invitations/:id` | admin | Revoke invitation |

## Role-Based Access Control

Roles are stored in Clerk's `publicMetadata.role` and enforced via the `authorize()` middleware.

### Role Permissions

```typescript
// apps/api/src/middleware/auth.ts
router.use('/orders', authenticate, authorize('admin', 'agent'), ordersRouter)
```

**Available Roles**:
- `admin`: Full access
- `manager`: Can invite users, view all data
- `agent`: Can create/edit orders, view accounts/products
- `readonly`: Read-only access

## Clerk Dashboard Configuration

⚠️ **Important**: Configure your Clerk application at https://dashboard.clerk.com

### Required Settings:

1. **Disable Public Signups**:
   - Go to "User & Authentication" → "Email, Phone, Username"
   - Disable "Allow sign ups"

2. **Session Settings**:
   - Go to "Sessions"
   - Set session lifetime as needed

3. **Metadata** (for roles):
   - Roles are stored in `publicMetadata.role`
   - No special configuration needed - the API handles this

4. **Redirect URLs** (for production):
   - Add your production URLs to "Allowed redirect URLs"
   - Add your production API URL to "Allowed origins"

## Testing the Integration

### 1. Start the Servers

```bash
# Terminal 1: API Server
cd apps/api
npm run dev
# Server runs on http://localhost:3001

# Terminal 2: Web Dashboard
cd apps/web
npm run dev
# Dashboard runs on http://localhost:3000
```

### 2. Create First Admin User

Since there's no public signup, you need to create the first admin manually in Clerk Dashboard:

1. Go to https://dashboard.clerk.com
2. Navigate to "Users"
3. Click "Create user"
4. Add email and password
5. In "Public metadata", add:
   ```json
   {
     "role": "admin"
   }
   ```

### 3. Test Login

1. Visit http://localhost:3000/login
2. Enter the admin credentials
3. Should redirect to `/dashboard`

### 4. Test Invitation Flow

```bash
# Create an invitation (as admin)
curl -X POST http://localhost:3001/api/invitations \
  -H "Authorization: Bearer <clerk-session-token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","role":"agent"}'

# Check console logs for invitation URL
# Example: http://localhost:3000/accept-invitation?token=abc123...

# Visit the URL in browser to complete signup
```

## Database Schema

The `userInvitations` table tracks invitations:

```sql
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  invited_by VARCHAR(50) NOT NULL,  -- Clerk user ID
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  resent_at TIMESTAMP,
  resent_count VARCHAR(10) DEFAULT '0',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

The `users` table syncs basic info from Clerk:

```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,  -- Clerk user ID
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'agent',
  active BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Troubleshooting

### API Returns 401 Unauthorized
- Check that Clerk keys are correctly set in `.env` files
- Verify the session token is being sent from frontend
- Check browser console for Clerk errors

### Invitation Acceptance Fails
- Verify invitation token is valid and not expired
- Check that email matches the invitation
- Ensure Clerk allows the email domain

### Role Not Applied
- Check that `publicMetadata.role` is set in Clerk
- Verify `/api/invitations/accept` was called successfully
- Check API logs for errors

### CORS Errors
- Verify `apps/api/src/main.ts` CORS config includes your frontend URL
- Check that `withCredentials: true` is set on frontend API calls

## Next Steps

1. **Email Integration**: Uncomment email sending in `invitation.service.ts`
2. **MFA**: Implement MFA using Clerk's built-in 2FA
3. **User Management UI**: Create admin page to manage invitations
4. **Webhook**: Set up Clerk webhook to sync user changes
5. **Production**: Update env vars with production Clerk keys

## Security Notes

- ✅ No public signup - invitation-only
- ✅ Role-based access control on all routes
- ✅ Tokens expire after 7 days
- ✅ Sessions managed by Clerk
- ⚠️ Email notifications currently disabled (see invitation.service.ts)
- ⚠️ Remember to enable HTTPS in production
- ⚠️ Store sensitive env vars securely (never commit them!)

## Support

- Clerk Documentation: https://clerk.com/docs
- Clerk Dashboard: https://dashboard.clerk.com
- API running at: http://localhost:3001
- Web Dashboard: http://localhost:3000
- Sales Dashboard: http://localhost:3003
