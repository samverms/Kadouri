import { db } from './src/db';
import { accounts, contacts, addresses } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  // Get first 3 accounts with their contacts and addresses
  const allAccounts = await db.select().from(accounts).limit(3);

  console.log('Checking account data...\n');

  for (const account of allAccounts) {
    console.log(`Account: ${account.name} (${account.code})`);

    // Get contacts
    const accountContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.accountId, account.id));

    console.log(`  Contacts: ${accountContacts.length}`);
    accountContacts.forEach(c => {
      console.log(`    - ${c.name}`);
      console.log(`      Email: ${c.email || 'NOT SET'}`);
      console.log(`      Phone: ${c.phone || 'NOT SET'}`);
      console.log(`      Primary: ${c.isPrimary}`);
    });

    // Get addresses
    const accountAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.accountId, account.id));

    console.log(`  Addresses: ${accountAddresses.length}`);
    accountAddresses.forEach(a => {
      console.log(`    - ${a.type}`);
      console.log(`      ${a.line1}`);
      console.log(`      ${a.city}, ${a.state} ${a.postalCode}`);
      console.log(`      Primary: ${a.isPrimary}`);
    });

    console.log('');
  }

  process.exit(0);
}

main().catch(console.error);
