#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <a> tags with divs that handle phone calls and emails
# Fix phone link in seller section
old_phone_seller = '''                                                    {contact.phone && (
                                                      <a
                                                        href={`tel:${contact.phone}`}
                                                        className="text-green-600 hover:text-green-700"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        <Phone className="h-3 w-3" />
                                                      </a>
                                                    )}'''

new_phone_seller = '''                                                    {contact.phone && (
                                                      <div
                                                        onClick={(e) => {
                                                          e.preventDefault()
                                                          e.stopPropagation()
                                                          window.location.href = `tel:${contact.phone}`
                                                        }}
                                                        className="text-green-600 hover:text-green-700 cursor-pointer"
                                                      >
                                                        <Phone className="h-3 w-3" />
                                                      </div>
                                                    )}'''

content = content.replace(old_phone_seller, new_phone_seller)

# Fix email button in seller section (already a button, but let's ensure it's correct)
old_email_seller = '''                                                    {contact.email && (
                                                      <button
                                                        onClick={(e) => handleOpenEmailModal(contact.email, order.sellerAccountName, e)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                      >
                                                        <Mail className="h-3 w-3" />
                                                      </button>
                                                    )}'''

new_email_seller = '''                                                    {contact.email && (
                                                      <div
                                                        onClick={(e) => handleOpenEmailModal(contact.email, order.sellerAccountName, e)}
                                                        className="text-blue-600 hover:text-blue-700 cursor-pointer"
                                                      >
                                                        <Mail className="h-3 w-3" />
                                                      </div>
                                                    )}'''

content = content.replace(old_email_seller, new_email_seller)

# Fix phone link in buyer section
old_phone_buyer = '''                                                    {contact.phone && (
                                                      <a
                                                        href={`tel:${contact.phone}`}
                                                        className="text-green-600 hover:text-green-700"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        <Phone className="h-3 w-3" />
                                                      </a>
                                                    )}'''

new_phone_buyer = '''                                                    {contact.phone && (
                                                      <div
                                                        onClick={(e) => {
                                                          e.preventDefault()
                                                          e.stopPropagation()
                                                          window.location.href = `tel:${contact.phone}`
                                                        }}
                                                        className="text-green-600 hover:text-green-700 cursor-pointer"
                                                      >
                                                        <Phone className="h-3 w-3" />
                                                      </div>
                                                    )}'''

content = content.replace(old_phone_buyer, new_phone_buyer)

# Fix email button in buyer section
old_email_buyer = '''                                                    {contact.email && (
                                                      <button
                                                        onClick={(e) => handleOpenEmailModal(contact.email, order.buyerAccountName, e)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                      >
                                                        <Mail className="h-3 w-3" />
                                                      </button>
                                                    )}'''

new_email_buyer = '''                                                    {contact.email && (
                                                      <div
                                                        onClick={(e) => handleOpenEmailModal(contact.email, order.buyerAccountName, e)}
                                                        className="text-blue-600 hover:text-blue-700 cursor-pointer"
                                                      >
                                                        <Mail className="h-3 w-3" />
                                                      </div>
                                                    )}'''

content = content.replace(old_email_buyer, new_email_buyer)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed nested links: replaced <a> and <button> with <div> inside Link component")
