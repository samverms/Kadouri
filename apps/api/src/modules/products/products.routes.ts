import { Router } from 'express'
import { ProductsController } from './products.controller'
import { variantsController } from './variants.controller'

const router = Router()
const controller = new ProductsController()

// Product routes (list and create)
router.get('/', controller.searchProducts)
router.post('/', controller.createProduct)

// Individual variant routes (MUST come before /:id routes to avoid conflicts)
router.get('/variants/:id', variantsController.getVariantById)
router.put('/variants/:id', variantsController.updateVariant)
router.delete('/variants/:id', variantsController.deleteVariant)

// Product variant routes (by product ID)
router.get('/:productId/variants', variantsController.getVariantsByProduct)
router.post('/:productId/variants', variantsController.createVariant)
router.post('/:productId/variants/:variantId/set-default', variantsController.setDefaultVariant)

// Product routes (by ID - MUST come after specific routes)
router.get('/:id', controller.getProduct)
router.patch('/:id', controller.updateProduct)
router.delete('/:id', controller.deleteProduct)
router.post('/:id/link-qbo', controller.linkQboItem)

export { router as productsRouter }
