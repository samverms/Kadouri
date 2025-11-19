import { Request, Response, NextFunction } from 'express'
import { ProductsService } from './products.service'
import { createProductSchema, updateProductSchema } from '../../shared-copy'

export class ProductsController {
  private productsService: ProductsService

  constructor() {
    this.productsService = new ProductsService()
  }

  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createProductSchema.parse(req.body)
      const product = await this.productsService.createProduct(validated)
      res.status(201).json(product)
    } catch (error) {
      next(error)
    }
  }

  getProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await this.productsService.getProduct(req.params.id)
      res.json(product)
    } catch (error) {
      next(error)
    }
  }

  searchProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, limit, includeInactive } = req.query
      const products = await this.productsService.searchProducts(
        search as string,
        limit ? parseInt(limit as string) : undefined,
        includeInactive === 'true'
      )
      res.json(products)
    } catch (error) {
      next(error)
    }
  }

  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = updateProductSchema.parse(req.body)
      // @ts-ignore - Clerk adds userId to req.auth
      const userId = req.auth?.userId
      const product = await this.productsService.updateProduct(req.params.id, validated, userId)
      res.json(product)
    } catch (error) {
      next(error)
    }
  }

  linkQboItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { qboItemId } = req.body
      const product = await this.productsService.linkQboItem(req.params.id, qboItemId)
      res.json(product)
    } catch (error) {
      next(error)
    }
  }

  deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await this.productsService.deleteProduct(req.params.id)
      res.json(product)
    } catch (error) {
      next(error)
    }
  }
}
