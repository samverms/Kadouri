import XLSX from 'xlsx'
import { db } from '../db'
import { accounts, products, orders, orderLines } from '../db/schema'
import { eq, ilike } from 'drizzle-orm'

interface SalesRow {
  customer: string
  date: string
  transactionType: string
  invoiceNum: string
  product: string
  description: string
  qty: number
  price: number
  amount: number
  balance: number
}

async function importSalesData() {
  console.log('Reading SalesByCustomer.xlsx...')
  const workbook = XLSX.readFile('SalesByCustomer.xlsx')
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]

  // Get seller account (Golden Nuts)
  console.log('\nLooking for seller account (Golden Nuts)...')
  let seller = await db.select().from(accounts).where(ilike(accounts.name, '%Golden Nuts%')).limit(1)

  if (seller.length === 0) {
    console.log('Creating seller account: Golden Nuts, Inc.')
    const [newSeller] = await db.insert(accounts).values({
      code: 'GOLDEN',
      name: 'Golden Nuts, Inc. DBA - The Kadouri Connection',
      active: true,
    }).returning()
    seller = [newSeller]
  }

  const sellerId = seller[0].id
  console.log(`✅ Seller: ${seller[0].name} (${sellerId})`)

  // Get all buyer accounts
  console.log('\nLoading buyer accounts from database...')
  const buyerAccounts = await db.select().from(accounts).where(eq(accounts.active, true))
  console.log(`Found ${buyerAccounts.length} accounts`)

  // Parse sales data
  console.log('\nParsing sales data...')
  const headerRow = 4
  const rows: SalesRow[] = []
  let currentCustomer = ''

  for (let i = headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i]
    const firstCol = row[0]?.toString().trim() || ''

    if (!firstCol && !row[1]) continue
    if (firstCol.startsWith('Total for')) continue

    // Customer name
    if (firstCol && !firstCol.startsWith('   ') && !row[1]) {
      currentCustomer = firstCol
      continue
    }

    // Agent/broker (skip for now)
    if (firstCol.startsWith('   ') && !row[1]) {
      continue
    }

    // Transaction row
    if (row[1] && row[2] === 'Invoice') {
      rows.push({
        customer: currentCustomer,
        date: row[1]?.toString() || '',
        transactionType: row[2]?.toString() || '',
        invoiceNum: row[3]?.toString() || '',
        product: row[4]?.toString() || '',
        description: row[5]?.toString() || '',
        qty: parseFloat(row[6]?.toString() || '0') || 0,
        price: parseFloat(row[7]?.toString() || '0') || 0,
        amount: parseFloat(row[8]?.toString() || '0') || 0,
        balance: parseFloat(row[9]?.toString() || '0') || 0,
      })
    }
  }

  console.log(`Parsed ${rows.length} invoice line items`)

  // Group by invoice number
  const invoiceMap = new Map<string, SalesRow[]>()
  rows.forEach(row => {
    if (!row.invoiceNum) return
    const items = invoiceMap.get(row.invoiceNum) || []
    items.push(row)
    invoiceMap.set(row.invoiceNum, items)
  })

  console.log(`Grouped into ${invoiceMap.size} unique invoices`)

  // Create default product for unmatched items
  console.log('\nCreating default product...')
  let defaultProduct = await db.select().from(products).where(eq(products.name, 'Miscellaneous Item')).limit(1)

  if (defaultProduct.length === 0) {
    const [newProduct] = await db.insert(products).values({
      name: 'Miscellaneous Item',
      variety: 'Various',
      grade: 'N/A',
      uom: 'LBS',
      active: true,
    }).returning()
    defaultProduct = [newProduct]
  }

  const defaultProductId = defaultProduct[0].id

  // Import invoices (limit to 1000 for now to avoid timeout)
  console.log('\nImporting invoices (limiting to first 1000)...')
  let imported = 0
  let skipped = 0
  let errors = 0
  let processed = 0
  const LIMIT = 1000

  for (const [invoiceNum, lineItems] of invoiceMap) {
    if (processed >= LIMIT) break
    processed++

    try {
      // Find buyer
      const customerName = lineItems[0].customer
      const buyer = buyerAccounts.find(acc =>
        acc.name.toLowerCase().includes(customerName.toLowerCase()) ||
        customerName.toLowerCase().includes(acc.name.toLowerCase())
      )

      if (!buyer) {
        skipped++
        if (skipped <= 5) {
          console.log(`⚠️  Skipped invoice ${invoiceNum}: Customer "${customerName}" not found in database`)
        }
        continue
      }

      // Check if invoice already exists
      const existing = await db.select().from(orders).where(eq(orders.qboDocNumber, invoiceNum)).limit(1)
      if (existing.length > 0) {
        skipped++
        continue
      }

      // Parse date
      const dateStr = lineItems[0].date
      let orderDate = new Date()
      try {
        orderDate = new Date(dateStr)
        if (isNaN(orderDate.getTime())) {
          orderDate = new Date()
        }
      } catch {
        orderDate = new Date()
      }

      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
      const commissionTotal = lineItems.reduce((sum, item) => {
        if (item.product.toLowerCase().includes('commission')) {
          return sum + item.amount
        }
        return sum
      }, 0)

      // Create order
      const [order] = await db.insert(orders).values({
        orderNo: invoiceNum,
        sellerId: sellerId,
        buyerId: buyer.id,
        status: 'paid',
        qboDocType: 'invoice',
        qboDocId: invoiceNum,
        qboDocNumber: invoiceNum,
        subtotal: subtotal.toString(),
        commissionTotal: commissionTotal.toString(),
        totalAmount: subtotal.toString(),
        createdBy: 'system',
        createdAt: orderDate,
        updatedAt: orderDate,
      }).returning()

      // Create order lines
      let lineNo = 1
      for (const item of lineItems) {
        // Skip pure commission lines or description lines
        if (!item.product || item.product.toLowerCase().includes('commission') || item.qty === 0) {
          continue
        }

        await db.insert(orderLines).values({
          orderId: order.id,
          lineNo: lineNo++,
          productId: defaultProductId,
          sizeGrade: item.product.substring(0, 100),
          quantity: item.qty.toString(),
          unitSize: '1',
          uom: 'LBS',
          totalWeight: item.qty.toString(),
          unitPrice: item.price.toString(),
          commissionPct: item.product.toLowerCase().includes('2%') ? '2' : null,
          commissionAmt: item.product.toLowerCase().includes('commission') ? item.amount.toString() : null,
          lineTotal: item.amount.toString(),
          createdAt: orderDate,
          updatedAt: orderDate,
        })
      }

      imported++
      if (imported % 100 === 0) {
        console.log(`Imported ${imported} invoices...`)
      }
    } catch (error) {
      errors++
      if (errors <= 5) {
        console.error(`❌ Error importing invoice ${invoiceNum}:`, error)
      }
    }
  }

  console.log('\n✅ Import complete!')
  console.log(`   Successfully imported: ${imported} invoices`)
  console.log(`   Skipped (customer not found or already exists): ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log(`\nNote: Limited to first ${LIMIT} invoices. Run again to import more.`)
}

importSalesData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
