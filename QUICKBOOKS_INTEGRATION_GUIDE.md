# QuickBooks Online Integration Guide

## Current Status

Your QuickBooks integration is **CURRENTLY DISABLED**. All code exists in `apps/api/src/services/quickbooks.bak/` folder.

## Prerequisites

1. **QuickBooks Developer Account**
   - Sign up at https://developer.intuit.com
   - Create an app to get credentials
   - Choose sandbox or production environment

2. **Required Environment Variables** (see `.env.example`)
   ```bash
   QBO_CLIENT_ID=your_client_id_here
   QBO_CLIENT_SECRET=your_client_secret_here
   QBO_REDIRECT_URI=http://localhost:2000/webhooks/qbo/callback
   QBO_ENVIRONMENT=sandbox  # or 'production'
   QBO_WEBHOOK_VERIFIER_TOKEN=your_webhook_token_here
   ```

## Step-by-Step Activation

### Step 1: Set Up QuickBooks Developer Account

1. Go to https://developer.intuit.com
2. Sign in or create an account
3. Navigate to "My Apps" → "Create an app"
4. Select "QuickBooks Online and Payments"
5. Configure app:
   - **App name**: PACE CRM
   - **Redirect URI**: `http://localhost:2000/webhooks/qbo/callback` (development)
   - **Scopes**: Accounting, Payment
6. Get your credentials:
   - Client ID
   - Client Secret
7. Save credentials to `apps/api/.env`:
   ```bash
   QBO_CLIENT_ID=<your_client_id>
   QBO_CLIENT_SECRET=<your_client_secret>
   QBO_REDIRECT_URI=http://localhost:2000/webhooks/qbo/callback
   QBO_ENVIRONMENT=sandbox
   ```

### Step 2: Enable QuickBooks Service Files

```bash
cd apps/api/src/services
# Rename backup folder to active
mv quickbooks.bak quickbooks
```

### Step 3: Create QuickBooks Routes File

Create `apps/api/src/routes/quickbooks.routes.ts`:

```typescript
import { Router } from 'express'
import { qboClient, QBO_SCOPES } from '../services/quickbooks/config'
import { QuickBooksSync } from '../services/quickbooks/sync'
import { authenticate } from '../middleware/auth'

const router = Router()

// OAuth flow - initiate connection
router.get('/connect', authenticate, (req, res) => {
  const authUri = qboClient.authorizeUri({
    scope: QBO_SCOPES,
    state: 'PACE_CRM_STATE', // Add CSRF protection in production
  })
  res.redirect(authUri)
})

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const parseRedirect = req.url
    const authResponse = await qboClient.createToken(parseRedirect)

    // Store tokens securely (implement token storage)
    // For now, log them (NOT SECURE - for development only)
    console.log('Access Token:', authResponse.token.access_token)
    console.log('Refresh Token:', authResponse.token.refresh_token)
    console.log('Realm ID:', authResponse.token.realmId)

    // TODO: Save tokens to database (create quickbooks_tokens table)

    res.send('QuickBooks connected successfully! You can close this window.')
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.status(500).send('Failed to connect to QuickBooks')
  }
})

// Sync order to QuickBooks
router.post('/sync/order/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params
    const { docType } = req.body // 'invoice' or 'estimate'

    const result = await QuickBooksSync.pushOrderToQBO(orderId, docType)
    res.json(result)
  } catch (error) {
    console.error('Order sync error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Sync account to customer
router.post('/sync/account/:accountId', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params
    const result = await QuickBooksSync.syncAccountToCustomer(accountId)
    res.json(result)
  } catch (error) {
    console.error('Account sync error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Sync product to item
router.post('/sync/product/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params
    const result = await QuickBooksSync.syncProductToItem(productId)
    res.json(result)
  } catch (error) {
    console.error('Product sync error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Check invoice payment status
router.get('/status/order/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params
    const result = await QuickBooksSync.syncInvoiceStatus(orderId)
    res.json(result)
  } catch (error) {
    console.error('Status sync error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
```

### Step 4: Create Webhook Handler Route

Create `apps/api/src/routes/qbo-webhooks.routes.ts`:

```typescript
import { Router } from 'express'
import { handleWebhook } from '../services/quickbooks/webhook'

const router = Router()

// QuickBooks webhooks (no auth - QBO doesn't send bearer tokens)
router.post('/', async (req, res) => {
  try {
    await handleWebhook(req.body, req.headers)
    res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).send('Error processing webhook')
  }
})

export default router
```

### Step 5: Register Routes

Edit `apps/api/src/routes/index.ts`:

```typescript
// Add imports at top
import quickbooksRouter from './quickbooks.routes'
import qboWebhookRouter from './qbo-webhooks.routes'

// Add routes after existing protected routes
router.use('/quickbooks', authenticate, quickbooksRouter)
router.use('/webhooks/qbo', qboWebhookRouter) // No auth for webhooks

// Remove or comment out the TODO line that was there
```

### Step 6: Create Token Storage Table

Create migration: `apps/api/src/db/schema/quickbooks-tokens.ts`

```typescript
import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'

export const quickbooksTokens = pgTable('quickbooks_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  realmId: text('realm_id').notNull().unique(), // QBO company ID
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenType: text('token_type').default('bearer'),
  expiresAt: timestamp('expires_at').notNull(),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

Export from `apps/api/src/db/schema/index.ts`:
```typescript
export * from './quickbooks-tokens'
```

Generate and run migration:
```bash
cd apps/api
npm run migration:generate
npm run migration:run
```

### Step 7: Update Token Management in Routes

Update the `/callback` endpoint to save tokens to database:

```typescript
// In quickbooks.routes.ts callback handler
import { db } from '../db'
import { quickbooksTokens } from '../db/schema'

// Inside callback handler, replace console.logs with:
const expiresAt = new Date(Date.now() + authResponse.token.expires_in * 1000)
const refreshExpiresAt = new Date(Date.now() + authResponse.token.x_refresh_token_expires_in * 1000)

await db.insert(quickbooksTokens).values({
  realmId: authResponse.token.realmId,
  accessToken: authResponse.token.access_token,
  refreshToken: authResponse.token.refresh_token,
  expiresAt,
  refreshTokenExpiresAt: refreshExpiresAt,
  isActive: true,
}).onConflictDoUpdate({
  target: quickbooksTokens.realmId,
  set: {
    accessToken: authResponse.token.access_token,
    refreshToken: authResponse.token.refresh_token,
    expiresAt,
    refreshTokenExpiresAt: refreshExpiresAt,
    updatedAt: new Date(),
  }
})
```

### Step 8: Update QuickBooks Client to Use Stored Tokens

Create `apps/api/src/services/quickbooks/token-manager.ts`:

```typescript
import { db } from '../../db'
import { quickbooksTokens } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { qboClient } from './config'

export class TokenManager {
  /**
   * Get active QBO token (auto-refreshes if expired)
   */
  static async getActiveToken(): Promise<{ accessToken: string; realmId: string }> {
    const token = await db.query.quickbooksTokens.findFirst({
      where: and(
        eq(quickbooksTokens.isActive, true),
      ),
      orderBy: (tokens, { desc }) => [desc(tokens.updatedAt)],
    })

    if (!token) {
      throw new Error('No QuickBooks connection found. Please connect your QuickBooks account.')
    }

    // Check if token is expired
    if (new Date() > token.expiresAt) {
      // Refresh token
      qboClient.setToken({
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
      })

      const authResponse = await qboClient.refresh()

      // Update database
      const newExpiresAt = new Date(Date.now() + authResponse.token.expires_in * 1000)
      const newRefreshExpiresAt = new Date(Date.now() + authResponse.token.x_refresh_token_expires_in * 1000)

      await db.update(quickbooksTokens)
        .set({
          accessToken: authResponse.token.access_token,
          refreshToken: authResponse.token.refresh_token,
          expiresAt: newExpiresAt,
          refreshTokenExpiresAt: newRefreshExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(quickbooksTokens.id, token.id))

      return {
        accessToken: authResponse.token.access_token,
        realmId: token.realmId,
      }
    }

    return {
      accessToken: token.accessToken,
      realmId: token.realmId,
    }
  }

  /**
   * Set token for QBO client before API calls
   */
  static async setClientToken() {
    const { accessToken, realmId } = await this.getActiveToken()
    qboClient.setToken({ access_token: accessToken })
    return realmId
  }
}
```

### Step 9: Update Sync Service

Update `apps/api/src/services/quickbooks/sync.ts` to use TokenManager.

At the top of each sync method, add:
```typescript
import { TokenManager } from './token-manager'

// Inside each method before QBO API calls:
const realmId = await TokenManager.setClientToken()
```

### Step 10: Test the Integration

1. **Start the API server**:
   ```bash
   npm run dev
   ```

2. **Connect to QuickBooks**:
   - Visit: http://localhost:2000/api/quickbooks/connect
   - Log in to your QuickBooks Sandbox account
   - Authorize the app
   - You'll be redirected back to the callback URL

3. **Verify connection**:
   Check your database `quickbooks_tokens` table should have a record.

4. **Test syncing an account**:
   ```bash
   curl -X POST http://localhost:2000/api/quickbooks/sync/account/ACCOUNT_ID \
     -H "Authorization: Bearer YOUR_CLERK_TOKEN"
   ```

5. **Test syncing an order**:
   ```bash
   curl -X POST http://localhost:2000/api/quickbooks/sync/order/ORDER_ID \
     -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"docType": "invoice"}'
   ```

## Frontend Integration

### Add QuickBooks Connect Button

In `apps/web/src/app/(dashboard)/settings/page.tsx`:

```typescript
<Card>
  <CardHeader>
    <CardTitle>QuickBooks Integration</CardTitle>
  </CardHeader>
  <CardContent>
    <Button onClick={() => window.location.href = 'http://localhost:2000/api/quickbooks/connect'}>
      Connect to QuickBooks
    </Button>
  </CardContent>
</Card>
```

### Add Sync Button to Orders

In order detail page or order list, add:

```typescript
const syncToQuickBooks = async (orderId: string, docType: 'invoice' | 'estimate') => {
  try {
    const response = await fetch(`${API_URL}/api/quickbooks/sync/order/${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ docType }),
      credentials: 'include',
    })

    if (response.ok) {
      toast.success('Order synced to QuickBooks!')
    } else {
      toast.error('Failed to sync order')
    }
  } catch (error) {
    toast.error('Error syncing to QuickBooks')
  }
}

// In JSX:
<Button onClick={() => syncToQuickBooks(order.id, 'invoice')}>
  Sync to QuickBooks
</Button>
```

## Production Deployment

### For production, you'll need to:

1. **Update Redirect URI** in QuickBooks App settings:
   ```
   https://your-domain.com/webhooks/qbo/callback
   ```

2. **Update environment variable**:
   ```bash
   QBO_ENVIRONMENT=production
   QBO_REDIRECT_URI=https://your-domain.com/webhooks/qbo/callback
   ```

3. **Set up webhooks** in QuickBooks Developer Portal:
   - Webhook URL: `https://your-domain.com/api/webhooks/qbo`
   - Events: Invoice, Payment, Customer, Item

4. **Security enhancements**:
   - Add CSRF protection to OAuth flow
   - Encrypt tokens at rest (use pgcrypto in PostgreSQL)
   - Add rate limiting
   - Implement proper error handling and logging

## Troubleshooting

### "Invalid OAuth token" error
- Token might be expired - should auto-refresh
- Check `quickbooks_tokens` table for valid token
- Try reconnecting via `/quickbooks/connect`

### "Company ID not found" error
- Make sure you completed OAuth flow
- Check `realmId` is stored in database

### Rate limit errors (429)
- QuickBooks limits: 500 req/min (sandbox), 1000 req/min (production)
- The sync service has built-in retry logic with exponential backoff

### Sync fails silently
- Check `apps/api/logs/error.log` for detailed errors
- Verify account/product data is valid (required fields populated)

## How the Sync Works

### Order → Invoice/Estimate Flow:

1. **Call** `QuickBooksSync.pushOrderToQBO(orderId, 'invoice')`
2. **System checks** if buyer account is synced to QBO
   - If not → syncs account as Customer first
3. **System checks** each product in order lines
   - If not synced → creates QBO Item for each product
4. **Builds invoice** with line items (including commission lines)
5. **Creates invoice** in QuickBooks
6. **Stores mapping** in `sync_maps` table
7. **Updates order** status to `posted_to_qb`

### Payment Status Sync:

- Call `QuickBooksSync.syncInvoiceStatus(orderId)` manually, OR
- QuickBooks webhook notifies when payment received
- System checks invoice balance in QBO
- If balance = 0 → updates order status to `paid`

## Database Tables Used

| Table | Purpose |
|-------|---------|
| `quickbooks_tokens` | OAuth tokens (you'll create this) |
| `sync_maps` | Tracks which local entities map to QBO entities |
| `accounts` | Synced to QBO Customers |
| `products` | Synced to QBO Items |
| `orders` | Synced to QBO Invoices/Estimates |
| `webhook_events` | Stores QBO webhook notifications |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/quickbooks/connect` | GET | Initiate OAuth flow |
| `/api/webhooks/qbo/callback` | GET | OAuth callback |
| `/api/quickbooks/sync/order/:orderId` | POST | Sync order to QBO |
| `/api/quickbooks/sync/account/:accountId` | POST | Sync account to customer |
| `/api/quickbooks/sync/product/:productId` | POST | Sync product to item |
| `/api/quickbooks/status/order/:orderId` | GET | Check payment status |
| `/api/webhooks/qbo` | POST | Receive QBO webhooks |

## Next Steps

After basic integration works:

1. **Automated sync**: Set up cron job to sync pending orders
2. **Bidirectional sync**: Pull QBO data back into PACE CRM
3. **Conflict resolution**: Handle when data changes in both systems
4. **Multi-company**: Support multiple QuickBooks companies
5. **Detailed logging**: Track all sync operations for audit trail
