# Kadouri CRM - QuickBooks Order Management System

A modern order management system with QuickBooks Online integration, built for produce/agricultural sales with commission tracking.

## 📦 Two Dashboard Versions Available

This repository contains **two separate dashboard versions** to choose from:

### 1. **Web Dashboard** (Simple Version)
- Clean, minimal design
- Basic dashboard layout
- Port: `3000`
- Location: `apps/web`

### 2. **Sales Dashboard** (Modern/Redesigned Version)
- Beautiful gradient backgrounds
- Enhanced metrics and visualizations
- Modern card-based UI with hover effects
- Sticky header navigation
- Port: `3003`
- Location: `apps/sales`

## Tech Stack

### Frontend
- Next.js 14 (React)
- TailwindCSS
- TanStack Query (React Query)
- TanStack Table
- Zustand (state management)
- React Hook Form + Zod
- Clerk (authentication)

### Backend
- Node.js with Express
- PostgreSQL (via Drizzle ORM)
- Redis (caching)
- BullMQ (job queues)
- Puppeteer (PDF generation)
- AWS S3 (file storage)
- QuickBooks Online API

## Project Structure

```
kadouri-crm/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Express backend
├── packages/
│   └── shared/           # Shared types & schemas
├── package.json
└── turbo.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- AWS Account (for S3)
- QuickBooks Developer Account

### Installation

1. **Clone and install dependencies:**
```bash
git clone https://github.com/luminoustec/kadouri.git
cd kadouri-crm
npm install
```

2. **Choose which dashboard to run:**

#### Option A: Run Web Dashboard (Simple Version)
```bash
cd apps/web
npm run dev
```
→ Open http://localhost:3000

#### Option B: Run Sales Dashboard (Modern Version)
```bash
cd apps/sales
npm run dev
```
→ Open http://localhost:3003

#### Option C: Run Both Dashboards Simultaneously
```bash
# Terminal 1 - Web Dashboard
cd apps/web
npm run dev

# Terminal 2 - Sales Dashboard
cd apps/sales
npm run dev
```
- Web: http://localhost:3000
- Sales: http://localhost:3003

## Features

- **Account Management**: Sellers/Buyers with addresses and contacts
- **Order Entry**: Fast order creation with line-item commission tracking
- **PDF Generation**: Dual PDFs (buyer/seller versions)
- **QuickBooks Sync**: Two-way sync for customers, items, estimates, invoices
- **Commission Tracking**: Per-line and order-level commissions
- **Reporting**: Customer history, commission reports, item summaries
- **Role-based Access**: Admin, Agent, and Read-only roles

## Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Build
```bash
npm run build
```

## QuickBooks Integration

The system integrates with QuickBooks Online for:
- Customer management (Accounts → QBO Customers)
- Item management (Products → QBO Items)
- Transaction creation (Orders → QBO Estimates/Invoices)
- Payment tracking (via webhooks)

See `apps/api/src/services/quickbooks/` for integration details.

## License

Private - All Rights Reserved
