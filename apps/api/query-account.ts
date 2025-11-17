import { db } from './src/db/index.js'
import { accounts } from './src/db/schema/index.js'
import { eq } from 'drizzle-orm'

async function query() {
  const snacks = await db.select().from(accounts).where(eq(accounts.code, '1S740'))
  console.log('180 Snacks:', snacks[0])

  if (snacks[0]?.parentAccountId) {
    const parent = await db.select().from(accounts).where(eq(accounts.id, snacks[0].parentAccountId))
    console.log('\nParent Account:', parent[0])
  }

  process.exit(0)
}

query()
