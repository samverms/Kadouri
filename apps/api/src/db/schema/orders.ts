import { pgTable, uuid, varchar, timestamp, numeric, text, integer } from 'drizzle-orm/pg-core'
import { accounts } from './accounts'
import { products } from './products'

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNo: varchar('order_no', { length: 50 }).notNull().unique(),
  sellerId: uuid('seller_id').notNull().references(() => accounts.id),
  buyerId: uuid('buyer_id').notNull().references(() => accounts.id),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, confirmed, posted_to_qb, paid
  contractNo: varchar('contract_no', { length: 100 }),
  qboDocType: varchar('qbo_doc_type', { length: 20 }), // estimate or invoice
  qboDocId: varchar('qbo_doc_id', { length: 50 }),
  qboDocNumber: varchar('qbo_doc_number', { length: 50 }),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  commissionTotal: numeric('commission_total', { precision: 12, scale: 2 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  terms: text('terms'),
  notes: text('notes'),
  palletCount: integer('pallet_count'),
  createdBy: varchar('created_by', { length: 50 }).notNull(), // user ID
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const orderLines = pgTable('order_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  lineNo: integer('line_no').notNull(),
  productId: uuid('product_id').notNull().references(() => products.id),
  sizeGrade: varchar('size_grade', { length: 100 }),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitSize: numeric('unit_size', { precision: 10, scale: 2 }).notNull(),
  uom: varchar('uom', { length: 50 }).notNull(),
  totalWeight: numeric('total_weight', { precision: 12, scale: 2 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  commissionPct: numeric('commission_pct', { precision: 5, scale: 2 }), // percentage
  commissionAmt: numeric('commission_amt', { precision: 10, scale: 2 }), // absolute amount
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const pdfs = pgTable('pdfs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // seller or buyer
  url: text('url').notNull(),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
