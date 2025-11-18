#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the invoice number clickable
old_invoice_line = '''                                              {order.qboDocNumber && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                  <span className="font-medium">Invoice:</span>
                                                  <span className="font-mono">{order.qboDocNumber}</span>
                                                </div>
                                              )}'''

new_invoice_line = '''                                              {order.qboDocNumber && (
                                                <div
                                                  onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                  }}
                                                  className="flex items-center gap-1 text-xs"
                                                >
                                                  <span className="font-medium text-gray-600">Invoice:</span>
                                                  <Link
                                                    href={`/orders/${order.id}`}
                                                    className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    {order.qboDocNumber}
                                                  </Link>
                                                </div>
                                              )}'''

content = content.replace(old_invoice_line, new_invoice_line)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Made invoice number clickable - links to order detail page")
