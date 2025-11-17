import { pgTable, uuid, varchar, boolean, timestamp, numeric } from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }), // Item number like K1001, K1002, etc.
  name: varchar('name', { length: 255 }).notNull(),
  variety: varchar('variety', { length: 255 }),
  grade: varchar('grade', { length: 100 }),
  category: varchar('category', { length: 100 }), // Product category (Almonds, Walnuts, etc.)
  defaultUnitSize: numeric('default_unit_size', { precision: 10, scale: 2 }),
  uom: varchar('uom', { length: 50 }), // unit of measure - deprecated, use variants instead
  qboItemId: varchar('qbo_item_id', { length: 50 }),
  active: boolean('active').notNull().default(true),
  source: varchar('source', { length: 50 }).notNull().default('manual'), // 'quickbooks_import', 'manual'
  archivedAt: timestamp('archived_at'), // When product was archived (for audit trail)
  archivedBy: varchar('archived_by', { length: 100 }), // Clerk user ID who archived it
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 100 }), // Clerk user ID who last updated the product
})
