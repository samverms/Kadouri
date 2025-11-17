import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const brokers = pgTable('brokers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Junction table for many-to-many relationship between accounts and brokers
export const accountBrokers = pgTable('account_brokers', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull(), // references accounts.id
  brokerId: uuid('broker_id').notNull(), // references brokers.id
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
