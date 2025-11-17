import { db } from './src/db/index.js'
import { orderLines, orders, accounts, products, addresses, contacts } from './src/db/schema/index.js'
import { sql } from 'drizzle-orm'

async function cleanAllData() {
  console.log('\n🗑️  Cleaning all data from database...\n')

  try {
    // Delete in correct order due to foreign keys
    console.log('  Deleting order lines...')
    await db.delete(orderLines)

    console.log('  Deleting orders...')
    await db.delete(orders)

    console.log('  Deleting products...')
    await db.delete(products)

    console.log('  Deleting addresses...')
    await db.delete(addresses)

    console.log('  Deleting contacts...')
    await db.delete(contacts)

    console.log('  Deleting accounts...')
    await db.delete(accounts)

    console.log('\n✅ All data cleaned successfully!')

  } catch (error) {
    console.error('❌ Error cleaning data:', error)
    throw error
  }

  process.exit(0)
}

cleanAllData()
