import { db } from './src/db'
import { sql } from 'drizzle-orm'

async function addAccountFields() {
  try {
    console.log('Adding account_type and broker_ids columns to accounts table...')

    // Add account_type column
    await db.execute(sql`
      ALTER TABLE accounts
      ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'both'
    `)
    console.log('✓ Added account_type column')

    // Add broker_ids column (text array)
    await db.execute(sql`
      ALTER TABLE accounts
      ADD COLUMN IF NOT EXISTS broker_ids TEXT[]
    `)
    console.log('✓ Added broker_ids column')

    console.log('\n✓ Migration complete!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

addAccountFields()
