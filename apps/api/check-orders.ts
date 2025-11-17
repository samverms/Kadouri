import { db } from './src/db/index.js'
import { accounts, orders } from './src/db/schema/index.js'
import { eq, sql } from 'drizzle-orm'

async function checkOrders() {
  console.log('\n=== Checking Order Relationships ===\n')

  // Find 180 Snacks
  const snacks = await db.select().from(accounts).where(sql`${accounts.name} ILIKE '%180 snacks%'`)
  console.log('180 Snacks account:', snacks[0])

  if (snacks.length > 0) {
    // Get orders where 180 Snacks is the BUYER
    const asBuyer = await db.select().from(orders).where(eq(orders.buyerId, snacks[0].id)).limit(3)
    console.log(`\n180 Snacks as BUYER (${asBuyer.length} orders):`)
    for (const order of asBuyer) {
      const seller = await db.select().from(accounts).where(eq(accounts.id, order.sellerId))
      console.log(`  Order ${order.orderNo} - Seller: ${seller[0]?.name}`)
    }

    // Get orders where 180 Snacks is the SELLER
    const asSeller = await db.select().from(orders).where(eq(orders.sellerId, snacks[0].id)).limit(3)
    console.log(`\n180 Snacks as SELLER (${asSeller.length} orders):`)
    for (const order of asSeller) {
      const buyer = await db.select().from(accounts).where(eq(accounts.id, order.buyerId))
      console.log(`  Order ${order.orderNo} - Buyer: ${buyer[0]?.name}`)
    }
  }

  // Find Raj Bhog
  const rajBhog = await db.select().from(accounts).where(sql`${accounts.name} ILIKE '%raj bhog%'`)
  console.log('\n\nRaj Bhog Foods account:', rajBhog[0])

  if (rajBhog.length > 0) {
    // Get orders where Raj Bhog is the BUYER
    const asBuyer = await db.select().from(orders).where(eq(orders.buyerId, rajBhog[0].id)).limit(3)
    console.log(`\nRaj Bhog as BUYER (${asBuyer.length} orders):`)
    for (const order of asBuyer) {
      const seller = await db.select().from(accounts).where(eq(accounts.id, order.sellerId))
      console.log(`  Order ${order.orderNo} - Seller: ${seller[0]?.name}`)
    }

    // Get orders where Raj Bhog is the SELLER
    const asSeller = await db.select().from(orders).where(eq(orders.sellerId, rajBhog[0].id)).limit(3)
    console.log(`\nRaj Bhog as SELLER (${asSeller.length} orders):`)
    for (const order of asSeller) {
      const buyer = await db.select().from(accounts).where(eq(accounts.id, order.buyerId))
      console.log(`  Order ${order.orderNo} - Buyer: ${buyer[0]?.name}`)
    }
  }

  process.exit(0)
}

checkOrders()
