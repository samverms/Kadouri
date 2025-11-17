import XLSX from 'xlsx'
import { db } from '../db'
import { accounts } from '../db/schema'
import { eq, ilike } from 'drizzle-orm'

interface SalesRow {
  customer?: string
  date?: string
  transactionType?: string
  invoiceNum?: string
  product?: string
  description?: string
  qty?: number
  price?: number
  amount?: number
  balance?: number
}

async function analyzeSalesData() {
  console.log('Reading SalesByCustomer.xlsx...')
  const workbook = XLSX.readFile('SalesByCustomer.xlsx')
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]

  // Parse the data starting from row 5 (after headers)
  const headerRow = 4
  const rows: SalesRow[] = []
  let currentCustomer = ''
  let currentAgent = ''

  for (let i = headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i]
    const firstCol = row[0]?.toString().trim() || ''

    // Skip empty rows and total rows
    if (!firstCol && !row[1]) continue
    if (firstCol.startsWith('Total for')) continue

    // Check if it's a customer name (not indented)
    if (firstCol && !firstCol.startsWith('   ') && !row[1]) {
      currentCustomer = firstCol
      currentAgent = ''
      continue
    }

    // Check if it's an agent/broker (indented with 3 spaces)
    if (firstCol.startsWith('   ') && !row[1]) {
      currentAgent = firstCol.trim()
      continue
    }

    // Parse transaction row
    if (row[1]) {
      const parsedRow: SalesRow = {
        customer: currentCustomer,
        date: row[1]?.toString() || '',
        transactionType: row[2]?.toString() || '',
        invoiceNum: row[3]?.toString() || '',
        product: row[4]?.toString() || '',
        description: row[5]?.toString() || '',
        qty: parseFloat(row[6]?.toString() || '0'),
        price: parseFloat(row[7]?.toString() || '0'),
        amount: parseFloat(row[8]?.toString() || '0'),
        balance: parseFloat(row[9]?.toString() || '0'),
      }

      if (parsedRow.transactionType === 'Invoice') {
        rows.push(parsedRow)
      }
    }
  }

  console.log(`\nFound ${rows.length} invoice line items`)

  // Group by customer
  const customerStats = new Map<string, { count: number; total: number; invoices: Set<string> }>()

  rows.forEach(row => {
    if (!row.customer) return

    const stats = customerStats.get(row.customer) || { count: 0, total: 0, invoices: new Set() }
    stats.count++
    stats.total += row.amount || 0
    if (row.invoiceNum) stats.invoices.add(row.invoiceNum)
    customerStats.set(row.customer, stats)
  })

  console.log('\n=== Top 10 Customers by Invoice Count ===')
  const sorted = Array.from(customerStats.entries())
    .sort((a, b) => b[1].invoices.size - a[1].invoices.size)
    .slice(0, 10)

  for (const [customer, stats] of sorted) {
    console.log(`${customer}:`)
    console.log(`  - ${stats.invoices.size} invoices`)
    console.log(`  - ${stats.count} line items`)
    console.log(`  - $${stats.total.toFixed(2)} total`)
  }

  // Try to match customers with accounts in database
  console.log('\n=== Matching Customers with Database Accounts ===')
  const allAccounts = await db.select().from(accounts)

  let matched = 0
  let unmatched = 0
  const unmatchedCustomers: string[] = []

  for (const [customer] of customerStats) {
    const found = allAccounts.find(acc =>
      acc.name.toLowerCase().includes(customer.toLowerCase()) ||
      customer.toLowerCase().includes(acc.name.toLowerCase())
    )

    if (found) {
      matched++
    } else {
      unmatched++
      if (unmatchedCustomers.length < 10) {
        unmatchedCustomers.push(customer)
      }
    }
  }

  console.log(`Matched: ${matched}`)
  console.log(`Unmatched: ${unmatched}`)
  if (unmatchedCustomers.length > 0) {
    console.log('\nFirst 10 unmatched customers:')
    unmatchedCustomers.forEach(c => console.log(`  - ${c}`))
  }

  // Sample invoices
  console.log('\n=== Sample Invoice Data (first 5) ===')
  const uniqueInvoices = new Map<string, SalesRow[]>()
  rows.forEach(row => {
    if (!row.invoiceNum) return
    const items = uniqueInvoices.get(row.invoiceNum) || []
    items.push(row)
    uniqueInvoices.set(row.invoiceNum, items)
  })

  let count = 0
  for (const [invoiceNum, items] of uniqueInvoices) {
    if (count >= 5) break
    console.log(`\nInvoice #${invoiceNum}:`)
    console.log(`  Customer: ${items[0].customer}`)
    console.log(`  Date: ${items[0].date}`)
    console.log(`  Line items: ${items.length}`)
    console.log(`  Total: $${items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}`)
    count++
  }
}

analyzeSalesData()
  .then(() => {
    console.log('\n✅ Analysis complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
