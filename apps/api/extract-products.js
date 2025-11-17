const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('C:/pace-crm-main/SalesByCustomer.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Parse products from descriptions
const productsMap = new Map();

data.forEach((row, index) => {
  const description = row[5]; // Memo/Description column

  if (!description || typeof description !== 'string') return;

  const descLower = description.toLowerCase();

  // Skip non-product rows
  if (descLower.includes('@') || descLower.includes('usa') || descLower.includes('brooklyn')) return;

  // Parse product details using regex
  const patterns = [
    // Pattern: "80 cases walnuts combo halves and pieces 25# $1.35/lbs"
    /(\d+)\s+cases?\s+([a-z\s]+?)\s+(\d+)#/i,
    // Pattern: "80 bags walnuts 50#"
    /(\d+)\s+bags?\s+([a-z\s]+?)\s+(\d+)#/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const quantity = match[1];
      let productName = match[2].trim();
      const unitSize = match[3];

      // Clean up product name
      productName = productName
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Extract variety/grade from the full product name
      let variety = null;
      let grade = null;
      let baseName = productName;

      // Common patterns
      if (productName.toLowerCase().includes('combo halves and pieces')) {
        baseName = productName.split(/combo/i)[0].trim();
        variety = 'Combo Halves and Pieces';
      } else if (productName.toLowerCase().includes('hulled')) {
        baseName = productName.split(/hulled/i)[0].trim();
        variety = 'Hulled';
      } else if (productName.toLowerCase().includes('natural')) {
        baseName = productName.split(/natural/i)[0].trim();
        variety = 'Natural';
      } else if (productName.toLowerCase().includes('dark')) {
        baseName = productName.split(/dark/i)[0].trim();
        variety = 'Dark';
      }

      // Create a unique key for the product
      const key = `${baseName}|${variety || ''}|${unitSize}`;

      if (!productsMap.has(key)) {
        productsMap.set(key, {
          name: baseName,
          variety: variety,
          grade: grade,
          defaultUnitSize: unitSize,
          uom: 'lbs',
        });
      }

      break;
    }
  }
});

// Convert map to array
const products = Array.from(productsMap.values());

console.log('Extracted Products:');
console.log('==================');
products.forEach((product, index) => {
  console.log(`${index + 1}. ${product.name}`);
  if (product.variety) console.log(`   Variety: ${product.variety}`);
  if (product.grade) console.log(`   Grade: ${product.grade}`);
  console.log(`   Unit Size: ${product.defaultUnitSize} ${product.uom}`);
  console.log('---');
});

console.log(`\nTotal unique products: ${products.length}`);

// Save to JSON file
fs.writeFileSync(
  'C:/pace-crm-main/apps/api/extracted-products.json',
  JSON.stringify(products, null, 2)
);

console.log('\nProducts saved to extracted-products.json');
