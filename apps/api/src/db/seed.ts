import { db } from './index'
import { accounts, addresses, contacts, products, users } from './schema'

const seed = async () => {
  console.log('Seeding database...')

  // Create admin user
  await db.insert(users).values({
    id: 'user_seed_admin',
    email: 'admin@pace.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  })

  // Create sample seller account
  const [seller] = await db.insert(accounts).values({
    code: 'SELL-001',
    name: 'Acme Farms Inc.',
  }).returning()

  // Create seller address
  await db.insert(addresses).values({
    accountId: seller.id,
    type: 'billing',
    line1: '123 Farm Road',
    city: 'Farmville',
    state: 'CA',
    postalCode: '93001',
    isPrimary: true,
  })

  // Create seller contact
  await db.insert(contacts).values({
    accountId: seller.id,
    name: 'John Farmer',
    email: 'john@acmefarms.com',
    phone: '555-0100',
    isPrimary: true,
  })

  // Create sample buyer account
  const [buyer] = await db.insert(accounts).values({
    code: 'BUY-001',
    name: 'Fresh Market Distributors',
  }).returning()

  // Create buyer address
  await db.insert(addresses).values({
    accountId: buyer.id,
    type: 'shipping',
    line1: '456 Commerce Blvd',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90001',
    isPrimary: true,
  })

  // Create buyer contact
  await db.insert(contacts).values({
    accountId: buyer.id,
    name: 'Sarah Buyer',
    email: 'sarah@freshmarket.com',
    phone: '555-0200',
    isPrimary: true,
  })

  // Create sample products
  await db.insert(products).values([
    {
      name: 'Strawberries',
      variety: 'Albion',
      grade: 'Grade A',
      defaultUnitSize: '12',
      uom: 'lbs',
    },
    {
      name: 'Avocados',
      variety: 'Hass',
      grade: 'Premium',
      defaultUnitSize: '25',
      uom: 'lbs',
    },
    {
      name: 'Lettuce',
      variety: 'Romaine',
      grade: 'Grade A',
      defaultUnitSize: '24',
      uom: 'heads',
    },
  ])

  console.log('Database seeded successfully!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
