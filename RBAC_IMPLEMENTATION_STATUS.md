# RBAC Implementation Status

## ✅ Completed

1. **Database Schema Created**
   - Tables: roles, permissions, role_permissions, user_roles
   - SQL file ready at: `apps/api/src/db/migrations/0001_sloppy_richard_fisk.sql`

2. **Seed Data Ready**
   - File: `apps/api/src/db/seed-roles.sql`
   - Creates 50 permissions (10 modules x 5 actions)
   - Creates 4 roles: Admin, Sales, BackOffice, Accountant
   - Admin gets ALL permissions
   - Other roles get appropriate subset

3. **Backend API Complete**
   - Service: `apps/api/src/modules/roles/roles.service.ts`
   - Routes: `apps/api/src/modules/roles/roles.routes.ts`
   - Integrated into main router

## API Endpoints Created

```
GET    /api/roles                     - Get all roles
GET    /api/roles/:id                 - Get role with permissions
GET    /api/permissions               - Get all permissions
POST   /api/roles                     - Create new role
PATCH  /api/roles/:id                 - Update role
POST   /api/roles/:id/permissions     - Assign permissions to role
GET    /api/me/role                   - Get current user's role
POST   /api/users/:clerkUserId/role   - Assign role to user
POST   /api/check-permission          - Check if user has permission
```

## 🔄 Next Steps

### 1. Run SQL in Supabase (REQUIRED)

Run these SQL files in your Supabase SQL Editor:

**First** - Create tables (if not already done):
```sql
-- From: apps/api/src/db/migrations/0001_sloppy_richard_fisk.sql
-- Lines 58-118 (roles, permissions, role_permissions, user_roles tables)
```

**Second** - Seed data:
```sql
-- From: apps/api/src/db/seed-roles.sql  
-- This creates all 4 roles and 50 permissions
```

### 2. Assign Roles to Your 4 Users

After running the seed, run this SQL to assign roles to your users:

```sql
-- Get role IDs
SELECT id, name FROM roles;

-- Then assign (replace ROLE_ID with actual IDs from above)
INSERT INTO user_roles (clerk_user_id, role_id) VALUES
('ELIOT_CLERK_USER_ID', 'ADMIN_ROLE_ID'),
('DANNY_CLERK_USER_ID', 'SALES_ROLE_ID'),
('KATERINA_CLERK_USER_ID', 'BACKOFFICE_ROLE_ID'),
('YOGI_CLERK_USER_ID', 'ACCOUNTANT_ROLE_ID');
```

To get Clerk User IDs, check Clerk Dashboard or have each user log in once.

### 3. Create Role Management UI

Create file: `apps/web/src/app/(dashboard)/settings/roles/page.tsx`

This UI should:
- List all roles
- Show permissions for selected role
- Allow toggling permissions (checkboxes)
- Save permission changes
- Create new roles

### 4. Update User Management Page

Modify: `apps/web/src/app/(dashboard)/users/page.tsx`

Changes needed:
- Fetch roles from API instead of hardcoded list
- When inviting user, select from available roles
- Show actual role name from database

### 5. Create Permission Checking Hooks

Create: `apps/web/src/hooks/usePermissions.ts`

```typescript
// Check if current user has permission
const hasPermission = usePermission('accounts', 'create')

// Get all user permissions
const { permissions, role } = useUserRole()
```

### 6. Protect UI Components

Add permission checks to:
- Navigation items (hide if no permission)
- Buttons (disable if no permission)
- Pages (redirect if no permission)

Example:
```typescript
{hasPermission('accounts', 'create') && (
  <Button>Create Account</Button>
)}
```

## Permission Matrix

| Role | Modules | Actions |
|------|---------|---------|
| **Admin** | All | All (view, create, edit, delete, export) |
| **Sales** | dashboard, accounts, orders, products, email, reports | All actions |
| **BackOffice** | dashboard, accounts, orders, products, contracts, email | All actions |
| **Accountant** | dashboard, invoices, reports | view, edit, export only |
| **Accountant** | orders, accounts | view only |

## Files Created

1. `apps/api/src/db/schema/roles.ts`
2. `apps/api/src/db/schema/user-roles.ts`
3. `apps/api/src/db/seed-roles.ts`
4. `apps/api/src/db/seed-roles.sql` ⭐ RUN THIS
5. `apps/api/src/modules/roles/roles.service.ts`
6. `apps/api/src/modules/roles/roles.routes.ts`

## Testing After Setup

1. Login as each user
2. Check their role: `GET /api/me/role`
3. Verify permissions differ by role
4. Test permission checking: `POST /api/check-permission`
5. Try creating a new role via API
6. Assign permissions to the new role

## Future Enhancements

- Row-level permissions (e.g., sales can only see their own orders)
- Time-based access (temporary elevated permissions)
- Permission inheritance (role hierarchies)
- Audit log for permission changes
