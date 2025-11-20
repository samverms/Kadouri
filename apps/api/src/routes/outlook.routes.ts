import { Router } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { db } from '../db'
import { outlookTokens } from '../db/schema'
import { eq } from 'drizzle-orm'
import axios from 'axios'
import { logger } from '../utils/logger'

const router = Router()

// Microsoft OAuth configuration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || ''
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || ''
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:2000/api/outlook/callback'
const MICROSOFT_SCOPES = 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access'

// Get connection status
router.get('/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const [token] = await db
      .select({
        email: outlookTokens.email,
        expiresAt: outlookTokens.expiresAt,
      })
      .from(outlookTokens)
      .where(eq(outlookTokens.userId, userId))

    if (!token) {
      return res.json({ connected: false })
    }

    const isExpired = new Date(token.expiresAt) < new Date()

    res.json({
      connected: true,
      email: token.email,
      expiresAt: token.expiresAt,
      isExpired,
    })
  } catch (error: any) {
    logger.error('Failed to get Outlook status', error)
    res.status(500).json({ error: 'Failed to get connection status' })
  }
})

// Initiate OAuth flow
router.get('/connect', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Build authorization URL
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
    authUrl.searchParams.append('client_id', MICROSOFT_CLIENT_ID)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('redirect_uri', MICROSOFT_REDIRECT_URI)
    authUrl.searchParams.append('scope', MICROSOFT_SCOPES)
    authUrl.searchParams.append('response_mode', 'query')
    authUrl.searchParams.append('state', userId) // Pass Clerk user ID as state

    res.redirect(authUrl.toString())
  } catch (error: any) {
    logger.error('Failed to initiate Outlook OAuth', error)
    res.status(500).json({ error: 'Failed to initiate connection' })
  }
})

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId, error } = req.query

    if (error) {
      logger.error('Outlook OAuth error', { error })
      return res.send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">✗ Connection Failed</h1>
            <p>Error: ${error}</p>
            <p>You can close this window and try again.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `)
    }

    if (!code || !userId) {
      return res.status(400).send('Missing code or state')
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        code: code as string,
        redirect_uri: MICROSOFT_REDIRECT_URI,
        grant_type: 'authorization_code',
        scope: MICROSOFT_SCOPES,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const { access_token, refresh_token, expires_in } = tokenResponse.data

    // Get user's email from Microsoft Graph
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const userEmail = userResponse.data.mail || userResponse.data.userPrincipalName

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expires_in * 1000)

    // Store tokens in database (upsert)
    await db
      .insert(outlookTokens)
      .values({
        userId: userId as string,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        email: userEmail,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: outlookTokens.userId,
        set: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          email: userEmail,
          updatedAt: new Date(),
        },
      })

    logger.info(`Outlook connected successfully for user ${userId}`)

    res.send(`
      <html>
        <head><title>Outlook Connected</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #2ca01c;">✓ Outlook Connected Successfully!</h1>
          <p>Account: ${userEmail}</p>
          <p>You can now close this window and return to Kadouri CRM.</p>
          <script>
            // Notify parent window
            if (window.opener) {
              window.opener.postMessage({ type: 'OUTLOOK_CONNECTED', success: true }, '*');
            }
            // Auto-close after 2 seconds
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `)
  } catch (error: any) {
    logger.error('Failed to complete Outlook OAuth', {
      error: error.response?.data || error.message,
    })
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #dc2626;">✗ Connection Failed</h1>
          <p>${error.message}</p>
          <p>You can close this window and try again.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `)
  }
})

// Disconnect Outlook
router.delete('/disconnect', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await db.delete(outlookTokens).where(eq(outlookTokens.userId, userId))

    logger.info(`Outlook disconnected for user ${userId}`)

    res.json({ success: true })
  } catch (error: any) {
    logger.error('Failed to disconnect Outlook', error)
    res.status(500).json({ error: 'Failed to disconnect' })
  }
})

export default router
