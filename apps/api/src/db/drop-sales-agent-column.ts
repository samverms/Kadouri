import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL!)

async function dropSalesAgentColumn() {
  try {
    console.log('Dropping sales_agent_id column from orders table...')
    await sql`ALTER TABLE orders DROP COLUMN IF EXISTS sales_agent_id`
    console.log('✓ Column sales_agent_id dropped successfully')
    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('Error dropping column:', error)
    await sql.end()
    process.exit(1)
  }
}

dropSalesAgentColumn()
