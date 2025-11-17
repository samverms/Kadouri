import { db } from './src/db/index'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

async function runMigration() {
  try {
    console.log('Running contracts migration...')

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'src/db/migrations/0003_add_contracts.sql'),
      'utf-8'
    )

    await db.execute(sql.raw(migrationSQL))

    console.log('✅ Contracts migration completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

runMigration()
