import { db } from './src/db'
import { quickbooksTokens } from './src/db/schema'
import { eq } from 'drizzle-orm'

async function reactivate() {
  console.log('Reactivating QuickBooks token...')

  const result = await db
    .update(quickbooksTokens)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(quickbooksTokens.realmId, '9341455711675819'))
    .returning()

  console.log('Update result:', result)

  // Verify
  const token = await db.query.quickbooksTokens.findFirst({
    where: (tokens) => eq(tokens.isActive, true)
  })

  if (token) {
    console.log('✅ Token is now ACTIVE')
    console.log('Realm ID:', token.realmId)
    console.log('Access expires:', token.expiresAt)
    console.log('Refresh expires:', token.refreshTokenExpiresAt)
  } else {
    console.log('❌ Token is still INACTIVE')
  }

  process.exit(0)
}

reactivate().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
