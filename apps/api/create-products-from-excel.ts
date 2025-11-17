import * as XLSX from 'xlsx';
import { db } from './src/db';
import { products } from './src/db/schema';
import { sql } from 'drizzle-orm';

interface ProductData {
  name: string;
  variety: string | null;
  grade: string | null;
  defaultUnitSize: string;
  uom: string;
}

async function main() {
  console.log('Reading Excel file...');

  // Read the Excel file
  const workbook = XLSX.readFile('C:/pace-crm-main/SalesByCustomer.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  // Parse products from descriptions
  const productsMap = new Map<string, ProductData>();

  data.forEach((row) => {
    const description = row[5]; // Memo/Description column

    if (!description || typeof description !== 'string') return;

    const descLower = description.toLowerCase();

    // Skip non-product rows
    if (
      descLower.includes('@') ||
      descLower.includes('usa') ||
      descLower.includes('brooklyn') ||
      descLower.includes('check') ||
      descLower.length < 10
    ) return;

    // Parse product details using regex patterns
    const patterns = [
      // Pattern: "80 cases walnuts combo halves and pieces 25# $1.35/lbs"
      /(\d+)\s+cases?\s+([a-z\s]+?)\s+(\d+)#/i,
      // Pattern: "80 bags walnuts 50#"
      /(\d+)\s+bags?\s+([a-z\s]+?)\s+(\d+)#/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        let productName = match[2].trim();
        const unitSize = match[3];

        // Clean up product name - normalize whitespace
        productName = productName.replace(/\s+/g, ' ').trim();

        // Extract variety/grade from the full product name
        let variety: string | null = null;
        let baseName = productName;

        // Common variety patterns
        if (/combo\s+halves\s+and\s+pieces/i.test(productName)) {
          baseName = productName.split(/combo/i)[0].trim();
          variety = 'Combo Halves and Pieces';
        } else if (/light\s+halves\s+and\s+pieces/i.test(productName)) {
          baseName = productName.split(/light/i)[0].trim();
          variety = 'Light Halves and Pieces';
        } else if (/halves\s+and\s+pieces/i.test(productName)) {
          baseName = productName.split(/halves/i)[0].trim();
          variety = 'Halves and Pieces';
        } else if (/hulled/i.test(productName)) {
          baseName = productName.split(/hulled/i)[0].trim();
          variety = 'Hulled';
        } else if (/natural/i.test(productName)) {
          baseName = productName.split(/natural/i)[0].trim();
          variety = 'Natural';
        } else if (/organic/i.test(productName)) {
          baseName = productName.split(/organic/i)[0].trim();
          variety = 'Organic';
        } else if (/roasted\s+salted/i.test(productName)) {
          baseName = productName.split(/roasted/i)[0].trim();
          variety = 'Roasted Salted';
        } else if (/roasted\s+not\s+salted/i.test(productName)) {
          baseName = productName.split(/roasted/i)[0].trim();
          variety = 'Roasted Not Salted';
        } else if (/blanched/i.test(productName)) {
          baseName = productName.split(/blanched/i)[0].trim();
          variety = 'Blanched';
        } else if (/pitted/i.test(productName)) {
          baseName = productName.split(/pitted/i)[0].trim();
          variety = 'Pitted';
        } else if (/dark/i.test(productName)) {
          baseName = productName.split(/dark/i)[0].trim();
          variety = 'Dark';
        }

        // Capitalize base name properly
        baseName = baseName
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .trim();

        // Skip if base name is empty or too short
        if (!baseName || baseName.length < 3) continue;

        // Create a unique key for the product
        const key = `${baseName}|${variety || 'none'}|${unitSize}`;

        if (!productsMap.has(key)) {
          productsMap.set(key, {
            name: baseName,
            variety: variety,
            grade: null,
            defaultUnitSize: unitSize,
            uom: 'lbs',
          });
        }

        break;
      }
    }
  });

  // Convert map to array and filter out invalid entries
  const productsList = Array.from(productsMap.values()).filter(
    (p) => p.name && p.name.length >= 3 && p.name !== 'And'
  );

  console.log(`\nFound ${productsList.length} unique products`);
  console.log('\nSample products:');
  productsList.slice(0, 10).forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}${p.variety ? ` - ${p.variety}` : ''} (${p.defaultUnitSize} ${p.uom})`);
  });

  // Insert into database
  console.log('\n\nInserting products into database...');

  let inserted = 0;
  let skipped = 0;

  for (const product of productsList) {
    try {
      // Check if product already exists - simpler query
      const existing = await db
        .select()
        .from(products)
        .where(sql`
          LOWER(${products.name}) = LOWER(${product.name})
          AND COALESCE(LOWER(${products.variety}), '') = COALESCE(LOWER(${product.variety || ''}), '')
          AND CAST(${products.defaultUnitSize} AS TEXT) = ${product.defaultUnitSize}
        `)
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Insert new product
      await db.insert(products).values({
        name: product.name,
        variety: product.variety || null,
        grade: product.grade || null,
        defaultUnitSize: product.defaultUnitSize,
        uom: product.uom,
        active: true,
      });

      inserted++;

      if (inserted % 100 === 0) {
        console.log(`   Progress: ${inserted} products inserted...`);
      }
    } catch (error: any) {
      console.error(`Error inserting product ${product.name}:`, error.message);
    }
  }

  console.log(`\n✅ Insertion complete!`);
  console.log(`   - Inserted: ${inserted} products`);
  console.log(`   - Skipped (duplicates): ${skipped} products`);
  console.log(`   - Total unique: ${productsList.length} products`);

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
