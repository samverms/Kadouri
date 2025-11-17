import XLSX from 'xlsx';
import { db } from './src/db';
import { accounts, contacts, addresses } from './src/db/schema';
import { eq } from 'drizzle-orm';

// Parse address string like "51 Jersey St Paterson NJ 07501"
function parseAddress(addressStr: string): { line1: string; city: string; state: string; postalCode: string } | null {
  if (!addressStr || addressStr.trim() === '') return null;

  const cleaned = addressStr.trim();

  // Try to match pattern: [street] [city] [STATE] [ZIP]
  // Common pattern: "51 Jersey St Paterson NJ 07501"
  const match = cleaned.match(/^(.+?)\s+([A-Za-z\s]+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)(?:\s+[A-Z]{2})?$/);

  if (match) {
    return {
      line1: match[1].trim(),
      city: match[2].trim(),
      state: match[3].trim(),
      postalCode: match[4].trim()
    };
  }

  // Fallback: just use the whole thing as line1, with placeholders
  return {
    line1: cleaned,
    city: 'Unknown',
    state: 'XX',
    postalCode: '00000'
  };
}

// Parse phone string like "Phone:(973) 977-9400 Fax:(732) 339-0073"
function extractMainPhone(phoneStr: string): string | null {
  if (!phoneStr || phoneStr.trim() === '') return null;

  // Extract first phone number
  const match = phoneStr.match(/Phone:\s*([^\s]+(?:\s+[^\s]+)?)/i);
  if (match) {
    return match[1].trim();
  }

  // Just return the cleaned string
  return phoneStr.replace(/Phone:|Fax:|Mobile:/gi, '').trim().split(/\s+/)[0] || null;
}

// Parse email string - take first email
function extractFirstEmail(emailStr: string): string | null {
  if (!emailStr || emailStr.trim() === '') return null;

  const emails = emailStr.split(',').map(e => e.trim()).filter(e => e.includes('@'));
  return emails[0] || null;
}

async function importContactsAndAddresses() {
  try {
    console.log('Reading Accounts.xlsx...');
    const workbook = XLSX.readFile('../../Accounts.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

    console.log(`Found ${rows.length} accounts in Excel file\n`);

    let contactsCreated = 0;
    let addressesCreated = 0;
    let accountsNotFound = 0;

    for (const row of rows) {
      const accountName = row['Customer full name'];
      if (!accountName) continue;

      // Find matching account in database
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.name, accountName))
        .limit(1);

      if (!account) {
        console.log(`⚠ Account not found: ${accountName}`);
        accountsNotFound++;
        continue;
      }

      console.log(`Processing: ${accountName} (${account.code})`);

      // Create contact if email or phone exists
      const email = extractFirstEmail(row['Email']);
      const phone = extractMainPhone(row['Phone numbers']);

      if (email || phone) {
        try {
          const [newContact] = await db.insert(contacts).values({
            accountId: account.id,
            name: accountName, // Use account name as contact name
            email: email || '',
            phone: phone || undefined,
            isPrimary: true
          }).returning();

          console.log(`  ✓ Created contact: ${email || phone}`);
          contactsCreated++;
        } catch (err: any) {
          console.log(`  ✗ Contact error: ${err.message}`);
        }
      }

      // Create bill address
      const billAddr = parseAddress(row['Bill address']);
      if (billAddr) {
        try {
          await db.insert(addresses).values({
            accountId: account.id,
            type: 'billing',
            line1: billAddr.line1,
            line2: undefined,
            city: billAddr.city,
            state: billAddr.state,
            postalCode: billAddr.postalCode,
            isPrimary: true
          });

          console.log(`  ✓ Created billing address: ${billAddr.city}, ${billAddr.state}`);
          addressesCreated++;
        } catch (err: any) {
          console.log(`  ✗ Billing address error: ${err.message}`);
        }
      }

      // Create ship address (if different from bill)
      const shipAddr = parseAddress(row['Ship address']);
      if (shipAddr && row['Ship address'] !== row['Bill address']) {
        try {
          await db.insert(addresses).values({
            accountId: account.id,
            type: 'shipping',
            line1: shipAddr.line1,
            line2: undefined,
            city: shipAddr.city,
            state: shipAddr.state,
            postalCode: shipAddr.postalCode,
            isPrimary: false
          });

          console.log(`  ✓ Created shipping address: ${shipAddr.city}, ${shipAddr.state}`);
          addressesCreated++;
        } catch (err: any) {
          console.log(`  ✗ Shipping address error: ${err.message}`);
        }
      }

      console.log('');
    }

    console.log('\n=== Import Summary ===');
    console.log(`Contacts created: ${contactsCreated}`);
    console.log(`Addresses created: ${addressesCreated}`);
    console.log(`Accounts not found: ${accountsNotFound}`);

  } catch (error) {
    console.error('Import error:', error);
  } finally {
    process.exit(0);
  }
}

importContactsAndAddresses();
