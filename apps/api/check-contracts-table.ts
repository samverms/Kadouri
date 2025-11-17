import { db } from './src/db/index'
import { sql } from 'drizzle-orm'

async function checkTable() {
  try {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'contracts'
    `)
    console.log('Contracts table exists:', result.length > 0)
    console.log(result)
  } catch (error) {
    console.error('Error:', error)
  }
  process.exit(0)
}

checkTable()
