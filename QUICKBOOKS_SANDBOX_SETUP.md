# QuickBooks Sandbox Setup Guide

## Overview
This guide shows you how to set up a **QuickBooks Sandbox (dummy) account** for testing the PACE CRM integration WITHOUT affecting your real QuickBooks data.

## What You Get with Sandbox
- ✅ Free test environment with dummy data
- ✅ All QuickBooks API features available
- ✅ Safe testing - no risk to production data
- ✅ OAuth 2.0 authentication testing
- ✅ Webhook testing for real-time updates

## Step 1: Create QuickBooks Developer Account

1. Go to https://developer.intuit.com/
2. Click **"Sign In"** or **"Create an account"**
3. Use your existing Intuit/QuickBooks credentials OR create a new account
4. Accept the Developer Agreement

## Step 2: Create a Sandbox Company

1. After logging in, go to: https://developer.intuit.com/app/developer/sandbox
2. Click **"Add Sandbox Company"**
3. Choose a company type:
   - **Recommended**: "Sample Company" (pre-populated with dummy data)
   - Or "Blank Company" (empty, you add data)
4. The sandbox company will be created in ~30 seconds
5. You'll see credentials:
   - **Company ID**
   - **Admin Username**
   - **Admin Password**
   - **Note these down** - you'll need them to log in

## Step 3: Create an App in Developer Portal

1. Go to https://developer.intuit.com/app/developer/myapps
2. Click **"Create an app"**
3. Select **"QuickBooks Online and Payments"**
4. Fill in app details:
   - **App name**: "PACE CRM Test" (or any name you want)
   - **Description**: "CRM integration testing"
5. Click **"Create app"**

## Step 4: Configure App Settings

After creating the app, you'll see two tabs: **Development** and **Production**.

### Development Settings (for Sandbox)

1. Click on the **"Keys & OAuth"** section under Development
2. You'll see:
   - **Client ID**: Copy this (e.g., `ABCxyz123...`)
   - **Client Secret**: Click "Show" and copy this
3. Scroll down to **"Redirect URIs"**
4. Add your callback URL:
   ```
   http://localhost:2000/webhooks/qbo/callback
   ```
5. Click **"Save"**

### Scopes (Permissions)

Make sure these scopes are enabled:
- ✅ `com.intuit.quickbooks.accounting` - Full accounting access
- ✅ `com.intuit.quickbooks.payment` - Optional, for payment processing

## Step 5: Configure PACE CRM Environment Variables

Open `apps/api/.env` and update these values:

```env
# QuickBooks Configuration
QBO_CLIENT_ID=<Your Client ID from Step 4>
QBO_CLIENT_SECRET=<Your Client Secret from Step 4>
QBO_REDIRECT_URI=http://localhost:2000/webhooks/qbo/callback
QBO_ENVIRONMENT=sandbox
QBO_WEBHOOK_VERIFIER_TOKEN=<Generate a random string, e.g., use: openssl rand -base64 32>
```

### Example:
```env
QBO_CLIENT_ID=ABxyz123example
QBO_CLIENT_SECRET=ABCsecret456example
QBO_REDIRECT_URI=http://localhost:2000/webhooks/qbo/callback
QBO_ENVIRONMENT=sandbox
QBO_WEBHOOK_VERIFIER_TOKEN=xK8mP3nQ9rT2vW5yZ1aC4bD7eF0gH6jL
```

## Step 6: Test the OAuth Connection

### Option A: Using the PACE CRM Interface

1. Start the API server: `npm run dev` (from root)
2. The QuickBooks service will initialize
3. Navigate to the QuickBooks settings page in PACE CRM
4. Click **"Connect to QuickBooks"**
5. You'll be redirected to Intuit's OAuth page
6. **Important**: Log in with your **Sandbox credentials** (from Step 2), NOT your real QuickBooks account
7. Select your **Sandbox company** from the dropdown
8. Click **"Authorize"**
9. You'll be redirected back to PACE CRM with a success message

### Option B: Test OAuth Manually

If the QuickBooks service is not yet active in the UI, you can test the OAuth flow directly:

1. Start the API server
2. Open your browser and navigate to:
   ```
   http://localhost:2000/api/qbo/connect
   ```
   (You may need to create this endpoint first - see below)

3. This should redirect you to QuickBooks OAuth page
4. Follow steps 6-9 from Option A above

## Step 7: Access Your Sandbox Company

To view/modify data in your Sandbox company:

1. Go to https://app.sandbox.qbo.intuit.com/
2. Click **"Sign in with Intuit"**
3. Use the **Sandbox credentials** from Step 2
4. You'll see a QuickBooks interface with dummy data

## Step 8: Enable Webhooks (Optional)

Webhooks allow QuickBooks to notify PACE CRM when data changes (e.g., invoice paid).

### In QuickBooks Developer Portal:

1. Go to your app settings
2. Click **"Webhooks"** section
3. Enter your webhook endpoint URL:
   ```
   https://your-domain.com/webhooks/qbo
   ```
   **Note**: For local testing, you'll need a tool like **ngrok** to expose localhost:
   ```bash
   ngrok http 2000
   # Use the https URL ngrok provides
   ```
4. Add the **Verifier Token** (the random string you set in `.env`)
5. Select entities to watch:
   - Customer
   - Invoice
   - Payment
   - Item
6. Click **"Save"**

## Activating QuickBooks Integration in PACE CRM

Your codebase already has QuickBooks integration code at:
```
apps/api/src/services/quickbooks.bak/
```

### To activate it:

1. Rename the folder:
   ```bash
   cd apps/api/src/services
   mv quickbooks.bak quickbooks
   ```

2. The service includes:
   - **client.ts**: OAuth & API wrapper
   - **sync.ts**: Bidirectional sync logic
   - **webhook.ts**: Webhook handler
   - **config.ts**: Configuration
   - **types.ts**: TypeScript interfaces

3. Import and use in your routes:
   ```typescript
   import { QuickBooksClient } from '../services/quickbooks/client'
   import { QuickBooksSync } from '../services/quickbooks/sync'
   ```

## Testing the Integration

### 1. Sync an Account (Customer)

```typescript
import { QuickBooksSync } from './services/quickbooks/sync'

// Sync PACE account to QBO customer
const result = await QuickBooksSync.syncAccountToCustomer(accountId)
console.log('Synced to QBO Customer ID:', result.qboCustomerId)
```

### 2. Push an Order (Invoice)

```typescript
// Create invoice in QuickBooks
const result = await QuickBooksSync.pushOrderToQBO(orderId, 'invoice')
console.log('Created QBO Invoice #:', result.qboDocNumber)
```

### 3. Query QuickBooks Data

```typescript
import { QuickBooksClient } from './services/quickbooks/client'

const client = new QuickBooksClient()
const customers = await client.query("SELECT * FROM Customer WHERE Active = true")
console.log('Active customers:', customers)
```

## Important Notes

### Sandbox vs Production

- **Sandbox**: Use for ALL testing and development
  - URL: `https://app.sandbox.qbo.intuit.com/`
  - API: `https://sandbox-quickbooks.api.intuit.com/`
  - Company IDs are different from production

- **Production**: Only use when ready to go live
  - URL: `https://app.qbo.intuit.com/`
  - API: `https://quickbooks.api.intuit.com/`
  - Requires production app review by Intuit

### Token Expiration

- **Access Token**: Expires after 1 hour
- **Refresh Token**: Expires after 100 days
- The QuickBooks client auto-refreshes tokens
- Tokens are stored in memory (add database persistence for production)

### Rate Limits (Sandbox)

- 500 requests per minute
- 5000 requests per 24 hours
- Same as production limits

## Troubleshooting

### "Invalid client credentials"
- ✅ Double-check Client ID and Secret
- ✅ Make sure you're using **Development keys**, not Production
- ✅ Verify keys have no extra spaces

### "Redirect URI mismatch"
- ✅ Ensure redirect URI in `.env` EXACTLY matches what's in Developer Portal
- ✅ Include `http://` prefix
- ✅ Check for trailing slashes

### "Company not found"
- ✅ Make sure you selected the **Sandbox company** during OAuth
- ✅ Verify `QBO_ENVIRONMENT=sandbox` in `.env`

### Tokens not refreshing
- ✅ Check that refresh token is being stored
- ✅ Verify token hasn't expired (100-day limit)
- ✅ Re-authenticate if needed

## Next Steps

1. ✅ You now have a safe Sandbox environment
2. Test syncing accounts to QuickBooks customers
3. Test creating invoices/estimates from orders
4. Test bidirectional sync (pull data from QuickBooks)
5. Test webhooks (if enabled)
6. Once confident, apply for Production access through Intuit Developer Portal

## Additional Resources

- **QuickBooks API Explorer**: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account
- **OAuth 2.0 Playground**: https://developer.intuit.com/app/developer/playground
- **API Reference**: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/customer
- **Sandbox Management**: https://developer.intuit.com/app/developer/sandbox
- **Support**: https://help.developer.intuit.com/s/

---

**Ready to test!** Start with Step 1 and follow through. The Sandbox keeps your real data safe while you build and test the integration.
