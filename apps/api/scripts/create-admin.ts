import { db } from '../src/db'
import { userInvitations } from '../src/db/schema'
import crypto from 'crypto'

async function createAdminInvitation() {
  const email = 'samverms@yahoo.com'
  const role = 'admin'
  const token = crypto.randomBytes(32).toString('hex')
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7)

  const [invitation] = await db
    .insert(userInvitations)
    .values({
      email,
      role,
      invitedBy: 'system',
      token,
      status: 'pending',
      expiresAt: expiryDate,
      resentCount: '0',
    })
    .returning()

  const invitationUrl = `${process.env.APP_URL || 'http://localhost:2500'}/accept-invitation?token=${token}`

  console.log('✅ Admin invitation created!')
  console.log(`📧 Email: ${email}`)
  console.log(`🔗 Invitation URL: ${invitationUrl}`)
  console.log(`\n⚠️  This link expires in 7 days`)

  process.exit(0)
}

createAdminInvitation().catch((error) => {
  console.error('❌ Error creating admin invitation:', error)
  process.exit(1)
})
