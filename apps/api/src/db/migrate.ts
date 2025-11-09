import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../config'

const runMigrations = async () => {
  const sql = postgres(config.database.url, { max: 1 })
  const db = drizzle(sql)

  console.log('Running migrations...')

  await migrate(db, { migrationsFolder: './src/db/migrations' })

  console.log('Migrations completed successfully!')

  await sql.end()
  process.exit(0)
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
