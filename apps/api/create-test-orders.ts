import { db } from './src/db'
import { accounts, products } from './src/db/schema'
import { OrdersService } from './src/modules/orders/orders.service'

async function createTestOrders() {
  try {
    console.log('Creating test orders...')

    // Get some accounts and products
    const allAccounts = await db.select().from(accounts).limit(10)
    const allProducts = await db.select().from(products).limit(5)

    if (allAccounts.length < 2) {
      console.error('Not enough accounts in database. Need at least 2 accounts.')
      return
    }

    if (allProducts.length < 1) {
      console.error('Not enough products in database. Need at least 1 product.')
      return
    }

    const seller = allAccounts[0]
    const buyer = allAccounts[1]
    const product = allProducts[0]

    const ordersService = new OrdersService()

    // Create 3 test orders with different statuses
    const testOrdersData = [
      {
        sellerId: seller.id,
        buyerId: buyer.id,
        contractNo: 'TEST-001',
        terms: 'Net 30',
        notes: 'Test order 1 - Draft status (editable)',
        lines: [
          {
            productId: product.id,
            sizeGrade: 'TEST',
            quantity: 100,
            unitSize: 25,
            uom: 'CASE',
            totalWeight: 2500,
            unitPrice: 5.50,
            commissionPct: 2.0,
          },
        ],
      },
      {
        sellerId: seller.id,
        buyerId: buyer.id,
        contractNo: 'TEST-002',
        terms: 'Net 15',
        notes: 'Test order 2 - Draft status (editable)',
        lines: [
          {
            productId: product.id,
            sizeGrade: 'PREMIUM',
            quantity: 150,
            unitSize: 30,
            uom: 'CASE',
            totalWeight: 4500,
            unitPrice: 6.25,
            commissionPct: 2.5,
          },
        ],
      },
      {
        sellerId: seller.id,
        buyerId: buyer.id,
        contractNo: 'TEST-003',
        terms: 'COD',
        notes: 'Test order 3 - Draft status (editable)',
        lines: [
          {
            productId: product.id,
            sizeGrade: 'STANDARD',
            quantity: 75,
            unitSize: 20,
            uom: 'BAG',
            totalWeight: 1500,
            unitPrice: 4.75,
            commissionPct: 1.5,
          },
        ],
      },
    ]

    for (const orderData of testOrdersData) {
      const newOrder = await ordersService.createOrder(orderData, 'test-user')
      console.log(`Created order: ${newOrder.orderNo} with status: ${newOrder.status}`)
    }

    console.log('\nTest orders created successfully!')
    console.log('All orders have "draft" status and can be edited.')
  } catch (error) {
    console.error('Error creating test orders:', error)
  }
}

createTestOrders()
