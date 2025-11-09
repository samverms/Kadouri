import { Router } from 'express'
import { OrdersController } from './orders.controller'

const router = Router()
const controller = new OrdersController()

router.get('/', controller.searchOrders)
router.post('/', controller.createOrder)
router.get('/:id', controller.getOrder)
router.patch('/:id', controller.updateOrder)
router.delete('/:id', controller.deleteOrder)

export { router as ordersRouter }
