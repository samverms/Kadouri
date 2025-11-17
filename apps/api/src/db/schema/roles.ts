import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  module: text('module').notNull(), // e.g., 'accounts', 'orders', 'products'
  action: text('action').notNull(), // e.g., 'view', 'create', 'edit', 'delete', 'export'
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert
export type RolePermission = typeof rolePermissions.$inferSelect
export type NewRolePermission = typeof rolePermissions.$inferInsert
