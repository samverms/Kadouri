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

// Extracted from price list
const productData: ProductImport[] = [
  // NUTS
  { itemNumber: 'K1001', pack: '25lb', description: 'Almond Blanched Flour', category: 'NUTS' },
  { itemNumber: 'K1002', pack: '25lb', description: 'Almond Blanched Meal', category: 'NUTS' },
  { itemNumber: 'K1003', pack: '25lb', description: 'Almond Natural Meal', category: 'NUTS' },
  { itemNumber: 'K1004', pack: '50lb', description: 'Almonds 18/20 Non Pareil Variety Type', category: 'NUTS' },
  { itemNumber: 'K1005', pack: '50lb', description: 'Almonds 20/22 Non Pareil Variety Type', category: 'NUTS' },
  { itemNumber: 'K1006', pack: '50lb', description: 'Almonds 23/25 Non Pareil Variety Type', category: 'NUTS' },
  { itemNumber: 'K1007', pack: '50lb', description: 'Almonds 27/30 Non Pareil Variety Type', category: 'NUTS' },
  { itemNumber: 'K1008', pack: '50lb', description: 'Almonds 30/32 Non Pareil Variety Type', category: 'NUTS' },
  { itemNumber: 'K1009', pack: '25lb', description: 'Almonds Blanched Diced', category: 'NUTS' },
  { itemNumber: 'K1010', pack: '25lb', description: 'Almonds Blanched Sliced - Blue Diamond', category: 'NUTS' },
  { itemNumber: 'K1011', pack: '25lb', description: 'Almonds Blanched Slivered - Blue Diamond', category: 'NUTS' },
  { itemNumber: 'K1012', pack: '25lb', description: 'Almonds Blanched Whole - Blue Diamond', category: 'NUTS' },
  { itemNumber: 'K1013', pack: '25lb', description: 'Almonds Natural Sliced - Blue Diamond', category: 'NUTS' },
  { itemNumber: 'K1014', pack: '25lb', description: 'Almonds Blanched Sliced - Custom Process', category: 'NUTS' },
  { itemNumber: 'K1015', pack: '25lb', description: 'Almonds Blanched Slivered - Custom Process', category: 'NUTS' },
  { itemNumber: 'K1016', pack: '25lb', description: 'Almonds Blanched Whole - Custom Process', category: 'NUTS' },
  { itemNumber: 'K1017', pack: '25lb', description: 'Almonds Natural Sliced - Custom Process', category: 'NUTS' },
  { itemNumber: 'K1018', pack: '25lb', description: 'Almonds Organic Shelled', category: 'NUTS' },
  { itemNumber: 'K1019', pack: '25lb', description: 'Almonds Roasted Salted', category: 'NUTS' },
  { itemNumber: 'K1020', pack: '25lb', description: 'Almonds Roasted Unsalted', category: 'NUTS' },

  { itemNumber: 'K1030', pack: '44lb', description: 'Brazil Nuts Medium/Midget', category: 'NUTS' },
  { itemNumber: 'K1031', pack: '44lb', description: 'Brazil Nuts Broken', category: 'NUTS' },

  { itemNumber: 'K1040', pack: '50lb', description: 'Cashews Pieces Small', category: 'NUTS' },
  { itemNumber: 'K1041', pack: '50lb', description: 'Cashews Pieces Large', category: 'NUTS' },
  { itemNumber: 'K1042', pack: '48lb', description: 'Cashews Raw Split', category: 'NUTS' },
  { itemNumber: 'K1043', pack: '25lb', description: 'Cashews Roasted 320 Unsalted', category: 'NUTS' },
  { itemNumber: 'K1044', pack: '25lb', description: 'Cashews Roasted 320 Salted', category: 'NUTS' },
  { itemNumber: 'K1047', pack: '25lb', description: 'Cashews Roasted 240 Unsalted', category: 'NUTS' },
  { itemNumber: 'K1048', pack: '25lb', description: 'Cashews Roasted 240 Salted', category: 'NUTS' },
  { itemNumber: 'K1045', pack: '50lb', description: 'Cashews Whole 240ct (Lg)', category: 'NUTS' },
  { itemNumber: 'K1046', pack: '50lb', description: 'Cashews Whole W320 Raw', category: 'NUTS' },

  { itemNumber: 'K1060', pack: '55lb', description: 'Filberts Blanched Turkish', category: 'NUTS' },
  { itemNumber: 'K1061', pack: '25lb', description: 'Filberts Oregon (w Skin) X-Large', category: 'NUTS' },
  { itemNumber: 'K1062', pack: '25lb', description: 'Filberts Oregon Jumbo 15/17mm', category: 'NUTS' },
  { itemNumber: 'K1063', pack: '55lb', description: 'Filberts Raw Turkish 13/15mm - natural', category: 'NUTS' },
  { itemNumber: 'K1064', pack: '25lb', description: 'Filberts Natural Meal', category: 'NUTS' },
  { itemNumber: 'K1065', pack: '22lb', description: 'Filberts Blanched Roasted Vacpak', category: 'NUTS' },

  { itemNumber: 'K1080', pack: '25lb', description: 'Macadamias #1', category: 'NUTS' },
  { itemNumber: 'K1081', pack: '25lb', description: 'Macadamias #2', category: 'NUTS' },
  { itemNumber: 'K1082', pack: '25lb', description: 'Macadamias #4', category: 'NUTS' },
  { itemNumber: 'K1083', pack: '25lb', description: 'Macadamias #6', category: 'NUTS' },
  { itemNumber: 'K1084', pack: '25lb', description: 'Macadamias Pieces large L4', category: 'NUTS' },

  { itemNumber: 'K1100', pack: '30lb', description: 'Peanuts - Blanched Roasted Salted', category: 'NUTS' },
  { itemNumber: 'K1101', pack: '30lb', description: 'Peanuts - Blanched Roasted No Salt', category: 'NUTS' },
  { itemNumber: 'K1102', pack: '30lb', description: 'Peanuts - Blanched Raw', category: 'NUTS' },
  { itemNumber: 'K1103', pack: '30lb', description: 'Peanuts Rstd Granulated', category: 'NUTS' },
  { itemNumber: 'K1104', pack: '2200lb', description: 'Peanuts Blanched Jumbo Runner', category: 'NUTS' },
  { itemNumber: 'K1105', pack: '110lb', description: 'Peanuts Red Skin Jumbo Runner', category: 'NUTS' },

  { itemNumber: 'K1120', pack: '30lb', description: 'Pecan Fancy Jr Mammoth Halves', category: 'NUTS' },
  { itemNumber: 'K1121', pack: '30lb', description: 'Pecan Fancy X-Large Halves', category: 'NUTS' },
  { itemNumber: 'K1122', pack: '30lb', description: 'Pecan Fancy Pieces Large', category: 'NUTS' },
  { itemNumber: 'K1123', pack: '30lb', description: 'Pecan Fancy Pieces Medium', category: 'NUTS' },
  { itemNumber: 'K1124', pack: '30lb', description: 'Pecan Fancy Pieces Small', category: 'NUTS' },

  { itemNumber: 'K1140', pack: '55.12lb', description: 'Pignolia/Pine Nuts 750ct large', category: 'NUTS' },
  { itemNumber: 'K1141', pack: '55.12lb', description: 'Pignolia/Pine Nuts 1200ct', category: 'NUTS' },
  { itemNumber: 'K1142', pack: '55.12lb', description: 'Pignolia/Pine Nuts 950ct Med', category: 'NUTS' },
  { itemNumber: 'K1143', pack: '27.55lb', description: 'Pignolia/Pine Nuts Spanish', category: 'NUTS' },
  { itemNumber: 'K1144', pack: '22lb', description: 'Pignolia/Pine Nuts Turkish', category: 'NUTS' },

  { itemNumber: 'K1160', pack: '22lb', description: 'Pistachio in shell Turkish roasted salted 32/34', category: 'NUTS' },
  { itemNumber: 'K1161', pack: '30lb', description: 'Pistachio Pieces Lg/Splits', category: 'NUTS' },
  { itemNumber: 'K1162', pack: '25lb', description: 'Pistachio Roasted Salted 21/27 in shell CA', category: 'NUTS' },
  { itemNumber: 'K1163', pack: '25lb', description: 'Pistachio Roasted Unsalted 21/27 in shell CA', category: 'NUTS' },
  { itemNumber: 'K1164', pack: '30lb', description: 'Pistachio Shelled Halves & Pieces CA', category: 'NUTS' },
  { itemNumber: 'K1165', pack: '22lb', description: 'Pistachio Shelled Turkish (Kernel)', category: 'NUTS' },
  { itemNumber: 'K1166', pack: '30lb', description: 'Pistachio Shelled Whole Raw 80% CA', category: 'NUTS' },

  { itemNumber: 'K1180', pack: '55.12lb', description: 'Pumpkin Seeds Shelled AA Sterilized (Pepita)', category: 'NUTS' },
  { itemNumber: 'K1181', pack: '25lb', description: 'Pumpkin Seeds Shelled Roasted Salted', category: 'NUTS' },
  { itemNumber: 'K1182', pack: '25lb', description: 'Pumpkin Seeds Shelled Roasted Unsalted', category: 'NUTS' },
  { itemNumber: 'K1183', pack: '55lb', description: 'Pumpkin Seeds in Shell Jumbo Salted', category: 'NUTS' },

  { itemNumber: 'K1190', pack: '50lb', description: 'Sunflower Shelled Imported Bulgaria', category: 'NUTS' },
  { itemNumber: 'K1191', pack: '30lb', description: 'Sunflower Kernals Roasted Salted', category: 'NUTS' },
  { itemNumber: 'K1192', pack: '30lb', description: 'Sunflower Kernals Roasted Unsalted', category: 'NUTS' },

  { itemNumber: 'K1200', pack: '30lb', description: 'Walnut Combo Granules', category: 'NUTS' },
  { itemNumber: 'K1201', pack: '25lb', description: 'Walnut Combo Halves & Pieces', category: 'NUTS' },
  { itemNumber: 'K1202', pack: '30lb', description: 'Walnut Combo Pieces Baker', category: 'NUTS' },
  { itemNumber: 'K1203', pack: '30lb', description: 'Walnut Combo Pieces Medium', category: 'NUTS' },
  { itemNumber: 'K1204', pack: '30lb', description: 'Walnut Light Granules', category: 'NUTS' },
  { itemNumber: 'K1205', pack: '25lb', description: 'Walnut Light Halves & Pieces Chandler', category: 'NUTS' },
  { itemNumber: 'K1206', pack: '25lb', description: 'Walnut Light Halves & Pieces Domestic', category: 'NUTS' },
  { itemNumber: 'K1207', pack: '22lb', description: 'Walnut Light Halves Chandler', category: 'NUTS' },
  { itemNumber: 'K1208', pack: '25lb', description: 'Walnut Light Medium Pieces', category: 'NUTS' },
  { itemNumber: 'K1209', pack: '50lb', description: 'Walnut in Shell Jumbo Hartley', category: 'NUTS' },

  // FRUITS
  { itemNumber: 'K2001', pack: '44lb', description: 'Apple Rings', category: 'FRUITS' },
  { itemNumber: 'K2002', pack: '44lb', description: 'Apple Diced', category: 'FRUITS' },

  { itemNumber: 'K2010', pack: '28lb', description: 'Apricot #1', category: 'FRUITS' },
  { itemNumber: 'K2011', pack: '28lb', description: 'Apricot #4', category: 'FRUITS' },
  { itemNumber: 'K2012', pack: '28lb', description: 'Apricot Diced Sulphured', category: 'FRUITS' },
  { itemNumber: 'K2013', pack: '25lb', description: 'Apricot Tart Sour Fancy', category: 'FRUITS' },
  { itemNumber: 'K2014', pack: '28lb', description: 'Apricot Organic #4', category: 'FRUITS' },
  { itemNumber: 'K2015', pack: '24x8oz', description: 'Apricot Retail', category: 'FRUITS' },
  { itemNumber: 'K2016', pack: '24x12oz', description: 'Apricot Retail', category: 'FRUITS' },
  { itemNumber: 'K2017', pack: '24x7oz', description: 'Apricot Retail', category: 'FRUITS' },
  { itemNumber: 'K2018', pack: '48x7oz', description: 'Apricot Organic retail', category: 'FRUITS' },

  { itemNumber: 'K2030', pack: '14lb', description: 'Banana Chips', category: 'FRUITS' },
  { itemNumber: 'K2031', pack: '10lb', description: 'Blueberries - Chile', category: 'FRUITS' },
  { itemNumber: 'K2032', pack: '10lb', description: 'Blueberries - USA', category: 'FRUITS' },

  { itemNumber: 'K2040', pack: '44lb', description: 'Cataloupe Sliced', category: 'FRUITS' },
  { itemNumber: 'K2041', pack: '25lb', description: 'Cherries Tart Pitted', category: 'FRUITS' },

  { itemNumber: 'K2050', pack: '25lb', description: 'Coconut Chips', category: 'FRUITS' },
  { itemNumber: 'K2051', pack: '25lb', description: 'Coconut Desiccated Fine (Macaroon)', category: 'FRUITS' },
  { itemNumber: 'K2052', pack: '25lb', description: 'Coconut Desiccated Medium', category: 'FRUITS' },
  { itemNumber: 'K2053', pack: '10lb', description: 'Coconut Flakes Sweetened', category: 'FRUITS' },

  { itemNumber: 'K2060', pack: '25lb', description: 'Cranberries Ocean Spray', category: 'FRUITS' },

  { itemNumber: 'K2070', pack: '30lb', description: 'Currants Zante Greece', category: 'FRUITS' },

  { itemNumber: 'K2080', pack: '11lb', description: 'Dates Medjool Large CA', category: 'FRUITS' },
  { itemNumber: 'K2081', pack: '22lb', description: 'Dates Pitted Tunisian', category: 'FRUITS' },
  { itemNumber: 'K2082', pack: '12x24oz', description: 'Dates Pitted retail', category: 'FRUITS' },
  { itemNumber: 'K2083', pack: '24x10oz', description: 'Dates Pitted retail', category: 'FRUITS' },

  { itemNumber: 'K2100', pack: '11lb', description: 'Figs #1 Jumbo', category: 'FRUITS' },
  { itemNumber: 'K2101', pack: '28lb', description: 'Figs #4', category: 'FRUITS' },
  { itemNumber: 'K2102', pack: '28lb', description: 'Figs Diced', category: 'FRUITS' },
  { itemNumber: 'K2103', pack: '33lb', description: 'Figs Paste', category: 'FRUITS' },
  { itemNumber: 'K2104', pack: '28lb', description: 'Figs Organic', category: 'FRUITS' },
  { itemNumber: 'K2105', pack: '48x8oz', description: 'Figs retail', category: 'FRUITS' },
  { itemNumber: 'K2106', pack: '24x14oz', description: 'Figs retail', category: 'FRUITS' },
  { itemNumber: 'K2107', pack: '48x8oz', description: 'Figs #4 Organic retail', category: 'FRUITS' },

  { itemNumber: 'K2120', pack: '44lb', description: 'Ginger Sliced', category: 'FRUITS' },
  { itemNumber: 'K2121', pack: '20lb', description: 'Goji Berries', category: 'FRUITS' },
  { itemNumber: 'K2122', pack: '44lb', description: 'Guava Sliced', category: 'FRUITS' },
  { itemNumber: 'K2123', pack: '44lb', description: 'Kiwi Slices', category: 'FRUITS' },

  { itemNumber: 'K2130', pack: '44lb', description: 'Mango Diced', category: 'FRUITS' },
  { itemNumber: 'K2131', pack: '44lb', description: 'Mango Sliced', category: 'FRUITS' },
  { itemNumber: 'K2132', pack: '22lb', description: 'Mango Sliced No Dye Low Sugar', category: 'FRUITS' },
  { itemNumber: 'K2133', pack: '22lb', description: 'Mulberries', category: 'FRUITS' },

  { itemNumber: 'K2140', pack: '44lb', description: 'Papaya Chunks', category: 'FRUITS' },
  { itemNumber: 'K2141', pack: '44lb', description: 'Papaya Diced', category: 'FRUITS' },
  { itemNumber: 'K2142', pack: '44lb', description: 'Papaya Spears', category: 'FRUITS' },
  { itemNumber: 'K2143', pack: '25lb', description: 'Papaya Spears No Sugar', category: 'FRUITS' },
  { itemNumber: 'K2144', pack: '25lb', description: 'Peaches', category: 'FRUITS' },
  { itemNumber: 'K2145', pack: '25lb', description: 'Pears Fancy', category: 'FRUITS' },
  { itemNumber: 'K2146', pack: '44lb', description: 'Pineapple Core Dices', category: 'FRUITS' },
  { itemNumber: 'K2147', pack: '44lb', description: 'Pineapple Diced', category: 'FRUITS' },
  { itemNumber: 'K2148', pack: '25lb', description: 'Pineapple No Sugar', category: 'FRUITS' },
  { itemNumber: 'K2149', pack: '44lb', description: 'Pineapple Sliced', category: 'FRUITS' },
  { itemNumber: 'K2150', pack: '44lb', description: 'Pineapple Tidbits Thailand', category: 'FRUITS' },
  { itemNumber: 'K2151', pack: '25lb', description: 'Plum', category: 'FRUITS' },

  { itemNumber: 'K2160', pack: '25lb', description: 'Prunes Pitted 10/20 Jumbo', category: 'FRUITS' },
  { itemNumber: 'K2161', pack: '25lb', description: 'Prunes Pitted 30/40 Ashlock', category: 'FRUITS' },
  { itemNumber: 'K2162', pack: '25lb', description: 'Prunes Pitted 40/50 California', category: 'FRUITS' },
  { itemNumber: 'K2163', pack: '25lb', description: 'Prunes Pitted 50/60', category: 'FRUITS' },
  { itemNumber: 'K2164', pack: '22lb', description: 'Prunes Pitted 70/80 Uzbekistan', category: 'FRUITS' },
  { itemNumber: 'K2165', pack: '25lb', description: 'Prunes with Pits 10/20', category: 'FRUITS' },
  { itemNumber: 'K2166', pack: '28lb', description: 'Prunes Yellow Sour with Pit', category: 'FRUITS' },

  { itemNumber: 'K2180', pack: '30lb', description: 'Raisins Dark - Thompson Pakistani', category: 'FRUITS' },
  { itemNumber: 'K2181', pack: '30lb', description: 'Raisins Dark - Thompson So Africa', category: 'FRUITS' },
  { itemNumber: 'K2182', pack: '30lb', description: 'Raisins Dark Select Thompson Argentina', category: 'FRUITS' },
  { itemNumber: 'K2183', pack: '30lb', description: 'Raisins Golden South Africa', category: 'FRUITS' },
  { itemNumber: 'K2184', pack: '30lb', description: 'Raisins Golden C.A', category: 'FRUITS' },
  { itemNumber: 'K2185', pack: '30lb', description: 'Raisins Golden seedless Fancy', category: 'FRUITS' },
  { itemNumber: 'K2186', pack: '30lb', description: 'Raisins Jumbo Flame', category: 'FRUITS' },
  { itemNumber: 'K2187', pack: '30lb', description: 'Raisins Jumbo Flame Chile', category: 'FRUITS' },
  { itemNumber: 'K2188', pack: '30lb', description: 'Raisins Dark Jumbo', category: 'FRUITS' },

  { itemNumber: 'K2200', pack: '22lb', description: 'Strawberries Thailand', category: 'FRUITS' },
  { itemNumber: 'K2201', pack: '10lb', description: 'Strawberries Turkish', category: 'FRUITS' },

  // MISC
  { itemNumber: 'K3210', pack: '44lb', description: 'Corn Nuts Spain', category: 'MISC' },
  { itemNumber: 'K3211', pack: '22lb', description: 'Greens Peas Fried', category: 'MISC' },
  { itemNumber: 'K3212', pack: '22lb', description: 'Rice Crackers', category: 'MISC' },
  { itemNumber: 'K3213', pack: '22lb', description: 'Wasabi Peas', category: 'MISC' },

  { itemNumber: 'K3220', pack: '44lb', description: 'Chick Pea Flour', category: 'MISC' },
  { itemNumber: 'K3221', pack: '22lb', description: 'Chick Peas Roasted White', category: 'MISC' },
  { itemNumber: 'K3222', pack: '22lb', description: 'Chick Peas Roasted Yellow', category: 'MISC' },

  { itemNumber: 'K3230', pack: '55.12lb', description: 'Quinoa Red', category: 'MISC' },
  { itemNumber: 'K3231', pack: '55.12lb', description: 'Quinoa White', category: 'MISC' },

  { itemNumber: 'K3240', pack: '4/5lb', description: 'Sundried Tomato Halves', category: 'MISC' },
  { itemNumber: 'K3241', pack: '4/5lb', description: 'Sundried Tomato Julienne', category: 'MISC' },

  { itemNumber: 'K3250', pack: '50lb', description: 'Sesame Natural', category: 'MISC' },
  { itemNumber: 'K3251', pack: '50lb', description: 'Sesame Seeds Hulled', category: 'MISC' },
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

  // Handle fractional packs like "4/5lb"
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
    console.log(`Importing ${productData.length} new products...`)

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

    console.log(`\n✅ Successfully imported ${productData.length} products`)
    console.log('All products are:')
    console.log('  - active: true')
    console.log('  - source: "manual"')
    console.log('  - variety: category (NUTS, FRUITS, MISC)')

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
