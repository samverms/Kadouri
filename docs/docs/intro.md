---
sidebar_position: 1
---

# Welcome to Kadouri CRM

Kadouri CRM is a modern order management system with **QuickBooks Online integration**, built specifically for produce and agricultural sales with commission tracking.

## Overview

Kadouri CRM provides a comprehensive solution for managing:

- **Accounts** - Sellers and buyers with addresses, contacts, and QuickBooks customer mapping
- **Products** - Item catalog with variety/grade tracking and QuickBooks integration
- **Orders** - Complete order management with line-item commission tracking
- **Invoicing** - Automatic PDF generation and QuickBooks sync
- **Reporting** - Customer history, commission reports, and analytics
- **Role-Based Access Control** - Granular permissions across 10 modules

## Tech Stack

### Frontend
- Next.js 14 with App Router
- TailwindCSS for styling
- TanStack Query & Table for data management
- Clerk for authentication
- Zustand for state management

### Backend
- Node.js with Express
- PostgreSQL with Drizzle ORM
- Redis for caching
- BullMQ for job queues
- Puppeteer for PDF generation
- AWS S3 for file storage

### Integrations
- QuickBooks Online API with OAuth 2.0
- Microsoft Outlook for email

## Monorepo Structure

This is a **Turborepo monorepo** with multiple apps:

```
Kadouri-crm/
├── apps/
│   ├── api/           # Express backend (port 2000)
│   ├── web/           # Admin dashboard (port 2005)
│   └── sales/         # Sales dashboard (port 2010)
├── packages/
│   └── shared/        # Shared types & schemas
└── docs/              # This documentation site
```

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Run migrations and seed database
cd apps/api
npm run migration:run
npx tsx src/db/seed-roles.ts
cd ../..

# Start development servers
npm run dev:admin    # API + Web dashboard
# or
npm run dev:sales    # API + Sales dashboard
```

Visit:
- API: http://localhost:2000
- Admin Dashboard: http://localhost:2005
- Sales Dashboard: http://localhost:2010

## What's Next?

- [Installation Guide](getting-started/installation) - Detailed setup instructions
- [Architecture Overview](architecture/overview) - Understand the system architecture
- [Features](features/accounts) - Explore key features
- [API Reference](api/overview) - API documentation
