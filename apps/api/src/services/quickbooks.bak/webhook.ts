import { Request, Response } from 'express'
import crypto from 'crypto'
import { db } from '../../db'
import { webhookEvents } from '../../db/schema'
import { logger } from '../../utils/logger'
import { QBOWebhookEvent } from './types'
import { config } from '../../config'

export class QuickBooksWebhook {
  // Verify webhook signature
  static verifySignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha256', process.env.QBO_WEBHOOK_VERIFIER_TOKEN || '')
      .update(payload)
      .digest('base64')

    return hash === signature
  }

  // Process webhook event
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['intuit-signature'] as string
      const payload = JSON.stringify(req.body)

      // Verify signature
      if (!this.verifySignature(payload, signature)) {
        logger.error('Invalid webhook signature')
        res.status(401).send('Unauthorized')
        return
      }

      const event: QBOWebhookEvent = req.body

      // Process each event notification
      for (const notification of event.eventNotifications) {
        const { realmId, dataChangeEvent } = notification

        for (const entity of dataChangeEvent.entities) {
          // Store webhook event
          await db.insert(webhookEvents).values({
            eventId: `${realmId}-${entity.name}-${entity.id}-${Date.now()}`,
            realmId,
            entityName: entity.name,
            operation: entity.operation,
            entityId: entity.id,
            payload: entity as any,
            processed: 'pending',
          })

          logger.info(
            `Received QBO webhook: ${entity.operation} ${entity.name} ${entity.id}`
          )

          // Queue for processing (will be picked up by background worker)
          // For now, just log it
        }
      }

      res.status(200).send('OK')
    } catch (error: any) {
      logger.error('Error handling QBO webhook:', error)
      res.status(500).send('Internal Server Error')
    }
  }

  // Process pending webhook events (called by background worker)
  static async processPendingEvents(): Promise<void> {
    // TODO: Implement background processing of webhook events
    // This should:
    // 1. Fetch pending webhook events
    // 2. For each event:
    //    - If Invoice/Estimate updated: sync status to order
    //    - If Payment created: update order payment status
    //    - If Customer updated: sync to account
    //    - If Item updated: sync to product
    // 3. Mark events as processed or failed
    logger.info('Processing pending QBO webhook events...')
  }
}
