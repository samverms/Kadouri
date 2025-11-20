import { pgTable, uuid, varchar, boolean, timestamp, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  qboCustomerId: varchar('qbo_customer_id', { length: 50 }),
  parentAccountId: uuid('parent_account_id'),
  salesAgentId: varchar('sales_agent_id', { length: 255 }), // Assigned sales person/agent
  accountType: varchar('account_type', { length: 20 }).notNull().default('both'), // 'buyer', 'seller', 'both'
  brokerIds: text('broker_ids').array(), // Array of Clerk user IDs for associated brokers
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 }), // Customer service person who last edited
})

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // billing, shipping, warehouse, pickup
  line1: varchar('line1', { length: 255 }).notNull(),
  line2: varchar('line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 2 }).notNull().default('US'),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 }), // Clerk user ID
})

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 }), // Clerk user ID
})

// Relations
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  parentAccount: one(accounts, {
    fields: [accounts.parentAccountId],
    references: [accounts.id],
  }),
  addresses: many(addresses),
  contacts: many(contacts),
}))

export const addressesRelations = relations(addresses, ({ one }) => ({
  account: one(accounts, {
    fields: [addresses.accountId],
    references: [accounts.id],
  }),
}))

export const contactsRelations = relations(contacts, ({ one }) => ({
  account: one(accounts, {
    fields: [contacts.accountId],
    references: [accounts.id],
  }),
}))
