import { db } from './src/db/index.js'
import { orders, orderLines, accounts } from './src/db/schema/index.js'
import { eq, sql, or, and } from 'drizzle-orm'

async function showCompanyTransactions() {
  const companyNames = [
    'Sam\'s International',
    'Raj Bhog Foods',
    '180 Snacks',
    'A-1 Bakery Supply',
    'C S Beyond'
  ]

  console.log('\n=== FULL TRANSACTION DETAILS FOR COMPANIES ===\n')

  for (const companyName of companyNames) {
    console.log('═'.repeat(80))
    console.log(`COMPANY: ${companyName}`)
    console.log('═'.repeat(80))

    const account = await db.select().from(accounts)
      .where(sql`${accounts.name} ILIKE ${`%${companyName}%`}`)
      .limit(1)

    if (account.length === 0) {
      console.log(`❌ Company not found\n`)
      continue
    }

    const companyId = account[0].id
    console.log(`Account ID: ${companyId}`)
    console.log(`Account Type: ${account[0].type || 'N/A'}`)
    console.log(`Address: ${account[0].address || 'N/A'}`)
    console.log(`City: ${account[0].city || 'N/A'}, ${account[0].state || 'N/A'} ${account[0].zipCode || ''}`)

    // Get all orders where this company is SELLER
    const asSellerOrders = await db.select()
      .from(orders)
      .where(eq(orders.sellerId, companyId))

    if (asSellerOrders.length > 0) {
      console.log('\n' + '─'.repeat(80))
      console.log(`📤 AS SELLER (${asSellerOrders.length} orders)`)
      console.log('─'.repeat(80))

      // Group by buyer
      const buyerGroups = new Map<string, typeof asSellerOrders>()
      for (const order of asSellerOrders) {
        if (!buyerGroups.has(order.buyerId)) {
          buyerGroups.set(order.buyerId, [])
        }
        buyerGroups.get(order.buyerId)!.push(order)
      }

      for (const [buyerId, buyerOrders] of buyerGroups.entries()) {
        const buyer = await db.select().from(accounts).where(eq(accounts.id, buyerId)).limit(1)
        const buyerName = buyer.length > 0 ? buyer[0].name : 'Unknown'

        console.log(`\n  → BUYER: ${buyerName}`)
        console.log(`     Orders: ${buyerOrders.length}`)

        let totalSales = 0
        for (const order of buyerOrders) {
          const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, order.id))

          console.log(`\n     Order: ${order.orderNo}`)
          console.log(`     Date: ${order.orderDate}`)
          console.log(`     Invoice: ${order.qboDocNumber || 'N/A'}`)
          console.log(`     Status: ${order.status}`)
          console.log(`     Total: $${order.totalAmount}`)

          if (lines.length > 0) {
            console.log(`     Line Items:`)
            for (const line of lines) {
              console.log(`       - ${line.description || line.productName || 'N/A'}: ${line.quantity} x $${line.unitPrice} = $${line.totalPrice}`)
            }
          }

          totalSales += parseFloat(order.totalAmount || '0')
        }

        console.log(`\n     TOTAL SALES TO ${buyerName.toUpperCase()}: $${totalSales.toFixed(2)}`)
      }
    }

    // Get all orders where this company is BUYER
    const asBuyerOrders = await db.select()
      .from(orders)
      .where(eq(orders.buyerId, companyId))

    if (asBuyerOrders.length > 0) {
      console.log('\n' + '─'.repeat(80))
      console.log(`📥 AS BUYER (${asBuyerOrders.length} orders)`)
      console.log('─'.repeat(80))

      // Group by seller
      const sellerGroups = new Map<string, typeof asBuyerOrders>()
      for (const order of asBuyerOrders) {
        if (!sellerGroups.has(order.sellerId)) {
          sellerGroups.set(order.sellerId, [])
        }
        sellerGroups.get(order.sellerId)!.push(order)
      }

      for (const [sellerId, sellerOrders] of sellerGroups.entries()) {
        const seller = await db.select().from(accounts).where(eq(accounts.id, sellerId)).limit(1)
        const sellerName = seller.length > 0 ? seller[0].name : 'Unknown'

        console.log(`\n  ← SELLER: ${sellerName}`)
        console.log(`     Orders: ${sellerOrders.length}`)

        let totalPurchases = 0
        for (const order of sellerOrders) {
          const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, order.id))

          console.log(`\n     Order: ${order.orderNo}`)
          console.log(`     Date: ${order.orderDate}`)
          console.log(`     Invoice: ${order.qboDocNumber || 'N/A'}`)
          console.log(`     Status: ${order.status}`)
          console.log(`     Total: $${order.totalAmount}`)

          if (lines.length > 0) {
            console.log(`     Line Items:`)
            for (const line of lines) {
              console.log(`       - ${line.description || line.productName || 'N/A'}: ${line.quantity} x $${line.unitPrice} = $${line.totalPrice}`)
            }
          }

          totalPurchases += parseFloat(order.totalAmount || '0')
        }

        console.log(`\n     TOTAL PURCHASES FROM ${sellerName.toUpperCase()}: $${totalPurchases.toFixed(2)}`)
      }
    }

    if (asSellerOrders.length === 0 && asBuyerOrders.length === 0) {
      console.log('\n❌ No transactions found for this company')
    }

    console.log('\n')
  }

  console.log('═'.repeat(80))
  console.log('END OF REPORT')
  console.log('═'.repeat(80))
  console.log('\n')

  process.exit(0)
}

showCompanyTransactions()
