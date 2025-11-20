import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { accounts } from './accounts'

export const brokers = pgTable('brokers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 50 }).default('US'),
  active: boolean('active').notNull().default(true),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Junction table for many-to-many relationship between accounts and brokers
export const accountBrokers = pgTable('account_brokers', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  brokerId: uuid('broker_id').notNull().references(() => brokers.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Relations
export const brokersRelations = relations(brokers, ({ many }) => ({
  accountBrokers: many(accountBrokers),
}))

export const accountBrokersRelations = relations(accountBrokers, ({ one }) => ({
  account: one(accounts, {
    fields: [accountBrokers.accountId],
    references: [accounts.id],
  }),
  broker: one(brokers, {
    fields: [accountBrokers.brokerId],
    references: [brokers.id],
  }),
}))
