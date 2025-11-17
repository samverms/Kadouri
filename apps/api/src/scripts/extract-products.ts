#!/usr/bin/env npx tsx
/**
 * Extract products from imported order lines and create proper product records
 */

import { db } from '../db'
import { products, orderLines } from '../db/schema'
import { eq } from 'drizzle-orm'

async function extractProducts() {
  console.log('Extracting products from order lines...\n')

  // Get all order lines with the misc product
  const lines = await db
    .select({
      sizeGrade: orderLines.sizeGrade,
      uom: orderLines.uom,
    })
    .from(orderLines)

  console.log(`Found ${lines.length} order lines to analyze`)

  // Extract unique product names from sizeGrade field
  const productMap = new Map<string, { name: string; uom: string; count: number }>()

  for (const line of lines) {
    const productName = line.sizeGrade || 'Unknown'

    // Parse product name - typically format is "Product Name - Details"
    // Examples: "Almonds - Nonpareil", "Pistachios - Inshell", etc.
    const parts = productName.split('-').map(p => p.trim())
    const baseName = parts[0] || productName

    const key = `${baseName}|${line.uom}`

    if (productMap.has(key)) {
      const existing = productMap.get(key)!
      existing.count++
    } else {
      productMap.set(key, {
        name: baseName.substring(0, 200), // Limit to 200 chars
        uom: line.uom || 'LBS',
        count: 1,
      })
    }
  }

  console.log(`\nFound ${productMap.size} unique products\n`)

  // Get existing products
  const existingProducts = await db.select().from(products)
  console.log(`Found ${existingProducts.length} existing products`)

  // Create new products
  let created = 0
  let skipped = 0
  const productNameMap = new Map<string, string>() // Maps product name to ID

  for (const [key, productData] of productMap) {
    try {
      // Check if product already exists
      const existing = existingProducts.find(
        p => p.name.toLowerCase() === productData.name.toLowerCase()
      )

      if (existing) {
        productNameMap.set(productData.name, existing.id)
        skipped++
        continue
      }

      // Create new product
      const [newProduct] = await db.insert(products).values({
        name: productData.name,
        variety: 'Various', // We'll need to parse this from description later
        grade: 'Standard',
        uom: productData.uom,
        active: true,
      }).returning()

      productNameMap.set(productData.name, newProduct.id)
      created++

      if (created % 10 === 0) {
        console.log(`Created ${created} products...`)
      }
    } catch (error) {
      console.error(`Failed to create product ${productData.name}:`, error)
    }
  }

  console.log(`\n✅ Product extraction complete!`)
  console.log(`   Created: ${created} new products`)
  console.log(`   Skipped: ${skipped} existing products`)
  console.log(`   Total unique products: ${productMap.size}`)

  // Now update order lines to reference proper products
  console.log('\nUpdating order lines with proper product references...')

  let updated = 0
  const allLines = await db.select().from(orderLines)

  for (const line of allLines) {
    const productName = line.sizeGrade || 'Unknown'
    const parts = productName.split('-').map(p => p.trim())
    const baseName = parts[0] || productName

    const productId = productNameMap.get(baseName.substring(0, 200))

    if (productId && productId !== line.productId) {
      await db
        .update(orderLines)
        .set({ productId })
        .where(eq(orderLines.id, line.id))

      updated++

      if (updated % 1000 === 0) {
        console.log(`Updated ${updated} order lines...`)
      }
    }
  }

  console.log(`\n✅ Updated ${updated} order lines with proper product references`)
}

// Run the extraction
extractProducts()
  .then(() => {
    console.log('\n✅ All done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
