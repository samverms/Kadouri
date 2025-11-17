import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'

export const quickbooksTokens = pgTable('quickbooks_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  realmId: text('realm_id').notNull().unique(), // QBO company ID
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenType: text('token_type').default('bearer'),
  expiresAt: timestamp('expires_at').notNull(),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
