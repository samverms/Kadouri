---
sidebar_position: 1
---

# Development Commands

Complete reference for all commands used in PACE CRM development.

## Monorepo Commands

Run from project root:

### Development
```bash
npm run dev                # Start all apps (api + web + sales)
npm run dev:admin          # Start api + web dashboard only
npm run dev:sales          # Start api + sales dashboard only
```

### Building
```bash
npm run build              # Build all apps
npm run build:admin        # Build web dashboard only
npm run build:sales        # Build sales dashboard only
```

### Linting & Testing
```bash
npm run lint               # Lint all packages
npm run test               # Run tests across all packages
```

### Cleanup
```bash
npm run clean              # Clean all build artifacts and node_modules
```

## Backend Commands (apps/api)

Run from `apps/api/` directory:

### Development
```bash
npm run dev                # Start with nodemon + ts-node (port 2000)
npm run build              # Compile TypeScript to dist/
npm run start              # Run production build
```

### Database
```bash
# Migrations
npm run migration:generate # Generate migration from schema changes
npm run migration:run      # Run pending migrations
npm run db:push           # Push schema directly (dev only)

# Database tools
npm run db:studio         # Open Drizzle Studio GUI (port 4983)

# Seeding
npx tsx src/db/seed.ts        # Seed sample data
npx tsx src/db/seed-roles.ts  # Seed RBAC roles (required)
npx tsx src/db/migrate.ts     # Run migrations directly
```

### Testing & Linting
```bash
npm run lint              # ESLint TypeScript files
npm run test              # Run Jest tests
```

## Frontend Commands

Run from `apps/web/` or `apps/sales/`:

### Development
```bash
npm run dev               # Next.js dev server (2005 or 2010)
npm run build             # Build production Next.js app
npm run start             # Start production server
npm run lint              # Next.js linting
```

## Documentation Commands

Run from `docs/` directory:

```bash
npm install               # Install dependencies
npm start                 # Start dev server (port 3000)
npm run build             # Build static site
npm run serve             # Serve built site
npm run clear             # Clear Docusaurus cache
```

## Turborepo Commands

### Task Filtering

Run specific task for specific app:

```bash
turbo run dev --filter=web           # Run dev only for web
turbo run build --filter=api         # Build only api
turbo run lint --filter=shared       # Lint only shared package
```

### Multiple Filters

```bash
turbo run test --filter=web --filter=api   # Test web and api
turbo run build --filter=!sales            # Build everything except sales
```

### Dependency Handling

```bash
turbo run build --filter=web...     # Build web and its dependencies
turbo run build --filter=...api     # Build api and its dependents
```

## Common Workflows

### Clean Install

```bash
npm run clean          # Remove all node_modules and build artifacts
npm install            # Fresh install
```

### Database Reset

```bash
cd apps/api

# Drop and recreate database
dropdb pace_crm && createdb pace_crm

# Run migrations and seed
npm run migration:run
npx tsx src/db/seed-roles.ts
npx tsx src/db/seed.ts
```

### Full Build & Start

```bash
# Build everything
npm run build

# Start API in production mode
cd apps/api
npm start &

# Start Web in production mode
cd ../web
npm start &

# Start Sales in production mode
cd ../sales
npm start &
```

### Kill All Processes

**Windows:**
```bash
# Kill by port
netstat -ano | findstr :2000
taskkill /PID <pid> /F

netstat -ano | findstr :2005
taskkill /PID <pid> /F

netstat -ano | findstr :2010
taskkill /PID <pid> /F
```

**Mac/Linux:**
```bash
# Kill all node processes
killall node

# Or kill by port
lsof -ti:2000 | xargs kill
lsof -ti:2005 | xargs kill
lsof -ti:2010 | xargs kill
```

## Environment-Specific Commands

### Development
```bash
NODE_ENV=development npm run dev
```

### Production
```bash
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

## Database Utilities

### Backup Database

```bash
pg_dump pace_crm > backup.sql
```

### Restore Database

```bash
psql pace_crm < backup.sql
```

### Connect to Database

```bash
psql pace_crm
```

### View Migrations Status

```bash
cd apps/api
psql $DATABASE_URL -c "SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC;"
```

## Redis Commands

### Check Redis Connection

```bash
redis-cli ping         # Should return PONG
```

### View Redis Keys

```bash
redis-cli
> KEYS *
> GET key_name
```

### Flush Redis Cache

```bash
redis-cli FLUSHALL
```

## Quick Reference

| Task | Command | Where |
|------|---------|-------|
| Start everything | `npm run dev` | Root |
| Start admin only | `npm run dev:admin` | Root |
| Generate migration | `npm run migration:generate` | apps/api |
| Run migrations | `npm run migration:run` | apps/api |
| Seed roles | `npx tsx src/db/seed-roles.ts` | apps/api |
| Open DB GUI | `npm run db:studio` | apps/api |
| Run tests | `npm run test` | Root or apps/api |
| Build all | `npm run build` | Root |
| Clean all | `npm run clean` | Root |

## Next Steps

- [Workflows](workflows) - Common development workflows
- [Testing](testing) - Testing strategies
- [Debugging](debugging) - Debugging tips
