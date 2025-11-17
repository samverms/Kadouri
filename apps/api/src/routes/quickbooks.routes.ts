import { Router } from 'express'
import { qboClient, QBO_SCOPES } from '../services/quickbooks/config'
import { QuickBooksSync } from '../services/quickbooks/sync-wrapper'
import { handleQuickBooksWebhook } from '../services/quickbooks/webhook-handler'
import { OrderActivityService } from '../modules/order-activities/order-activities.service'
import { authenticate } from '../middleware/auth'
import { db } from '../db'
import { quickbooksTokens, orders } from '../db/schema'
import { eq } from 'drizzle-orm'

const router = Router()

// Webhook endpoint - NO AUTHENTICATION (QuickBooks needs public access)
// This must be registered in QuickBooks Developer Dashboard
router.post('/webhook', handleQuickBooksWebhook)

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

    // Calculate token expiration times
    const expiresAt = new Date(Date.now() + authResponse.token.expires_in * 1000)
    const refreshExpiresAt = new Date(Date.now() + authResponse.token.x_refresh_token_expires_in * 1000)

    // Store tokens in database
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

    res.send(`
      <html>
        <head><title>QuickBooks Connected</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #2ca01c;">✓ QuickBooks Connected Successfully!</h1>
          <p>You can now close this window and return to PACE CRM.</p>
          <p style="color: #666;">Company ID: ${authResponse.token.realmId}</p>
        </body>
      </html>
    `)
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    res.status(500).send(`
      <html>
        <head><title>Connection Failed</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #d32f2f;">✗ Failed to Connect to QuickBooks</h1>
          <p>Error: ${error.message || 'Unknown error'}</p>
          <p><a href="/api/quickbooks/connect">Try Again</a></p>
        </body>
      </html>
    `)
  }
})

// Sync order to QuickBooks (Create)
router.post('/sync/order/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params
    const { docType } = req.body // 'invoice' or 'estimate'

    if (!docType || !['invoice', 'estimate'].includes(docType)) {
      return res.status(400).json({ error: 'docType must be "invoice" or "estimate"' })
    }

    const result = await QuickBooksSync.pushOrderToQBO(orderId, docType)

    // Record activity
    await OrderActivityService.recordActivity({
      orderId,
      clerkUserId: (req as any).auth.userId,
      userName: (req as any).auth.sessionClaims?.firstName + ' ' + (req as any).auth.sessionClaims?.lastName || 'User',
      activityType: 'invoice_created',
      description: `${docType === 'invoice' ? 'Invoice' : 'Estimate'} #${result.docNumber} created in QuickBooks`,
      ipAddress: req.ip,
    })

    res.json(result)
  } catch (error: any) {
    console.error('Order sync error:', error)
    res.status(500).json({ error: error.message || 'Unknown error' })
  }
})

// Update order in QuickBooks
router.put('/sync/order/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params

    // Get the order to check if it's already synced
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId)
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (!order.qboDocId || !order.qboDocType) {
      return res.status(400).json({
        error: 'Order not yet synced to QuickBooks. Use POST to create first.'
      })
    }

    // Re-sync the order (will update existing invoice/estimate in QBO)
    const result = await QuickBooksSync.pushOrderToQBO(orderId, order.qboDocType as 'invoice' | 'estimate')

    // Record activity
    await OrderActivityService.recordActivity({
      orderId,
      clerkUserId: (req as any).auth.userId,
      userName: (req as any).auth.sessionClaims?.firstName + ' ' + (req as any).auth.sessionClaims?.lastName || 'User',
      activityType: 'invoice_updated',
      description: `${order.qboDocType === 'invoice' ? 'Invoice' : 'Estimate'} #${order.qboDocNumber} updated in QuickBooks`,
      ipAddress: req.ip,
    })

    res.json({
      message: 'Order updated in QuickBooks',
      ...result
    })
  } catch (error: any) {
    console.error('Update sync error:', error)
    res.status(500).json({ error: error.message || 'Unknown error' })
  }
})

// Cancel/Void invoice in QuickBooks
router.delete('/sync/order/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params

    // Get the order to check if it's synced
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId)
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (!order.qboDocId || !order.qboDocType) {
      return res.status(400).json({
        error: 'Order not synced to QuickBooks'
      })
    }

    if (order.qboDocType !== 'invoice') {
      return res.status(400).json({
        error: 'Only invoices can be voided. Estimates can be deleted via QuickBooks directly.'
      })
    }

    // Void the invoice in QuickBooks
    const result = await QuickBooksSync.voidInvoice(orderId)

    // Record activity
    await OrderActivityService.recordActivity({
      orderId,
      clerkUserId: (req as any).auth.userId,
      userName: (req as any).auth.sessionClaims?.firstName + ' ' + (req as any).auth.sessionClaims?.lastName || 'User',
      activityType: 'invoice_voided',
      description: `Invoice #${order.qboDocNumber} voided in QuickBooks`,
      ipAddress: req.ip,
    })

    res.json(result)
  } catch (error: any) {
    console.error('Void invoice error:', error)
    res.status(500).json({ error: error.message || 'Unknown error' })
  }
})

// Sync account to customer
router.post('/sync/account/:accountId', authenticate, async (req, res) => {
  try {
    const { accountId } = req.params
    const result = await QuickBooksSync.syncAccountToCustomer(accountId)
    res.json(result)
  } catch (error: any) {
    console.error('Account sync error:', error)
    res.status(500).json({ error: error.message || 'Unknown error' })
  }
})

// Sync product to item
router.post('/sync/product/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params
    const result = await QuickBooksSync.syncProductToItem(productId)
    res.json(result)
  } catch (error: any) {
    console.error('Product sync error:', error)
    res.status(500).json({ error: error.message || 'Unknown error' })
  }
})

// Check invoice payment status
router.get('/status/order/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params
    const result = await QuickBooksSync.syncInvoiceStatus(orderId)
    res.json(result)
  } catch (error: any) {
    console.error('Status sync error:', error)
    res.status(500).json({ error: error.message || 'Unknown error' })
  }
})

// Get connection status (no auth - needed for settings page)
router.get('/status', async (req, res) => {
  try {
    const token = await db.query.quickbooksTokens.findFirst({
      where: (tokens, { eq }) => eq(tokens.isActive, true),
      orderBy: (tokens, { desc }) => [desc(tokens.updatedAt)],
    })

    if (!token) {
      return res.json({ connected: false })
    }

    const isExpired = new Date() > token.expiresAt

    res.json({
      connected: true,
      realmId: token.realmId,
      expiresAt: token.expiresAt,
      isExpired,
    })
  } catch (error: any) {
    console.error('Status check error:', error)
    res.status(500).json({ error: error.message || 'Unknown error' })
  }
})

// Disconnect QuickBooks
router.post('/disconnect', authenticate, async (req, res) => {
  try {
    // Mark all active tokens as inactive
    await db
      .update(quickbooksTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(quickbooksTokens.isActive, true))

    res.json({
      success: true,
      message: 'QuickBooks disconnected successfully'
    })
  } catch (error: any) {
    console.error('Disconnect error:', error)
    res.status(500).json({ error: error.message || 'Unknown error' })
  }
})

export default router
