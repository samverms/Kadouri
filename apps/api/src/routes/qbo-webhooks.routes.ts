import { Router } from 'express'
import { QuickBooksWebhook } from '../services/quickbooks/webhook'

const router = Router()

// QuickBooks webhooks (no auth - QBO doesn't send bearer tokens)
router.post('/', async (req, res) => {
  try {
    await QuickBooksWebhook.handleWebhook(req, res)
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).send('Error processing webhook')
  }
})

export default router
