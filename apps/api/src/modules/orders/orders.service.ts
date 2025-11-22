import { db } from '../../db'
import { orders, orderLines, accounts, products, agents, brokers, termsOptions, orderAttachments } from '../../db/schema'
import { eq, desc, ilike, or, inArray } from 'drizzle-orm'
import { AppError } from '../../middleware/error-handler'
import { logger } from '../../utils/logger'
import contractsService from '../contracts/contracts.service'
import { OrderActivityService } from '../order-activities/order-activities.service'
import { CloudinaryService } from '../../services/storage/cloudinary-service'

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
      sellerBillingAddressId?: string
      sellerPickupAddressId?: string
      buyerBillingAddressId?: string
      buyerShippingAddressId?: string
      isPickup?: boolean
      agentId?: string
      brokerId?: string
      contractNo?: string
      contractId?: string
      contractDrawQuantity?: number
      terms?: string
      notes?: string
      memo?: string
      palletCount?: number
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
        sellerBillingAddressId: data.sellerBillingAddressId,
        sellerPickupAddressId: data.sellerPickupAddressId,
        buyerBillingAddressId: data.buyerBillingAddressId,
        buyerShippingAddressId: data.buyerShippingAddressId,
        isPickup: data.isPickup || false,
        agentId: data.agentId,
        brokerId: data.brokerId,
        contractId: data.contractId,
        contractNo: data.contractNo,
        terms: data.terms,
        notes: data.notes,
        memo: data.memo,
        palletCount: data.palletCount,
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

    // If this order is drawn from a contract, record the contract draw
    if (data.contractId && data.contractDrawQuantity) {
      try {
        await contractsService.recordContractDraw(
          data.contractId,
          order.id,
          data.contractDrawQuantity,
          userId
        )
        logger.info(`Contract draw recorded for order: ${order.id}`, {
          contractId: data.contractId,
          quantity: data.contractDrawQuantity,
        })
      } catch (error: any) {
        // If contract draw fails, we should probably rollback the order
        // For now, just log the error
        logger.error(`Failed to record contract draw: ${error.message}`, {
          orderId: order.id,
          contractId: data.contractId,
        })
        // You might want to delete the order here or mark it with an error status
      }
    }

    logger.info(`Created order: ${order.id} (${order.orderNo})`)

    // Log activity
    try {
      await OrderActivityService.recordActivity({
        orderId: order.id,
        clerkUserId: userId,
        activityType: 'order_created',
        description: `Order ${order.orderNo} created with ${createdLines.length} line item(s)`,
      })
    } catch (err) {
      logger.error('Failed to log order creation activity:', err)
    }

    return {
      ...order,
      lines: createdLines,
    }
  }

  async getOrder(id: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        seller: {
          with: {
            addresses: true,
            contacts: true,
          },
        },
        buyer: {
          with: {
            addresses: true,
            contacts: true,
          },
        },
        agent: true,
        broker: true,
        sellerBillingAddress: true,
        sellerPickupAddress: true,
        buyerBillingAddress: true,
        buyerShippingAddress: true,
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

    if (results.length === 0) {
      return []
    }

    // Get all related data
    const orderIds = results.map(o => o.id)
    const sellerIds = [...new Set(results.map(o => o.sellerId).filter(Boolean) as string[])]
    const buyerIds = [...new Set(results.map(o => o.buyerId).filter(Boolean) as string[])]
    const accountIds = [...new Set([...sellerIds, ...buyerIds])]

    // Filter out null/undefined agent and broker IDs
    const agentIds = [...new Set(results.map(o => o.agentId).filter(Boolean) as string[])]
    const brokerIds = [...new Set(results.map(o => o.brokerId).filter(Boolean) as string[])]

    const [allAccounts, allLines, allAgents, allBrokers] = await Promise.all([
      accountIds.length > 0
        ? db.select().from(accounts).where(inArray(accounts.id, accountIds))
        : Promise.resolve([]),
      orderIds.length > 0
        ? db.select().from(orderLines).where(inArray(orderLines.orderId, orderIds))
        : Promise.resolve([]),
      agentIds.length > 0
        ? db.select().from(agents).where(inArray(agents.id, agentIds))
        : Promise.resolve([]),
      brokerIds.length > 0
        ? db.select().from(brokers).where(inArray(brokers.id, brokerIds))
        : Promise.resolve([])
    ])

    // Get products
    const productIds = [...new Set(allLines.map(l => l.productId))]
    const allProducts = productIds.length > 0
      ? await db.select().from(products).where(inArray(products.id, productIds))
      : []

    // Build lookup maps
    const accountsMap = new Map(allAccounts.map(a => [a.id, a]))
    const productsMap = new Map(allProducts.map(p => [p.id, p]))
    const agentsMap = new Map(allAgents.map(a => [a.id, a]))
    const brokersMap = new Map(allBrokers.map(b => [b.id, b]))
    const linesByOrderMap = new Map<string, any[]>()

    allLines.forEach(line => {
      if (!linesByOrderMap.has(line.orderId)) {
        linesByOrderMap.set(line.orderId, [])
      }
      const product = productsMap.get(line.productId)
      linesByOrderMap.get(line.orderId)!.push({
        id: line.id,
        productId: line.productId,
        productCode: product?.name || 'N/A',
        productDescription: [product?.variety, product?.grade].filter(Boolean).join(' - ') || line.sizeGrade || '',
        sizeGrade: line.sizeGrade,
        quantity: parseFloat(line.quantity),
        unitSize: parseFloat(line.unitSize),
        uom: line.uom,
        totalWeight: parseFloat(line.totalWeight),
        unitPrice: parseFloat(line.unitPrice),
        total: parseFloat(line.lineTotal),
        commissionPct: line.commissionPct ? parseFloat(line.commissionPct) : 0,
        commissionAmt: line.commissionAmt ? parseFloat(line.commissionAmt) : 0,
      })
    })

    // Format response to match invoices endpoint format
    const ordersWithDetails = results.map(order => {
      const seller = accountsMap.get(order.sellerId)
      const buyer = accountsMap.get(order.buyerId)
      const agent = order.agentId ? agentsMap.get(order.agentId) : null
      const broker = order.brokerId ? brokersMap.get(order.brokerId) : null

      return {
        id: order.id,
        orderNo: order.orderNo,
        qboDocNumber: order.qboDocNumber,
        qboDocId: order.qboDocId,
        orderDate: order.createdAt,
        status: order.status,
        sellerAccountId: order.sellerId,
        sellerAccountName: seller?.name || 'Unknown',
        sellerAccountCode: seller?.code || 'N/A',
        buyerAccountId: order.buyerId,
        buyerAccountName: buyer?.name || 'Unknown',
        buyerAccountCode: buyer?.code || 'N/A',
        totalAmount: parseFloat(order.totalAmount),
        agentId: order.agentId,
        agentName: agent?.name || '',
        brokerId: order.brokerId,
        brokerName: broker?.name || '',
        lines: linesByOrderMap.get(order.id) || [],
      }
    })

    return ordersWithDetails
  }

  async updateOrder(
    id: string,
    data: {
      sellerId?: string
      buyerId?: string
      sellerBillingAddressId?: string
      sellerPickupAddressId?: string
      buyerBillingAddressId?: string
      buyerShippingAddressId?: string
      isPickup?: boolean
      agentId?: string
      brokerId?: string
      contractNo?: string
      poNumber?: string
      contractId?: string
      terms?: string
      notes?: string
      memo?: string
      palletCount?: number
      status?: string
      lines?: any[]
    },
    userId?: string
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

    // Track what changed for activity log with detailed before/after values
    const changeDetails: Array<{ field: string; from: any; to: any }> = []
    const changeDescriptions: string[] = []

    if (data.sellerId && data.sellerId !== current.sellerId) {
      changeDetails.push({ field: 'sellerId', from: current.sellerId, to: data.sellerId })
      changeDescriptions.push('seller')
    }
    if (data.buyerId && data.buyerId !== current.buyerId) {
      changeDetails.push({ field: 'buyerId', from: current.buyerId, to: data.buyerId })
      changeDescriptions.push('buyer')
    }
    if (data.agentId !== undefined && data.agentId !== current.agentId) {
      changeDetails.push({ field: 'agentId', from: current.agentId, to: data.agentId })
      changeDescriptions.push('agent')
    }
    if (data.brokerId !== undefined && data.brokerId !== current.brokerId) {
      changeDetails.push({ field: 'brokerId', from: current.brokerId, to: data.brokerId })
      changeDescriptions.push('broker')
    }
    if (data.contractNo && data.contractNo !== current.contractNo) {
      changeDetails.push({ field: 'contractNo', from: current.contractNo || '(none)', to: data.contractNo })
      changeDescriptions.push(`contract # from "${current.contractNo || '(none)'}" to "${data.contractNo}"`)
    }
    if (data.poNumber !== undefined && data.poNumber !== current.poNumber) {
      changeDetails.push({ field: 'poNumber', from: current.poNumber || '(none)', to: data.poNumber || '(none)' })
      changeDescriptions.push(`PO # from "${current.poNumber || '(none)'}" to "${data.poNumber || '(none)'}"`)
    }
    if (data.terms && data.terms !== current.terms) {
      changeDetails.push({ field: 'terms', from: current.terms || '(none)', to: data.terms })
      changeDescriptions.push(`terms from "${current.terms || '(none)'}" to "${data.terms}"`)
    }
    if (data.notes && data.notes !== current.notes) {
      changeDetails.push({ field: 'notes', from: current.notes || '(none)', to: data.notes })
      changeDescriptions.push('notes')
    }
    if (data.status && data.status !== current.status) {
      changeDetails.push({ field: 'status', from: current.status, to: data.status })
      changeDescriptions.push(`status from "${current.status}" to "${data.status}"`)
    }
    if (data.lines) {
      changeDetails.push({ field: 'lines', from: current.lines?.length || 0, to: data.lines.length })
      changeDescriptions.push(`line items (${data.lines.length} items)`)
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

    // Log activity with detailed changes
    try {
      const changeDescription = changeDescriptions.length > 0
        ? `Order ${updated.orderNo} updated: ${changeDescriptions.join(', ')}`
        : `Order ${updated.orderNo} updated`

      await OrderActivityService.recordActivity({
        orderId: id,
        clerkUserId: userId,
        activityType: 'order_updated',
        description: changeDescription,
        changes: changeDetails.length > 0 ? changeDetails : undefined,
      })
    } catch (err) {
      logger.error('Failed to log order update activity:', err)
    }

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

  async getTermsOptions() {
    const terms = await db
      .select()
      .from(termsOptions)
      .where(eq(termsOptions.isActive, true))
      .orderBy(termsOptions.name)

    return terms
  }

  async getAllTermsOptions() {
    const terms = await db
      .select()
      .from(termsOptions)
      .orderBy(termsOptions.name)

    return terms
  }

  async createTermOption(data: { name: string; description?: string; isActive?: boolean }) {
    const [term] = await db
      .insert(termsOptions)
      .values({
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
      })
      .returning()

    logger.info(`Payment term created: ${term.name}`)
    return term
  }

  async updateTermOption(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const [term] = await db
      .update(termsOptions)
      .set({
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(termsOptions.id, id))
      .returning()

    if (!term) {
      throw new AppError('Payment term not found', 404)
    }

    logger.info(`Payment term updated: ${term.name}`)
    return term
  }

  async deleteTermOption(id: string) {
    const [term] = await db
      .delete(termsOptions)
      .where(eq(termsOptions.id, id))
      .returning()

    if (!term) {
      throw new AppError('Payment term not found', 404)
    }

    logger.info(`Payment term deleted: ${term.name}`)
    return { success: true }
  }

  // Attachment methods
  async uploadAttachment(orderId: string, file: Express.Multer.File, userId: string) {
    // Verify order exists
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
    if (!order) {
      throw new AppError('Order not found', 404)
    }

    // Upload to Cloudinary
    const cloudinaryService = new CloudinaryService()
    const key = `orders/${order.orderNo}/attachments/${Date.now()}-${file.originalname}`
    const fileUrl = await cloudinaryService.uploadFile(key, file.buffer, file.mimetype)

    // Save to database
    const [attachment] = await db
      .insert(orderAttachments)
      .values({
        orderId,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        fileType: file.mimetype,
        uploadedBy: userId,
      })
      .returning()

    logger.info(`Attachment uploaded for order ${orderId}: ${file.originalname}`)
    return attachment
  }

  async getAttachments(orderId: string) {
    const attachments = await db
      .select()
      .from(orderAttachments)
      .where(eq(orderAttachments.orderId, orderId))
      .orderBy(desc(orderAttachments.createdAt))

    return attachments
  }

  async deleteAttachment(id: string, userId: string) {
    const [attachment] = await db
      .select()
      .from(orderAttachments)
      .where(eq(orderAttachments.id, id))

    if (!attachment) {
      throw new AppError('Attachment not found', 404)
    }

    // Delete from S3
    try {
      const cloudinaryService = new CloudinaryService()
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}
      const urlParts = attachment.fileUrl.split('/kadouri-crm/')
      if (urlParts.length > 1) {
        const key = urlParts[1]
        await cloudinaryService.deleteFile(key)
      }
    } catch (error) {
      logger.error('Failed to delete file from Cloudinary:', error)
      // Continue with database deletion even if Cloudinary delete fails
    }

    // Delete from database
    await db.delete(orderAttachments).where(eq(orderAttachments.id, id))

    logger.info(`Attachment deleted: ${id} by user ${userId}`)
    return { success: true }
  }
}
