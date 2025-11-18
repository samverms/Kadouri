# RBAC Quick Reference

## Access Role Management
URL: http://localhost:2005/settings/roles

## API Endpoints
```
GET    /api/roles                     - List roles
GET    /api/roles/:id                 - Get role details
GET    /api/permissions               - List permissions
POST   /api/roles/:id/permissions     - Update role permissions
GET    /api/me/role                   - Get my role & permissions
```

## Use in Code
```typescript
import { usePermission } from '@/hooks/usePermissions'

const canEdit = usePermission('accounts', 'edit')
```

## 4 Roles Created
1. Admin - Full access
2. Sales - Accounts, Orders, Products, Reports
3. BackOffice - Accounts, Orders, Contracts
4. Accountant - Invoices (full), Orders/Accounts (view)

## Done! ✅
