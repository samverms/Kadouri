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

console.log('\n=== Looking for 180 Snacks + Raj Bhog transactions ===\n')

let found = 0
for (let i = 0; i < rows.length; i++) {
  const row = rows[i]

  // Check if row contains both "180 snacks" and "raj bhog"
  const rowText = row.join('|').toLowerCase()

  if (rowText.includes('180 snacks') && rowText.includes('raj bhog')) {
    console.log(`\nFound at row ${i}:`)
    console.log('Primary Customer (col 0):', row[0])
    console.log('Broker/Vendor (col 1):', row[1])
    console.log('Transaction Type (col 4):', row[4])
    console.log('Invoice Number (col 3):', row[3])
    console.log('Amount (col 6):', row[6])
    console.log('Full row:', JSON.stringify(row.slice(0, 10)))
    found++
  }
}

console.log(`\n\nTotal rows found with both "180 snacks" and "raj bhog": ${found}`)

// Also search for just 180 snacks with Raj Bhog as primary customer
console.log('\n\n=== Looking for Raj Bhog as PRIMARY customer with 180 Snacks as broker ===\n')
let found2 = 0
for (let i = 0; i < rows.length; i++) {
  const row = rows[i]

  if (row[0] && row[0].toLowerCase().includes('raj bhog') &&
      row[1] && row[1].toLowerCase().includes('180 snacks')) {
    console.log(`\nFound at row ${i}:`)
    console.log('Primary Customer:', row[0])
    console.log('Broker/Vendor:', row[1])
    console.log('Transaction Type:', row[4])
    console.log('Invoice Number:', row[3])
    found2++
  }
}

console.log(`\n\nTotal: ${found2}`)

process.exit(0)
