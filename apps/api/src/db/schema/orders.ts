import { pgTable, uuid, varchar, timestamp, numeric, text, integer, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { accounts, addresses } from './accounts'
import { products } from './products'
import { productVariants } from './product-variants'
import { agents } from './agents'
import { brokers } from './brokers'

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNo: varchar('order_no', { length: 50 }).notNull().unique(),
  sellerId: uuid('seller_id').notNull().references(() => accounts.id),
  buyerId: uuid('buyer_id').notNull().references(() => accounts.id),

  // Address references
  sellerBillingAddressId: uuid('seller_billing_address_id').references(() => addresses.id),
  sellerPickupAddressId: uuid('seller_pickup_address_id').references(() => addresses.id),
  buyerBillingAddressId: uuid('buyer_billing_address_id').references(() => addresses.id),
  buyerShippingAddressId: uuid('buyer_shipping_address_id').references(() => addresses.id),

  // Pickup flag
  isPickup: boolean('is_pickup').notNull().default(false), // If true, buyer picks up (no shipping address needed)

  // Agent and Broker references
  agentId: uuid('agent_id').references(() => agents.id),
  brokerId: uuid('broker_id').references(() => brokers.id),

  // DEPRECATED fields - kept for backward compatibility during migration
  agentUserId: varchar('agent_user_id', { length: 255 }),
  agentName: varchar('agent_name', { length: 255 }),
  brokerUserId: varchar('broker_user_id', { length: 255 }),
  brokerName: varchar('broker_name', { length: 255 }),
  salesAgentId: varchar('sales_agent_id', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, confirmed, posted_to_qb, paid
  poNumber: varchar('po_number', { length: 100 }), // Purchase Order number
  contractId: uuid('contract_id'), // Link to contracts table (if this order is a contract draw)
  contractNo: varchar('contract_no', { length: 100 }), // Sales Contract number
  qboDocType: varchar('qbo_doc_type', { length: 20 }), // estimate or invoice
  qboDocId: varchar('qbo_doc_id', { length: 50 }),
  qboDocNumber: varchar('qbo_doc_number', { length: 50 }),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  commissionTotal: numeric('commission_total', { precision: 12, scale: 2 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  terms: text('terms'),
  notes: text('notes'),
  memo: text('memo'), // Auto-generated memo field with manual override capability
  palletCount: integer('pallet_count'),
  createdBy: varchar('created_by', { length: 50 }).notNull(), // user ID
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 }), // Clerk user ID
})

export const orderLines = pgTable('order_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  lineNo: integer('line_no').notNull(),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id').references(() => productVariants.id), // Optional: if product has variants
  packageType: varchar('package_type', { length: 50 }), // bag, box, case, pallet, bulk, each
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

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  seller: one(accounts, {
    fields: [orders.sellerId],
    references: [accounts.id],
  }),
  buyer: one(accounts, {
    fields: [orders.buyerId],
    references: [accounts.id],
  }),
  agent: one(agents, {
    fields: [orders.agentId],
    references: [agents.id],
  }),
  broker: one(brokers, {
    fields: [orders.brokerId],
    references: [brokers.id],
  }),
  sellerBillingAddress: one(addresses, {
    fields: [orders.sellerBillingAddressId],
    references: [addresses.id],
  }),
  sellerPickupAddress: one(addresses, {
    fields: [orders.sellerPickupAddressId],
    references: [addresses.id],
  }),
  buyerBillingAddress: one(addresses, {
    fields: [orders.buyerBillingAddressId],
    references: [addresses.id],
  }),
  buyerShippingAddress: one(addresses, {
    fields: [orders.buyerShippingAddressId],
    references: [addresses.id],
  }),
  lines: many(orderLines),
}))

export const orderLinesRelations = relations(orderLines, ({ one }) => ({
  order: one(orders, {
    fields: [orderLines.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderLines.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderLines.variantId],
    references: [productVariants.id],
  }),
}))

// Terms Options table - configurable payment terms
export const termsOptions = pgTable('terms_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(), // e.g., "Net 30", "Net 60", "COD", "Due on Receipt"
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Order Attachments table - file uploads for orders
export const orderAttachments = pgTable('order_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(), // S3 URL or storage path
  fileSize: integer('file_size'), // in bytes
  fileType: varchar('file_type', { length: 100 }), // MIME type
  uploadedBy: varchar('uploaded_by', { length: 50 }).notNull(), // Clerk user ID
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const orderAttachmentsRelations = relations(orderAttachments, ({ one }) => ({
  order: one(orders, {
    fields: [orderAttachments.orderId],
    references: [orders.id],
  }),
}))
