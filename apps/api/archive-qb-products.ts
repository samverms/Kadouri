import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { products } from './src/db/schema'
import { config } from './src/config'

const sql = postgres(config.database.url, { max: 1 })
const db = drizzle(sql)

async function archiveQBProducts() {
  try {
    console.log('Starting to archive QuickBooks products...')

    // Update all existing products to mark them as QB imports and inactive
    const result = await db
      .update(products)
      .set({
        source: 'quickbooks_import',
        active: false,
        archivedAt: new Date(),
        archivedBy: 'system',
        updatedAt: new Date(),
      })
      .returning()

    console.log(`✅ Archived ${result.length} QuickBooks products`)
    console.log('Products are now marked as:')
    console.log('  - source: "quickbooks_import"')
    console.log('  - active: false')
    console.log('  - archivedAt: current timestamp')
    console.log('  - archivedBy: "system"')
    console.log('\nThese products will no longer appear in dropdowns but remain in the database for historical orders.')

  } catch (error) {
    console.error('Error archiving products:', error)
    throw error
  } finally {
    await sql.end()
  }
}

archiveQBProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed:', err)
    process.exit(1)
  })
