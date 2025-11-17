import { db } from './src/db'
import { sql } from 'drizzle-orm'

async function addMissingColumn() {
  try {
    await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sales_agent_id VARCHAR(255)`)
    console.log('✓ Added sales_agent_id column to accounts table')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

addMissingColumn()
