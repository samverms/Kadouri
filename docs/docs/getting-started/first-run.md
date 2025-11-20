---
sidebar_position: 3
---

# First Run

Initialize the database and start your development environment.

## Database Setup

### 1. Create Database

Create a PostgreSQL database:

```bash
createdb Kadouri_crm
# or using psql:
psql -U postgres -c "CREATE DATABASE Kadouri_crm;"
```

### 2. Run Migrations

Apply database migrations to create tables:

```bash
cd apps/api
npm run migration:run
```

This creates all necessary tables: accounts, products, orders, users, roles, permissions, etc.

### 3. Seed Roles and Permissions

The RBAC system requires initial role data:

```bash
npx tsx src/db/seed-roles.ts
```

This creates 4 default roles:
- **Admin** - Full access to all modules
- **Sales** - Access to dashboard, accounts, orders, products
- **BackOffice** - Access to dashboard, accounts, orders, contracts
- **Accountant** - View/edit access to invoices and reports

### 4. (Optional) Seed Sample Data

Load sample accounts, products, and orders:

```bash
npx tsx src/db/seed.ts
```

## Start Development Servers

### Option 1: Start All Apps

```bash
npm run dev
```

This starts:
- API server on port 2000
- Web dashboard on port 2005
- Sales dashboard on port 2010

### Option 2: Start Admin Dashboard Only

```bash
npm run dev:admin
```

This starts:
- API server on port 2000
- Web dashboard on port 2005

### Option 3: Start Sales Dashboard Only

```bash
npm run dev:sales
```

This starts:
- API server on port 2000
- Sales dashboard on port 2010

## Verify Everything Works

### 1. Check API Health

Visit: http://localhost:2000/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

### 2. Access Admin Dashboard

Visit: http://localhost:2005

You'll be redirected to Clerk authentication. Sign in or create an account.

### 3. Check Database

Use Drizzle Studio to inspect your database:

```bash
cd apps/api
npm run db:studio
```

Visit: http://localhost:4983

## Common Issues

### Port Already in Use

If ports 2000, 2005, or 2010 are already in use:

**Windows:**
```bash
# Find process using port
netstat -ano | findstr :2000

# Kill process
taskkill /PID <process_id> /F
```

**Mac/Linux:**
```bash
# Find and kill process
lsof -ti:2000 | xargs kill
```

### Database Connection Failed

- Verify PostgreSQL is running
- Check `DATABASE_URL` in `apps/api/.env`
- Ensure database exists: `psql -l | grep Kadouri_crm`

### Redis Connection Failed

- Verify Redis is running: `redis-cli ping` (should return "PONG")
- Check `REDIS_URL` in `apps/api/.env`

### Clerk Authentication Issues

- Verify `CLERK_SECRET_KEY` matches in both `apps/api/.env` and `apps/web/.env.local`
- Check that your Clerk application is configured correctly in the dashboard

## Next Steps

Now that your development environment is running:

- Explore the [Architecture](../architecture/overview) to understand the codebase structure
- Learn about [Key Features](../features/accounts) like accounts, orders, and QuickBooks sync
- Check out [API Documentation](../api/overview) to build integrations
