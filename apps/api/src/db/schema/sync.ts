import { pgTable, uuid, varchar, timestamp, text, jsonb } from 'drizzle-orm/pg-core'

// Track QuickBooks sync mapping history
export const syncMaps = pgTable('sync_maps', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // account, product, order
  entityId: uuid('entity_id').notNull(),
  qboType: varchar('qbo_type', { length: 50 }).notNull(), // customer, item, invoice, estimate
  qboId: varchar('qbo_id', { length: 50 }).notNull(),
  syncMetadata: jsonb('sync_metadata'), // store additional sync info
  lastSyncedAt: timestamp('last_synced_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Audit trail for all changes
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(), // create, update, delete
  userId: varchar('user_id', { length: 50 }).notNull(),
  changes: jsonb('changes'), // store before/after values
  timestamp: timestamp('timestamp').notNull().defaultNow(),
})

// QuickBooks webhook events
export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: varchar('event_id', { length: 100 }).notNull().unique(),
  realmId: varchar('realm_id', { length: 50 }).notNull(),
  entityName: varchar('entity_name', { length: 50 }).notNull(), // Customer, Item, Invoice, etc.
  operation: varchar('operation', { length: 20 }).notNull(), // Create, Update, Delete, Merge
  entityId: varchar('entity_id', { length: 50 }).notNull(),
  payload: jsonb('payload').notNull(),
  processed: varchar('processed', { length: 20 }).notNull().default('pending'), // pending, processing, completed, failed
  processedAt: timestamp('processed_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
