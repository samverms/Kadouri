import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { products } from './src/db/schema'
import { config } from './src/config'

const sql = postgres(config.database.url, { max: 1 })
const db = drizzle(sql)

interface ProductImport {
  itemNumber: string
  pack: string
  description: string
  category: string
}

// Missing products with assigned K-codes following the existing pattern
const productData: ProductImport[] = [
  // NUTS - Missing almonds (K1021-K1023)
  { itemNumber: 'K1021', pack: '50lb', description: 'Almonds 25/27 Non Pareil Variety Type', category: 'NUTS' },
  { itemNumber: 'K1022', pack: '25lb', description: 'Almonds Smokehouse', category: 'NUTS' },
  { itemNumber: 'K1023', pack: '50lb', description: 'Almonds Hard Shell', category: 'NUTS' },

  // NUTS - Missing filberts (K1066-K1068)
  { itemNumber: 'K1066', pack: '55.12lb', description: 'Filberts Organic Turkish', category: 'NUTS' },
  { itemNumber: 'K1067', pack: '50lb', description: 'Filberts in Shell', category: 'NUTS' },

  // NUTS - Missing pecans (K1125)
  { itemNumber: 'K1125', pack: '50lb', description: 'Pecans in Shell', category: 'NUTS' },

  // FRUITS - Missing items (K2017-K2019)
  { itemNumber: 'K2084', pack: '33lb', description: 'Date Paste', category: 'FRUITS' },
  { itemNumber: 'K2019', pack: '22lb', description: 'Apricot Sweet Kernels Organic', category: 'FRUITS' },

  // MISC - Missing items (K3252-K3254)
  { itemNumber: 'K3252', pack: '44lb', description: 'Fava Beans Roasted', category: 'MISC' },
  { itemNumber: 'K3253', pack: '22lb', description: 'Natural Tomato Diced', category: 'MISC' },
  { itemNumber: 'K3254', pack: '4/3liter', description: 'Atlas Organic Extra Virgin Olive Oil - TINS', category: 'MISC' },
  { itemNumber: 'K3255', pack: '12/1liter', description: 'Atlas Organic Extra Virgin Olive Oil - Glass btl', category: 'MISC' },

  // ORGANIC products - K4xxx range
  { itemNumber: 'K4001', pack: '25lb', description: 'Almonds Organic', category: 'ORGANIC' },
  { itemNumber: 'K4002', pack: '28lb', description: 'Apricot Organic', category: 'ORGANIC' },
  { itemNumber: 'K4003', pack: '14lb', description: 'Banana Chips Organic', category: 'ORGANIC' },
  { itemNumber: 'K4004', pack: '44lb', description: 'Brazil Nuts Midget Kernels Organic Untreated', category: 'ORGANIC' },
  { itemNumber: 'K4005', pack: '50lb', description: 'Cashew 320 Organic', category: 'ORGANIC' },
  { itemNumber: 'K4006', pack: '25lb', description: 'Coconut Flour Organic', category: 'ORGANIC' },
  { itemNumber: 'K4007', pack: '25lb', description: 'Coconut Shredded Organic', category: 'ORGANIC' },
  { itemNumber: 'K4008', pack: '25lb', description: 'Coconut Chips Organic', category: 'ORGANIC' },
  { itemNumber: 'K4009', pack: '25lb', description: 'Coconut Palm Sugar Organic Big Tree', category: 'ORGANIC' },
  { itemNumber: 'K4010', pack: '25lb', description: 'Cranberries Organic', category: 'ORGANIC' },
  { itemNumber: 'K4011', pack: '11lb', description: 'Dates Medjool Organic', category: 'ORGANIC' },
  { itemNumber: 'K4012', pack: '22lb', description: 'Dates Pitted Organic', category: 'ORGANIC' },
  { itemNumber: 'K4013', pack: '12x24oz', description: 'Dates Organic in cup', category: 'ORGANIC' },
  { itemNumber: 'K4014', pack: '24x10oz', description: 'Dates Organic in cup', category: 'ORGANIC' },
  { itemNumber: 'K4015', pack: '28lb', description: 'Figs Organic', category: 'ORGANIC' },
  { itemNumber: 'K4016', pack: '55lb', description: 'Hazelnuts Organic', category: 'ORGANIC' },
  { itemNumber: 'K4017', pack: '44lb', description: 'Mango Strips Organic', category: 'ORGANIC' },
  { itemNumber: 'K4018', pack: '44lb', description: 'Mango Cheeks Organic', category: 'ORGANIC' },
  { itemNumber: 'K4019', pack: '28lb', description: 'Apricot Natural Organic', category: 'ORGANIC' },
  { itemNumber: 'K4020', pack: '30lb', description: 'Peanuts Raw Organic', category: 'ORGANIC' },
  { itemNumber: 'K4021', pack: '55.12lb', description: 'Pine Nuts Organic', category: 'ORGANIC' },
  { itemNumber: 'K4022', pack: '30lb', description: 'Pistachios Organic', category: 'ORGANIC' },
  { itemNumber: 'K4023', pack: '25lb', description: 'Prunes Pitted Organic', category: 'ORGANIC' },
  { itemNumber: 'K4024', pack: '55.12lb', description: 'Pumpkin Seeds Shelled Organic', category: 'ORGANIC' },
  { itemNumber: 'K4025', pack: '30lb', description: 'Raisins Dark Organic', category: 'ORGANIC' },
  { itemNumber: 'K4026', pack: '22lb', description: 'Strawberries Organic', category: 'ORGANIC' },
  { itemNumber: 'K4027', pack: '50lb', description: 'Tapioca Starch Organic', category: 'ORGANIC' },
  { itemNumber: 'K4028', pack: '25lb', description: 'Walnut LHP Organic', category: 'ORGANIC' },
]

function parsePackSize(pack: string): { size: number; unit: string } {
  // Extract number and unit from pack string
  // Examples: "25lb", "50lb", "24x8oz", "4/5lb", "55.12lb"

  // Handle retail packs like "24x8oz" or "12x24oz"
  if (pack.includes('x')) {
    const match = pack.match(/(\d+)x(\d+)(\w+)/)
    if (match) {
      const [, count, size, unit] = match
      return { size: parseFloat(count) * parseFloat(size), unit }
    }
  }

  // Handle fractional packs like "4/5lb" or "4/3liter"
  if (pack.includes('/')) {
    const match = pack.match(/(\d+)\/(\d+)(\w+)/)
    if (match) {
      const [, numerator, denominator, unit] = match
      return { size: parseFloat(numerator) * parseFloat(denominator), unit }
    }
  }

  // Handle standard packs like "25lb" or "55.12lb"
  const match = pack.match(/(\d+\.?\d*)(\w+)/)
  if (match) {
    const [, size, unit] = match
    return { size: parseFloat(size), unit }
  }

  return { size: 0, unit: 'lb' }
}

async function importProducts() {
  try {
    console.log(`Importing ${productData.length} missing products...`)

    for (const item of productData) {
      const { size, unit } = parsePackSize(item.pack)

      await db.insert(products).values({
        code: item.itemNumber,
        name: item.description,
        variety: item.category,
        defaultUnitSize: size.toString(),
        uom: unit,
        active: true,
        source: 'manual',
      })

      console.log(`✅ Imported: ${item.itemNumber} - ${item.description}`)
    }

    console.log(`\n✅ Successfully imported ${productData.length} missing products`)
    console.log('All products are:')
    console.log('  - active: true')
    console.log('  - source: "manual"')
    console.log('  - variety: category (NUTS, FRUITS, MISC, ORGANIC)')

  } catch (error) {
    console.error('Error importing products:', error)
    throw error
  } finally {
    await sql.end()
  }
}

importProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Import failed:', err)
    process.exit(1)
  })
