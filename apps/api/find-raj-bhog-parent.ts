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

console.log('\n=== Finding Raj Bhog parent seller ===\n')

// Find Raj Bhog
let rajBhogRow = -1
for (let i = 0; i < rows.length; i++) {
  if (rows[i][0] && rows[i][0].trim() === 'Raj Bhog Foods') {
    rajBhogRow = i
    break
  }
}

if (rajBhogRow === -1) {
  console.log('Raj Bhog not found!')
  process.exit(1)
}

console.log(`Found "Raj Bhog Foods" at row ${rajBhogRow}`)
console.log(`Raj Bhog indentation: "${rows[rajBhogRow][0]}"`)

// Look backwards to find the parent (Level 0 - no indentation)
let parentRow = -1
for (let i = rajBhogRow - 1; i >= 0; i--) {
  const row = rows[i]
  // Level 0 has no leading spaces and has content in column 0
  if (row[0] && row[0][0] !== ' ' && row[0].trim().length > 0 && !row[0].toLowerCase().includes('total')) {
    parentRow = i
    break
  }
}

if (parentRow !== -1) {
  console.log(`\nParent SELLER account at row ${parentRow}: "${rows[parentRow][0]}"`)
  console.log('\nShowing 30 rows from parent to Raj Bhog:\n')

  for (let i = parentRow; i <= rajBhogRow + 15 && i < rows.length; i++) {
    const row = rows[i]
    const indent = row[0] ? (row[0].match(/^(\s*)/)?.[1]?.length || 0) : 0
    console.log(`Row ${i} [indent=${indent}]: ${row[0] || '(col1:' + row[1] + ')'}`)
  }
} else {
  console.log('Could not find parent!')
}

process.exit(0)
