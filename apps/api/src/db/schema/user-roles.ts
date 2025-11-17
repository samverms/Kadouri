import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { roles } from './roles'

// Maps Clerk users to internal roles
export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(), // Clerk user ID
  roleId: uuid('role_id').notNull().references(() => roles.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert
