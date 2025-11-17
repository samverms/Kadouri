import { db } from './src/db';
import { products } from './src/db/schema';

async function main() {
  const allProducts = await db.select().from(products);

  console.log(`\n✅ Total products in database: ${allProducts.length}`);

  console.log('\nSample products (first 20):');
  console.log('='.repeat(80));

  allProducts.slice(0, 20).forEach((p, i) => {
    const varietyStr = p.variety ? ` - ${p.variety}` : '';
    console.log(`${i + 1}. ${p.name}${varietyStr} (${p.defaultUnitSize} ${p.uom})`);
  });

  // Check for variety distribution
  const withVariety = allProducts.filter((p) => p.variety).length;
  const withoutVariety = allProducts.length - withVariety;

  console.log('\n' + '='.repeat(80));
  console.log(`Products with variety: ${withVariety}`);
  console.log(`Products without variety: ${withoutVariety}`);

  // Count by UOM
  const uomCounts = allProducts.reduce((acc, p) => {
    acc[p.uom] = (acc[p.uom] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nProducts by unit of measure:');
  Object.entries(uomCounts).forEach(([uom, count]) => {
    console.log(`  ${uom}: ${count} products`);
  });

  process.exit(0);
}

main().catch(console.error);
