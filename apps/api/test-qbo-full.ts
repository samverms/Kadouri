import { QuickBooksSync } from './src/services/quickbooks/sync-wrapper'
import { db } from './src/db'
import { orders } from './src/db/schema'
import { eq } from 'drizzle-orm'

async function testFullWorkflow() {
  try {
    console.log('='.repeat(60))
    console.log('QUICKBOOKS INTEGRATION - FULL WORKFLOW TEST')
    console.log('='.repeat(60))

    // Use a test order
    const orderId = '16e58dfc-900d-43c8-b2aa-337c34cfd9ba' // ORD-40242

    // Step 1: CREATE INVOICE IN QUICKBOOKS
    console.log('\n📝 STEP 1: Creating invoice in QuickBooks...')
    console.log('-'.repeat(60))

    const createResult = await QuickBooksSync.pushOrderToQBO(orderId, 'invoice')

    console.log('✅ Invoice created successfully!')
    console.log(`   Invoice ID: ${createResult.docId}`)
    console.log(`   Invoice Number: ${createResult.docNumber}`)
    console.log('\n👉 Go to QuickBooks and verify the invoice was created')
    console.log(`   Invoice #${createResult.docNumber}`)

    // Get the order to show details
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
    console.log(`\n   Order Details:`)
    console.log(`   - Order No: ${order.orderNo}`)
    console.log(`   - Total: $${order.totalAmount}`)
    console.log(`   - Status: ${order.status}`)
    console.log(`   - QB Doc ID: ${order.qboDocId}`)
    console.log(`   - QB Doc Number: ${order.qboDocNumber}`)

    // Wait for user confirmation
    console.log('\n⏸️  Press Ctrl+C to stop, or wait 10 seconds to continue with update test...')
    await sleep(10000)

    // Step 2: UPDATE INVOICE
    console.log('\n\n📝 STEP 2: Updating invoice in QuickBooks...')
    console.log('-'.repeat(60))
    console.log('   (No changes made, just testing the update flow)')

    const updateResult = await QuickBooksSync.pushOrderToQBO(orderId, 'invoice')

    console.log('✅ Invoice updated successfully!')
    console.log(`   Invoice ID: ${updateResult.docId}`)
    console.log(`   Invoice Number: ${updateResult.docNumber}`)
    console.log('\n👉 Go to QuickBooks and verify the invoice is still there')
    console.log(`   Invoice #${updateResult.docNumber}`)

    // Wait for user confirmation
    console.log('\n⏸️  Press Ctrl+C to stop, or wait 10 seconds to continue with void test...')
    await sleep(10000)

    // Step 3: VOID INVOICE
    console.log('\n\n❌ STEP 3: Voiding invoice in QuickBooks...')
    console.log('-'.repeat(60))

    const voidResult = await QuickBooksSync.voidInvoice(orderId)

    console.log('✅ Invoice voided successfully!')
    console.log(`   Message: ${voidResult.message}`)
    console.log('\n👉 Go to QuickBooks and verify the invoice is now VOIDED')
    console.log(`   Invoice #${createResult.docNumber} should show as VOID`)

    // Final status
    const [finalOrder] = await db.select().from(orders).where(eq(orders.id, orderId))
    console.log(`\n   Final Order Status: ${finalOrder.status}`)

    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL TESTS PASSED!')
    console.log('='.repeat(60))
    console.log('\nWorkflow tested:')
    console.log('  1. ✅ Create invoice in QB')
    console.log('  2. ✅ Update invoice in QB')
    console.log('  3. ✅ Void invoice in QB')
    console.log('\n')

    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ TEST FAILED!')
    console.error('Error:', error.message)
    console.error('\nStack trace:')
    console.error(error.stack)
    process.exit(1)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Run the test
testFullWorkflow()
