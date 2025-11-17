import { pgTable, uuid, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { orders } from './orders'

export const orderActivities = pgTable('order_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  clerkUserId: varchar('clerk_user_id', { length: 255 }),
  userName: varchar('user_name', { length: 255 }),
  activityType: varchar('activity_type', { length: 50 }).notNull(),
  // Activity types: 'order_created', 'order_updated', 'invoice_created', 'invoice_updated',
  // 'invoice_voided', 'status_changed', 'synced_from_qb', 'payment_received', 'invoice_imported'
  description: text('description').notNull(),
  changes: jsonb('changes'), // { field: { old: value, new: value } }
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type OrderActivity = typeof orderActivities.$inferSelect
export type NewOrderActivity = typeof orderActivities.$inferInsert
