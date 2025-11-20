import { db } from './index'
import { agents, brokers } from './schema'
import { logger } from '../utils/logger'

async function seedAgentsBrokers() {
  try {
    logger.info('Seeding agents and brokers...')

    // Check if agents already exist
    const existingAgents = await db.select().from(agents).limit(1)
    if (existingAgents.length === 0) {
      // Insert sample agents
      const sampleAgents = [
        {
          name: 'John Smith',
          companyName: 'Smith Sales Agency',
          email: 'john@smithsales.com',
          phone: '(555) 123-4567',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          active: true,
        },
        {
          name: 'Sarah Johnson',
          companyName: 'Johnson Marketing',
          email: 'sarah@johnsonmarketing.com',
          phone: '(555) 234-5678',
          addressLine1: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'US',
          active: true,
        },
        {
          name: 'Michael Brown',
          email: 'michael.brown@email.com',
          phone: '(555) 345-6789',
          addressLine1: '789 Elm St',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
          country: 'US',
          active: true,
        },
      ]

      await db.insert(agents).values(sampleAgents)
      logger.info(`Inserted ${sampleAgents.length} sample agents`)
    } else {
      logger.info('Agents already exist, skipping...')
    }

    // Check if brokers already exist
    const existingBrokers = await db.select().from(brokers).limit(1)
    if (existingBrokers.length === 0) {
      // Insert sample brokers
      const sampleBrokers = [
        {
          name: 'David Wilson',
          companyName: 'Wilson Brokerage',
          email: 'david@wilsonbrokers.com',
          phone: '(555) 456-7890',
          addressLine1: '321 Pine St',
          city: 'Houston',
          state: 'TX',
          postalCode: '77001',
          country: 'US',
          active: true,
        },
        {
          name: 'Emily Davis',
          companyName: 'Davis & Associates',
          email: 'emily@davisassociates.com',
          phone: '(555) 567-8901',
          addressLine1: '654 Maple Ave',
          city: 'Phoenix',
          state: 'AZ',
          postalCode: '85001',
          country: 'US',
          active: true,
        },
        {
          name: 'Robert Martinez',
          companyName: 'Martinez Brokers LLC',
          email: 'robert@martinezbrokers.com',
          phone: '(555) 678-9012',
          addressLine1: '987 Cedar Ln',
          city: 'Philadelphia',
          state: 'PA',
          postalCode: '19019',
          country: 'US',
          active: true,
        },
      ]

      await db.insert(brokers).values(sampleBrokers)
      logger.info(`Inserted ${sampleBrokers.length} sample brokers`)
    } else {
      logger.info('Brokers already exist, skipping...')
    }

    logger.info('Agents and brokers seeding completed!')
    process.exit(0)
  } catch (error) {
    logger.error('Error seeding agents and brokers:', error)
    process.exit(1)
  }
}

seedAgentsBrokers()
