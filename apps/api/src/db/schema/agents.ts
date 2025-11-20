import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { accounts } from './accounts'

export const agents = pgTable('agents', {
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

export const accountAgents = pgTable('account_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  agentId: uuid('agent_id').notNull().references(() => agents.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Relations
export const agentsRelations = relations(agents, ({ many }) => ({
  accountAgents: many(accountAgents),
}))

export const accountAgentsRelations = relations(accountAgents, ({ one }) => ({
  account: one(accounts, {
    fields: [accountAgents.accountId],
    references: [accounts.id],
  }),
  agent: one(agents, {
    fields: [accountAgents.agentId],
    references: [agents.id],
  }),
}))
