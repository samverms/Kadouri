import { db } from './src/db'
import { sql } from 'drizzle-orm'

async function removeUnusedColumns() {
  try {
    console.log('Removing customer_service_id and back_office_id columns...')

    await db.execute(sql`ALTER TABLE accounts DROP COLUMN IF EXISTS customer_service_id`)
    console.log('✓ Removed customer_service_id column')

    await db.execute(sql`ALTER TABLE accounts DROP COLUMN IF EXISTS back_office_id`)
    console.log('✓ Removed back_office_id column')

    console.log('\n✓ Cleanup complete!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

removeUnusedColumns()
