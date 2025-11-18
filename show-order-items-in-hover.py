#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the order card in hover to show line items
old_order_card = '''                                          <div className="text-xs text-gray-600 space-y-0.5">
                                            <div>Seller: {order.sellerAccountName}</div>
                                            <div>Buyer: {order.buyerAccountName}</div>
                                            <div className="flex items-center justify-between mt-1">
                                              <span>{order.lines?.length || 0} items</span>
                                              <span className="font-semibold text-gray-900">
                                                ${order.totalAmount?.toLocaleString()}
                                              </span>
                                            </div>
                                          </div>'''

new_order_card = '''                                          <div className="text-xs text-gray-600 space-y-0.5">
                                            <div>Seller: {order.sellerAccountName}</div>
                                            <div>Buyer: {order.buyerAccountName}</div>
                                            {order.lines && order.lines.length > 0 && (
                                              <div className="mt-1 pt-1 border-t border-gray-100">
                                                <div className="font-medium text-gray-700 mb-0.5">Items:</div>
                                                {order.lines.slice(0, 3).map((line: any, idx: number) => (
                                                  <div key={idx} className="text-gray-600 flex justify-between">
                                                    <span className="truncate">{line.productCode}</span>
                                                    <span className="ml-2 whitespace-nowrap">{line.quantity} lbs</span>
                                                  </div>
                                                ))}
                                                {order.lines.length > 3 && (
                                                  <div className="text-gray-400 italic">+{order.lines.length - 3} more</div>
                                                )}
                                              </div>
                                            )}
                                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
                                              <span className="font-medium text-gray-700">Total:</span>
                                              <span className="font-semibold text-gray-900">
                                                ${order.totalAmount?.toLocaleString()}
                                              </span>
                                            </div>
                                          </div>'''

content = content.replace(old_order_card, new_order_card)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated order hover to show line items (first 3 items with quantities)")
