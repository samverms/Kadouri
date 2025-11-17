import { QuickBooksSync as QBOSyncClass } from './sync'
import { TokenManager } from './token-manager'
import { QBOTokens } from './types'

/**
 * Wrapper class that provides static methods for QuickBooks sync operations
 * Handles token management automatically
 */
export class QuickBooksSync {
  /**
   * Sync account to QuickBooks customer
   */
  static async syncAccountToCustomer(accountId: string): Promise<string> {
    const { accessToken, realmId } = await TokenManager.getActiveToken()

    const tokens: QBOTokens = {
      access_token: accessToken,
      refresh_token: '',
      expires_in: 0,
      x_refresh_token_expires_in: 0,
      token_type: 'bearer',
      realmId,
    }

    const qboSync = new QBOSyncClass(tokens)
    return await qboSync.syncAccountToCustomer(accountId)
  }

  /**
   * Sync product to QuickBooks item
   */
  static async syncProductToItem(productId: string): Promise<string> {
    const { accessToken, realmId } = await TokenManager.getActiveToken()

    const tokens: QBOTokens = {
      access_token: accessToken,
      refresh_token: '',
      expires_in: 0,
      x_refresh_token_expires_in: 0,
      token_type: 'bearer',
      realmId,
    }

    const qboSync = new QBOSyncClass(tokens)
    return await qboSync.syncProductToItem(productId)
  }

  /**
   * Push order to QuickBooks as invoice or estimate
   */
  static async pushOrderToQBO(orderId: string, docType: 'invoice' | 'estimate'): Promise<{ docId: string; docNumber: string }> {
    const { accessToken, realmId } = await TokenManager.getActiveToken()

    const tokens: QBOTokens = {
      access_token: accessToken,
      refresh_token: '',
      expires_in: 0,
      x_refresh_token_expires_in: 0,
      token_type: 'bearer',
      realmId,
    }

    const qboSync = new QBOSyncClass(tokens)
    return await qboSync.pushOrderToQBO(orderId, docType)
  }

  /**
   * Sync invoice payment status from QuickBooks
   */
  static async syncInvoiceStatus(orderId: string): Promise<void> {
    const { accessToken, realmId } = await TokenManager.getActiveToken()

    const tokens: QBOTokens = {
      access_token: accessToken,
      refresh_token: '',
      expires_in: 0,
      x_refresh_token_expires_in: 0,
      token_type: 'bearer',
      realmId,
    }

    const qboSync = new QBOSyncClass(tokens)
    return await qboSync.syncInvoiceStatus(orderId)
  }

  /**
   * Void invoice in QuickBooks
   */
  static async voidInvoice(orderId: string): Promise<{ success: boolean; message: string }> {
    const { accessToken, realmId } = await TokenManager.getActiveToken()

    const tokens: QBOTokens = {
      access_token: accessToken,
      refresh_token: '',
      expires_in: 0,
      x_refresh_token_expires_in: 0,
      token_type: 'bearer',
      realmId,
    }

    const qboSync = new QBOSyncClass(tokens)
    return await qboSync.voidInvoice(orderId)
  }
}
