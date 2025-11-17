import { Router } from 'express'
import { db } from '../../db'
import { orders, orderLines, accounts, products } from '../../db/schema'
import { eq, desc, or, ilike, and, sql, inArray } from 'drizzle-orm'

const router = Router()

// GET /api/invoices - List all invoices
router.get('/', async (req, res, next) => {
  try {
    const { search, limit = '100', offset = '0', accountId, productId } = req.query

    // Build where conditions
    const conditions = [eq(orders.qboDocType, 'invoice')]

    if (search) {
      const searchStr = `%${search}%`
      conditions.push(
        or(
          ilike(orders.orderNo, searchStr),
          ilike(orders.qboDocNumber, searchStr)
        )!
      )
    }

    // Filter by account ID (either seller or buyer)
    if (accountId) {
      conditions.push(
        or(
          eq(orders.sellerId, accountId as string),
          eq(orders.buyerId, accountId as string)
        )!
      )
    }

    // Fetch invoices
    const results = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))

    if (results.length === 0) {
      return res.json([])
    }

    // Get all related data
    const orderIds = results.map(o => o.id)
    const sellerIds = [...new Set(results.map(o => o.sellerId).filter(Boolean))]
    const buyerIds = [...new Set(results.map(o => o.buyerId).filter(Boolean))]
    const accountIds = [...new Set([...sellerIds, ...buyerIds])]

    const [allAccounts, allLines] = await Promise.all([
      accountIds.length > 0
        ? db.select().from(accounts).where(inArray(accounts.id, accountIds))
        : Promise.resolve([]),
      orderIds.length > 0
        ? db.select().from(orderLines).where(inArray(orderLines.orderId, orderIds))
        : Promise.resolve([])
    ])

    // If filtering by productId, filter results to only orders containing that product
    let filteredResults = results
    if (productId) {
      const orderIdsWithProduct = [...new Set(allLines
        .filter(line => line.productId === productId)
        .map(line => line.orderId))]
      filteredResults = results.filter(order => orderIdsWithProduct.includes(order.id))
    }

    // Get products
    const productIds = [...new Set(allLines.map(l => l.productId))]
    const allProducts = productIds.length > 0
      ? await db.select().from(products).where(inArray(products.id, productIds))
      : []

    // Build lookup maps
    const accountsMap = new Map(allAccounts.map(a => [a.id, a]))
    const productsMap = new Map(allProducts.map(p => [p.id, p]))
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

    // Format response
    const invoices = filteredResults.map(invoice => {
      const seller = accountsMap.get(invoice.sellerId)
      const buyer = accountsMap.get(invoice.buyerId)

      return {
        id: invoice.id,
        orderNo: invoice.orderNo,
        qboDocNumber: invoice.qboDocNumber,
        qboDocId: invoice.qboDocId,
        orderDate: invoice.createdAt,
        status: invoice.status,
        sellerAccountId: invoice.sellerId,
        sellerAccountName: seller?.name || 'Unknown',
        sellerAccountCode: seller?.code || 'N/A',
        buyerAccountId: invoice.buyerId,
        buyerAccountName: buyer?.name || 'Unknown',
        buyerAccountCode: buyer?.code || 'N/A',
        totalAmount: parseFloat(invoice.totalAmount),
        agentId: invoice.createdBy,
        agentName: invoice.createdBy || 'Unknown',
        lines: linesByOrderMap.get(invoice.id) || [],
      }
    })

    res.json(invoices)
  } catch (error) {
    next(error)
  }
})

// GET /api/invoices/:id - Get single invoice
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const [invoice] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.qboDocType, 'invoice')))
      .limit(1)

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    // Get related data
    const [seller, buyer, lines] = await Promise.all([
      db.select().from(accounts).where(eq(accounts.id, invoice.sellerId)).limit(1),
      db.select().from(accounts).where(eq(accounts.id, invoice.buyerId)).limit(1),
      db.select().from(orderLines).where(eq(orderLines.orderId, id))
    ])

    // Get products
    const productIds = lines.map(l => l.productId)
    const lineProducts = productIds.length > 0
      ? await db.select().from(products).where(inArray(products.id, productIds))
      : []

    const productsMap = new Map(lineProducts.map(p => [p.id, p]))

    const response = {
      id: invoice.id,
      orderNo: invoice.orderNo,
      qboDocNumber: invoice.qboDocNumber,
      qboDocId: invoice.qboDocId,
      orderDate: invoice.createdAt,
      status: invoice.status,
      seller: seller[0],
      buyer: buyer[0],
      totalAmount: parseFloat(invoice.totalAmount),
      lines: lines.map(line => {
        const product = productsMap.get(line.productId)
        return {
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
        }
      })
    }

    res.json(response)
  } catch (error) {
    next(error)
  }
})

export default router
