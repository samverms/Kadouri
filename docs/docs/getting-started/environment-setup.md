---
sidebar_position: 2
---

# Environment Setup

Configure environment variables for the API and frontend applications.

## Backend Environment (apps/api)

Copy the example environment file:

```bash
cd apps/api
cp .env.example .env
```

Edit `.env` and configure the following:

### Database Configuration

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pace_crm
```

### Redis Configuration

```env
REDIS_URL=redis://localhost:6379
```

### Clerk Authentication

Get your keys from [Clerk Dashboard](https://dashboard.clerk.com):

```env
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
```

### AWS S3 (for PDF storage)

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=pace-crm-pdfs
```

### QuickBooks Online

Get credentials from [QuickBooks Developer Portal](https://developer.intuit.com):

```env
QBO_CLIENT_ID=your_client_id
QBO_CLIENT_SECRET=your_client_secret
QBO_REDIRECT_URI=http://localhost:2000/api/quickbooks/callback
QBO_ENVIRONMENT=sandbox  # or 'production'
```

### Optional Configuration

```env
PORT=2000
NODE_ENV=development
LOG_LEVEL=info
```

## Frontend Environment (apps/web)

Copy the example environment file:

```bash
cd apps/web
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:2000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Frontend Environment (apps/sales)

The sales dashboard uses the same configuration as the web dashboard:

```bash
cd apps/sales
cp .env.example .env.local
```

Use the same values as `apps/web/.env.local`.

## Verify Configuration

Start PostgreSQL and Redis services, then test the API connection:

```bash
cd apps/api
npm run dev
```

If everything is configured correctly, you should see:

```
[INFO] Server listening on port 2000
[INFO] Database connected
[INFO] Redis connected
```

## Next Steps

- [First Run](first-run) - Initialize the database and start development
