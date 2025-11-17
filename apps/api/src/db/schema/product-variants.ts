import { pgTable, uuid, varchar, boolean, timestamp, numeric } from 'drizzle-orm/pg-core'
import { products } from './products'

export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 100 }), // e.g., "K2001-10LB-BAG"
  size: numeric('size', { precision: 10, scale: 2 }).notNull(), // Package size: 10, 15, 20, 25
  sizeUnit: varchar('size_unit', { length: 20 }).notNull(), // lb, kg, oz, g, ton
  packageType: varchar('package_type', { length: 50 }).notNull(), // bag, box, case, pallet, bulk, each
  isDefault: boolean('is_default').notNull().default(false), // Which variant to pre-select
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: varchar('created_by', { length: 100 }), // Clerk user ID
  updatedBy: varchar('updated_by', { length: 100 }), // Clerk user ID
})
