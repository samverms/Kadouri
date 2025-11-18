# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PACE CRM is a modern order management system with QuickBooks Online integration, built for produce/agricultural sales with commission tracking. It's a **Turborepo monorepo** with a Next.js frontend and Express backend.

### Tech Stack
- **Frontend**: Next.js 14, TailwindCSS, TanStack Query/Table, Zustand, React Hook Form + Zod, Clerk auth
- **Backend**: Node.js/Express, PostgreSQL (Drizzle ORM), Redis (caching), BullMQ (job queues), Puppeteer (PDF generation), AWS S3 (file storage)
- **Integration**: QuickBooks Online API with OAuth 2.0, Microsoft Outlook (email)
- **Monorepo**: Turborepo with npm workspaces

## Development Commands

### Monorepo Commands (from root)
```bash
npm install                # Install all dependencies across all workspaces
npm run dev                # Start all apps in dev mode (api + web + sales)
npm run dev:admin          # Start only web dashboard + api
npm run dev:sales          # Start only sales dashboard + api
npm run build              # Build all apps
npm run build:admin        # Build only web dashboard
npm run build:sales        # Build only sales dashboard
npm run lint               # Lint all packages
npm run test               # Run tests across all packages
npm run clean              # Clean all build artifacts and node_modules
```

**Note on Turborepo**: This monorepo uses Turborepo for task orchestration. Commands like `dev:admin` use `turbo run dev --filter=web` which runs the `dev` task for the `web` package and its dependencies (including `api`). The API server always starts when using these commands.

### Backend-Specific Commands (from apps/api)
```bash
npm run dev                    # Start API server with nodemon + ts-node on port 2000
npm run build                  # Compile TypeScript to dist/
npm run start                  # Run production build
npm run lint                   # ESLint TypeScript files
npm run test                   # Run Jest tests

# Database commands
npm run migration:generate     # Generate migration from schema changes (drizzle-kit generate:pg)
npm run migration:run          # Run pending migrations (ts-node src/db/migrate.ts)
npm run db:push               # Push schema changes directly to DB (drizzle-kit push:pg)
npm run db:studio             # Open Drizzle Studio GUI

# Direct execution (for one-off tasks)
npx tsx src/db/seed.ts        # Seed database with initial data
npx tsx src/db/migrate.ts     # Run migrations directly
```

### Frontend-Specific Commands
```bash
# From apps/web (Admin Dashboard - port 2005)
npm run dev          # Start Next.js dev server on port 2005
npm run build        # Build production Next.js app
npm run start        # Start production server
npm run lint         # Next.js linting

# From apps/sales (Sales Dashboard - port 2010)
npm run dev          # Start Next.js dev server on port 2010
npm run build        # Build production Next.js app
npm run start        # Start production server on port 2010
npm run lint         # Next.js linting
```

## Architecture & Key Concepts

### Monorepo Structure
```
apps/
  ├── api/           # Express backend - API server with DB access
  ├── web/           # Next.js admin dashboard (port 2005) - Simple UI
  ├── sales/         # Next.js sales dashboard (port 2010) - Modern/redesigned UI
packages/
  └── shared/        # Shared TypeScript types, Zod schemas, constants
```

**Two Frontend Versions**: Both `web` and `sales` apps are identical in functionality but have different UI designs. The sales dashboard features gradient backgrounds, enhanced metrics, and modern card-based UI.

### Database Schema (Drizzle ORM)
Located in `apps/api/src/db/schema/`:
- **accounts.ts**: Sellers/Buyers with QBO customer mapping, addresses, contacts
- **products.ts**: Items with QBO item mapping, variety/grade tracking
- **orders.ts**: Order headers with seller/buyer refs, status tracking, QBO doc mapping, order lines
- **sync.ts**: Tracks entity-to-QBO mappings (syncMaps table)
- **users.ts**: User accounts with Clerk integration
- **emails.ts**: Email templates and sent email tracking
- **roles.ts**: RBAC system with roles, permissions, and role_permissions tables
- **user-roles.ts**: Maps Clerk users to roles

Key patterns:
- All tables use UUID primary keys
- Timestamps (`createdAt`, `updatedAt`) on all entities
- Foreign keys with CASCADE delete where appropriate
- Numeric columns use `numeric(precision, scale)` for financial data
- Related entities (addresses, contacts, orderLines) are often defined in the same schema file as their parent

### QuickBooks Integration
**Location**: `apps/api/src/services/quickbooks.bak/` (currently in backup state)
- **client.ts**: QBO API wrapper using intuit-oauth
- **sync.ts**: Bidirectional sync logic
  - `syncAccountToCustomer()`: Maps local account → QBO Customer (with address)
  - `syncProductToItem()`: Maps local product → QBO Service Item
  - `pushOrderToQBO()`: Creates QBO Invoice/Estimate from order
  - `syncInvoiceStatus()`: Checks QBO payment status
- **webhook.ts**: Handles QBO webhook notifications
- **config.ts**: QBO environment/credentials setup
- **types.ts**: QBO entity TypeScript interfaces

Sync flow: Local entity → Check if synced → Find/Create in QBO → Store mapping in `syncMaps`

### Email Service
**Location**: `apps/api/src/services/email/`
- **email-service.ts**: Email sending service with template support
- **outlook-client.ts**: Microsoft Outlook integration for sending emails
- Supports HTML templates and attachments
- Email tracking stored in `emails` table

### Module Structure (Backend)
Domain modules are located in `apps/api/src/modules/[domain]/` and follow this pattern:
```
modules/[domain]/
  ├── [domain].service.ts    # Business logic, DB operations
  ├── [domain].controller.ts # Request/response handling (optional)
  └── [domain].routes.ts     # Express route definitions
```

**Current Modules**:
- `modules/accounts/` - Account management (sellers/buyers with addresses and contacts)
- `modules/products/` - Product/item management
- `modules/orders/` - Order entry and management
- `modules/search/` - Global search functionality across entities
- `modules/users/` - User management, MFA, and invitations
- `modules/roles/` - Role-Based Access Control (RBAC) management

Routes are registered in `apps/api/src/routes/index.ts` with authentication middleware from `@clerk/express`.

**API Server Configuration** (`apps/api/src/main.ts`):
- Port: 2000 (configurable via `PORT` env var)
- Middleware: Helmet (security), CORS, compression, JSON/URL-encoded body parsing
- Error handling: Centralized via `errorHandler` middleware
- Logging: Winston logger (`utils/logger.ts`)

### Authentication & Authorization
- **Clerk** handles authentication on both frontend and backend
- Backend uses `@clerk/express` middleware (`authenticate` in routes/index.ts)
- **RBAC System**: Complete role-based access control implementation
  - 4 default roles: Admin, Sales, BackOffice, Accountant
  - 50 permissions across 10 modules (dashboard, accounts, orders, products, invoices, contracts, email, reports, users, settings)
  - 5 actions per module: view, create, edit, delete, export
  - User roles stored in `user_roles` table mapping Clerk user IDs to roles
  - Frontend hooks: `usePermission(module, action)` and `useUserRole()` in `src/hooks/usePermissions.ts`
  - API endpoints in `modules/roles/` for role management
  - UI at `/settings/roles` for managing role permissions
- Environment variables required:
  - Frontend: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
  - Backend: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`

### Frontend Architecture
Both `apps/web` and `apps/sales` share the same architecture:
- **App Router** (Next.js 14) with layouts in `src/app/`
- **TanStack Query** for server state management (API calls, caching, mutations)
- **Zustand** for client state management (UI state, global filters)
- **React Hook Form + Zod** for forms with validation
- **UI Components** in `src/components/ui/` (TailwindCSS + shadcn/ui pattern)
- **Contexts** in `src/contexts/` (auth, theme, etc.)
- Path alias: `@/*` maps to `src/*`

**Main Routes**:
- `/dashboard` - Dashboard with metrics and charts
- `/accounts`, `/accounts/[id]`, `/accounts/new` - Account management
- `/products`, `/products/[id]` - Product catalog
- `/orders`, `/orders/[id]` - Order management
- `/reports` - Reporting and analytics
- `/invoices` - Invoice management
- `/contracts` - Contract tracking
- `/email/compose`, `/email/templates` - Email functionality
- `/settings`, `/settings/security`, `/settings/roles` - Settings, security, and role management
- `/users` - User management (admin only)
- `/search` - Global search
- `/accept-invitation` - New user invitation acceptance flow

### Shared Package
`packages/shared/src/`:
- **types/**: TypeScript interfaces shared between frontend/backend
- **schemas/**: Zod validation schemas (reused for API validation and forms)
- **constants/**: Enums, config constants

Import from apps: `import { ... } from '@pace/shared'`

## Environment Setup

### Required Services
1. PostgreSQL 14+ (local or cloud)
2. Redis 7+ (for caching/BullMQ)
3. AWS S3 bucket (for PDF storage)
4. QuickBooks Developer Account (sandbox/production)

### Environment Files
Copy and configure:
- `apps/web/.env.example` → `apps/web/.env.local`
- `apps/api/.env.example` → `apps/api/.env`

Critical variables:
- **Database**: `DATABASE_URL` (PostgreSQL connection string)
- **Redis**: `REDIS_URL`
- **Clerk**: Keys for both apps
- **QuickBooks**: `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_REDIRECT_URI`, `QBO_ENVIRONMENT`
- **AWS**: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`

### First-Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Set up environment files
# Copy apps/web/.env.example to apps/web/.env.local and configure
# Copy apps/api/.env.example to apps/api/.env and configure

# 3. Set up database
cd apps/api
npm run migration:run          # Run database migrations
npx tsx src/db/seed.ts        # Seed initial data (optional)
npx tsx src/db/seed-roles.ts  # Seed RBAC roles and permissions (required for RBAC)
cd ../..

# 4. Start development servers
npm run dev                    # Start all apps (api + web + sales)
# Or run specific dashboard:
npm run dev:admin              # Start api + web dashboard only
npm run dev:sales              # Start api + sales dashboard only
```

**Access URLs**:
- Backend API: http://localhost:2000
- Web Dashboard: http://localhost:2005
- Sales Dashboard: http://localhost:2010

**Health Check**: Visit http://localhost:2000/health to verify API is running

## Key Workflows

### Adding a New Database Table
1. Create schema file in `apps/api/src/db/schema/[name].ts`
2. Export from `apps/api/src/db/schema/index.ts`
3. Run `npm run migration:generate` from `apps/api/`
4. Review generated migration in `src/db/migrations/`
5. Run `npm run migration:run` to apply

### Creating a New API Module
1. Create folder: `apps/api/src/modules/[domain]/`
2. Implement service, controller, routes files
3. Register routes in `apps/api/src/routes/index.ts`
4. Add authentication if needed (`authenticate` middleware)

### Syncing Orders to QuickBooks
Order lifecycle: `draft` → `confirmed` → `posted_to_qb` → `paid`
- Create order in local DB
- Call `QuickBooksSync.pushOrderToQBO(orderId, 'invoice' | 'estimate')`
- This auto-syncs buyer (account→customer) and products (product→items)
- QBO doc ID/number stored in `orders.qboDocId`/`qboDocNumber`
- Status updates via webhook or manual `syncInvoiceStatus()`

### Managing User Roles and Permissions
The system has a complete RBAC implementation for fine-grained access control:

**Default Roles**:
- **Admin**: Full access to all modules and actions
- **Sales**: Access to dashboard, accounts, orders, products, email, reports
- **BackOffice**: Access to dashboard, accounts, orders, products, contracts, email
- **Accountant**: View/edit/export for invoices and reports; view-only for accounts and orders

**Working with Roles**:
1. **View/Edit Permissions**: Navigate to `/settings/roles`
   - Select a role from the left sidebar
   - Toggle permissions by module and action (view, create, edit, delete, export)
   - Click "Save Changes" to persist

2. **Assign Role to User**: Currently done via database
   ```sql
   INSERT INTO user_roles (clerk_user_id, role_id)
   VALUES ('clerk_user_xyz', 'role_uuid');
   ```

3. **Check Permissions in Frontend**:
   ```typescript
   import { usePermission } from '@/hooks/usePermissions'

   const canEditAccounts = usePermission('accounts', 'edit')
   {canEditAccounts && <Button>Edit</Button>}
   ```

4. **API Endpoints** (in `modules/roles/roles.routes.ts`):
   - `GET /api/roles` - List all roles
   - `GET /api/roles/:id` - Get role with permissions
   - `GET /api/me/role` - Get current user's role & permissions
   - `POST /api/roles/:id/permissions` - Assign permissions to role
   - `POST /api/users/:clerkUserId/role` - Assign role to user

### PDF Generation
Order PDFs are generated using Puppeteer with custom HTML templates:

**Service**: `apps/api/src/services/pdf/pdf-generator.ts`
- `generateSellerPDF(orderData)`: Blue-themed PDF for seller (shows their selling info)
- `generateBuyerPDF(orderData)`: Green-themed PDF for buyer (shows their purchase info)
- Both PDFs include: order details, product info, pricing, agent info
- Generated PDFs uploaded to S3 with presigned URLs (7-day expiry)

**API Routes**: `apps/api/src/routes/pdf.routes.ts`
- `POST /api/pdf/order/seller` - Generate seller PDF
- `POST /api/pdf/order/buyer` - Generate buyer PDF
- `POST /api/pdf/order/both` - Generate both PDFs in parallel

**UI Integration**: Order list page has PDF generation buttons in expanded view
- Individual buttons for seller/buyer PDFs
- "Generate Both PDFs" button opens both in separate tabs
- Loading states while generating

**Storage**: PDFs stored in S3 bucket configured via:
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`
- Path pattern: `orders/{orderNo}/seller-{orderNo}.pdf` and `orders/{orderNo}/buyer-{orderNo}.pdf`

## Important Notes

- **Financial Precision**: Always use `numeric` type for money/weights in database schema, convert to `parseFloat()` only when needed for calculations
- **QBO Rate Limits**: Be mindful of QuickBooks API rate limits (500 requests/minute in sandbox, 1000 in production)
- **Transaction Handling**: Critical operations (order creation, QBO sync) should use DB transactions for data consistency
- **Error Handling**: Use `AppError` class from `middleware/error-handler.ts` for consistent error responses with proper HTTP status codes
- **Logging**: Use Winston logger from `utils/logger.ts` for structured logging (automatically logs errors, requests)
- **CORS Configuration**: Backend CORS is set to `http://localhost:2005` by default. Update `apps/api/src/main.ts` if needed for different origins.
- **Clerk Auth**: All API routes except `/health` require authentication. Use `authenticate` middleware from `@clerk/express`.
- **Database Schema Changes**: Always use migrations (`npm run migration:generate` then `npm run migration:run`) rather than `db:push` for production to preserve data and track schema history.
- **No express-ws**: Never install or use `express-ws` package (per user constraints).
- **File Naming**: Maintain consistent file naming when working on the same topic/feature to avoid confusion.

## Debugging

### View Logs
```bash
# API server logs (Winston)
tail -f apps/api/logs/app.log          # Unix/Linux/Mac
Get-Content apps/api/logs/app.log -Tail 50 -Wait  # Windows PowerShell

# Next.js logs
# View in terminal where npm run dev is running
```

### Database Inspection
```bash
cd apps/api
npm run db:studio    # Open Drizzle Studio on http://localhost:4983
```

### Common Issues
- **Port conflicts**: Kill processes on ports 2000, 2005, or 2010 if already in use
- **Database connection**: Verify PostgreSQL is running and `DATABASE_URL` is correct
- **Redis connection**: Verify Redis is running if using caching/job queues
- **Clerk auth**: Ensure `CLERK_SECRET_KEY` matches between frontend and backend
- **RBAC not working**: Ensure roles are seeded (`npx tsx src/db/seed-roles.ts`) and users are assigned roles in `user_roles` table

## Testing

- Backend tests use Jest
- Run tests: `npm run test` (from root or apps/api)
- Test files: `*.test.ts` or `*.spec.ts` pattern
- **Note**: Test suite may be incomplete; always test manually after changes
- **Critical**: Always test functionality before marking work as complete and check logs for errors
- **Documentation**: Update Docusaurus documentation site (in `docs/`) when making significant changes

## Documentation

Project includes a Docusaurus documentation site:
- **Location**: `docs/` directory in root
- **Running locally**:
  ```bash
  cd docs
  npm install  # or yarn
  npm start    # or yarn start
  ```
  This will start the dev server (usually on http://localhost:3000)
- **Building**: `npm run build` (from docs/)
- Keep documentation in sync with code changes
- Document all major features, APIs, and workflows
- Currently contains default Docusaurus tutorial content - should be customized for PACE CRM
- sql schema is at sqlschema.txt always review before writing sql