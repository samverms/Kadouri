import { db } from '../../db'
import { agents, accountAgents } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { AppError } from '../../middleware/error-handler'
import { logger } from '../../utils/logger'

export class AgentsService {
  // Create agent and optionally associate with account
  async createAgent(data: {
    name: string
    email?: string
    phone?: string
    accountId?: string // Optional: associate with account immediately
  }) {
    const [agent] = await db.insert(agents).values({
      name: data.name,
      email: data.email,
      phone: data.phone,
    }).returning()

    logger.info(`Created agent: ${agent.id} (${agent.name})`)

    // If accountId provided, create association
    if (data.accountId) {
      await db.insert(accountAgents).values({
        accountId: data.accountId,
        agentId: agent.id,
      })
      logger.info(`Associated agent ${agent.id} with account ${data.accountId}`)
    }

    return agent
  }

  // Get all agents
  async getAllAgents() {
    return await db.select().from(agents)
  }

  // Get agent by ID
  async getAgentById(id: string) {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id))
    if (!agent) {
      throw new AppError('Agent not found', 404)
    }
    return agent
  }

  // Get agents for an account
  async getAgentsForAccount(accountId: string) {
    const associations = await db
      .select({
        agent: agents,
      })
      .from(accountAgents)
      .innerJoin(agents, eq(accountAgents.agentId, agents.id))
      .where(eq(accountAgents.accountId, accountId))

    return associations.map(a => a.agent)
  }

  // Associate agent with account
  async associateAgentWithAccount(agentId: string, accountId: string) {
    const [association] = await db.insert(accountAgents).values({
      accountId,
      agentId,
    }).returning()

    logger.info(`Associated agent ${agentId} with account ${accountId}`)
    return association
  }

  // Remove agent-account association
  async removeAssociation(agentId: string, accountId: string) {
    await db
      .delete(accountAgents)
      .where(and(
        eq(accountAgents.agentId, agentId),
        eq(accountAgents.accountId, accountId)
      ))

    logger.info(`Removed association between agent ${agentId} and account ${accountId}`)
  }

  // Update agent
  async updateAgent(id: string, data: {
    name?: string
    email?: string
    phone?: string
  }) {
    const [updated] = await db
      .update(agents)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, id))
      .returning()

    if (!updated) {
      throw new AppError('Agent not found', 404)
    }

    logger.info(`Updated agent: ${id}`)
    return updated
  }

  // Delete agent
  async deleteAgent(id: string) {
    // First delete all associations
    await db.delete(accountAgents).where(eq(accountAgents.agentId, id))

    // Then delete the agent
    const [deleted] = await db
      .delete(agents)
      .where(eq(agents.id, id))
      .returning()

    if (!deleted) {
      throw new AppError('Agent not found', 404)
    }

    logger.info(`Deleted agent: ${id}`)
    return deleted
  }
}

export default new AgentsService()
