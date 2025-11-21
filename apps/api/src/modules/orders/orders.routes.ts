import { Router } from 'express'
import { OrdersController } from './orders.controller'

const router = Router()
const controller = new OrdersController()

router.get('/', controller.searchOrders)
router.post('/', controller.createOrder)
router.get('/:id', controller.getOrder)
router.patch('/:id', controller.updateOrder)
router.delete('/:id', controller.deleteOrder)

// Terms options endpoint (separate router for better organization)
const termsRouter = Router()
termsRouter.get('/', controller.getTermsOptions)

export { router as ordersRouter, termsRouter as termsOptionsRouter }
