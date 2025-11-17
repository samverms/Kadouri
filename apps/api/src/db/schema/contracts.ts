import { pgTable, text, uuid, numeric, timestamp, pgEnum, jsonb, boolean } from 'drizzle-orm/pg-core'
import { accounts } from './accounts'
import { products } from './products'

export const contractStatusEnum = pgEnum('contract_status', [
  'draft',
  'active',
  'completed',
  'expired',
  'cancelled'
])

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractNumber: text('contract_number').notNull().unique(),

  // Parties
  sellerId: uuid('seller_id').references(() => accounts.id, { onDelete: 'restrict' }).notNull(),
  buyerId: uuid('buyer_id').references(() => accounts.id, { onDelete: 'restrict' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }).notNull(),

  // Quantities
  totalQuantity: numeric('total_quantity', { precision: 10, scale: 2 }).notNull(),
  remainingQuantity: numeric('remaining_quantity', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').notNull(), // lbs, kg, etc.

  // Pricing
  pricePerUnit: numeric('price_per_unit', { precision: 10, scale: 4 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  totalValue: numeric('total_value', { precision: 12, scale: 2 }).notNull(),

  // Validity
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
  status: contractStatusEnum('status').notNull().default('draft'),

  // Broker Information
  brokerName: text('broker_name'),
  brokerAddress: text('broker_address'),
  brokerPhone: text('broker_phone'),
  brokerEmail: text('broker_email'),

  // Terms & Documents
  terms: text('terms'),
  notes: text('notes'),

  // Draft document (auto-generated)
  draftDocumentUrl: text('draft_document_url'),
  draftDocumentType: text('draft_document_type'), // pdf, docx
  draftGeneratedAt: timestamp('draft_generated_at', { withTimezone: true }),

  // Executed document (uploaded by user)
  executedDocumentUrl: text('executed_document_url'),
  executedDocumentType: text('executed_document_type'),
  executedUploadedAt: timestamp('executed_uploaded_at', { withTimezone: true }),
  executedUploadedBy: text('executed_uploaded_by'), // clerk user id

  // Document version history
  documentVersions: jsonb('document_versions').$type<Array<{
    url: string
    type: string
    uploadedAt: string
    uploadedBy: string
  }>>(),

  // Metadata
  createdBy: text('created_by').notNull(), // clerk user id
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Contract draws tracking (audit trail)
export const contractDraws = pgTable('contract_draws', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').references(() => contracts.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').notNull(), // references orders.id
  quantityDrawn: numeric('quantity_drawn', { precision: 10, scale: 2 }).notNull(),
  remainingAfterDraw: numeric('remaining_after_draw', { precision: 10, scale: 2 }).notNull(),
  drawnAt: timestamp('drawn_at', { withTimezone: true }).notNull().defaultNow(),
  drawnBy: text('drawn_by').notNull(), // clerk user id
})
