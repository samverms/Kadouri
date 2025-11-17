#!/usr/bin/env npx tsx

import { db } from '../db'
import { orders, orderLines, products } from '../db/schema'

async function checkCounts() {
  const orderCount = await db.select().from(orders)
  const lineCount = await db.select().from(orderLines)
  const productCount = await db.select().from(products)

  console.log('\n📊 Database counts:')
  console.log(`   Orders: ${orderCount.length}`)
  console.log(`   Order Lines: ${lineCount.length}`)
  console.log(`   Products: ${productCount.length}`)

  console.log('\n📦 Sample products:')
  productCount.slice(0, 10).forEach(p => {
    console.log(`   - ${p.name} (${p.uom})`)
  })

  console.log('\n📝 Sample order lines:')
  lineCount.slice(0, 5).forEach(l => {
    console.log(`   - sizeGrade: ${l.sizeGrade}, uom: ${l.uom}`)
  })

  process.exit(0)
}

checkCounts()
