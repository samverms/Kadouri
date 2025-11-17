import { db } from './src/db'
import { orders } from './src/db/schema'
import { eq, or, isNull } from 'drizzle-orm'

async function createInvoicesInDB() {
  try {
    // Get 3 draft orders
    const draftOrders = await db
      .select()
      .from(orders)
      .where(or(eq(orders.qboDocType, 'draft'), isNull(orders.qboDocType)))
      .limit(3)

    console.log(`Found ${draftOrders.length} draft orders`)

    const today = new Date()

    for (const order of draftOrders) {
      // Generate a fake QB invoice number (high number to avoid conflicts)
      const qboDocNumber = String(50000 + Math.floor(Math.random() * 10000))
      const qboDocId = String(Math.floor(Math.random() * 1000000))

      await db
        .update(orders)
        .set({
          qboDocType: 'invoice',
          qboDocNumber: qboDocNumber,
          qboDocId: qboDocId,
          status: 'posted_to_qb',
          createdAt: today, // Set to TODAY
          updatedAt: today,
        })
        .where(eq(orders.id, order.id))

      console.log(`✅ Created invoice for order ${order.orderNo} with QB# ${qboDocNumber} dated ${today.toISOString().split('T')[0]}`)
    }

    console.log('\n✅ Successfully created 3 invoices with today\'s date!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createInvoicesInDB()
