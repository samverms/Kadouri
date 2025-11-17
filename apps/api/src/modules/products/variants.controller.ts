import { Request, Response, NextFunction } from 'express'
import { variantsService } from './variants.service'
import { z } from 'zod'

// Validation schemas
const createVariantSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().optional(),
  size: z.number().positive(),
  sizeUnit: z.string().min(1),
  packageType: z.string().min(1),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
})

const updateVariantSchema = z.object({
  sku: z.string().optional(),
  size: z.number().positive().optional(),
  sizeUnit: z.string().min(1).optional(),
  packageType: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
})

export class VariantsController {
  // GET /api/products/:productId/variants
  getVariantsByProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const variants = await variantsService.getVariantsByProduct(req.params.productId)
      res.json(variants)
    } catch (error) {
      next(error)
    }
  }

  // GET /api/variants/:id
  getVariantById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const variant = await variantsService.getVariantById(req.params.id)
      res.json(variant)
    } catch (error) {
      next(error)
    }
  }

  // POST /api/products/:productId/variants
  createVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createVariantSchema.parse({
        ...req.body,
        productId: req.params.productId,
      })
      // @ts-ignore - Clerk adds userId to req.auth
      const userId = req.auth?.userId
      const variant = await variantsService.createVariant({
        ...validated,
        createdBy: userId,
      })
      res.status(201).json(variant)
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors })
      } else {
        next(error)
      }
    }
  }

  // PUT /api/variants/:id
  updateVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = updateVariantSchema.parse(req.body)
      // @ts-ignore - Clerk adds userId to req.auth
      const userId = req.auth?.userId
      const variant = await variantsService.updateVariant(req.params.id, {
        ...validated,
        updatedBy: userId,
      })
      res.json(variant)
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors })
      } else {
        next(error)
      }
    }
  }

  // DELETE /api/variants/:id
  deleteVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await variantsService.deleteVariant(req.params.id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  // POST /api/products/:productId/variants/:variantId/set-default
  setDefaultVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const variant = await variantsService.setDefaultVariant(
        req.params.productId,
        req.params.variantId
      )
      res.json(variant)
    } catch (error) {
      next(error)
    }
  }
}

export const variantsController = new VariantsController()
