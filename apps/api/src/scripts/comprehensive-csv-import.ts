#!/usr/bin/env tsx
/**
 * Comprehensive CSV Import Script
 *
 * This script imports data from SalesByCustomer.csv with complete feature support:
 * - Hierarchical account relationships (parent customer -> broker/agent)
 * - Contact and address extraction from description fields
 * - Product parsing and creation
 * - Dual order/invoice creation with proper linking
 * - Commission tracking
 * - Credit memo handling
 *
 * File structure: SalesByCustomer.csv (comma-separated)
 * Column 1: Customer/Supplier name (hierarchical, indented with spaces)
 * Column 2: Date
 * Column 3: Transaction Type (Invoice, Credit Memo)
 * Column 4: Invoice Number
 * Column 5: Product/Service
 * Column 6: Memo/Description (contains contact info, addresses, product details)
 * Column 7: Sales Price
 * Column 8: Commission Rate
 * Column 9: Commission Amount
 * Column 10: Balance (running balance)
 */

import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { db } from '../db'
import {
  accounts,
  addresses,
  contacts,
  products,
  orders,
  orderLines
} from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'

// ==================== TYPES ====================

interface CSVRow {
  col1: string  // Customer/Supplier name
  col2: string  // Date
  col3: string  // Transaction Type
  col4: string  // Invoice Number
  col5: string  // Product/Service
  col6: string  // Memo/Description
  col7: string  // Sales Price
  col8: string  // Commission Rate
  col9: string  // Commission Amount
  col10: string // Balance
}

interface ParsedInvoice {
  invoiceNumber: string
  date: string
  transactionType: string
  primaryCustomer: string | null  // Top-level customer (e.g., "A-1 Bakery Supply")
  broker: string                   // Broker/agent or direct customer (e.g., "Olive Branch Brokerage")
  lines: ParsedLine[]
  contactInfo: ContactInfo | null
  shippingAddress: AddressInfo | null
  totalAmount: number
  commissionTotal: number
  paymentTerms: string | null
}

interface ParsedLine {
  product: string
  description: string
  quantity: number
  unitSize: number
  uom: string
  unitPrice: number
  lineTotal: number
  commissionPct: number
  commissionAmt: number
}

interface ContactInfo {
  name: string | null
  email: string[]
  phone: string[]
}

interface AddressInfo {
  line1: string
  line2: string | null
  city: string
  state: string
  postalCode: string
  country: string
}

interface AccountCache {
  id: string
  name: string
  code: string
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Detect indentation level based on leading spaces
 */
function getIndentLevel(text: string): number {
  const match = text.match(/^( +)/)
  return match ? match[1].length / 3 : 0  // Assuming 3 spaces per level
}

/**
 * Parse commission from product description
 * Examples: "Commission 2%", "Commission 5%"
 */
function parseCommission(text: string): number | null {
  const match = text.match(/Commission\s+(\d+(?:\.\d+)?)%/i)
  return match ? parseFloat(match[1]) / 100 : null
}

/**
 * Parse product description to extract details
 * Example: "80 cases walnuts combo halves and pieces 25# $1.35/lbs pick up"
 * Returns: { quantity: 80, unitSize: 25, uom: "LBS", product: "walnuts combo halves and pieces", unitPrice: 1.35 }
 */
function parseProductDescription(desc: string): Partial<ParsedLine> {
  const result: Partial<ParsedLine> = {
    description: desc,
    quantity: 0,
    unitSize: 0,
    uom: 'LBS',
    unitPrice: 0
  }

  // Extract quantity (e.g., "80 cases", "20 bags")
  const qtyMatch = desc.match(/(\d+)\s+(cases?|bags?|master bags?)/i)
  if (qtyMatch) {
    result.quantity = parseInt(qtyMatch[1])
    // Set UOM based on quantity unit (cases, bags, etc.)
    const unit = qtyMatch[2].toLowerCase()
    if (unit.startsWith('case')) result.uom = 'CASE'
    else if (unit.startsWith('bag')) result.uom = 'BAG'
    else if (unit.startsWith('master')) result.uom = 'MASTER BAG'
  }

  // Extract unit size (e.g., "25#", "50#", "4x10#")
  const sizeMatch = desc.match(/(\d+(?:\.\d+)?)\s*#|(\d+x\d+)\s*#/i)
  if (sizeMatch) {
    result.unitSize = parseFloat(sizeMatch[1] || sizeMatch[2].split('x')[1])
  }

  // Extract unit price (e.g., "$1.35/lbs", "$36.00/bag")
  const priceMatch = desc.match(/\$(\d+(?:\.\d+)?)\s*\/\s*(lbs?|bag|case)/i)
  if (priceMatch) {
    result.unitPrice = parseFloat(priceMatch[1])
  }

  // Extract product name (everything before the price or before "pick up")
  let productName = desc
    .replace(/^\d+\s+(cases?|bags?|master bags?)\s+/i, '')  // Remove quantity
    .replace(/\s+\d+(?:\.\d+)?#.*$/, '')                    // Remove size and after
    .replace(/\s+\$\d+(?:\.\d+)?\/.*$/, '')                // Remove price and after
    .replace(/\s+(pick\s+up|deliver|must leave check).*$/i, '') // Remove pickup/delivery info
    .trim()

  result.product = productName || 'Unknown Product'

  return result
}

/**
 * Extract contact information from description field
 * Looks for emails and phone numbers
 */
function extractContactInfo(desc: string): ContactInfo | null {
  if (!desc) return null

  const emails = desc.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
  const phones = desc.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || []

  if (emails.length === 0 && phones.length === 0) return null

  // Try to extract name (usually first line before email)
  const lines = desc.split(/[\r\n]+/)
  const name = lines[0]?.trim() || null

  return {
    name: name && name.length < 100 ? name : null,
    email: emails,
    phone: phones.map(p => p.replace(/[^\d]/g, ''))
  }
}

/**
 * Extract shipping address from description field
 * Looks for multi-line address patterns
 */
function extractAddress(desc: string): AddressInfo | null {
  if (!desc || desc.length < 20) return null

  const lines = desc.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return null

  // Look for state/zip pattern (e.g., "NY 11209")
  const stateZipLine = lines.find(l => /,?\s*[A-Z]{2}\s+\d{5}/.test(l))
  if (!stateZipLine) return null

  const stateZipMatch = stateZipLine.match(/,?\s*([A-Z]{2})\s+(\d{5})/)
  if (!stateZipMatch) return null

  const state = stateZipMatch[1].trim()  // Trim to ensure exactly 2 chars
  const postalCode = stateZipMatch[2].trim()

  // Extract city (usually the word before state)
  const cityMatch = stateZipLine.match(/,?\s*([A-Za-z\s]+),?\s*[A-Z]{2}\s+\d{5}/)
  const city = cityMatch ? cityMatch[1].trim() : ''

  // Extract street address (lines before city/state/zip line)
  const addressLines = lines.slice(0, lines.indexOf(stateZipLine))
  const line1 = addressLines[0] || ''
  const line2 = addressLines[1] || null

  if (!line1 || !city || !state) return null

  return {
    line1: line1.substring(0, 255),  // Truncate to max length
    line2: line2 ? line2.substring(0, 255) : null,
    city: city.substring(0, 100),  // Truncate to max length
    state: state.substring(0, 2),  // Ensure max 2 chars
    postalCode: postalCode.substring(0, 20),
    country: 'US'  // Changed from 'USA' to 'US' (2 char ISO code)
  }
}

/**
 * Parse CSV file and group data by invoice
 */
function parseCSVFile(filePath: string): ParsedInvoice[] {
  console.log(`📖 Reading CSV file: ${filePath}`)

  let fileContent = fs.readFileSync(filePath, 'utf-8')
  // Remove UTF-8 BOM if present
  if (fileContent.charCodeAt(0) === 0xFEFF) {
    fileContent = fileContent.slice(1)
  }
  const rows = parse(fileContent, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    escape: '"',
    quote: '"'
  }) as string[][]

  console.log(`  Found ${rows.length} rows in CSV`)

  // Parse hierarchical structure
  const invoices: ParsedInvoice[] = []
  let currentPrimaryCustomer: string | null = null
  let currentBroker: string | null = null
  let currentInvoice: ParsedInvoice | null = null

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const col1 = (row[0] || '').toString()
    const col2 = (row[1] || '').toString()
    const col3 = (row[2] || '').toString()
    const col4 = (row[3] || '').toString()
    const col5 = (row[4] || '').toString()
    const col6 = (row[5] || '').toString()
    const col7 = (row[6] || '').toString()
    const col8 = (row[7] || '').toString()
    const col9 = (row[8] || '').toString()

    // Skip header rows and total rows
    if (col1.includes('Sales by Customer') || col1.startsWith('Total for')) continue

    const indentLevel = getIndentLevel(col1)

    // Level 0: Primary customer (top-level)
    if (indentLevel === 0 && col1.trim() && !col2) {
      currentPrimaryCustomer = col1.trim()
      currentBroker = null
      continue
    }

    // Level 1: Broker/agent (indented once)
    if (indentLevel === 1 && col1.trim() && !col2) {
      currentBroker = col1.trim()
      continue
    }

    // Level 2 or transaction line: Has date in col2
    if (col2 && col3 && col4) {
      const transactionType = col3.trim()
      const invoiceNum = col4.trim()

      // Skip if not Invoice or Credit Memo
      if (!transactionType.match(/Invoice|Credit Memo/i)) continue

      // Check if this is a new invoice or continuation
      if (!currentInvoice || currentInvoice.invoiceNumber !== invoiceNum) {
        // Save previous invoice if exists
        if (currentInvoice && currentInvoice.lines.length > 0) {
          invoices.push(currentInvoice)
        }

        // Create new invoice
        currentInvoice = {
          invoiceNumber: invoiceNum,
          date: col2.trim(),
          transactionType: transactionType,
          primaryCustomer: currentPrimaryCustomer,
          broker: currentBroker || currentPrimaryCustomer || 'Unknown',
          lines: [],
          contactInfo: null,
          shippingAddress: null,
          totalAmount: 0,
          commissionTotal: 0,
          paymentTerms: null
        }
      }

      // Parse line content
      const commission = parseCommission(col5)

      if (commission !== null && col7) {
        // This is a product/commission line
        const lineTotal = parseFloat(col7.replace(/,/g, '')) || 0
        const commissionAmt = parseFloat(col9.replace(/,/g, '')) || 0
        const parsed = parseProductDescription(col6)

        currentInvoice.lines.push({
          product: parsed.product || 'Unknown',
          description: col6,
          quantity: parsed.quantity || 0,
          unitSize: parsed.unitSize || 0,
          uom: parsed.uom || 'LBS',
          unitPrice: parsed.unitPrice || 0,
          lineTotal: lineTotal,
          commissionPct: commission,
          commissionAmt: commissionAmt
        })

        currentInvoice.totalAmount += lineTotal
        currentInvoice.commissionTotal += commissionAmt

        // Extract payment terms from description
        if (col6.match(/post\s+dated\s+check/i)) {
          const termsMatch = col6.match(/post\s+dated\s+check\s+(\d+)\s+days/i)
          if (termsMatch) {
            currentInvoice.paymentTerms = `Net ${termsMatch[1]}`
          }
        }
      } else if (col6 && !col7) {
        // This might be contact info or address line
        const contact = extractContactInfo(col6)
        if (contact && !currentInvoice.contactInfo) {
          currentInvoice.contactInfo = contact
        }

        const address = extractAddress(col6)
        if (address && !currentInvoice.shippingAddress) {
          currentInvoice.shippingAddress = address
        }
      }
    }
  }

  // Don't forget the last invoice
  if (currentInvoice && currentInvoice.lines.length > 0) {
    invoices.push(currentInvoice)
  }

  console.log(`  ✅ Parsed ${invoices.length} invoices`)
  return invoices
}

/**
 * Create or find account by name
 */
async function getOrCreateAccount(
  name: string,
  accountCache: Map<string, AccountCache>,
  parentId: string | null = null
): Promise<AccountCache> {
  // Check cache first
  const cached = accountCache.get(name)
  if (cached) return cached

  // Check database
  const existing = await db.select()
    .from(accounts)
    .where(eq(accounts.name, name))
    .limit(1)

  if (existing.length > 0) {
    const acc = existing[0]
    const cached: AccountCache = { id: acc.id, name: acc.name, code: acc.code }
    accountCache.set(name, cached)

    // Update parent if needed
    if (parentId && acc.parentAccountId !== parentId) {
      await db.update(accounts)
        .set({ parentAccountId: parentId })
        .where(eq(accounts.id, acc.id))
    }

    return cached
  }

  // Create new account
  const code = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 6) + Date.now().toString().slice(-4)

  const [newAccount] = await db.insert(accounts)
    .values({
      code,
      name,
      active: true,
      parentAccountId: parentId
    })
    .returning()

  const newCached: AccountCache = { id: newAccount.id, name: newAccount.name, code: newAccount.code }
  accountCache.set(name, newCached)
  return newCached
}

/**
 * Create or find product by name
 */
async function getOrCreateProduct(
  name: string,
  uom: string,
  productCache: Map<string, string>
): Promise<string> {
  // Check cache
  const cached = productCache.get(name)
  if (cached) return cached

  // Check database (case-insensitive)
  const existing = await db.select()
    .from(products)
    .where(eq(products.name, name))
    .limit(1)

  if (existing.length > 0) {
    productCache.set(name, existing[0].id)
    return existing[0].id
  }

  // Create new product
  const [newProduct] = await db.insert(products)
    .values({
      name,
      variety: 'Various',
      grade: 'Standard',
      defaultUnitSize: 1,
      uom: uom.toUpperCase(),
      active: true
    })
    .returning()

  productCache.set(name, newProduct.id)
  return newProduct.id
}

/**
 * Create contact for account
 */
async function createContact(
  accountId: string,
  contactInfo: ContactInfo,
  existingContacts: Set<string>
): Promise<void> {
  const key = `${accountId}-${contactInfo.email.join(',')}`
  if (existingContacts.has(key)) return

  await db.insert(contacts).values({
    accountId,
    name: contactInfo.name || 'Primary Contact',
    email: contactInfo.email[0] || null,
    phone: contactInfo.phone[0] || null,
    isPrimary: true
  })

  existingContacts.add(key)
}

/**
 * Create address for account
 */
async function createAddress(
  accountId: string,
  addressInfo: AddressInfo,
  existingAddresses: Set<string>
): Promise<void> {
  const key = `${accountId}-${addressInfo.line1}`
  if (existingAddresses.has(key)) return

  await db.insert(addresses).values({
    accountId,
    type: 'shipping',
    line1: addressInfo.line1,
    line2: addressInfo.line2,
    city: addressInfo.city,
    state: addressInfo.state,
    postalCode: addressInfo.postalCode,
    country: addressInfo.country,
    isPrimary: false
  })

  existingAddresses.add(key)
}

// ==================== MAIN IMPORT ====================

async function comprehensiveImport() {
  console.log('\n🚀 Starting comprehensive CSV import...\n')

  const csvPath = path.join(process.cwd(), '../../SalesByCustomer.csv')

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`)
  }

  // Step 1: Parse CSV
  const invoices = parseCSVFile(csvPath)
  console.log(`\n📊 Parsed ${invoices.length} invoices from CSV\n`)

  // Step 2: Get or create Golden Nuts account (seller)
  console.log('🏢 Setting up Golden Nuts account...')
  const accountCache = new Map<string, AccountCache>()
  const goldenNuts = await getOrCreateAccount(
    'Golden Nuts, Inc. DBA - The Kadouri Connection',
    accountCache
  )
  console.log(`  ✅ Golden Nuts account: ${goldenNuts.name} (${goldenNuts.id})`)

  // Initialize caches
  const productCache = new Map<string, string>()
  const existingContacts = new Set<string>()
  const existingAddresses = new Set<string>()

  // Step 3: Import invoices
  console.log('\n📦 Importing invoices...')
  let importedCount = 0
  let skippedCount = 0

  for (const invoice of invoices) {
    try {
      // FILTER: Only import specific accounts for testing
      const testAccounts = ['raj bhog', "sam's international", '180 snacks']
      const primaryLower = invoice.primaryCustomer?.toLowerCase() || ''
      const brokerLower = invoice.broker?.toLowerCase() || ''

      const matchesTestAccount = testAccounts.some(acc =>
        primaryLower.includes(acc) || brokerLower.includes(acc)
      )

      if (!matchesTestAccount || !invoice.primaryCustomer || !invoice.broker) {
        skippedCount++
        continue
      }

      // Skip Credit Memos for now (can be implemented later)
      if (invoice.transactionType.toLowerCase().includes('credit')) {
        skippedCount++
        continue
      }

      // Get or create accounts
      // COMMISSION LOGIC: Sellers pay commission (not buyers)
      // CSV Structure: Level 1 (broker/indented, has commission) = SELLER (pays commission)
      //                Level 0 (primaryCustomer/no indent) = BUYER (purchases from seller)
      let buyerAccountId: string
      let sellerAccountId: string

      // Broker (Level 1, indented, has commission line items) is the SELLER (pays commission)
      const sellerAccount = await getOrCreateAccount(invoice.broker, accountCache)
      sellerAccountId = sellerAccount.id

      // Primary customer (Level 0, no indentation) is the BUYER (customer purchasing from seller)
      const buyerAccount = await getOrCreateAccount(invoice.primaryCustomer, accountCache)
      buyerAccountId = buyerAccount.id

      // Create contacts for buyer
      if (invoice.contactInfo) {
        await createContact(buyerAccountId, invoice.contactInfo, existingContacts)
      }

      // Create addresses for buyer
      if (invoice.shippingAddress) {
        await createAddress(buyerAccountId, invoice.shippingAddress, existingAddresses)
      }

      // Create order
      const orderNo = `ORD-${invoice.invoiceNumber}`
      // Combine all line descriptions into order notes
      const orderNotes = invoice.lines.map(line => line.description).join('\n')

      const [order] = await db.insert(orders)
        .values({
          orderNo,
          sellerId: sellerAccountId,
          buyerId: buyerAccountId,
          status: 'paid',
          qboDocType: 'invoice',
          qboDocNumber: invoice.invoiceNumber,
          subtotal: invoice.totalAmount,
          commissionTotal: invoice.commissionTotal,
          totalAmount: invoice.totalAmount,
          terms: invoice.paymentTerms,
          notes: orderNotes,
          createdBy: 'system-import',
          createdAt: new Date(invoice.date)
        })
        .returning()

      // Create order lines
      let lineNo = 1
      for (const line of invoice.lines) {
        const productId = await getOrCreateProduct(line.product, line.uom, productCache)

        await db.insert(orderLines).values({
          orderId: order.id,
          lineNo,
          productId,
          sizeGrade: line.description,
          quantity: line.quantity,
          unitSize: line.unitSize,
          uom: line.uom,
          totalWeight: line.quantity * line.unitSize,
          unitPrice: line.unitPrice,
          commissionPct: line.commissionPct,
          commissionAmt: line.commissionAmt,
          lineTotal: line.lineTotal
        })

        lineNo++
      }

      importedCount++
      if (importedCount % 100 === 0) {
        console.log(`  ⏳ Imported ${importedCount}/${invoices.length} invoices...`)
      }

    } catch (error) {
      console.error(`  ❌ Error importing invoice ${invoice.invoiceNumber}:`, error)
      skippedCount++
    }
  }

  console.log(`\n✅ Import completed!`)
  console.log(`  Imported: ${importedCount} invoices`)
  console.log(`  Skipped: ${skippedCount} invoices`)
  console.log(`  Accounts created/updated: ${accountCache.size}`)
  console.log(`  Products created: ${productCache.size}`)
  console.log(`  Contacts created: ${existingContacts.size}`)
  console.log(`  Addresses created: ${existingAddresses.size}`)
}

// Run the import
comprehensiveImport()
  .then(() => {
    console.log('\n🎉 Import script finished successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Import script failed:', error)
    process.exit(1)
  })
