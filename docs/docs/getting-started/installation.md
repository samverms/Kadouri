---
sidebar_position: 1
---

# Installation

This guide will help you set up Kadouri CRM for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Redis** 7+ ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional Services

- **AWS Account** (for S3 PDF storage)
- **QuickBooks Developer Account** (for QuickBooks integration)
- **Clerk Account** (for authentication)

## Clone the Repository

```bash
git clone https://github.com/mailumaoc/Kadouri-crm.git
cd Kadouri-crm
```

## Install Dependencies

This monorepo uses npm worksKadouris. Install all dependencies from the root:

```bash
npm install
```

This command will install dependencies for:
- Root worksKadouri
- `apps/api` (Backend)
- `apps/web` (Admin Dashboard)
- `apps/sales` (Sales Dashboard)
- `packages/shared` (Shared types)
- `docs` (This documentation site)

## Verify Installation

Check that Turborepo is working:

```bash
npm run build
```

This should build all apps successfully.

## Next Steps

- [Environment Setup](environment-setup) - Configure environment variables
- [First Run](first-run) - Start the development servers
