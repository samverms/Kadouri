import OAuthClient from 'intuit-oauth'
import { config } from '../../config'

export const qboClient = new OAuthClient({
  clientId: config.quickbooks.clientId || '',
  clientSecret: config.quickbooks.clientSecret || '',
  environment: config.quickbooks.environment,
  redirectUri: config.quickbooks.redirectUri || '',
})

export const QBO_SCOPES = [
  OAuthClient.scopes.Accounting,
  OAuthClient.scopes.Payment,
]

export const QBO_API_BASE_URL =
  config.quickbooks.environment === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com'
