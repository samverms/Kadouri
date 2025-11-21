import { db } from './index'
import { termsOptions } from './schema'
import { logger } from '../utils/logger'

async function seedTerms() {
  try {
    logger.info('Seeding payment terms...')

    const terms = [
      { name: 'Net 30', description: 'Payment due within 30 days' },
      { name: 'Net 60', description: 'Payment due within 60 days' },
      { name: 'Net 90', description: 'Payment due within 90 days' },
      { name: 'COD', description: 'Cash on Delivery' },
      { name: 'Due on Receipt', description: 'Payment due immediately upon receipt' },
      { name: 'Net 15', description: 'Payment due within 15 days' },
      { name: 'Net 45', description: 'Payment due within 45 days' },
      { name: 'Prepaid', description: 'Payment required before shipment' },
      { name: '2/10 Net 30', description: '2% discount if paid within 10 days, otherwise due in 30 days' },
    ]

    for (const term of terms) {
      await db
        .insert(termsOptions)
        .values({
          name: term.name,
          description: term.description,
          isActive: true,
        })
        .onConflictDoNothing()

      logger.info(`Seeded term: ${term.name}`)
    }

    logger.info('✅ Terms seeding complete!')
  } catch (error) {
    logger.error('Failed to seed terms:', error)
    throw error
  }
}

seedTerms()
  .then(() => {
    logger.info('Done!')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('Seed failed:', error)
    process.exit(1)
  })
