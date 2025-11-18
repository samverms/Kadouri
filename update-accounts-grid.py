#!/usr/bin/env python3
# Update accounts grid to be compact with city/state and phone

import re

# Read the current file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace header row
old_header = '''                  <tr>
                    <th className="w-12"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Addresses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>'''

new_header = '''                  <tr>
                    <th className="w-8"></th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>'''

content = content.replace(old_header, new_header)

# 2. Add phone normalization function
old_func = '''  const handleAccountCreated = (newAccount: Account) => {
    setAccounts([newAccount, ...accounts])
    setShowCreateModal(false)
  }

  const filteredAccounts = accounts.filter((account) => {'''

new_func = '''  const handleAccountCreated = (newAccount: Account) => {
    setAccounts([newAccount, ...accounts])
    setShowCreateModal(false)
  }

  // Normalize phone number for search (remove all non-digits)
  const normalizePhone = (phone: string) => {
    return phone.replace(/\\D/g, '')
  }

  const filteredAccounts = accounts.filter((account) => {'''

content = content.replace(old_func, new_func)

# 3. Update phone search logic
old_search = '''    // Search in contacts
    if (account.contacts?.some(c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query)
    )) return true'''

new_search = '''    // Normalize search query for phone search
    const normalizedQuery = normalizePhone(query)

    // Search in contacts
    if (account.contacts?.some(c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.phone && (
        c.phone.toLowerCase().includes(query) ||
        normalizePhone(c.phone).includes(normalizedQuery)
      ))
    )) return true'''

content = content.replace(old_search, new_search)

# 4. Update search placeholder
content = content.replace(
    'Search accounts by name or code...',
    'Search accounts by name, code, location, or phone...'
)

# 5. Add primaryAddress extraction
old_map = '''                  {filteredAccounts.map((account) => {
                    const primaryContact = account.contacts?.find((c) => c.isPrimary) || account.contacts?.[0]
                    return ('''

new_map = '''                  {filteredAccounts.map((account) => {
                    const primaryContact = account.contacts?.find((c) => c.isPrimary) || account.contacts?.[0]
                    const primaryAddress = account.addresses?.find((a) => a.isPrimary) || account.addresses?.[0]
                    return ('''

content = content.replace(old_map, new_map)

# 6. Update the table rows - make compact with location and phone
# This is complex, so I'll use a regex pattern
old_row_pattern = r'(<td className="px-4 py-4">.*?</td>\s*<td className="px-6 py-4 whitespace-nowrap">.*?</td>\s*<td className="px-6 py-4 whitespace-nowrap">.*?</td>\s*<td className="px-6 py-4">.*?</td>\s*<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">.*?</td>\s*<td className="px-6 py-4 whitespace-nowrap">.*?</td>\s*<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">)'

# Since regex replacement is complex, let's do string replacement
old_row = '''                          <td className="px-4 py-4">
                            <button
                              onClick={() =>
                                setExpandedAccountId(
                                  expandedAccountId === account.id ? null : account.id
                                )
                              }
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expandedAccountId === account.id ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline font-mono"
                            >
                              {account.code}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600"
                            >
                              {account.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            {primaryContact ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{primaryContact.name}</div>
                                <div className="text-gray-500">{primaryContact.email}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No contact</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {account.addresses?.length || 0} address{account.addresses?.length !== 1 ? 'es' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                account.active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {account.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/accounts/${account.id}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </td>'''

new_row = '''                          <td className="px-2 py-2">
                            <button
                              onClick={() =>
                                setExpandedAccountId(
                                  expandedAccountId === account.id ? null : account.id
                                )
                              }
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expandedAccountId === account.id ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline font-mono"
                            >
                              {account.code}
                            </Link>
                          </td>
                          <td className="px-3 py-2">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600"
                            >
                              {account.name}
                            </Link>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                            {primaryAddress ? (
                              `${primaryAddress.city}, ${primaryAddress.state}`
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                            {primaryContact?.phone ? (
                              <a href={`tel:${primaryContact.phone}`} className="hover:text-blue-600">
                                {primaryContact.phone}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {primaryContact ? (
                              <div>
                                <div className="font-medium text-gray-900">{primaryContact.name}</div>
                                <div className="text-xs text-gray-500">{primaryContact.email}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                account.active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {account.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/accounts/${account.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </td>'''

content = content.replace(old_row, new_row)

# 7. Update expanded row colspan
content = content.replace(
    '<td colSpan={7} className="px-6 py-4">',
    '<td colSpan={8} className="px-6 py-4">'
)

# Write updated file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ File updated successfully!')
print('✅ Grid is now compact')
print('✅ Location shows city, state')
print('✅ Phone number column added')
print('✅ Phone search is format-independent')
