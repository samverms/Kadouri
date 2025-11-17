#!/usr/bin/env tsx
import { db } from './src/db'
import { orders } from './src/db/schema'
import { sql } from 'drizzle-orm'

async function deleteTestOrders() {
  console.log('🗑️  Deleting all existing imported orders (ORD-* prefix)...')

  // Delete all orders with ORD- prefix (imported from CSV)
  const deletedOrders = await db.delete(orders)
    .where(sql`${orders.orderNo} LIKE 'ORD-%'`)
    .returning()

  console.log(`  ✅ Deleted ${deletedOrders.length} orders`)
  console.log('\n✅ Cleanup complete!')
}

deleteTestOrders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
