---
sidebar_position: 6
---

# Role-Based Access Control (RBAC)

PACE CRM includes a comprehensive RBAC system for fine-grained access control across all features.

## Overview

The RBAC system provides:

- **4 Default Roles** with predefined permissions
- **10 Modules** covering all system features
- **5 Actions** per module (view, create, edit, delete, export)
- **50 Total Permissions** (10 modules × 5 actions)
- **User-Role Assignment** via database
- **Frontend Permission Hooks** for conditional rendering
- **API Permission Checks** for secure endpoints

## Default Roles

### Admin
**Full access to all modules and actions**

Permissions: All 50 permissions enabled

Use case: System administrators, managers

### Sales
**Access to customer-facing modules**

Modules:
- Dashboard (all actions)
- Accounts (all actions)
- Orders (all actions)
- Products (all actions)
- Email (all actions)
- Reports (view, export)

Use case: Sales representatives, account managers

### BackOffice
**Access to operational modules**

Modules:
- Dashboard (all actions)
- Accounts (all actions)
- Orders (all actions)
- Products (all actions)
- Contracts (all actions)
- Email (all actions)

Use case: Operations team, customer service

### Accountant
**Financial and reporting access**

Modules:
- Dashboard (view)
- Invoices (view, edit, export)
- Reports (view, export)
- Accounts (view only)
- Orders (view only)

Use case: Accounting department, financial analysts

## Database Schema

The RBAC system uses 4 tables:

### `roles`
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `permissions`
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  module TEXT NOT NULL,     -- 'accounts', 'orders', etc.
  action TEXT NOT NULL,      -- 'view', 'create', 'edit', 'delete', 'export'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `role_permissions`
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `user_roles`
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Using Permissions in Frontend

### Permission Hooks

PACE CRM provides custom hooks for checking permissions:

```typescript
import { usePermission, useUserRole } from '@/hooks/usePermissions'

function AccountsPage() {
  // Check specific permission
  const canCreateAccounts = usePermission('accounts', 'create')
  const canEditAccounts = usePermission('accounts', 'edit')
  const canDeleteAccounts = usePermission('accounts', 'delete')

  // Get full role info
  const { role, permissions, isLoading } = useUserRole()

  return (
    <div>
      {canCreateAccounts && (
        <Button onClick={handleCreate}>Create Account</Button>
      )}

      {canEditAccounts && (
        <Button onClick={handleEdit}>Edit</Button>
      )}

      {canDeleteAccounts && (
        <Button onClick={handleDelete}>Delete</Button>
      )}
    </div>
  )
}
```

### Conditional Rendering

```typescript
// Show/hide entire sections
{usePermission('reports', 'view') && (
  <ReportsSection />
)}

// Disable buttons
<Button disabled={!usePermission('orders', 'edit')}>
  Edit Order
</Button>

// Route protection (in layout or middleware)
const canViewSettings = usePermission('settings', 'view')
if (!canViewSettings) {
  redirect('/dashboard')
}
```

## Managing Roles

### Via UI (Settings Page)

Navigate to: `/settings/roles`

1. **View Roles**: Left sidebar shows all roles
2. **Select Role**: Click a role to view its permissions
3. **Edit Permissions**: Toggle checkboxes by module and action
4. **Save Changes**: Click "Save Changes" button

### Via API

#### Get All Roles
```bash
GET /api/roles
```

#### Get Role with Permissions
```bash
GET /api/roles/:roleId
```

#### Update Role Permissions
```bash
POST /api/roles/:roleId/permissions
Content-Type: application/json

{
  "permissionIds": ["uuid1", "uuid2", "uuid3"]
}
```

#### Get Current User's Role
```bash
GET /api/me/role
```

Response:
```json
{
  "role": {
    "id": "...",
    "name": "Sales",
    "description": "..."
  },
  "permissions": [
    {
      "module": "accounts",
      "action": "view"
    },
    {
      "module": "accounts",
      "action": "create"
    }
  ]
}
```

## Assigning Roles to Users

Currently, roles are assigned via direct database insert:

```sql
-- Get role ID
SELECT id FROM roles WHERE name = 'Sales';

-- Assign role to user (use Clerk user ID)
INSERT INTO user_roles (clerk_user_id, role_id)
VALUES ('user_2abc123xyz', 'role-uuid-here');
```

## Permission Matrix

| Module | View | Create | Edit | Delete | Export |
|--------|------|--------|------|--------|--------|
| Dashboard | ✓ | - | - | - | - |
| Accounts | ✓ | ✓ | ✓ | ✓ | ✓ |
| Orders | ✓ | ✓ | ✓ | ✓ | ✓ |
| Products | ✓ | ✓ | ✓ | ✓ | ✓ |
| Invoices | ✓ | ✓ | ✓ | ✓ | ✓ |
| Contracts | ✓ | ✓ | ✓ | ✓ | ✓ |
| Email | ✓ | ✓ | - | - | - |
| Reports | ✓ | - | - | - | ✓ |
| Users | ✓ | ✓ | ✓ | ✓ | - |
| Settings | ✓ | - | ✓ | - | - |

## Best Practices

### 1. Check Permissions Early
Always check permissions before rendering UI elements or making API calls.

### 2. Use Hooks for Simplicity
Prefer `usePermission()` hook over manually checking role names.

### 3. Server-Side Validation
Always validate permissions on the API, never trust frontend checks alone.

### 4. Principle of Least Privilege
Assign users the minimum permissions needed for their job function.

### 5. Regular Audits
Periodically review user-role assignments and permission grants.

## Future Enhancements

Planned improvements for the RBAC system:

1. **UI for User-Role Assignment**: Manage roles from the Users page
2. **Custom Roles**: Allow creating new roles with custom permission sets
3. **Row-Level Security**: Restrict data access by account ownership
4. **Audit Logging**: Track all permission changes
5. **Time-Based Permissions**: Temporary role assignments
6. **Permission Groups**: Bundle related permissions together

## Related

- [API Reference - Roles](../api/roles)
- [Authentication](../architecture/authentication)
- [User Management](users)
