import { pgTable, uuid, varchar, boolean, timestamp, numeric } from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  variety: varchar('variety', { length: 255 }),
  grade: varchar('grade', { length: 100 }),
  defaultUnitSize: numeric('default_unit_size', { precision: 10, scale: 2 }),
  uom: varchar('uom', { length: 50 }).notNull(), // unit of measure (lbs, kg, boxes, etc.)
  qboItemId: varchar('qbo_item_id', { length: 50 }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
