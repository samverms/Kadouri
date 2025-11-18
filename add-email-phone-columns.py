#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Email and Phone columns to the header
old_header = '''                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>'''

new_header = '''                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Address
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>'''

content = content.replace(old_header, new_header)

# Add Email and Phone cells to the table body
old_cells = '''                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">'''

new_cells = '''                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {primaryContact?.email ? (
                              <a
                                href={`mailto:${primaryContact.email}`}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                                title={primaryContact.email}
                              >
                                <Mail className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-gray-300">
                                <Mail className="h-4 w-4 inline" />
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {primaryContact?.phone ? (
                              <a
                                href={`tel:${primaryContact.phone}`}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors"
                                title={primaryContact.phone}
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-gray-300">
                                <Phone className="h-4 w-4 inline" />
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">'''

content = content.replace(old_cells, new_cells)

# Update the colspan in the expanded row
content = content.replace(
    '<td colSpan={7} className="px-6 py-4">',
    '<td colSpan={9} className="px-6 py-4">'
)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added Email and Phone action icon columns to Accounts list")
