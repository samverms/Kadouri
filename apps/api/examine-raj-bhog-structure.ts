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

console.log('\n=== Finding Raj Bhog section in CSV ===\n')

// Find where Raj Bhog starts
let rajBhogStart = -1
for (let i = 0; i < rows.length; i++) {
  if (rows[i][0] && rows[i][0].toLowerCase().includes('raj bhog') && !rows[i][0].toLowerCase().includes('total')) {
    rajBhogStart = i
    break
  }
}

if (rajBhogStart === -1) {
  console.log('Raj Bhog not found!')
  process.exit(1)
}

console.log(`Found Raj Bhog at row ${rajBhogStart}`)
console.log('\nShowing 50 rows starting from Raj Bhog:\n')

for (let i = rajBhogStart; i < rajBhogStart + 50 && i < rows.length; i++) {
  const row = rows[i]
  const indent = row[0] ? row[0].match(/^(\s*)/)?.[1]?.length || 0 : (row[1] ? 4 : 0)

  console.log(`Row ${i} (indent=${indent}):`)
  console.log(`  [0]: "${row[0] || ''}"`)
  console.log(`  [1]: "${row[1] || ''}"`)
  console.log(`  [2]: "${row[2] || ''}"`)
  console.log(`  [3]: "${row[3] || ''}"`)
  console.log(`  [4]: "${row[4] || ''}"`)
  console.log(`  [5]: "${row[5] || ''}"`)
  console.log(`  [6]: "${row[6] || ''}"`)
  console.log()

  // Stop at next major customer
  if (i > rajBhogStart && row[0] && !row[0].startsWith(' ') && row[0].trim().length > 0 && !row[0].toLowerCase().includes('total')) {
    console.log('Next customer found, stopping.')
    break
  }
}

process.exit(0)
