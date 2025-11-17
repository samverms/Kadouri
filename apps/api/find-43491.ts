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

for (let i = 0; i < rows.length; i++) {
  if (rows[i][3] === '43491') {
    console.log(`Found at index ${i}:`)
    console.log(JSON.stringify(rows[i], null, 2))
    console.log(`\nNext row:`)
    console.log(JSON.stringify(rows[i+1], null, 2))
    break
  }
}

process.exit(0)
