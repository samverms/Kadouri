import { pgTable, uuid, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core'

// User profiles synced from Clerk
export const users = pgTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(), // Clerk user ID
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: varchar('role', { length: 20 }).notNull().default('agent'), // admin, manager, agent, readonly
  active: boolean('active').notNull().default(true),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  mfaSecret: varchar('mfa_secret', { length: 255 }), // Encrypted MFA secret
  mfaBackupCodes: text('mfa_backup_codes'), // JSON array of backup codes
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// User invitations for role-based onboarding
export const userInvitations = pgTable('user_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // admin, manager, agent, readonly
  invitedBy: varchar('invited_by', { length: 50 }).notNull(), // User ID who sent invite
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, expired, revoked
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  resentAt: timestamp('resent_at'),
  resentCount: varchar('resent_count', { length: 10 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
