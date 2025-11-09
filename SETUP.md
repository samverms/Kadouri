# PACE CRM - Setup Guide

## Prerequisites

Before starting, make sure you have the following installed:

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
3. **Redis 7+** - [Download](https://redis.io/download/)
4. **Git** (optional but recommended)

---

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd "D:\PACE CRM"
npm install
```

This will install all dependencies for the monorepo (frontend, backend, and shared packages).

---

### 2. Set Up PostgreSQL Database

#### Option A: Using psql command line
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE pace_crm;

# Exit psql
\q
```

#### Option B: Using pgAdmin (GUI)
1. Open pgAdmin
2. Right-click on "Databases"
3. Create → Database
4. Name: `pace_crm`
5. Click Save

---

### 3. Update Environment Variables

#### Backend (.env file)
Edit `apps/api/.env` and update:

```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/pace_crm
```

Replace:
- `YOUR_USERNAME` with your PostgreSQL username (default: `postgres`)
- `YOUR_PASSWORD` with your PostgreSQL password

#### Frontend (.env.local file)
For now, the default values in `apps/web/.env.local` are fine.

---

### 4. Set Up Clerk Authentication (Required)

1. Go to [https://clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Copy your API keys:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

4. Update both environment files:

**apps/api/.env:**
```env
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

**apps/web/.env.local:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

---

### 5. Start Redis

#### On Windows (if using WSL or native Redis):
```bash
redis-server
```

#### On macOS:
```bash
brew services start redis
```

#### On Linux:
```bash
sudo systemctl start redis
```

#### Alternative: Use Docker
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

---

### 6. Run Database Migrations

```bash
cd apps/api
npm run migration:generate
npm run migration:run
```

This creates all the necessary tables in your database.

---

### 7. Seed Database (Optional)

```bash
cd apps/api
npx tsx src/db/seed.ts
```

This adds some sample data (accounts, products, users) for testing.

---

### 8. Start Development Servers

#### Option A: Start both servers at once (from root)
```bash
npm run dev
```

#### Option B: Start separately
```bash
# Terminal 1 - Backend
cd apps/api
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

---

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Health Check:** http://localhost:3001/api/health

---

## Troubleshooting

### Issue: "Cannot connect to database"
- Make sure PostgreSQL is running
- Check your DATABASE_URL in `apps/api/.env`
- Try connecting manually: `psql -U postgres pace_crm`

### Issue: "Cannot connect to Redis"
- Make sure Redis is running: `redis-cli ping` (should return "PONG")
- Check REDIS_URL in `apps/api/.env`

### Issue: "Clerk authentication error"
- Make sure you've added your Clerk keys to both .env files
- Keys must start with `pk_test_` and `sk_test_`

### Issue: "Module not found"
- Run `npm install` again in the root directory
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

---

## Next Steps

Once everything is running:
1. Open http://localhost:3000
2. You'll be redirected to sign in
3. Create an account
4. You should see the dashboard!

---

## Need Help?

Check the main README.md for more information about the project structure and features.
