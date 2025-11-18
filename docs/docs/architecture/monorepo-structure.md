---
sidebar_position: 2
---

# Monorepo Structure

Detailed overview of the PACE CRM monorepo file structure.

## Root Structure

```
pace-crm/
├── apps/                    # Application packages
│   ├── api/                # Backend API server
│   ├── web/                # Admin dashboard
│   └── sales/              # Sales dashboard
├── packages/               # Shared packages
│   └── shared/            # Shared types, schemas, constants
├── docs/                   # Docusaurus documentation
├── package.json            # Root workspace config
├── turbo.json             # Turborepo configuration
├── .gitignore
└── README.md
```

## Apps Directory

### API (`apps/api/`)

Backend Express server:

```
apps/api/
├── src/
│   ├── db/                 # Database configuration
│   │   ├── schema/        # Drizzle schema definitions
│   │   ├── migrations/    # SQL migrations
│   │   ├── index.ts       # Database connection
│   │   ├── migrate.ts     # Migration runner
│   │   └── seed*.ts       # Seed scripts
│   ├── modules/           # Domain modules
│   │   ├── accounts/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── roles/
│   │   └── users/
│   ├── services/          # External services
│   │   ├── email/
│   │   ├── pdf/
│   │   └── quickbooks.bak/
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions
│   ├── routes/            # Route registration
│   ├── config/            # Configuration
│   └── main.ts            # Application entry point
├── logs/                  # Winston logs
├── .env                   # Environment variables
└── package.json
```

### Web (`apps/web/`)

Next.js admin dashboard:

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (dashboard)/  # Dashboard layout group
│   │   ├── (auth)/       # Auth layout group
│   │   └── layout.tsx
│   ├── components/       # React components
│   │   ├── ui/          # Base UI components
│   │   ├── accounts/    # Account components
│   │   ├── orders/      # Order components
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities
│   ├── contexts/        # React contexts
│   └── styles/          # Global styles
├── public/              # Static assets
├── .env.local           # Environment variables
└── package.json
```

### Sales (`apps/sales/`)

Same structure as `web/` with different UI styling.

## Packages Directory

### Shared (`packages/shared/`)

```
packages/shared/
├── src/
│   ├── types/           # TypeScript interfaces
│   ├── schemas/         # Zod validation schemas
│   └── constants/       # Shared constants
├── package.json
└── tsconfig.json
```

## Configuration Files

### Root `package.json`

Defines workspace structure and root scripts:

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build"
  }
}
```

### `turbo.json`

Configures Turborepo pipelines:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Import Paths

### From Apps to Shared

```typescript
// In apps/api or apps/web
import { AccountSchema } from '@pace/shared'
```

### Within Apps

```typescript
// In apps/web
import { Button } from '@/components/ui/button'
import { useUserRole } from '@/hooks/usePermissions'
```

## Next Steps

- [Database Schema](database-schema)
- [Authentication](authentication)
