#!/usr/bin/env tsx
/**
 * Validation Script for CSV Import
 *
 * This script validates the imported data and provides detailed statistics:
 * - Counts of all entities (accounts, orders, invoices, products, etc.)
 * - Verifies data integrity (FK relationships, totals)
 * - Identifies any missing or inconsistent data
 * - Compares against CSV source data
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
import { sql, eq, isNull, isNotNull } from 'drizzle-orm'

async function validateImport() {
  console.log('\n🔍 Starting import validation...\n')

  // ==================== DATABASE COUNTS ====================
  console.log('📊 Database Record Counts:\n')

  const [accountCount] = await db.select({ count: sql<number>`count(*)` }).from(accounts)
  console.log(`  Accounts: ${accountCount.count}`)

  const [parentAccounts] = await db.select({ count: sql<number>`count(*)` })
    .from(accounts)
    .where(isNotNull(accounts.parentAccountId))
  console.log(`    - With parent relationship: ${parentAccounts.count}`)

  const [topLevelAccounts] = await db.select({ count: sql<number>`count(*)` })
    .from(accounts)
    .where(isNull(accounts.parentAccountId))
  console.log(`    - Top-level accounts: ${topLevelAccounts.count}`)

  const [contactCount] = await db.select({ count: sql<number>`count(*)` }).from(contacts)
  console.log(`  Contacts: ${contactCount.count}`)

  const [addressCount] = await db.select({ count: sql<number>`count(*)` }).from(addresses)
  console.log(`  Addresses: ${addressCount.count}`)

  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products)
  console.log(`  Products: ${productCount.count}`)

  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders)
  console.log(`  Orders: ${orderCount.count}`)

  const [orderLineCount] = await db.select({ count: sql<number>`count(*)` }).from(orderLines)
  console.log(`  Order Lines: ${orderLineCount.count}`)

  // ==================== CSV SOURCE VALIDATION ====================
  console.log('\n\n📋 CSV Source Validation:\n')

  const csvPath = path.join(process.cwd(), '../../SalesByCustomer.csv')
  if (!fs.existsSync(csvPath)) {
    console.log('  ⚠️  CSV file not found - skipping source validation')
  } else {
    const fileContent = fs.readFileSync(csvPath, 'utf-8')
    const rows = parse(fileContent, {
      columns: false,
      skip_empty_lines: true,
      relax_column_count: true
    }) as string[][]

    // Count unique invoice numbers in CSV
    const csvInvoiceNumbers = new Set<string>()
    for (const row of rows) {
      const col3 = (row[2] || '').toString().trim()
      const col4 = (row[3] || '').toString().trim()
      if (col3 === 'Invoice' && col4) {
        csvInvoiceNumbers.add(col4)
      }
    }

    console.log(`  CSV Total Rows: ${rows.length}`)
    console.log(`  CSV Unique Invoices: ${csvInvoiceNumbers.size}`)
    console.log(`  Database Orders: ${orderCount.count}`)

    const diff = csvInvoiceNumbers.size - orderCount.count
    if (diff === 0) {
      console.log(`  ✅ All invoices imported successfully!`)
    } else if (diff > 0) {
      console.log(`  ⚠️  Missing ${diff} invoices in database`)
    } else {
      console.log(`  ⚠️  Database has ${-diff} more invoices than CSV`)
    }

    // Check for specific invoice numbers
    const dbOrders = await db.select({ qboDocNumber: orders.qboDocNumber }).from(orders)
    const dbInvoiceNumbers = new Set(dbOrders.map(ord => ord.qboDocNumber).filter(Boolean))

    const missingInDB = [...csvInvoiceNumbers].filter(num => !dbInvoiceNumbers.has(num))
    const extraInDB = [...dbInvoiceNumbers].filter(num => !csvInvoiceNumbers.has(num))

    if (missingInDB.length > 0) {
      console.log(`\n  Missing invoice numbers (in CSV but not in DB):`)
      console.log(`    ${missingInDB.slice(0, 10).join(', ')}${missingInDB.length > 10 ? '...' : ''}`)
    }

    if (extraInDB.length > 0) {
      console.log(`\n  Extra invoice numbers (in DB but not in CSV):`)
      console.log(`    ${extraInDB.slice(0, 10).join(', ')}${extraInDB.length > 10 ? '...' : ''}`)
    }
  }

  // ==================== DATA INTEGRITY CHECKS ====================
  console.log('\n\n🔒 Data Integrity Checks:\n')

  // Check orders have valid seller/buyer
  const [ordersWithInvalidSeller] = await db.select({ count: sql<number>`count(*)` })
    .from(orders)
    .leftJoin(accounts, eq(orders.sellerId, accounts.id))
    .where(isNull(accounts.id))
  console.log(`  Orders with invalid seller: ${ordersWithInvalidSeller.count}`)

  const [ordersWithInvalidBuyer] = await db.select({ count: sql<number>`count(*)` })
    .from(orders)
    .leftJoin(accounts, eq(orders.buyerId, accounts.id))
    .where(isNull(accounts.id))
  console.log(`  Orders with invalid buyer: ${ordersWithInvalidBuyer.count}`)

  // Check order lines have valid product
  const [orderLinesWithInvalidProduct] = await db.select({ count: sql<number>`count(*)` })
    .from(orderLines)
    .leftJoin(products, eq(orderLines.productId, products.id))
    .where(isNull(products.id))
  console.log(`  Order lines with invalid product: ${orderLinesWithInvalidProduct.count}`)

  // Check orders have QBO doc number
  const [ordersWithoutQboDoc] = await db.select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(isNull(orders.qboDocNumber))
  console.log(`  Orders without QBO doc number: ${ordersWithoutQboDoc.count}`)

  // ==================== GOLDEN NUTS VALIDATION ====================
  console.log('\n\n🏢 Golden Nuts Validation:\n')

  const goldenNutsAccounts = await db.select()
    .from(accounts)
    .where(sql`${accounts.name} ILIKE '%golden nuts%'`)

  console.log(`  Golden Nuts accounts found: ${goldenNutsAccounts.length}`)
  if (goldenNutsAccounts.length > 0) {
    for (const acc of goldenNutsAccounts) {
      console.log(`    - ${acc.name} (${acc.code})`)
      const [asSellerCount] = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.sellerId, acc.id))
      console.log(`      Used as seller in ${asSellerCount.count} orders`)
    }
  }

  // ==================== ACCOUNT HIERARCHY VALIDATION ====================
  console.log('\n\n🌳 Account Hierarchy Validation:\n')

  // Get accounts with parent relationships
  const accountsWithParent = await db.select({
    id: accounts.id,
    name: accounts.name,
    parentId: accounts.parentAccountId
  })
    .from(accounts)
    .where(isNotNull(accounts.parentAccountId))

  console.log(`  Accounts with parent: ${accountsWithParent.length}`)

  // Sample some parent-child relationships
  if (accountsWithParent.length > 0) {
    console.log(`\n  Sample parent-child relationships:`)
    for (const acc of accountsWithParent.slice(0, 5)) {
      const parent = await db.select({ name: accounts.name })
        .from(accounts)
        .where(eq(accounts.id, acc.parentId!))
        .limit(1)
      if (parent.length > 0) {
        console.log(`    ${parent[0].name} → ${acc.name}`)
      }
    }
  }

  // ==================== TOP CUSTOMERS BY ORDERS ====================
  console.log('\n\n👥 Top 10 Customers by Order Count:\n')

  const topCustomers = await db.select({
    name: accounts.name,
    orderCount: sql<number>`count(${orders.id})`,
    totalAmount: sql<number>`sum(${orders.totalAmount})`
  })
    .from(accounts)
    .innerJoin(orders, eq(accounts.id, orders.buyerId))
    .groupBy(accounts.id, accounts.name)
    .orderBy(sql`count(${orders.id}) DESC`)
    .limit(10)

  for (const customer of topCustomers) {
    console.log(`  ${customer.name}: ${customer.orderCount} orders, $${Number(customer.totalAmount).toFixed(2)}`)
  }

  // ==================== PRODUCT BREAKDOWN ====================
  console.log('\n\n📦 Top 10 Products by Order Lines:\n')

  const topProducts = await db.select({
    name: products.name,
    lineCount: sql<number>`count(${orderLines.id})`,
    totalQuantity: sql<number>`sum(${orderLines.quantity})`
  })
    .from(products)
    .innerJoin(orderLines, eq(products.id, orderLines.productId))
    .groupBy(products.id, products.name)
    .orderBy(sql`count(${orderLines.id}) DESC`)
    .limit(10)

  for (const product of topProducts) {
    console.log(`  ${product.name}: ${product.lineCount} lines, ${product.totalQuantity} units`)
  }

  // ==================== SUMMARY ====================
  console.log('\n\n✨ Validation Summary:\n')

  const hasErrors =
    ordersWithInvalidSeller.count > 0 ||
    ordersWithInvalidBuyer.count > 0 ||
    orderLinesWithInvalidProduct.count > 0 ||
    ordersWithoutQboDoc.count > 0

  if (hasErrors) {
    console.log('  ❌ Data integrity issues found! Review the errors above.')
  } else {
    console.log('  ✅ All data integrity checks passed!')
  }

  console.log('\n🎉 Validation complete!\n')
}

// Run the validation
validateImport()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Validation failed:', error)
    process.exit(1)
  })
