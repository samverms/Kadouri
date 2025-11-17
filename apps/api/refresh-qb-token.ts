import { db } from './src/db'
import { quickbooksTokens } from './src/db/schema'
import OAuthClient from 'intuit-oauth'
import { eq } from 'drizzle-orm'

async function refreshToken() {
  try {
    const [tokenRecord] = await db.select().from(quickbooksTokens).limit(1)

    if (!tokenRecord) {
      console.error('No QuickBooks tokens found in database')
      console.log('Please re-authenticate at: http://localhost:2000/api/quickbooks/connect')
      process.exit(1)
    }

    const oauthClient = new OAuthClient({
      clientId: process.env.QBO_CLIENT_ID || '',
      clientSecret: process.env.QBO_CLIENT_SECRET || '',
      environment: (process.env.QBO_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      redirectUri: process.env.QBO_REDIRECT_URI || '',
    })

    oauthClient.setToken({
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken,
      token_type: 'bearer',
      expires_in: 3600,
    })

    console.log('Refreshing QuickBooks access token...')

    const authResponse = await oauthClient.refresh()
    const newTokens = authResponse.token

    console.log('Token refreshed successfully')

    // Update database with new tokens
    await db
      .update(quickbooksTokens)
      .set({
        accessToken: newTokens.access_token || tokenRecord.accessToken,
        refreshToken: newTokens.refresh_token || tokenRecord.refreshToken,
        expiresAt: new Date(Date.now() + ((newTokens.expires_in || 3600) * 1000)),
        updatedAt: new Date(),
      })
      .where(eq(quickbooksTokens.id, tokenRecord.id))

    console.log('✅ Tokens updated in database')
    console.log('New access token expires at:', new Date(Date.now() + ((newTokens.expires_in || 3600) * 1000)))

    process.exit(0)
  } catch (error: any) {
    console.error('❌ Failed to refresh token:', error.message)

    if (error.authResponse) {
      console.error('Auth response:', JSON.stringify(error.authResponse, null, 2))
    }

    console.log('\n⚠️  Refresh token may be expired. Please re-authenticate at:')
    console.log('   http://localhost:2000/api/quickbooks/connect')

    process.exit(1)
  }
}

refreshToken()
