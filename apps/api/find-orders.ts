import { db } from './src/db'
import { orders } from './src/db/schema'
import { isNull } from 'drizzle-orm'

async function findOrders() {
  const result = await db.select().from(orders).where(isNull(orders.qboDocId)).limit(5)

  console.log('Available Orders (not yet synced to QB):')
  console.log('')

  result.forEach((o, i) => {
    console.log(`${i+1}. Order: ${o.orderNo}`)
    console.log(`   ID: ${o.id}`)
    console.log(`   Total: $${o.totalAmount}`)
    console.log(`   Status: ${o.status}`)
    console.log('')
  })

  process.exit(0)
}

findOrders()
