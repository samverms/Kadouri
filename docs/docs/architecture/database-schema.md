---
sidebar_position: 3
---

# Database Schema

Complete reference for PACE CRM PostgreSQL database schema.

## Overview

The database uses PostgreSQL with Drizzle ORM for type-safe database operations.

All tables follow these conventions:
- UUID primary keys
- `created_at` and `updated_at` timestamps
- Foreign keys with appropriate CASCADE rules
- `numeric` type for financial/weight data

## Core Tables

### Accounts

Stores sellers and buyers (customers).

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'seller' or 'buyer'
  email TEXT,
  phone TEXT,
  qbo_customer_id TEXT,  -- QuickBooks customer ID
  qbo_sync_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Related tables:
- `addresses` - Multiple addresses per account
- `contacts` - Contact persons for the account

### Products

Product/item catalog.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  variety TEXT,
  grade TEXT,
  price NUMERIC(10, 2),
  unit TEXT,
  qbo_item_id TEXT,  -- QuickBooks item ID
  qbo_sync_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Orders

Order headers and line items.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  seller_id UUID REFERENCES accounts(id),
  buyer_id UUID REFERENCES accounts(id),
  status TEXT NOT NULL,  -- 'draft', 'confirmed', 'posted_to_qb', 'paid'
  total_amount NUMERIC(12, 2),
  qbo_doc_id TEXT,       -- QuickBooks invoice/estimate ID
  qbo_doc_number TEXT,
  qbo_doc_type TEXT,     -- 'invoice' or 'estimate'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_lines (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity NUMERIC(10, 2),
  unit_price NUMERIC(10, 2),
  line_total NUMERIC(12, 2),
  commission_rate NUMERIC(5, 2),  -- Percentage
  commission_amount NUMERIC(12, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## RBAC Tables

### Roles

System roles (Admin, Sales, BackOffice, Accountant).

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

### Permissions

All available permissions in the system.

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  module TEXT NOT NULL,  -- 'accounts', 'orders', etc.
  action TEXT NOT NULL,  -- 'view', 'create', 'edit', 'delete', 'export'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Role Permissions

Maps roles to permissions (many-to-many).

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### User Roles

Assigns roles to users (Clerk user IDs).

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Integration Tables

### Sync Maps

Tracks entity-to-QuickBooks mappings.

```sql
CREATE TABLE sync_maps (
  id UUID PRIMARY KEY,
  local_entity_type TEXT NOT NULL,  -- 'account', 'product', 'order'
  local_entity_id UUID NOT NULL,
  qbo_entity_type TEXT NOT NULL,    -- 'customer', 'item', 'invoice'
  qbo_entity_id TEXT NOT NULL,
  qbo_sync_token TEXT,
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Emails

Email tracking and templates.

```sql
CREATE TABLE emails (
  id UUID PRIMARY KEY,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP,
  status TEXT,  -- 'pending', 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## User Management

### Users

User accounts (synced with Clerk).

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Entity Relationships

```
accounts (1) ─── (many) addresses
accounts (1) ─── (many) contacts
accounts (1) ─── (many) orders (as seller)
accounts (1) ─── (many) orders (as buyer)

products (1) ─── (many) order_lines

orders (1) ─── (many) order_lines

roles (1) ─── (many) role_permissions
permissions (1) ─── (many) role_permissions
roles (1) ─── (many) user_roles
```

## Migrations

Migrations are managed with Drizzle Kit and stored in `apps/api/src/db/migrations/`.

### Create Migration

```bash
cd apps/api
npm run migration:generate
```

### Run Migrations

```bash
npm run migration:run
```

## Seeding

Initial data can be seeded using TypeScript scripts:

```bash
# Seed RBAC roles (required)
npx tsx src/db/seed-roles.ts

# Seed sample data (optional)
npx tsx src/db/seed.ts
```

## Database Tools

### Drizzle Studio

Visual database browser:

```bash
cd apps/api
npm run db:studio
```

Visit: http://localhost:4983

### psql

Direct PostgreSQL access:

```bash
psql pace_crm
```

## Best Practices

1. **Always use migrations** for schema changes in production
2. **Use transactions** for multi-step operations
3. **Use numeric types** for financial data (not float)
4. **Index foreign keys** for query performance
5. **Validate data** at application layer (Zod schemas)

## Next Steps

- [Authentication](authentication)
- [Features Overview](../features/accounts)
