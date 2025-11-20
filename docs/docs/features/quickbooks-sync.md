---
sidebar_position: 3
---

# QuickBooks Integration

Kadouri CRM features deep integration with QuickBooks Online, enabling seamless invoice management and two-way data synchronization.

## Overview

The QuickBooks integration provides:

- **OAuth 2.0 Authentication** - Secure connection to QuickBooks Online
- **Bidirectional Sync** - Changes in QB automatically sync to Kadouri and vice versa
- **Invoice Management** - Create, update, and void invoices directly from orders
- **Activity Tracking** - Complete audit trail of all QB-related actions
- **Webhook Support** - Real-time updates when invoices are paid or modified in QB

## Architecture

### Components

**Backend (`apps/api/src/services/quickbooks/`)**:
- `config.ts` - QuickBooks OAuth configuration and client setup
- `sync-wrapper.ts` - Sync logic for orders, accounts, and products
- `webhook-handler.ts` - Processes QB webhook notifications

**Routes (`apps/api/src/routes/quickbooks.routes.ts`)**:
- OAuth flow endpoints
- Sync endpoints for orders, accounts, products
- Webhook receiver endpoint (no auth required)

**Database Tables**:
- `quickbooks_tokens` - Stores OAuth access/refresh tokens
- `orders.qboDocId`, `orders.qboDocNumber`, `orders.qboDocType` - QB invoice mapping
- `accounts.qboCustomerId` - QB customer mapping
- `products.qboItemId` - QB item mapping
- `order_activities` - Activity log for all invoice actions

## Setup

### 1. QuickBooks Developer Account

1. Create account at https://developer.intuit.com
2. Create a new app in the QuickBooks Developer Dashboard
3. Set redirect URI: `http://localhost:2000/api/quickbooks/callback` (dev) or your production URL
4. Copy Client ID and Client Secret

### 2. Environment Configuration

Add to `apps/api/.env`:

```bash
# QuickBooks OAuth
QBO_CLIENT_ID=your_client_id_here
QBO_CLIENT_SECRET=your_client_secret_here
QBO_REDIRECT_URI=http://localhost:2000/api/quickbooks/callback
QBO_ENVIRONMENT=sandbox  # or 'production'

# Webhook Security
QBO_WEBHOOK_VERIFIER_TOKEN=c4f2e7049a61d5ebe03bb0ce18591d2c900a8a56c80cfd93b560d4f52bb63d3c
```

### 3. Connect QuickBooks

1. Navigate to Settings → QuickBooks Integration in Kadouri CRM
2. Click "Connect to QuickBooks"
3. Log in to QuickBooks and authorize the connection
4. You'll be redirected back to Kadouri with a success message

### 4. Configure Webhooks (Production Only)

For real-time sync, register webhooks in QB Developer Dashboard:

1. **Webhook URL**: `https://yourdomain.com/api/quickbooks/webhook`
2. **Verifier Token**: Use the token from your `.env` file
3. **Entities to Monitor**:
   - Invoice
   - Payment
   - Customer
   - Item

## Invoice Workflow

### Creating Invoices

**From Order Detail Page**:

1. Open an order (must have seller, buyer, and line items)
2. Click "Create Invoice in QB" in the QuickBooks Integration section
3. System automatically:
   - Creates/updates QB Customer for buyer account
   - Creates/updates QB Items for all products
   - Creates QB Invoice with all order lines
   - Updates order status to `posted_to_qb`
   - Records activity: "Invoice #12345 created in QuickBooks by [username]"

**API Endpoint**:
```bash
POST /api/quickbooks/sync/order/:orderId
{
  "docType": "invoice"  # or "estimate"
}
```

**What Gets Synced**:
- **Invoice Header**: Buyer as customer, order date, terms, memo (notes)
- **Line Items**: Product name, quantity, unit price, size/grade as memo
- **Totals**: Subtotal, commission (as separate line if tracked), total amount

### Updating Invoices

When an order is edited after invoice creation:

1. Make changes to the order (add/remove lines, change quantities, etc.)
2. Click "Update QB Invoice" button
3. System:
   - Fetches existing invoice from QB
   - Updates line items, totals, and header fields
   - Preserves QB invoice number and ID
   - Records activity: "Invoice #12345 updated in QuickBooks by [username]"

**Business Rule**: You can update orders with status `posted_to_qb`, but NOT `paid` orders.

**API Endpoint**:
```bash
PUT /api/quickbooks/sync/order/:orderId
```

### Voiding Invoices

To cancel an invoice:

1. Click "Void Invoice" button on order detail page
2. Confirm the action (cannot be undone)
3. System:
   - Voids invoice in QuickBooks
   - Updates order status to `cancelled`
   - Records activity: "Invoice #12345 voided in QuickBooks by [username]"

**API Endpoint**:
```bash
DELETE /api/quickbooks/sync/order/:orderId
```

## Webhook Sync (QB → Kadouri)

Webhooks enable real-time updates when changes occur in QuickBooks:

### Invoice Changes

When an invoice is modified in QB:
- Fetches latest invoice data
- Updates order total amount
- Determines payment status (unpaid, partial, paid)
- Updates order status to `paid` if balance = 0
- Records activity with payment status

### Payment Received

When a payment is applied to an invoice:
- Checks invoice balance
- Updates order status to `paid` if fully paid
- Records activity: "Payment received in QuickBooks - Invoice marked as PAID"

### Invoice Voided

When an invoice is voided/deleted in QB:
- Updates order status to `cancelled`
- Records activity: "Invoice voided in QuickBooks"

### Customer/Item Changes

- **Customer updates**: Syncs name changes to account
- **Item deletions**: Clears QB item ID from product
- **Item updates**: Can be extended to sync pricing/details

## Activity Tracking

Every QB-related action is logged in the `order_activities` table:

**Activity Types**:
- `invoice_created` - Manual invoice creation from Kadouri
- `invoice_updated` - Manual invoice update from Kadouri
- `invoice_voided` - Invoice voided (manual or webhook)
- `payment_received` - Payment applied in QB (webhook)
- `synced_from_qb` - General sync from QB (webhook)

**Activity Fields**:
- `orderId` - Associated order
- `clerkUserId` - User who performed action (if manual)
- `userName` - Display name (e.g., "John Smith" or "QuickBooks Webhook")
- `activityType` - Type code
- `description` - Human-readable description
- `ipAddress` - IP address (for manual actions)
- `createdAt` - Timestamp

**Viewing Activities**:
- Order detail page → "Activity Log" tab
- API: `GET /api/orders/:orderId/activities`

## Business Rules

### Edit Permissions

| Order Status | Can Edit Order? | Can Update QB Invoice? | Can Void Invoice? |
|--------------|----------------|------------------------|-------------------|
| `draft` | ✅ Yes | ❌ No (not synced) | ❌ No (not synced) |
| `posted_to_qb` | ✅ Yes | ✅ Yes | ✅ Yes |
| `paid` | ❌ No | ❌ No | ❌ No |
| `cancelled` | ❌ No | ❌ No | ❌ No |

**Key Rules**:
1. Once an order is marked `paid` in QB, it becomes **read-only** in Kadouri
2. QuickBooks is the source of truth for invoices
3. Users must click "Update QB Invoice" after editing a posted order
4. Deleting orders is blocked if status is `posted_to_qb` or `paid`

### Sync Mapping

**Accounts → Customers**:
- Account name → Customer DisplayName
- Primary address → Customer BillAddr
- Account code → Customer stored in custom field (optional)

**Products → Items**:
- Product name → Item Name
- Item type: Service (non-inventory)
- Price synced from product unit price

**Orders → Invoices**:
- Order number → DocNumber (if QB allows custom numbers)
- Seller/Buyer → Customer reference
- Order lines → Invoice line items
- Commission tracked in Kadouri only (not synced to QB)

## API Reference

### OAuth Endpoints

```bash
# Initiate OAuth connection
GET /api/quickbooks/connect

# OAuth callback (QB redirects here)
GET /api/quickbooks/callback

# Check connection status
GET /api/quickbooks/status

# Disconnect QuickBooks
POST /api/quickbooks/disconnect
```

### Sync Endpoints

```bash
# Create invoice from order
POST /api/quickbooks/sync/order/:orderId
Body: { "docType": "invoice" | "estimate" }

# Update existing invoice
PUT /api/quickbooks/sync/order/:orderId

# Void invoice
DELETE /api/quickbooks/sync/order/:orderId

# Sync account to customer
POST /api/quickbooks/sync/account/:accountId

# Sync product to item
POST /api/quickbooks/sync/product/:productId

# Check invoice payment status
GET /api/quickbooks/status/order/:orderId
```

### Webhook Endpoint

```bash
# Receive QB webhook notifications (no auth)
POST /api/quickbooks/webhook
Headers:
  intuit-signature: <HMAC-SHA256 signature>
```

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to QuickBooks"
- Verify `QBO_CLIENT_ID` and `QBO_CLIENT_SECRET` are correct
- Check redirect URI matches QB Developer Dashboard exactly
- Ensure environment (`sandbox` or `production`) matches QB company

**Problem**: "Token expired"
- Tokens expire after 1 hour (access) and 100 days (refresh)
- System automatically refreshes tokens
- If refresh fails, reconnect via Settings

### Sync Errors

**Problem**: "Customer not found"
- Account may not be synced to QB yet
- System auto-syncs when creating invoice
- Check `accounts.qboCustomerId` in database

**Problem**: "Invoice already exists"
- Order already has `qboDocId`
- Use "Update QB Invoice" instead
- Check Activity Log for sync history

**Problem**: "Cannot edit order - invoice has been paid"
- Order status is `paid` (read-only)
- Make changes in QuickBooks instead
- Or void invoice, edit order, recreate invoice

### Webhook Issues

**Problem**: Webhooks not working
- Verify webhook URL is publicly accessible (use ngrok for dev)
- Check verifier token matches in QB Dashboard and `.env`
- Check API logs for webhook errors: `tail -f apps/api/logs/app.log`

**Problem**: "Invalid webhook signature"
- Verifier token mismatch
- Regenerate token and update both QB Dashboard and `.env`

## Security

### OAuth Token Storage

- Access tokens stored encrypted in `quickbooks_tokens` table
- Tokens scoped to specific QB company (realmId)
- Automatic token refresh before expiration

### Webhook Security

- HMAC-SHA256 signature verification
- Shared secret (verifier token) known only to Kadouri and QB
- Webhook endpoint is public but verified

### Permissions

- All sync endpoints require authentication (Clerk)
- Activity log records user attribution
- IP addresses tracked for audit trail

## Best Practices

1. **Test in Sandbox First**: Use QB sandbox environment for development
2. **Monitor Activity Log**: Review activities after each sync to verify correctness
3. **Handle Edge Cases**: QB has rate limits (500 req/min sandbox, 1000 production)
4. **Backup Before Major Changes**: Export data before bulk syncs
5. **Use Webhooks**: Enable webhooks for automatic payment status updates
6. **Regular Reconnection**: Refresh tokens expire, reconnect periodically if needed

## Limitations

- **Commission Tracking**: Not synced to QB (Kadouri-only feature)
- **Custom Fields**: Limited support for QB custom fields
- **Inventory Items**: Uses Service items (non-inventory) for products
- **Multi-Currency**: Not currently supported
- **Sales Receipts**: Only invoices supported (not sales receipts or estimates)

## Future Enhancements

Planned features:
- Estimate creation and conversion to invoices
- Sales receipt support for cash sales
- Payment recording from Kadouri to QB
- Multi-currency support
- Inventory sync for stock tracking
- Automated reconciliation reports

