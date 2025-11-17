import * as XLSX from 'xlsx';
import { db } from './src/db';
import { products } from './src/db/schema';
import { eq, and, sql } from 'drizzle-orm';

interface ProductData {
  name: string;
  variety: string | null;
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
  const productsSet = new Set<string>();
  const productsList: ProductData[] = [];

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
      /(\d+)\s+cases?\s+([a-z\s]+?)\s+(\d+)#/i,
      /(\d+)\s+bags?\s+([a-z\s]+?)\s+(\d+)#/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        let productName = match[2].trim();
        const unitSize = match[3];

        // Clean up product name
        productName = productName.replace(/\s+/g, ' ').trim();

        // Extract variety
        let variety: string | null = null;
        let baseName = productName;

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

        // Capitalize base name
        baseName = baseName
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .trim();

        // Skip if invalid
        if (!baseName || baseName.length < 3) continue;

        // Create unique key to prevent duplicates
        const key = `${baseName.toLowerCase()}|${(variety || '').toLowerCase()}|${unitSize}`;

        if (!productsSet.has(key)) {
          productsSet.add(key);
          productsList.push({
            name: baseName,
            variety: variety,
            defaultUnitSize: unitSize,
            uom: 'lbs',
          });
        }

        break;
      }
    }
  });

  // Filter out invalid entries
  const cleanedProducts = productsList.filter(
    (p) => p.name && p.name.length >= 3 && !['And', 'Or', 'The', 'A'].includes(p.name)
  );

  console.log(`\nFound ${cleanedProducts.length} unique products (cleaned and de-duplicated)`);
  console.log('\nSample products:');
  cleanedProducts.slice(0, 15).forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}${p.variety ? ` - ${p.variety}` : ''} (${p.defaultUnitSize} ${p.uom})`);
  });

  console.log('\n\nInserting products into database...');
  console.log('(This may take a few minutes...)\n');

  let inserted = 0;
  let errors = 0;

  for (const product of cleanedProducts) {
    try {
      await db.insert(products).values({
        name: product.name,
        variety: product.variety || null,
        grade: null,
        defaultUnitSize: product.defaultUnitSize,
        uom: product.uom,
        active: true,
      });

      inserted++;

      if (inserted % 50 === 0) {
        console.log(`   Progress: ${inserted}/${cleanedProducts.length} products inserted...`);
      }
    } catch (error: any) {
      // Skip duplicates silently (unique constraint violations)
      if (error.code === '23505') {
        // Duplicate key error
        continue;
      }
      errors++;
      if (errors <= 5) {
        console.error(`Error inserting "${product.name}": ${error.message}`);
      }
    }
  }

  console.log(`\n✅ Insertion complete!`);
  console.log(`   - Successfully inserted: ${inserted} products`);
  console.log(`   - Errors/Duplicates skipped: ${errors}`);
  console.log(`   - Total processed: ${cleanedProducts.length} products`);

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
