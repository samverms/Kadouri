#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the order header to show invoice number
old_order_header = '''                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                              <span className="text-base font-semibold text-blue-600 font-mono">
                                                {order.orderNo}
                                              </span>
                                              {order.status !== 'paid' && order.status !== 'cancelled' && (
                                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                                                  Outstanding
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-sm text-gray-500 font-medium">
                                              {new Date(order.orderDate).toLocaleDateString()}
                                            </span>
                                          </div>'''

new_order_header = '''                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex flex-col gap-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-base font-semibold text-blue-600 font-mono">
                                                  {order.orderNo}
                                                </span>
                                                {order.status !== 'paid' && order.status !== 'cancelled' && (
                                                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                                                    Unpaid
                                                  </span>
                                                )}
                                                {order.status === 'paid' && (
                                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                    Paid
                                                  </span>
                                                )}
                                              </div>
                                              {order.qboDocNumber && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                  <span className="font-medium">Invoice:</span>
                                                  <span className="font-mono">{order.qboDocNumber}</span>
                                                </div>
                                              )}
                                            </div>
                                            <span className="text-sm text-gray-500 font-medium">
                                              {new Date(order.orderDate).toLocaleDateString()}
                                            </span>
                                          </div>'''

content = content.replace(old_order_header, new_order_header)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added invoice number and payment status (Paid/Unpaid) to recent orders popup")
