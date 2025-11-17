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

// Find invoice 43491
let found = false
for (let i = 0; i < rows.length; i++) {
  const row = rows[i]
  if (row[3] === '43491') {
    console.log(`\nFound invoice 43491 at row ${i}:`)
    console.log('Row data:', row)

    // Check the description field
    if (row[5]) {
      console.log('\nDescription field:')
      console.log(JSON.stringify(row[5]))
      console.log('\nDescription length:', row[5].length)

      // Parse address
      const lines = row[5].split(/[\r\n]+/).map((l: string) => l.trim()).filter(Boolean)
      console.log('\nParsed lines:')
      lines.forEach((line: string, idx: number) => {
        console.log(`  ${idx}: "${line}" (length: ${line.length})`)
      })

      // Look for state/zip
      const stateZipLine = lines.find((l: string) => /,?\s*[A-Z]{2}\s+\d{5}/.test(l))
      if (stateZipLine) {
        console.log('\nState/Zip line found:', stateZipLine)
        const match = stateZipLine.match(/,?\s*([A-Z]{2})\s+(\d{5})/)
        if (match) {
          console.log('State:', match[1], '(length:', match[1].length, ')')
          console.log('Postal Code:', match[2])
        }

        // Extract city
        const cityMatch = stateZipLine.match(/,?\s*([A-Za-z\s]+),?\s*[A-Z]{2}\s+\d{5}/)
        if (cityMatch) {
          console.log('City:', cityMatch[1].trim(), '(length:', cityMatch[1].trim().length, ')')
        }
      }
    }

    found = true
    break
  }
}

if (!found) {
  console.log('Invoice 43491 not found')
}

process.exit(0)
