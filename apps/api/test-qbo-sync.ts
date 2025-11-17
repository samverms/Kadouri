import { QuickBooksSync } from './src/services/quickbooks/sync-wrapper'

async function testSync() {
  try {
    console.log('Testing QuickBooks sync...')

    // Test syncing order as invoice
    const orderId = '16e58dfc-900d-43c8-b2aa-337c34cfd9ba' // ORD-40242

    console.log(`\nSyncing order ${orderId} to QuickBooks...`)
    const result = await QuickBooksSync.pushOrderToQBO(orderId, 'invoice')

    console.log('\n✅ Success!')
    console.log('Result:', JSON.stringify(result, null, 2))

    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

testSync()
