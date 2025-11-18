#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the header order: Primary Contact, Phone, Email (then address)
old_headers = '''                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Address
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>'''

new_headers = '''                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Contact
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Address
                    </th>'''

content = content.replace(old_headers, new_headers)

# Fix the Primary Contact cell to only show name (remove phone and email from it)
old_contact_cell = '''                          <td className="px-6 py-4">
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          </td>'''

new_contact_cell = '''                          <td className="px-6 py-4 whitespace-nowrap">
                            {primaryContact ? (
                              <div className="text-sm font-medium text-gray-900">
                                {primaryContact.name}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No contact</span>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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

content = content.replace(old_contact_cell, new_contact_cell)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed column order: Primary Contact (name only), Phone, Email, Primary Address")
