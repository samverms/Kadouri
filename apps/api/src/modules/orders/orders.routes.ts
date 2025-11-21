import { Router } from 'express'
import multer from 'multer'
import { OrdersController } from './orders.controller'

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

const router = Router()
const controller = new OrdersController()

router.get('/', controller.searchOrders)
router.post('/', controller.createOrder)
router.get('/:id', controller.getOrder)
router.patch('/:id', controller.updateOrder)
router.delete('/:id', controller.deleteOrder)

// Attachment routes
router.post('/:id/attachments', upload.single('file'), controller.uploadAttachment)
router.get('/:id/attachments', controller.getAttachments)
router.delete('/:id/attachments/:attachmentId', controller.deleteAttachment)

// Terms options endpoint (separate router for better organization)
const termsRouter = Router()
termsRouter.get('/', controller.getTermsOptions)

export { router as ordersRouter, termsRouter as termsOptionsRouter }
