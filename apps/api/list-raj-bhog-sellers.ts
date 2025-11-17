import { db } from './src/db/index.js'
import { orders, accounts } from './src/db/schema/index.js'
import { eq, sql } from 'drizzle-orm'

async function listRajBhogSellers() {
  console.log('\n=== Raj Bhog Foods - All Sellers ===\n')

  // Find Raj Bhog account
  const rajBhog = await db.select().from(accounts).where(sql`${accounts.name} ILIKE '%raj bhog%'`)

  if (rajBhog.length === 0) {
    console.log('❌ Raj Bhog Foods not found in database')
    process.exit(1)
  }

  console.log(`Raj Bhog Account: ${rajBhog[0].name} (ID: ${rajBhog[0].id})`)
  console.log(`Account Type: ${rajBhog[0].type}\n`)

  // Get all orders where Raj Bhog is the BUYER
  const buyerOrders = await db.select()
  .from(orders)
  .where(eq(orders.buyerId, rajBhog[0].id))

  console.log(`📋 Total orders where Raj Bhog is BUYER: ${buyerOrders.length}\n`)

  // Group by seller
  const sellerMap = new Map<string, any[]>()

  for (const order of buyerOrders) {
    if (!sellerMap.has(order.sellerId)) {
      sellerMap.set(order.sellerId, [])
    }
    sellerMap.get(order.sellerId)!.push(order)
  }

  console.log(`👥 Unique sellers: ${sellerMap.size}\n`)

  // Get seller details and display
  for (const [sellerId, sellerOrders] of sellerMap.entries()) {
    const seller = await db.select().from(accounts).where(eq(accounts.id, sellerId))

    if (seller.length > 0) {
      console.log(`\n🏢 SELLER: ${seller[0].name}`)
      console.log(`   Type: ${seller[0].type}`)
      console.log(`   ID: ${seller[0].id}`)
      console.log(`   Orders from this seller: ${sellerOrders.length}`)

      const totalAmount = sellerOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0)
      console.log(`   Total purchases: $${totalAmount.toFixed(2)}`)

      console.log(`\n   Orders:`)
      for (const order of sellerOrders) {
        console.log(`     • ${order.orderNo} (Invoice: ${order.qboDocNumber}) - $${order.totalAmount} - ${order.orderDate}`)
      }
    }
  }

  console.log('\n')
  process.exit(0)
}

listRajBhogSellers()
