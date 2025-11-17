const desc = '210 cases pistachios shelled halves and pieces 30# $6.75/lbs pick up California 09/24';

// Extract quantity
const qtyMatch = desc.match(/(\d+)\s+(cases?|bags?|master bags?)/i);
console.log('Quantity match:', qtyMatch ? qtyMatch[1] + ' ' + qtyMatch[2] : 'Not found');

// Extract unit size
const sizeMatch = desc.match(/(\d+(?:\.\d+)?)\s*#|(\d+x\d+)\s*#/i);
console.log('Unit size match:', sizeMatch ? (sizeMatch[1] || sizeMatch[2]) : 'Not found');

// Extract unit price
const priceMatch = desc.match(/\$(\d+(?:\.\d+)?)\s*\/\s*(lbs?|bag|case)/i);
console.log('Price match:', priceMatch ? '$' + priceMatch[1] + '/' + priceMatch[2] : 'Not found');

// Determine UOM
let uom = 'LBS';
if (qtyMatch) {
  const unit = qtyMatch[2].toLowerCase();
  if (unit.startsWith('case')) uom = 'CASE';
  else if (unit.startsWith('bag')) uom = 'BAG';
}

// Calculate
const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;
const unitSize = sizeMatch ? parseFloat(sizeMatch[1] || sizeMatch[2].split('x')[1]) : 0;
const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
const totalWeight = qty * unitSize;
const lineTotal = totalWeight * unitPrice;

console.log('\n=== Parsed values ===');
console.log('Quantity:', qty, uom.toLowerCase());
console.log('Unit Size:', unitSize, 'lbs per', uom.toLowerCase());
console.log('UOM:', uom);
console.log('Total Weight:', totalWeight, 'lbs');
console.log('Unit Price:', '$' + unitPrice + '/lb');
console.log('Line Total:', '$' + lineTotal.toLocaleString());
