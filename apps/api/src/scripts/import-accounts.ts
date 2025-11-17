import XLSX from 'xlsx'
import { db } from '../db'
import { accounts, addresses, contacts } from '../db/schema'

interface ExcelRow {
  'Customer full name': string
  'Phone numbers': string
  'Email': string
  'Bill address': string
  'Ship address': string
}

function parseAddress(addressStr: string) {
  if (!addressStr || addressStr.trim() === '') return null

  // Try to parse address format: "Street City State Zip Country"
  const parts = addressStr.trim().split(/\s+/)

  // Look for state (2 letter code) and zip
  let state = ''
  let postalCode = ''
  let country = 'US'
  let cityIndex = -1

  for (let i = 0; i < parts.length; i++) {
    // Check if it's a 2-letter state code
    if (parts[i].length === 2 && /^[A-Z]{2}$/.test(parts[i]) && !state) {
      state = parts[i]
      cityIndex = i - 1
      // Next part might be zip
      if (i + 1 < parts.length && /^\d{5}(-\d{4})?$/.test(parts[i + 1])) {
        postalCode = parts[i + 1]
      }
    }
    // Check for country names
    if (parts[i].toLowerCase() === 'turkey' || parts[i].toLowerCase() === 'israel' ||
        parts[i].toLowerCase() === 'canada' || parts[i].toLowerCase() === 'mexico') {
      country = parts[i]
      if (parts[i].toLowerCase() === 'turkey') country = 'TR'
      if (parts[i].toLowerCase() === 'israel') country = 'IL'
      if (parts[i].toLowerCase() === 'canada') country = 'CA'
      if (parts[i].toLowerCase() === 'mexico') country = 'MX'
    }
  }

  // Default to XX for unknown states
  if (!state) state = 'XX'
  if (!postalCode) postalCode = '00000'

  // Extract city (word before state)
  let city = ''
  if (cityIndex > 0) {
    city = parts[cityIndex]
  } else {
    // Try to find a city name (capitalized word not in address line)
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].length > 2 && /^[A-Z][a-z]+$/.test(parts[i]) && parts[i] !== state) {
        city = parts[i]
        cityIndex = i
        break
      }
    }
  }
  if (!city) city = 'Unknown'

  // Everything before city is line1
  const line1 = cityIndex > 0 ? parts.slice(0, cityIndex).join(' ') : addressStr

  return {
    line1: line1 || addressStr.substring(0, 255),
    city: city.substring(0, 100),
    state: state.substring(0, 2),
    postalCode: postalCode.substring(0, 20),
    country: country.substring(0, 2)
  }
}

function parsePhones(phoneStr: string): string[] {
  if (!phoneStr) return []

  // Extract phone numbers from format like "Phone:(973) 977-9400 Fax:(732) 339-0073"
  const phoneRegex = /(?:Phone|Mobile|Fax):?\s*([+\d\s\-\(\)]+)/gi
  const phones: string[] = []
  let match

  while ((match = phoneRegex.exec(phoneStr)) !== null) {
    phones.push(match[1].trim())
  }

  return phones
}

function parseEmails(emailStr: string): string[] {
  if (!emailStr) return []

  // Split by comma and clean up
  return emailStr.split(',')
    .map(e => e.trim())
    .filter(e => e.includes('@'))
}

function generateAccountCode(name: string, index: number): string {
  // Generate code from first letters of name + index
  const words = name.split(/\s+/).filter(w => w.length > 0)
  let code = words.map(w => w[0].toUpperCase()).join('').substring(0, 3)
  code += String(index + 1).padStart(3, '0')
  return code
}

async function importAccounts() {
  try {
    console.log('Reading Accounts.xlsx...')
    const workbook = XLSX.readFile('../../Accounts.xlsx')
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet)

    console.log(`Found ${data.length} accounts to import`)

    // Delete all existing accounts (CASCADE will delete addresses and contacts)
    console.log('Deleting existing accounts...')
    await db.delete(accounts)
    console.log('Existing accounts deleted')

    console.log('Importing new accounts...')
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < data.length; i++) {
      const row = data[i]

      try {
        const accountName = row['Customer full name']?.trim()
        if (!accountName) {
          console.log(`Skipping row ${i + 1}: No customer name`)
          errorCount++
          continue
        }

        // Generate account code
        const code = generateAccountCode(accountName, i)

        // Insert account
        const [account] = await db.insert(accounts).values({
          code,
          name: accountName,
          active: true
        }).returning()

        // Parse and insert addresses
        const billAddr = parseAddress(row['Bill address'])
        const shipAddr = parseAddress(row['Ship address'])

        if (billAddr) {
          await db.insert(addresses).values({
            accountId: account.id,
            type: 'billing',
            line1: billAddr.line1,
            city: billAddr.city,
            state: billAddr.state,
            postalCode: billAddr.postalCode,
            country: billAddr.country,
            isPrimary: true
          })
        }

        if (shipAddr && row['Ship address'] !== row['Bill address']) {
          await db.insert(addresses).values({
            accountId: account.id,
            type: 'shipping',
            line1: shipAddr.line1,
            city: shipAddr.city,
            state: shipAddr.state,
            postalCode: shipAddr.postalCode,
            country: shipAddr.country,
            isPrimary: false
          })
        }

        // Parse and insert contacts
        const emails = parseEmails(row['Email'])
        const phones = parsePhones(row['Phone numbers'])

        if (emails.length > 0) {
          for (let j = 0; j < emails.length; j++) {
            const email = emails[j]
            await db.insert(contacts).values({
              accountId: account.id,
              name: accountName, // Use account name as contact name
              email: email,
              phone: phones[j] || phones[0] || null,
              isPrimary: j === 0
            })
          }
        }

        successCount++
        if (successCount % 10 === 0) {
          console.log(`Imported ${successCount} accounts...`)
        }

      } catch (error) {
        console.error(`Error importing row ${i + 1} (${row['Customer full name']}):`, error)
        errorCount++
      }
    }

    console.log(`\n✅ Import complete!`)
    console.log(`   Successfully imported: ${successCount} accounts`)
    console.log(`   Errors: ${errorCount}`)

  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  }
}

// Run the import
importAccounts()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
