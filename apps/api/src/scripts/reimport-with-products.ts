#!/usr/bin/env npx tsx
/**
 * Re-import sales data with proper product extraction and all line items
 */

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

async function reimportWithProducts() {
  console.log('Re-importing sales data with proper products...\n')
  console.log('Reading SalesByCustomer.xlsx...')

  const workbook = XLSX.readFile('SalesByCustomer.xlsx')
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]

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

    if (firstCol && !firstCol.startsWith('   ') && !row[1]) {
      currentCustomer = firstCol
      continue
    }

    if (firstCol.startsWith('   ') && !row[1]) {
      continue
    }

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

  // Extract unique products from the data
  console.log('\nExtracting unique products...')
  const productMap = new Map<string, {name: string, count: number}>()

  for (const row of rows) {
    const productName = row.product?.trim() || 'Unknown'

    // Skip commission and empty products
    if (!productName ||
        productName.toLowerCase().includes('commission') ||
        productName === 'Unknown') {
      continue
    }

    // Parse product name - extract base name
    const parts = productName.split('-').map(p => p.trim())
    const baseName = parts[0] || productName

    if (productMap.has(baseName)) {
      const existing = productMap.get(baseName)!
      existing.count++
    } else {
      productMap.set(baseName, { name: baseName, count: 1 })
    }
  }

  console.log(`Found ${productMap.size} unique products`)

  // Get existing products
  const existingProducts = await db.select().from(products)
  console.log(`Found ${existingProducts.length} existing products in DB`)

  // Create new products
  console.log('\nCreating products...')
  let createdProducts = 0
  const productNameToIdMap = new Map<string, string>()

  // Add existing products to map
  for (const product of existingProducts) {
    productNameToIdMap.set(product.name, product.id)
  }

  for (const [productName, data] of productMap) {
    try {
      // Check if exists
      const existing = existingProducts.find(
        p => p.name.toLowerCase() === productName.toLowerCase()
      )

      if (existing) {
        continue
      }

      // Create new product
      const [newProduct] = await db.insert(products).values({
        name: productName.substring(0, 200),
        variety: 'Various',
        grade: 'Standard',
        uom: 'LBS',
        active: true,
      }).returning()

      productNameToIdMap.set(productName, newProduct.id)
      createdProducts++

      if (createdProducts % 10 === 0) {
        console.log(`Created ${createdProducts} products...`)
      }
    } catch (error) {
      console.error(`Failed to create product ${productName}:`, error)
    }
  }

  console.log(`✅ Created ${createdProducts} new products`)

  // Get customer accounts
  const allAccounts = await db.select().from(accounts)
  const customerAccountMap = new Map<string, string>()

  for (const account of allAccounts) {
    customerAccountMap.set(account.name.toLowerCase(), account.id)
  }

  // Get seller account
  let seller = await db.select().from(accounts).where(ilike(accounts.name, '%Golden Nuts%')).limit(1)
  if (seller.length === 0) {
    throw new Error('Seller account not found')
  }
  const sellerId = seller[0].id

  // Group by invoice
  console.log('\nGrouping by invoice...')
  const invoiceMap = new Map<string, SalesRow[]>()
  rows.forEach(row => {
    if (!row.invoiceNum) return
    const items = invoiceMap.get(row.invoiceNum) || []
    items.push(row)
    invoiceMap.set(row.invoiceNum, items)
  })

  console.log(`Found ${invoiceMap.size} unique invoices`)

  // Delete existing order lines to reimport
  console.log('\nClearing existing order lines...')
  await db.delete(orderLines)
  console.log('✅ Cleared all order lines')

  // Re-import with proper line items
  console.log('\nRe-importing order lines...')
  const allOrders = await db.select().from(orders)
  console.log(`Found ${allOrders.length} existing orders`)

  let processedOrders = 0
  let createdLines = 0

  for (const order of allOrders) {
    try {
      const invoiceNum = order.qboDocNumber || order.orderNo
      const lineItems = invoiceMap.get(invoiceNum)

      if (!lineItems || lineItems.length === 0) {
        continue
      }

      let lineNo = 1
      for (const item of lineItems) {
        // Find product ID
        let productId: string | null = null

        if (item.product) {
          const parts = item.product.split('-').map(p => p.trim())
          const baseName = parts[0]
          productId = productNameToIdMap.get(baseName) || null
        }

        // Use first product as fallback
        if (!productId) {
          productId = existingProducts[0]?.id || null
        }

        if (!productId) {
          console.error(`No product ID found for order ${order.orderNo}`)
          continue
        }

        // Create line item
        await db.insert(orderLines).values({
          orderId: order.id,
          lineNo: lineNo++,
          productId: productId,
          sizeGrade: item.product?.substring(0, 100) || 'N/A',
          quantity: Math.abs(item.qty).toString(),
          unitSize: '1',
          uom: 'LBS',
          totalWeight: Math.abs(item.qty).toString(),
          unitPrice: item.price.toString(),
          commissionPct: item.product?.toLowerCase().includes('2%') ? '2' : null,
          commissionAmt: item.product?.toLowerCase().includes('commission') ? item.amount.toString() : null,
          lineTotal: item.amount.toString(),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })

        createdLines++
      }

      processedOrders++
      if (processedOrders % 1000 === 0) {
        console.log(`Processed ${processedOrders} orders, created ${createdLines} line items...`)
      }
    } catch (error) {
      console.error(`Error processing order ${order.orderNo}:`, error)
    }
  }

  console.log('\n✅ Re-import complete!')
  console.log(`   Processed: ${processedOrders} orders`)
  console.log(`   Created: ${createdLines} line items`)
  console.log(`   Products: ${productMap.size} unique (${createdProducts} new)`)
}

reimportWithProducts()
  .then(() => {
    console.log('\n✅ All done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
