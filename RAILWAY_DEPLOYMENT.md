# Railway Deployment Guide

## Overview
This guide explains how to deploy both the frontend (Next.js) and backend (Express API) to Railway as separate services in the same project.

## Prerequisites
- Railway account (https://railway.app)
- Railway CLI installed: `npm install -g @railway/cli`
- Git repository pushed to GitHub (samverms/Kadouri)

## Project Setup

### 1. Connect Railway to GitHub

In your Railway project dashboard:
1. Go to https://railway.com/project/cd543199-5db5-4767-9551-a018d3fa5dbe
2. Click "New" → "GitHub Repo"
3. Select `samverms/Kadouri` repository

### 2. Create Two Services

You need to create 2 services from the same GitHub repo:

#### Service 1: Backend API

1. Click "New" → "GitHub Repo" → Select `samverms/Kadouri`
2. Name it: `kadouri-api`
3. In Settings → General:
   - **Root Directory**: Leave empty or set to `.` (repository root)
   - **Build Command**: (leave empty, nixpacks.toml handles it)
   - **Start Command**: (leave empty, nixpacks.toml handles it)
4. Add Environment Variables (see below)

#### Service 2: Frontend Web

1. Click "New" → "GitHub Repo" → Select `samverms/Kadouri`
2. Name it: `kadouri-web`
3. In Settings → General:
   - **Root Directory**: Leave empty or set to `.` (repository root)
   - **Build Command**: (leave empty, nixpacks.toml handles it)
   - **Start Command**: (leave empty, nixpacks.toml handles it)
4. Add Environment Variables (see below)

## Environment Variables

### Backend API Service (`kadouri-api`)

```bash
# Database
DATABASE_URL=your_postgresql_url

# Redis
REDIS_URL=your_redis_url

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name

# QuickBooks (optional)
QBO_CLIENT_ID=your_qbo_client_id
QBO_CLIENT_SECRET=your_qbo_client_secret
QBO_REDIRECT_URI=your_qbo_redirect_uri
QBO_ENVIRONMENT=sandbox

# Other
NODE_ENV=production
PORT=3001
```

### Frontend Web Service (`kadouri-web`)

First, get the API service URL from Railway:
1. Click on `kadouri-api` service
2. Go to Settings → Domains
3. Copy the Railway-provided domain (e.g., `kadouri-api-production.up.railway.app`)

Then add these variables:

```bash
# API Connection
NEXT_PUBLIC_API_URL=https://kadouri-api-production.up.railway.app

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Build Config
NODE_ENV=production
HEROKU=true
```

## Deployment Process

### Option A: Through Railway Dashboard (Recommended)

1. Push code to GitHub (already done)
2. Railway will automatically detect changes and deploy
3. Check deployment logs in each service's "Deployments" tab
4. Wait for both services to build and deploy

### Option B: Through CLI

```bash
# Login to Railway
railway login

# Link project
railway link --project cd543199-5db5-4767-9551-a018d3fa5dbe

# Deploy API service
railway up --service kadouri-api

# Deploy Web service
railway up --service kadouri-web
```

## Configuration Files

The following configuration files have been added to the repository:

- **railway.json**: Main Railway project configuration
- **railway.toml**: Build and deploy settings
- **apps/api/nixpacks.toml**: API-specific build configuration
- **apps/web/nixpacks.toml**: Web-specific build configuration

## Deployment Flow

When you push code to GitHub:

1. **Shared Package Build**:
   ```bash
   cd packages/shared
   npm install
   npm run build
   ```

2. **API Build**:
   ```bash
   cd apps/api
   npm install
   npm link ../../packages/shared
   npm run build  # Compiles TypeScript
   npm start      # Starts Express server on port 3001
   ```

3. **Web Build**:
   ```bash
   cd apps/web
   npm ci --legacy-peer-deps
   npm link ../../packages/shared
   npm run build  # Builds Next.js
   npm start      # Starts Next.js server on Railway port
   ```

## Testing Deployment

Once both services are deployed:

### Test API:
```bash
curl https://kadouri-api-production.up.railway.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Test Frontend:
```bash
curl https://kadouri-web-production.up.railway.app
# Should return HTML from Next.js
```

### Test Full Integration:
1. Open `https://kadouri-web-production.up.railway.app` in browser
2. Try logging in with Clerk
3. Check if API calls work (check browser console)

## Troubleshooting

### Build Failures

1. Check build logs in Railway dashboard
2. Common issues:
   - Missing environment variables
   - TypeScript errors (set `HEROKU=true` to ignore in production)
   - Package installation issues (check node version)

### API Connection Issues

1. Verify `NEXT_PUBLIC_API_URL` is set correctly in web service
2. Check CORS settings in API (`apps/api/src/main.ts`)
3. Ensure API service is running and healthy

### Database Connection

1. Check `DATABASE_URL` is set correctly
2. Run migrations:
   ```bash
   railway run --service kadouri-api npm run migration:run
   ```

### Logs

View logs in Railway dashboard or via CLI:
```bash
# API logs
railway logs --service kadouri-api

# Web logs
railway logs --service kadouri-web
```

## Monitoring

Railway provides:
- CPU and Memory usage graphs
- Request metrics
- Deployment history
- Build logs

Access these in your project dashboard.

## Scaling

To scale your services:
1. Go to service Settings → Resources
2. Adjust replicas or resources as needed
3. Note: Scaling requires Railway Pro plan

## Custom Domains

To add custom domains:
1. Go to service Settings → Domains
2. Click "Add Domain"
3. Follow DNS configuration instructions
4. Update environment variables if needed

## Next Steps

1. Set up Railway PostgreSQL database (or use external)
2. Set up Railway Redis (or use external)
3. Configure Clerk webhooks to point to Railway API URL
4. Set up QuickBooks OAuth redirect to Railway Web URL
5. Enable automatic deployments on GitHub push

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Dashboard: https://railway.com/project/cd543199-5db5-4767-9551-a018d3fa5dbe
