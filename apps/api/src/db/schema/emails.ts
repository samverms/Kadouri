import { pgTable, uuid, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core'

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  category: varchar('category', { length: 100 }), // order_confirmation, invoice, quote, follow_up, etc.
  variables: text('variables'), // JSON array of available variables like {{customerName}}, {{orderNumber}}
  isActive: boolean('is_active').notNull().default(true),
  createdBy: varchar('created_by', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const emailLogs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => emailTemplates.id),
  to: text('to').notNull(), // Email addresses (comma-separated)
  cc: text('cc'),
  bcc: text('bcc'),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('sent'), // sent, failed, queued
  error: text('error'),
  sentBy: varchar('sent_by', { length: 50 }).notNull(),
  relatedEntityType: varchar('related_entity_type', { length: 50 }), // order, invoice, account
  relatedEntityId: uuid('related_entity_id'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
})

export const outlookTokens = pgTable('outlook_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 50 }).notNull().unique(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
