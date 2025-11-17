import { db } from '../db/index.js'
import { orders, orderLines, accounts, contacts, addresses } from '../db/schema/index.js'
import { sql } from 'drizzle-orm'

async function cleanAllData() {
  console.log('🧹 Cleaning all data from database...\n')

  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting order lines...')
    await db.delete(orderLines)

    console.log('Deleting orders...')
    await db.delete(orders)

    console.log('Deleting contacts...')
    await db.delete(contacts)

    console.log('Deleting addresses...')
    await db.delete(addresses)

    console.log('Deleting accounts...')
    await db.delete(accounts)

    console.log('\n✅ All data cleaned successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error cleaning data:', error)
    process.exit(1)
  }
}

cleanAllData()
