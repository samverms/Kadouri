import { db } from '../../db'
import { brokers, accountBrokers } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { AppError } from '../../middleware/error-handler'
import { logger } from '../../utils/logger'

export class BrokersService {
  // Create broker and optionally associate with account
  async createBroker(data: {
    name: string
    email?: string
    phone?: string
    accountId?: string // Optional: associate with account immediately
  }) {
    const [broker] = await db.insert(brokers).values({
      name: data.name,
      email: data.email,
      phone: data.phone,
    }).returning()

    logger.info(`Created broker: ${broker.id} (${broker.name})`)

    // If accountId provided, create association
    if (data.accountId) {
      await db.insert(accountBrokers).values({
        accountId: data.accountId,
        brokerId: broker.id,
      })
      logger.info(`Associated broker ${broker.id} with account ${data.accountId}`)
    }

    return broker
  }

  // Get all brokers
  async getAllBrokers() {
    return await db.select().from(brokers)
  }

  // Get broker by ID
  async getBrokerById(id: string) {
    const [broker] = await db.select().from(brokers).where(eq(brokers.id, id))
    if (!broker) {
      throw new AppError('Broker not found', 404)
    }
    return broker
  }

  // Get brokers for an account
  async getBrokersForAccount(accountId: string) {
    const associations = await db
      .select({
        broker: brokers,
      })
      .from(accountBrokers)
      .innerJoin(brokers, eq(accountBrokers.brokerId, brokers.id))
      .where(eq(accountBrokers.accountId, accountId))

    return associations.map(a => a.broker)
  }

  // Associate broker with account
  async associateBrokerWithAccount(brokerId: string, accountId: string) {
    const [association] = await db.insert(accountBrokers).values({
      accountId,
      brokerId,
    }).returning()

    logger.info(`Associated broker ${brokerId} with account ${accountId}`)
    return association
  }

  // Remove broker-account association
  async removeAssociation(brokerId: string, accountId: string) {
    await db
      .delete(accountBrokers)
      .where(and(
        eq(accountBrokers.brokerId, brokerId),
        eq(accountBrokers.accountId, accountId)
      ))

    logger.info(`Removed association between broker ${brokerId} and account ${accountId}`)
  }

  // Update broker
  async updateBroker(id: string, data: {
    name?: string
    email?: string
    phone?: string
  }) {
    const [updated] = await db
      .update(brokers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(brokers.id, id))
      .returning()

    if (!updated) {
      throw new AppError('Broker not found', 404)
    }

    logger.info(`Updated broker: ${id}`)
    return updated
  }

  // Delete broker
  async deleteBroker(id: string) {
    // First delete all associations
    await db.delete(accountBrokers).where(eq(accountBrokers.brokerId, id))

    // Then delete the broker
    const [deleted] = await db
      .delete(brokers)
      .where(eq(brokers.id, id))
      .returning()

    if (!deleted) {
      throw new AppError('Broker not found', 404)
    }

    logger.info(`Deleted broker: ${id}`)
    return deleted
  }
}

export default new BrokersService()
