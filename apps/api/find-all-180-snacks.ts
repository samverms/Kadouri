import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const csvPath = path.join(process.cwd(), '../../SalesByCustomer.csv')
let fileContent = fs.readFileSync(csvPath, 'utf-8')
if (fileContent.charCodeAt(0) === 0xFEFF) {
  fileContent = fileContent.slice(1)
}

const rows = parse(fileContent, {
  columns: false,
  skip_empty_lines: true,
  relax_column_count: true,
  relax_quotes: true,
})

console.log('\n=== All 180 Snacks transactions ===\n')

const customers = new Set<string>()
let count = 0

for (let i = 0; i < rows.length; i++) {
  const row = rows[i]
  const rowText = row.join('|').toLowerCase()

  if (rowText.includes('180 snacks') || rowText.includes('180snacks')) {
    count++
    if (count <= 10) {
      console.log(`\nRow ${i}:`)
      console.log('Col 0 (Primary):', row[0])
      console.log('Col 1 (Broker):', row[1])
      console.log('Col 3 (Invoice):', row[3])
      console.log('Col 4 (Type):', row[4])
    }

    // Track which column has 180 snacks
    if (row[0] && row[0].toLowerCase().includes('180')) {
      customers.add('PRIMARY: ' + row[0])
    }
    if (row[1] && row[1].toLowerCase().includes('180')) {
      customers.add('BROKER: ' + row[1])
    }
  }
}

console.log(`\n\nTotal 180 Snacks transactions: ${count}`)
console.log('\n180 Snacks appears as:')
customers.forEach(c => console.log('  -', c))

process.exit(0)
