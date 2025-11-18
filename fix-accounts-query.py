#!/usr/bin/env python3
# Fix PostgreSQL ANY() query error by using Drizzle's inArray function

with open('apps/api/src/modules/accounts/accounts.service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add inArray to imports
content = content.replace(
    "import { eq, or, ilike, sql } from 'drizzle-orm'",
    "import { eq, or, ilike, sql, inArray } from 'drizzle-orm'"
)

# 2. Replace SQL ANY() with inArray()
old_queries = '''    // Fetch ALL addresses and contacts in 2 queries instead of N queries
    const [allAddresses, allContacts] = await Promise.all([
      db.select().from(addresses).where(sql`${addresses.accountId} = ANY(${accountIds})`),
      db.select().from(contacts).where(sql`${contacts.accountId} = ANY(${accountIds})`)
    ])'''

new_queries = '''    // Fetch ALL addresses and contacts in 2 queries instead of N queries
    const [allAddresses, allContacts] = await Promise.all([
      db.select().from(addresses).where(inArray(addresses.accountId, accountIds)),
      db.select().from(contacts).where(inArray(contacts.accountId, accountIds))
    ])'''

content = content.replace(old_queries, new_queries)

with open('apps/api/src/modules/accounts/accounts.service.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Fixed PostgreSQL ANY() query')
print('- Added inArray import from drizzle-orm')
print('- Replaced sql ANY() with inArray() function')
