import { db } from './src/db'
import { sql } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  try {
    console.log('Reading migration file...')
    const migrationPath = path.join(__dirname, 'src/db/migrations/add-team-tracking-columns.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('Executing migration...')
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 80)}...`)
      await db.execute(sql.raw(statement))
    }

    console.log('✓ Migration completed successfully!')
    console.log('\nAdded columns:')
    console.log('  - accounts: sales_agent_id, customer_service_id, back_office_id, updated_by')
    console.log('  - addresses: updated_by')
    console.log('  - contacts: updated_by')
    console.log('  - orders: sales_agent_id, updated_by')

    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
