import { QuickBooksSync } from './src/services/quickbooks/sync-wrapper'
import { db } from './src/db'
import { orders } from './src/db/schema'
import { eq } from 'drizzle-orm'

async function createInvoice() {
  const orderId = '392f8e66-d8ab-4538-ba3f-2fd0255ec994' // ORD-32545

  console.log('Creating invoice in QuickBooks...')
  console.log('Order: ORD-32545')
  console.log('Amount: $20,000.00')
  console.log('')

  try {
    const result = await QuickBooksSync.pushOrderToQBO(orderId, 'invoice')

    console.log('✅ SUCCESS! Invoice created in QuickBooks')
    console.log('')
    console.log(`Invoice ID: ${result.docId}`)
    console.log(`Invoice Number: ${result.docNumber}`)
    console.log('')

    // Get updated order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId))

    console.log('Order Details:')
    console.log(`- Order No: ${order.orderNo}`)
    console.log(`- Total: $${order.totalAmount}`)
    console.log(`- Status: ${order.status}`)
    console.log(`- QB Doc ID: ${order.qboDocId}`)
    console.log(`- QB Doc Number: ${order.qboDocNumber}`)
    console.log('')
    console.log(`👉 Check QuickBooks Invoice #${result.docNumber}`)

    process.exit(0)
  } catch (error: any) {
    console.error('❌ ERROR:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

createInvoice()
