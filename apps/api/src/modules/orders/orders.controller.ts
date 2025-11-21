import { Response, NextFunction } from 'express'
import { OrdersService } from './orders.service'
import { createOrderSchema, updateOrderSchema } from '../../shared-copy'
import { AuthRequest } from '../../middleware/auth'

export class OrdersController {
  private ordersService: OrdersService

  constructor() {
    this.ordersService = new OrdersService()
  }

  createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validated = createOrderSchema.parse(req.body)
      const order = await this.ordersService.createOrder(validated, req.userId!)
      res.status(201).json(order)
    } catch (error) {
      next(error)
    }
  }

  getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const order = await this.ordersService.getOrder(req.params.id)
      res.json(order)
    } catch (error) {
      next(error)
    }
  }

  searchOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { search, status, sellerId, buyerId, limit } = req.query
      const orders = await this.ordersService.searchOrders({
        search: search as string,
        status: status as string,
        sellerId: sellerId as string,
        buyerId: buyerId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      })
      res.json(orders)
    } catch (error) {
      next(error)
    }
  }

  updateOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validated = updateOrderSchema.parse(req.body)
      const order = await this.ordersService.updateOrder(req.params.id, validated, req.userId)
      res.json(order)
    } catch (error) {
      next(error)
    }
  }

  deleteOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.ordersService.deleteOrder(req.params.id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  getTermsOptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const terms = await this.ordersService.getTermsOptions()
      res.json(terms)
    } catch (error) {
      next(error)
    }
  }
}
