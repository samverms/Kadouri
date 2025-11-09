import { Router } from 'express'
import { ProductsController } from './products.controller'

const router = Router()
const controller = new ProductsController()

router.get('/', controller.searchProducts)
router.post('/', controller.createProduct)
router.get('/:id', controller.getProduct)
router.patch('/:id', controller.updateProduct)
router.delete('/:id', controller.deleteProduct)
router.post('/:id/link-qbo', controller.linkQboItem)

export { router as productsRouter }
