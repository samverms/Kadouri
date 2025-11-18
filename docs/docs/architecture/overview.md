---
sidebar_position: 1
---

# Architecture Overview

PACE CRM is built as a **Turborepo monorepo** with a clear separation between frontend, backend, and shared code.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  ┌──────────────┐              ┌──────────────┐        │
│  │ Web Dashboard│              │Sales Dashboard│       │
│  │  (port 2005) │              │  (port 2010) │        │
│  └──────┬───────┘              └──────┬───────┘        │
└─────────┼──────────────────────────────┼───────────────┘
          │                              │
          └──────────────┬───────────────┘
                         │
                    HTTP/REST
                         │
┌────────────────────────┼───────────────────────────────┐
│                 Backend Layer                          │
│            ┌────────────▼──────────┐                   │
│            │   Express API Server  │                   │
│            │     (port 2000)       │                   │
│            └───┬────────────────┬──┘                   │
│                │                │                      │
│     ┌──────────▼──────┐  ┌─────▼──────────┐          │
│     │   PostgreSQL    │  │     Redis      │          │
│     │   (Database)    │  │   (Cache)      │          │
│     └─────────────────┘  └────────────────┘          │
└──────────────────────────────────────────────────────┘
          │                              │
          │                              │
┌─────────▼──────────────────────────────▼─────────────┐
│              External Services                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │QuickBooks│  │  Clerk   │  │   AWS    │          │
│  │  Online  │  │   Auth   │  │    S3    │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend (Next.js 14)

Both dashboard apps share the same architecture:

- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS with custom components
- **State Management**:
  - TanStack Query for server state
  - Zustand for client state
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table with server-side pagination
- **Authentication**: Clerk

### Backend (Express + Node.js)

- **Framework**: Express 4.x
- **Language**: TypeScript
- **ORM**: Drizzle ORM with PostgreSQL
- **Caching**: Redis
- **Job Queues**: BullMQ
- **PDF Generation**: Puppeteer
- **File Storage**: AWS S3
- **Authentication**: Clerk Express SDK

### Database (PostgreSQL)

- **ORM**: Drizzle ORM
- **Migrations**: Version-controlled SQL migrations
- **Schema**: Type-safe schema definitions

Key tables:
- `accounts` - Sellers and buyers
- `products` - Item catalog
- `orders` - Order headers and lines
- `users` - User accounts
- `roles`, `permissions`, `role_permissions`, `user_roles` - RBAC system

### External Integrations

- **QuickBooks Online**: OAuth 2.0 + REST API
- **Clerk**: Authentication and user management
- **AWS S3**: PDF storage with presigned URLs
- **Microsoft Outlook**: Email sending (optional)

## Design Principles

### 1. Monorepo Organization

The project uses Turborepo to manage multiple apps and packages:

- **Shared dependencies** across all apps
- **Efficient caching** of build outputs
- **Parallel execution** of tasks
- **Dependency graph** awareness

### 2. Type Safety

End-to-end type safety using TypeScript:

- Shared types in `packages/shared`
- Database schema types from Drizzle
- Zod schemas for runtime validation
- API types shared between frontend and backend

### 3. Separation of Concerns

- **API Layer**: Pure business logic, no UI concerns
- **Frontend Layer**: UI and user interaction only
- **Shared Package**: Types, schemas, and constants used by both

### 4. Modular Backend

Backend is organized into domain modules:

```
apps/api/src/modules/
├── accounts/
│   ├── accounts.service.ts
│   ├── accounts.controller.ts
│   └── accounts.routes.ts
├── orders/
├── products/
├── roles/
└── users/
```

Each module is self-contained with:
- **Service**: Business logic and database operations
- **Controller**: HTTP request/response handling
- **Routes**: Express route definitions

## Data Flow

### 1. Typical API Request

```
User Action → Frontend Component
    ↓
TanStack Query Hook
    ↓
HTTP Request to API
    ↓
Express Route Handler
    ↓
Controller (validation)
    ↓
Service (business logic)
    ↓
Database (via Drizzle ORM)
    ↓
Response back through the chain
```

### 2. QuickBooks Sync Flow

```
Order Created → Check if Account/Products synced
    ↓
Sync Account to QBO Customer (if needed)
    ↓
Sync Products to QBO Items (if needed)
    ↓
Create QBO Invoice/Estimate
    ↓
Store QBO Doc ID in orders table
    ↓
Listen for webhooks for status updates
```

## Caching Strategy

### Frontend Caching (TanStack Query)

- **Automatic caching** of GET requests
- **Stale-while-revalidate** pattern
- **Optimistic updates** for mutations
- **Cache invalidation** on mutations

### Backend Caching (Redis)

- **Session storage** (if needed)
- **Rate limiting** data
- **Temporary data** for async jobs

## Next Steps

- [Monorepo Structure](monorepo-structure) - Detailed file structure
- [Database Schema](database-schema) - Complete schema documentation
- [Authentication](authentication) - Auth and RBAC system
