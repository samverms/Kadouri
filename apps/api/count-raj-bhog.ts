import { db } from './src/db/index.js'
import { orders, accounts } from './src/db/schema/index.js'
import { eq, sql } from 'drizzle-orm'

async function countRajBhog() {
  const rajBhog = await db.select().from(accounts).where(sql`${accounts.name} ILIKE '%raj bhog%'`)

  if (rajBhog.length > 0) {
    const allOrders = await db.select().from(orders).where(eq(orders.buyerId, rajBhog[0].id))
    console.log(`Total Raj Bhog orders in database: ${allOrders.length}`)
    console.log('\nOrder numbers:')
    allOrders.forEach(o => console.log(`  - ${o.orderNo} (Invoice: ${o.qboDocNumber || 'N/A'})`))
  } else {
    console.log('Raj Bhog Foods not found')
  }

  process.exit(0)
}

countRajBhog()
