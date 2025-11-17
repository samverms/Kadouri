import { db } from './src/db'
import { orders } from './src/db/schema'
import { eq } from 'drizzle-orm'

async function check() {
  const invoices = await db
    .select()
    .from(orders)
    .where(eq(orders.qboDocType, 'invoice'))

  console.log('Invoices in database:', invoices.length)

  invoices.forEach(inv => {
    console.log(`Order: ${inv.orderNo} | QB Invoice: #${inv.qboDocNumber} | Total: $${inv.totalAmount}`)
  })

  console.log('\n---\n')

  // Check the 3 specific orders
  const orderIds = [
    'be3bda90-10c7-4bbf-827a-1675eec837c2',
    '34c978e8-e32d-4433-92cb-3b7c2b2686ee',
    '392f8e66-d8ab-4538-ba3f-2fd0255ec994'
  ]

  for (const id of orderIds) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id))

    if (order) {
      console.log(`Order: ${order.orderNo}`)
      console.log(`  qboDocType: ${order.qboDocType}`)
      console.log(`  qboDocId: ${order.qboDocId}`)
      console.log(`  qboDocNumber: ${order.qboDocNumber}`)
      console.log(`  status: ${order.status}`)
      console.log('')
    }
  }

  process.exit(0)
}

check()
