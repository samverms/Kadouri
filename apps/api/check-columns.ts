import { db } from './src/db'
import { sql } from 'drizzle-orm'

async function checkColumns() {
  try {
    const result = await db.execute(
      sql`SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = 'accounts'
          ORDER BY ordinal_position`
    )

    console.log('Accounts table columns:')
    result.forEach((r: any) => {
      console.log(`  - ${r.column_name} (${r.data_type})`)
    })

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkColumns()
