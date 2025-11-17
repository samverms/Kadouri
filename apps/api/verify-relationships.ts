import { db } from './src/db/index.js'
import { orders, accounts } from './src/db/schema/index.js'
import { eq, sql } from 'drizzle-orm'

async function verifyRelationships() {
  console.log('\n=== Verifying Buyer/Seller Relationships ===\n')

  // Check Sam's International
  console.log('1. Sam\'s International as SELLER:')
  const samsAccount = await db.select().from(accounts)
    .where(sql`${accounts.name} ILIKE '%sam%s international%'`)

  if (samsAccount.length > 0) {
    console.log(`   ✅ Found account: ${samsAccount[0].name} (ID: ${samsAccount[0].id})`)

    // Get orders where Sam's is the SELLER
    const samsAsSellerOrders = await db.select()
      .from(orders)
      .where(eq(orders.sellerId, samsAccount[0].id))
      .limit(10)

    console.log(`   📦 Orders where Sam's International is SELLER: ${samsAsSellerOrders.length}`)

    for (const order of samsAsSellerOrders) {
      const buyer = await db.select().from(accounts).where(eq(accounts.id, order.buyerId))
      if (buyer.length > 0) {
        console.log(`      → ${order.orderNo}: Buyer is "${buyer[0].name}"`)
      }
    }
  } else {
    console.log('   ❌ Sam\'s International not found')
  }

  // Check Raj Bhog Foods
  console.log('\n2. Raj Bhog Foods relationships:')
  const rajBhogAccount = await db.select().from(accounts)
    .where(sql`${accounts.name} ILIKE '%raj bhog%'`)

  if (rajBhogAccount.length > 0) {
    console.log(`   ✅ Found account: ${rajBhogAccount[0].name} (ID: ${rajBhogAccount[0].id})`)

    // Raj Bhog as BUYER
    const rajBhogAsBuyerOrders = await db.select()
      .from(orders)
      .where(eq(orders.buyerId, rajBhogAccount[0].id))
      .limit(10)

    console.log(`\n   📦 Orders where Raj Bhog is BUYER: ${rajBhogAsBuyerOrders.length}`)

    // Get unique sellers
    const sellerIds = new Set(rajBhogAsBuyerOrders.map(o => o.sellerId))
    console.log(`   👥 Unique SELLERS for Raj Bhog: ${sellerIds.size}`)

    for (const sellerId of sellerIds) {
      const seller = await db.select().from(accounts).where(eq(accounts.id, sellerId))
      if (seller.length > 0) {
        const count = rajBhogAsBuyerOrders.filter(o => o.sellerId === sellerId).length
        console.log(`      → ${seller[0].name} (${count} orders)`)
      }
    }

    // Raj Bhog as SELLER
    const rajBhogAsSellerOrders = await db.select()
      .from(orders)
      .where(eq(orders.sellerId, rajBhogAccount[0].id))
      .limit(10)

    console.log(`\n   📦 Orders where Raj Bhog is SELLER: ${rajBhogAsSellerOrders.length}`)

    if (rajBhogAsSellerOrders.length > 0) {
      // Get unique buyers
      const buyerIds = new Set(rajBhogAsSellerOrders.map(o => o.buyerId))
      console.log(`   👥 Unique BUYERS from Raj Bhog: ${buyerIds.size}`)

      for (const buyerId of buyerIds) {
        const buyer = await db.select().from(accounts).where(eq(accounts.id, buyerId))
        if (buyer.length > 0) {
          const count = rajBhogAsSellerOrders.filter(o => o.buyerId === buyerId).length
          console.log(`      → ${buyer[0].name} (${count} orders)`)
        }
      }
    }
  } else {
    console.log('   ❌ Raj Bhog Foods not found')
  }

  // Check 180 Snacks
  console.log('\n3. 180 Snacks as BUYER:')
  const snacksAccount = await db.select().from(accounts)
    .where(sql`${accounts.name} ILIKE '%180 snacks%'`)

  if (snacksAccount.length > 0) {
    console.log(`   ✅ Found account: ${snacksAccount[0].name} (ID: ${snacksAccount[0].id})`)

    // 180 Snacks as BUYER
    const snacksAsBuyerOrders = await db.select()
      .from(orders)
      .where(eq(orders.buyerId, snacksAccount[0].id))
      .limit(10)

    console.log(`   📦 Orders where 180 Snacks is BUYER: ${snacksAsBuyerOrders.length}`)

    // Get unique sellers
    const sellerIds = new Set(snacksAsBuyerOrders.map(o => o.sellerId))
    console.log(`   👥 Unique SELLERS for 180 Snacks: ${sellerIds.size}`)

    for (const sellerId of sellerIds) {
      const seller = await db.select().from(accounts).where(eq(accounts.id, sellerId))
      if (seller.length > 0) {
        const count = snacksAsBuyerOrders.filter(o => o.sellerId === sellerId).length
        console.log(`      → ${seller[0].name} (${count} orders)`)
      }
    }
  } else {
    console.log('   ❌ 180 Snacks not found')
  }

  console.log('\n')
  process.exit(0)
}

verifyRelationships()
