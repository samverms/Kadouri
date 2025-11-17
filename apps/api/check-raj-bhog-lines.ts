import { db } from './src/db/index.js'
import { orders, accounts, orderLines, products } from './src/db/schema/index.js'
import { eq, sql } from 'drizzle-orm'

async function checkRajBhogLines() {
  const rajBhog = await db.select().from(accounts).where(sql`${accounts.name} ILIKE '%raj bhog%'`)

  if (rajBhog.length > 0) {
    const allOrders = await db.select().from(orders).where(eq(orders.buyerId, rajBhog[0].id))

    console.log(`\n=== Raj Bhog Foods Orders with Line Items ===\n`)

    for (const order of allOrders) {
      const lines = await db.select({
        lineNo: orderLines.lineNo,
        productId: orderLines.productId,
        description: orderLines.sizeGrade,
        quantity: orderLines.quantity,
        unitPrice: orderLines.unitPrice,
        lineTotal: orderLines.lineTotal
      })
      .from(orderLines)
      .where(eq(orderLines.orderId, order.id))
      .orderBy(orderLines.lineNo)

      console.log(`Order ${order.orderNo} (Invoice: ${order.qboDocNumber})`)
      console.log(`  Total line items: ${lines.length}`)

      if (lines.length > 0) {
        console.log(`  Line items:`)
        for (const line of lines) {
          console.log(`    ${line.lineNo}. ${line.description?.substring(0, 60) || 'N/A'}`)
          console.log(`       Qty: ${line.quantity}, Price: $${line.unitPrice}, Total: $${line.lineTotal}`)
        }
      } else {
        console.log(`  ⚠️  NO LINE ITEMS FOUND!`)
      }
      console.log()
    }
  }

  process.exit(0)
}

checkRajBhogLines()
