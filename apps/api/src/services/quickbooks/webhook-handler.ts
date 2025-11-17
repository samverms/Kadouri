import { Request, Response } from 'express'
import crypto from 'crypto'
import { db } from '../../db'
import { orders, accounts, products } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '../../utils/logger'
import { QuickBooksClient } from './client'
import { TokenManager } from './token-manager'
import { OrderActivityService } from '../../modules/order-activities/order-activities.service'

// QuickBooks webhook verification token
const WEBHOOK_VERIFIER_TOKEN = process.env.QBO_WEBHOOK_VERIFIER_TOKEN || 'your-webhook-token'

/**
 * Verify QuickBooks webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', WEBHOOK_VERIFIER_TOKEN)
    .update(payload)
    .digest('base64')

  return hash === signature
}

/**
 * Handle QuickBooks webhook notifications
 */
export async function handleQuickBooksWebhook(req: Request, res: Response) {
  try {
    // Verify the webhook signature
    const intuitSignature = req.headers['intuit-signature'] as string
    const payload = JSON.stringify(req.body)

    if (!verifyWebhookSignature(payload, intuitSignature)) {
      logger.warn('Invalid QuickBooks webhook signature')
      return res.status(401).send('Unauthorized')
    }

    const { eventNotifications } = req.body

    if (!eventNotifications || eventNotifications.length === 0) {
      return res.status(200).send('OK')
    }

    // Process each notification
    for (const notification of eventNotifications) {
      const { realmId, dataChangeEvent } = notification

      if (!dataChangeEvent || !dataChangeEvent.entities) {
        continue
      }

      // Process each entity change
      for (const entity of dataChangeEvent.entities) {
        const { name, id, operation, lastUpdated } = entity

        logger.info(`QB Webhook: ${operation} on ${name} ${id} in realm ${realmId}`)

        try {
          switch (name) {
            case 'Invoice':
              await handleInvoiceChange(id, operation, realmId)
              break
            case 'Customer':
              await handleCustomerChange(id, operation, realmId)
              break
            case 'Item':
              await handleItemChange(id, operation, realmId)
              break
            case 'Payment':
              await handlePaymentChange(id, operation, realmId)
              break
            default:
              logger.info(`Unhandled entity type: ${name}`)
          }
        } catch (error) {
          logger.error(`Error processing webhook for ${name} ${id}:`, error)
        }
      }
    }

    // QuickBooks expects a 200 response
    res.status(200).send('OK')
  } catch (error) {
    logger.error('Webhook handler error:', error)
    res.status(500).send('Internal Server Error')
  }
}

/**
 * Handle Invoice changes from QuickBooks
 */
async function handleInvoiceChange(qboInvoiceId: string, operation: string, realmId: string) {
  if (operation === 'Delete') {
    // Invoice was deleted/voided in QuickBooks
    logger.info(`Invoice ${qboInvoiceId} was deleted in QB`)

    // Find the order with this QB invoice ID
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.qboDocId, qboInvoiceId))
      .limit(1)

    if (order) {
      // Mark as voided/cancelled
      await db
        .update(orders)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))

      // Record activity
      await OrderActivityService.recordActivity({
        orderId: order.id,
        activityType: 'invoice_voided',
        description: `Invoice voided in QuickBooks`,
        userName: 'QuickBooks Webhook',
      })

      logger.info(`Order ${order.orderNo} marked as cancelled`)
    }

    return
  }

  // Fetch the invoice from QuickBooks to get latest data
  try {
    // Get QB client with tokens
    const { accessToken, realmId: tokenRealmId } = await TokenManager.getActiveToken()
    const qboClient = new QuickBooksClient({
      access_token: accessToken,
      realmId: tokenRealmId
    } as any)

    const invoiceData = await qboClient.getInvoice(qboInvoiceId)

    // Find the order with this QB invoice ID
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.qboDocId, qboInvoiceId))
      .limit(1)

    if (!order) {
      logger.warn(`No order found for QB invoice ${qboInvoiceId}`)
      return
    }

    // Determine payment status
    const balance = parseFloat(String(invoiceData.Balance || '0'))
    const totalAmount = parseFloat(String(invoiceData.TotalAmt || '0'))

    let paymentStatus = 'unpaid'
    if (balance === 0 && totalAmount > 0) {
      paymentStatus = 'paid'
    } else if (balance > 0 && balance < totalAmount) {
      paymentStatus = 'partial'
    }

    // Update the order with latest data from QuickBooks
    await db
      .update(orders)
      .set({
        totalAmount: totalAmount.toString(),
        status: paymentStatus === 'paid' ? 'paid' : 'posted_to_qb',
        qboDocNumber: invoiceData.DocNumber,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))

    // Record activity based on payment status
    if (paymentStatus === 'paid') {
      await OrderActivityService.recordActivity({
        orderId: order.id,
        activityType: 'payment_received',
        description: `Payment received in QuickBooks - Invoice #${invoiceData.DocNumber} marked as PAID`,
        userName: 'QuickBooks Webhook',
      })
    } else {
      await OrderActivityService.recordActivity({
        orderId: order.id,
        activityType: 'synced_from_qb',
        description: `Invoice #${invoiceData.DocNumber} updated from QuickBooks (Amount: $${totalAmount}, Status: ${paymentStatus})`,
        userName: 'QuickBooks Webhook',
      })
    }

    logger.info(`Order ${order.orderNo} updated: amount=${totalAmount}, status=${paymentStatus}`)
  } catch (error: any) {
    logger.error(`Failed to fetch invoice ${qboInvoiceId}:`, error.message)
  }
}

/**
 * Handle Customer changes from QuickBooks
 */
async function handleCustomerChange(qboCustomerId: string, operation: string, realmId: string) {
  if (operation === 'Delete') {
    logger.info(`Customer ${qboCustomerId} was deleted in QB`)

    // Find account with this QB customer ID
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.qboCustomerId, qboCustomerId))
      .limit(1)

    if (account) {
      // Clear the QB customer ID
      await db
        .update(accounts)
        .set({
          qboCustomerId: null,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, account.id))

      logger.info(`Account ${account.name} QB link removed`)
    }

    return
  }

  // For Create/Update, fetch the customer data
  try {
    // Get QB client with tokens
    const { accessToken, realmId: tokenRealmId } = await TokenManager.getActiveToken()
    const qboClient = new QuickBooksClient({
      access_token: accessToken,
      realmId: tokenRealmId
    } as any)

    const customerData = await qboClient.getCustomer(qboCustomerId)

    // Find account with this QB customer ID
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.qboCustomerId, qboCustomerId))
      .limit(1)

    if (account) {
      // Update account name if changed in QB
      await db
        .update(accounts)
        .set({
          name: customerData.DisplayName || account.name,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, account.id))

      logger.info(`Account ${account.name} updated from QB`)
    }
  } catch (error: any) {
    logger.error(`Failed to fetch customer ${qboCustomerId}:`, error.message)
  }
}

/**
 * Handle Item changes from QuickBooks
 */
async function handleItemChange(qboItemId: string, operation: string, realmId: string) {
  if (operation === 'Delete') {
    logger.info(`Item ${qboItemId} was deleted in QB`)

    // Find product with this QB item ID
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.qboItemId, qboItemId))
      .limit(1)

    if (product) {
      // Clear the QB item ID
      await db
        .update(products)
        .set({
          qboItemId: null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id))

      logger.info(`Product ${product.name} QB link removed`)
    }

    return
  }

  // Could fetch item data and update product if needed
  logger.info(`Item ${qboItemId} ${operation} - sync not implemented yet`)
}

/**
 * Handle Payment changes from QuickBooks
 */
async function handlePaymentChange(qboPaymentId: string, operation: string, realmId: string) {
  try {
    // Get QB client with tokens
    const { accessToken, realmId: tokenRealmId } = await TokenManager.getActiveToken()
    const qboClient = new QuickBooksClient({
      access_token: accessToken,
      realmId: tokenRealmId
    } as any)

    const paymentData = await qboClient.getPayment(qboPaymentId)

    // Get the linked invoices
    const linkedInvoices = paymentData.Line?.filter((line: any) => line.LinkedTxn) || []

    for (const line of linkedInvoices) {
      for (const linkedTxn of line.LinkedTxn) {
        if (linkedTxn.TxnType === 'Invoice') {
          const qboInvoiceId = linkedTxn.TxnId

          // Find order with this invoice ID
          const [order] = await db
            .select()
            .from(orders)
            .where(eq(orders.qboDocId, qboInvoiceId))
            .limit(1)

          if (order) {
            // Fetch the invoice to check balance
            const invoiceData = await qboClient.getInvoice(qboInvoiceId)
            const balance = parseFloat(String(invoiceData.Balance || '0'))

            // Update payment status
            const status = balance === 0 ? 'paid' : 'posted_to_qb'

            await db
              .update(orders)
              .set({
                status,
                updatedAt: new Date(),
              })
              .where(eq(orders.id, order.id))

            // Record activity
            await OrderActivityService.recordActivity({
              orderId: order.id,
              activityType: status === 'paid' ? 'payment_received' : 'synced_from_qb',
              description: status === 'paid'
                ? `Payment received in QuickBooks - Invoice marked as PAID`
                : `Partial payment received in QuickBooks`,
              userName: 'QuickBooks Webhook',
            })

            logger.info(`Order ${order.orderNo} payment status updated: ${status}`)
          }
        }
      }
    }
  } catch (error: any) {
    logger.error(`Failed to process payment ${qboPaymentId}:`, error.message)
  }
}
