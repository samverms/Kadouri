import { pgTable, uuid, varchar, timestamp, numeric, text, integer, boolean, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  invoiceNumber: varchar('invoice_number', { length: 255 }).notNull().unique(),
  invoiceType: varchar('invoice_type', { length: 50 }).default('standard'),
  invoiceStatus: varchar('invoice_status', { length: 50 }).default('draft'),

  // Relationships
  orderId: uuid('order_id'),
  customerId: uuid('customer_id'),
  billingAddressId: uuid('billing_address_id'),

  // Dates
  invoiceDate: date('invoice_date').notNull().defaultNow(),
  dueDate: date('due_date').notNull(),
  servicePeriodStart: date('service_period_start'),
  servicePeriodEnd: date('service_period_end'),

  // Agent and Broker fields (NEW - matching orders pattern)
  agentUserId: varchar('agent_user_id', { length: 255 }), // Clerk user ID
  agentName: varchar('agent_name', { length: 255 }), // Denormalized for display
  brokerUserId: varchar('broker_user_id', { length: 255 }), // Clerk user ID
  brokerName: varchar('broker_name', { length: 255 }), // Denormalized for display

  // Currency
  currency: varchar('currency', { length: 10 }).default('USD'),
  exchangeRate: numeric('exchange_rate', { precision: 10, scale: 4 }).default('1'),

  // Amounts
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  shippingCost: numeric('shipping_cost', { precision: 12, scale: 2 }).default('0'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).default('0'),
  balanceDue: numeric('balance_due', { precision: 12, scale: 2 }),

  // Payment details
  paymentTerms: varchar('payment_terms', { length: 100 }),
  paymentMethod: varchar('payment_method', { length: 50 }),
  poNumber: varchar('po_number', { length: 100 }),

  // Content
  notes: text('notes'),
  termsAndConditions: text('terms_and_conditions'),

  // Email tracking
  emailSent: boolean('email_sent').default(false),
  emailSentAt: timestamp('email_sent_at'),
  emailViewed: boolean('email_viewed').default(false),
  emailViewedAt: timestamp('email_viewed_at'),

  // QuickBooks sync
  qboInvoiceId: varchar('qbo_invoice_id', { length: 50 }),
  qboDocNumber: varchar('qbo_doc_number', { length: 50 }),
  qboSyncToken: varchar('qbo_sync_token', { length: 50 }),
  qboLastSyncedAt: timestamp('qbo_last_synced_at'),

  // PDF
  pdfUrl: text('pdf_url'),
  pdfGeneratedAt: timestamp('pdf_generated_at'),

  // Audit
  createdBy: varchar('created_by', { length: 255 }),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const invoiceLines = pgTable('invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id'),
  orderLineId: uuid('order_line_id'),
  lineNumber: integer('line_number').notNull(),

  // Product details
  productId: uuid('product_id'),
  productSku: varchar('product_sku', { length: 100 }),
  description: text('description').notNull(),

  // Quantities and pricing
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0'),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),

  // QuickBooks
  qboLineId: varchar('qbo_line_id', { length: 50 }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Relations
export const invoicesRelations = relations(invoices, ({ many }) => ({
  lines: many(invoiceLines),
}))

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLines.invoiceId],
    references: [invoices.id],
  }),
}))
