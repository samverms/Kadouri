import { db } from '../../db'
import { orders, orderLines } from '../../db/schema'
import { eq, desc, ilike, or } from 'drizzle-orm'
import { AppError } from '../../middleware/error-handler'
import { logger } from '../../utils/logger'

export class OrdersService {
  // Generate order number (format: YYMM-NNNN)
  private async generateOrderNumber(): Promise<string> {
    const now = new Date()
    const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`

    // Get last order for this month
    const lastOrder = await db
      .select()
      .from(orders)
      .where(ilike(orders.orderNo, `${yearMonth}-%`))
      .orderBy(desc(orders.orderNo))
      .limit(1)

    let sequence = 1
    if (lastOrder.length > 0) {
      const lastSequence = parseInt(lastOrder[0].orderNo.split('-')[1])
      sequence = lastSequence + 1
    }

    return `${yearMonth}-${sequence.toString().padStart(4, '0')}`
  }

  // Calculate line totals and commissions
  private calculateLineTotals(line: any) {
    const lineTotal = line.quantity * line.unitPrice
    let commissionAmt = 0

    if (line.commissionPct) {
      commissionAmt = (lineTotal * line.commissionPct) / 100
    } else if (line.commissionAmt) {
      commissionAmt = line.commissionAmt
    }

    return {
      lineTotal,
      commissionAmt,
    }
  }

  async createOrder(
    data: {
      sellerId: string
      buyerId: string
      contractNo?: string
      terms?: string
      notes?: string
      lines: any[]
    },
    userId: string
  ) {
    const orderNo = await this.generateOrderNumber()

    // Calculate totals
    let subtotal = 0
    let commissionTotal = 0

    const processedLines = data.lines.map((line, index) => {
      const { lineTotal, commissionAmt } = this.calculateLineTotals(line)
      subtotal += lineTotal
      commissionTotal += commissionAmt

      return {
        ...line,
        lineNo: index + 1,
        lineTotal,
        commissionAmt,
      }
    })

    const totalAmount = subtotal

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        orderNo,
        sellerId: data.sellerId,
        buyerId: data.buyerId,
        contractNo: data.contractNo,
        terms: data.terms,
        notes: data.notes,
        status: 'draft',
        subtotal: subtotal.toString(),
        commissionTotal: commissionTotal.toString(),
        totalAmount: totalAmount.toString(),
        createdBy: userId,
      })
      .returning()

    // Create order lines
    const createdLines = await db
      .insert(orderLines)
      .values(
        processedLines.map((line) => ({
          orderId: order.id,
          lineNo: line.lineNo,
          productId: line.productId,
          sizeGrade: line.sizeGrade,
          quantity: line.quantity.toString(),
          unitSize: line.unitSize.toString(),
          uom: line.uom,
          totalWeight: line.totalWeight.toString(),
          unitPrice: line.unitPrice.toString(),
          commissionPct: line.commissionPct?.toString(),
          commissionAmt: line.commissionAmt?.toString(),
          lineTotal: line.lineTotal.toString(),
        }))
      )
      .returning()

    logger.info(`Created order: ${order.id} (${order.orderNo})`)

    return {
      ...order,
      lines: createdLines,
    }
  }

  async getOrder(id: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        seller: true,
        buyer: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      throw new AppError('Order not found', 404)
    }

    // Transform the response to match frontend expectations
    return {
      ...order,
      orderDate: order.createdAt,
      agentName: order.createdBy || 'Unknown',
      lines: order.lines.map(line => ({
        ...line,
        quantity: parseFloat(line.quantity),
        unitSize: line.unitSize ? parseFloat(line.unitSize) : 0,
        uom: line.uom || 'CASE',
        totalWeight: line.totalWeight ? parseFloat(line.totalWeight) : 0,
        unitPrice: parseFloat(line.unitPrice),
        total: parseFloat(line.lineTotal),
        totalPrice: parseFloat(line.lineTotal),
        lineTotal: parseFloat(line.lineTotal),
        commissionPct: line.commissionPct ? parseFloat(line.commissionPct) : 0,
        commissionAmt: line.commissionAmt ? parseFloat(line.commissionAmt) : 0,
        sizeGrade: line.sizeGrade || '',
        productCode: line.product?.name || '',
        productDescription: line.product ? [line.product.variety, line.product.grade].filter(Boolean).join(' - ') : '',
        description: line.product?.name || '',
      })),
    }
  }

  async searchOrders(filters?: {
    search?: string
    status?: string
    sellerId?: string
    buyerId?: string
    limit?: number
  }) {
    let query = db.select().from(orders)

    if (filters?.search) {
      query = query.where(
        or(
          ilike(orders.orderNo, `%${filters.search}%`),
          ilike(orders.contractNo, `%${filters.search}%`)
        )
      ) as any
    }

    if (filters?.status) {
      query = query.where(eq(orders.status, filters.status)) as any
    }

    if (filters?.sellerId) {
      query = query.where(eq(orders.sellerId, filters.sellerId)) as any
    }

    if (filters?.buyerId) {
      query = query.where(eq(orders.buyerId, filters.buyerId)) as any
    }

    const results = await query
      .orderBy(desc(orders.createdAt))
      .limit(filters?.limit || 50)

    return results
  }

  async updateOrder(
    id: string,
    data: {
      sellerId?: string
      buyerId?: string
      contractNo?: string
      terms?: string
      notes?: string
      status?: string
      lines?: any[]
    }
  ) {
    // Get current order
    const [current] = await db.select().from(orders).where(eq(orders.id, id))
    if (!current) {
      throw new AppError('Order not found', 404)
    }

    // CRITICAL BUSINESS RULE: Paid orders cannot be edited
    // Orders with 'posted_to_qb' status CAN be edited - user must click "Update QB Invoice" button
    if (current.status === 'paid') {
      throw new AppError('Cannot edit order - invoice has been paid in QuickBooks', 400)
    }

    // If lines are provided, recalculate totals
    let updateData: any = {
      ...data,
      updatedAt: new Date(),
    }

    if (data.lines) {
      // Delete old lines
      await db.delete(orderLines).where(eq(orderLines.orderId, id))

      // Calculate new totals
      let subtotal = 0
      let commissionTotal = 0

      const processedLines = data.lines.map((line, index) => {
        const { lineTotal, commissionAmt } = this.calculateLineTotals(line)
        subtotal += lineTotal
        commissionTotal += commissionAmt

        return {
          ...line,
          lineNo: index + 1,
          lineTotal,
          commissionAmt,
        }
      })

      // Insert new lines
      await db.insert(orderLines).values(
        processedLines.map((line) => ({
          orderId: id,
          lineNo: line.lineNo,
          productId: line.productId,
          sizeGrade: line.sizeGrade,
          quantity: line.quantity.toString(),
          unitSize: line.unitSize.toString(),
          uom: line.uom,
          totalWeight: line.totalWeight.toString(),
          unitPrice: line.unitPrice.toString(),
          commissionPct: line.commissionPct?.toString(),
          commissionAmt: line.commissionAmt?.toString(),
          lineTotal: line.lineTotal.toString(),
        }))
      )

      updateData = {
        ...updateData,
        subtotal: subtotal.toString(),
        commissionTotal: commissionTotal.toString(),
        totalAmount: subtotal.toString(),
      }

      delete updateData.lines
    }

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning()

    logger.info(`Updated order: ${updated.id}`)
    return this.getOrder(id)
  }

  async deleteOrder(id: string) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id))
    if (!order) {
      throw new AppError('Order not found', 404)
    }

    if (order.status === 'posted_to_qb' || order.status === 'paid') {
      throw new AppError('Cannot delete order that has been posted to QuickBooks', 400)
    }

    await db.delete(orders).where(eq(orders.id, id))
    logger.info(`Deleted order: ${id}`)

    return { success: true }
  }
}
