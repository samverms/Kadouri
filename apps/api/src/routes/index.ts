import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { accountsRouter } from '../modules/accounts/accounts.routes'
import { productsRouter } from '../modules/products/products.routes'
import { ordersRouter } from '../modules/orders/orders.routes'
import { invitationRouter } from '../modules/users/invitation.routes'
import pdfRouter from './pdf.routes'
import searchRouter from './search.routes'

const router = Router()

// Public routes
router.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Protected routes
router.use('/accounts', authenticate, accountsRouter)
router.use('/products', authenticate, productsRouter)
router.use('/orders', authenticate, ordersRouter)
router.use('/search', authenticate, searchRouter)
router.use('/invitations', invitationRouter) // Has its own auth per route
// PDF routes - temporarily without auth for testing
router.use('/pdf', pdfRouter)

// TODO: Add these routes
// router.use('/reports', authenticate, reportsRouter)
// router.use('/webhooks/qbo', qboWebhookRouter)

export { router as routes }
