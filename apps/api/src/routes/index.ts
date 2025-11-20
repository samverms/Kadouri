import { Router } from 'express'
import path from 'path'
import express from 'express'
import { authenticate } from '../middleware/auth'
import { accountsRouter } from '../modules/accounts/accounts.routes'
import { productsRouter } from '../modules/products/products.routes'
import { ordersRouter } from '../modules/orders/orders.routes'
import { invitationRouter } from '../modules/users/invitation.routes'
import orderActivitiesRouter from '../modules/order-activities/order-activities.routes'
import pdfRouter from './pdf.routes'
import searchRouter from './search.routes'
import rolesRouter from '../modules/roles/roles.routes'
import invoicesRouter from '../modules/invoices/invoices.routes'
import usersRouter from './users.routes'
import contractsRouter from '../modules/contracts/contracts.routes'
import quickbooksRouter from './quickbooks.routes'
import qboWebhookRouter from './qbo-webhooks.routes'
import brokersRouter from '../modules/brokers/brokers.routes'
import agentsRouter from '../modules/agents/agents.routes'
import outlookRouter from './outlook.routes'

const router = Router()

// Public routes
router.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Serve uploaded files (with authentication)
const uploadsPath = path.join(process.cwd(), 'uploads')
router.use('/uploads', authenticate, express.static(uploadsPath))

// Protected routes
router.use('/accounts', authenticate, accountsRouter)
router.use('/products', authenticate, productsRouter)
router.use('/orders', authenticate, ordersRouter)
router.use('/contracts', authenticate, contractsRouter)
router.use('/invoices', authenticate, invoicesRouter)
router.use('/brokers', authenticate, brokersRouter)
router.use('/agents', authenticate, agentsRouter)
router.use('/search', authenticate, searchRouter)
router.use('/users', authenticate, usersRouter)
router.use('/quickbooks', quickbooksRouter) // QuickBooks OAuth and sync (has mixed auth)
router.use('/outlook', outlookRouter) // Office 365 OAuth (has mixed auth)
router.use('/webhooks/qbo', qboWebhookRouter) // QuickBooks webhooks (no auth)
router.use('/', authenticate, rolesRouter) // Roles and permissions
router.use('/', orderActivitiesRouter) // Order activities (has auth in routes)
router.use('/invitations', invitationRouter) // Has its own auth per route
router.use('/pdf', authenticate, pdfRouter) // PDF generation using PDFKit (Heroku compatible)

// TODO: Add these routes
// router.use('/reports', authenticate, reportsRouter)

export { router as routes }
