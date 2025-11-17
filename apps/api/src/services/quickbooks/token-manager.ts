import { db } from '../../db'
import { quickbooksTokens } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { qboClient } from './config'

export class TokenManager {
  /**
   * Get active QBO token (auto-refreshes if expired)
   */
  static async getActiveToken(): Promise<{ accessToken: string; realmId: string }> {
    const token = await db.query.quickbooksTokens.findFirst({
      where: eq(quickbooksTokens.isActive, true),
      orderBy: (tokens, { desc }) => [desc(tokens.updatedAt)],
    })

    if (!token) {
      throw new Error('No QuickBooks connection found. Please connect your QuickBooks account.')
    }

    // Check if token is expired
    if (new Date() > token.expiresAt) {
      console.log('QuickBooks token expired, refreshing...')

      // Set the current token to refresh it
      qboClient.setToken({
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
      })

      const authResponse = await qboClient.refresh()

      // Update database with new tokens
      const newExpiresAt = new Date(Date.now() + authResponse.token.expires_in * 1000)
      const newRefreshExpiresAt = new Date(Date.now() + authResponse.token.x_refresh_token_expires_in * 1000)

      await db.update(quickbooksTokens)
        .set({
          accessToken: authResponse.token.access_token,
          refreshToken: authResponse.token.refresh_token,
          expiresAt: newExpiresAt,
          refreshTokenExpiresAt: newRefreshExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(quickbooksTokens.id, token.id))

      console.log('QuickBooks token refreshed successfully')

      return {
        accessToken: authResponse.token.access_token,
        realmId: token.realmId,
      }
    }

    return {
      accessToken: token.accessToken,
      realmId: token.realmId,
    }
  }

  /**
   * Set token for QBO client before API calls
   */
  static async setClientToken(): Promise<string> {
    const { accessToken, realmId } = await this.getActiveToken()
    qboClient.setToken({ access_token: accessToken })
    return realmId
  }
}
