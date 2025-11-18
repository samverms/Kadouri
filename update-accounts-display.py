#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the table header to change "Addresses" to "Primary Address"
content = content.replace(
    '''                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Addresses
                    </th>''',
    '''                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Address
                    </th>'''
)

# Update the Primary Contact cell to show name, phone, and email
old_contact_cell = '''                          <td className="px-6 py-4">
                            {primaryContact ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{primaryContact.name}</div>
                                <div className="text-gray-500">{primaryContact.email}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No contact</span>
                            )}
                          </td>'''

new_contact_cell = '''                          <td className="px-6 py-4">
                            {primaryContact ? (
                              <div className="text-sm space-y-1">
                                <div className="font-medium text-gray-900">{primaryContact.name}</div>
                                {primaryContact.phone && (
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <Phone className="h-3 w-3" />
                                    {primaryContact.phone}
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Mail className="h-3 w-3" />
                                  {primaryContact.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No contact</span>
                            )}
                          </td>'''

content = content.replace(old_contact_cell, new_contact_cell)

# Update the Addresses cell to show primary address city, state
old_address_cell = '''                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {account.addresses?.length || 0} address{account.addresses?.length !== 1 ? 'es' : ''}
                          </td>'''

new_address_cell = '''                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(() => {
                              const primaryAddress = account.addresses?.find((a) => a.isPrimary) || account.addresses?.[0]
                              return primaryAddress ? (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {primaryAddress.city}, {primaryAddress.state}
                                </div>
                              ) : (
                                <span className="text-gray-400">No address</span>
                              )
                            })()}
                          </td>'''

content = content.replace(old_address_cell, new_address_cell)

# Update the code section where primaryContact is defined to also define primaryAddress
old_map_section = '''                  {filteredAccounts.map((account) => {
                    const primaryContact = account.contacts?.find((c) => c.isPrimary) || account.contacts?.[0]
                    return ('''

new_map_section = '''                  {filteredAccounts.map((account) => {
                    const primaryContact = account.contacts?.find((c) => c.isPrimary) || account.contacts?.[0]
                    const primaryAddress = account.addresses?.find((a) => a.isPrimary) || account.addresses?.[0]
                    return ('''

content = content.replace(old_map_section, new_map_section)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Accounts page to show primary contact (name, phone, email) and primary address (city, state)")
