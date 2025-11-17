import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const accountAgents = pgTable('account_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull(),
  agentId: uuid('agent_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
