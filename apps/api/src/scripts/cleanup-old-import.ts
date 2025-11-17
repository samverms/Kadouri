#!/usr/bin/env tsx
/**
 * Cleanup Old Import Data
 *
 * This script removes incorrectly imported data from previous CSV imports.
 * It will:
 * - Delete all orders and order_lines from SalesByCustomer.csv import
 * - Delete all invoices and invoice_lines
 * - Delete products created from CSV import
 * - Keep accounts but clear parent_account_id relationships
 * - Keep Golden Nuts, Inc. account
 */

import { db } from '../db'
import {
  orders,
  orderLines,
  products,
  accounts
} from '../db/schema'
import { sql } from 'drizzle-orm'

async function cleanupOldImport() {
  console.log('🧹 Starting cleanup of old import data...\n')

  try {
    // Step 1: Count existing records before deletion
    console.log('📊 Counting existing records...')
    const [orderCount] = await db.execute(sql`SELECT COUNT(*) as count FROM orders`)
    const [orderLineCount] = await db.execute(sql`SELECT COUNT(*) as count FROM order_lines`)
    const [productCount] = await db.execute(sql`SELECT COUNT(*) as count FROM products`)
    const [accountCount] = await db.execute(sql`SELECT COUNT(*) as count FROM accounts`)

    console.log(`  Orders: ${orderCount.count}`)
    console.log(`  Order Lines: ${orderLineCount.count}`)
    console.log(`  Products: ${productCount.count}`)
    console.log(`  Accounts: ${accountCount.count}`)
    console.log()

    // Step 2: Delete invoice tables if they exist
    console.log('🗑️  Checking for invoice tables...')
    try {
      await db.execute(sql`DELETE FROM invoice_lines`)
      await db.execute(sql`DELETE FROM invoices`)
      console.log(`  ✅ Deleted invoice data`)
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        console.log(`  ℹ️  Invoice tables don't exist yet (will be created during import)`)
      } else {
        throw error
      }
    }

    // Step 3: Delete order lines (must delete before orders due to FK constraint)
    console.log('🗑️  Deleting order lines...')
    await db.execute(sql`DELETE FROM order_lines`)
    console.log(`  ✅ Deleted all order lines`)

    // Step 4: Delete orders
    console.log('🗑️  Deleting orders...')
    await db.execute(sql`DELETE FROM orders`)
    console.log(`  ✅ Deleted all orders`)

    // Step 5: Delete products (these will be recreated during import)
    console.log('🗑️  Deleting products...')
    await db.execute(sql`DELETE FROM products`)
    console.log(`  ✅ Deleted all products`)

    // Step 6: Clear parent_account_id relationships in accounts
    console.log('🔗 Clearing parent account relationships...')
    await db.execute(sql`UPDATE accounts SET parent_account_id = NULL`)
    console.log(`  ✅ Cleared all parent account relationships`)

    console.log('\n✅ Cleanup completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`  - Deleted ${orderCount.count} orders`)
    console.log(`  - Deleted ${orderLineCount.count} order lines`)
    console.log(`  - Deleted ${productCount.count} products`)
    console.log(`  - Kept ${accountCount.count} accounts (relationships cleared)`)
    console.log('\n✨ Database is ready for fresh import!')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  }
}

// Run the cleanup
cleanupOldImport()
  .then(() => {
    console.log('\n🎉 Cleanup script finished!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Cleanup script failed:', error)
    process.exit(1)
  })
