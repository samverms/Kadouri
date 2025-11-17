import { db } from './src/db/index.js'
import { accounts, orders } from './src/db/schema/index.js'
import { eq, sql } from 'drizzle-orm'

async function checkData() {
  console.log('\n=== Checking Data Structure ===\n')

  // Check Raj Bhog Foods
  const rajBhog = await db.select().from(accounts).where(sql`${accounts.name} ILIKE '%raj bhog%'`)
  console.log('Raj Bhog Foods account:', rajBhog[0]?.name, rajBhog[0]?.code)

  if (rajBhog.length > 0) {
    // Get children of Raj Bhog
    const children = await db.select().from(accounts).where(eq(accounts.parentAccountId, rajBhog[0].id))
    console.log(`\nChildren of Raj Bhog (${children.length} total):`)
    children.slice(0, 10).forEach(c => console.log(`  - ${c.name} (${c.code})`))
    if (children.length > 10) console.log(`  ... and ${children.length - 10} more`)

    // Check if 180 Snacks is a child
    const snacks = children.find(c => c.name.includes('180'))
    console.log(`\n180 Snacks is ${snacks ? '' : 'NOT '}a child of Raj Bhog`)

    // Get orders for Raj Bhog
    const rajOrders = await db.select().from(orders).where(eq(orders.buyerId, rajBhog[0].id)).limit(5)
    console.log(`\nOrders for Raj Bhog: ${rajOrders.length} (showing first 5)`)
    rajOrders.forEach(o => console.log(`  - ${o.orderNo} - Invoice: ${o.qboDocNumber || 'N/A'}`))
  }

  // Check 180 Snacks
  console.log('\n\n=== 180 Snacks ===')
  const snacks180 = await db.select().from(accounts).where(sql`${accounts.name} ILIKE '%180 snacks%'`)
  if (snacks180.length > 0) {
    console.log('Account:', snacks180[0].name, snacks180[0].code)
    console.log('Parent ID:', snacks180[0].parentAccountId)

    if (snacks180[0].parentAccountId) {
      const parent = await db.select().from(accounts).where(eq(accounts.id, snacks180[0].parentAccountId))
      console.log('Parent Account:', parent[0]?.name)
    }

    // Get orders
    const snacksOrders = await db.select().from(orders).where(eq(orders.buyerId, snacks180[0].id)).limit(5)
    console.log(`\nOrders for 180 Snacks: ${snacksOrders.length}`)
    snacksOrders.forEach(o => console.log(`  - ${o.orderNo} - Invoice: ${o.qboDocNumber || 'N/A'}`))
  }

  process.exit(0)
}

checkData()
