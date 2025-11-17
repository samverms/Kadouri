import { qboClient } from './src/services/quickbooks/config'
import { TokenManager } from './src/services/quickbooks/token-manager'

async function verifyInvoices() {
  try {
    console.log('Fetching invoices from QuickBooks...')
    console.log('')

    const realmId = await TokenManager.setClientToken()

    // Query for recent invoices
    const query = "SELECT * FROM Invoice ORDER BY MetaData.CreateTime DESC MAXRESULTS 10"

    const response = await qboClient.makeApiCall({
      url: `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`,
      method: 'GET',
    })

    const invoices = response.json?.QueryResponse?.Invoice || []

    console.log(`Found ${invoices.length} recent invoices in QuickBooks:`)
    console.log('')

    invoices.forEach((inv: any, i: number) => {
      console.log(`${i + 1}. Invoice #${inv.DocNumber}`)
      console.log(`   QB ID: ${inv.Id}`)
      console.log(`   Customer: ${inv.CustomerRef?.name || 'N/A'}`)
      console.log(`   Total: $${inv.TotalAmt}`)
      console.log(`   Balance: $${inv.Balance}`)
      console.log(`   Status: ${inv.EmailStatus || 'Not sent'}`)
      console.log(`   Created: ${inv.MetaData?.CreateTime}`)
      console.log('')
    })

    process.exit(0)
  } catch (error: any) {
    console.error('❌ ERROR:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

verifyInvoices()
