#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the popup wider and improve spacing/readability
old_popup = '''                              {openOrdersAccountId === account.id && (
                                <div
                                  className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 p-4"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-gray-900">Recent Orders</h4>'''

new_popup = '''                              {openOrdersAccountId === account.id && (
                                <div
                                  className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 p-5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-base font-semibold text-gray-900">Recent Orders</h4>'''

content = content.replace(old_popup, new_popup)

# Improve the order card styling
old_order_card = '''                                      {accountOrders[account.id].map((order: any) => (
                                        <Link
                                          key={order.id}
                                          href={`/orders/${order.id}`}
                                          className="block p-2 rounded hover:bg-gray-50 border border-gray-100"
                                        >
                                          <div className="flex items-start justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium text-blue-600 font-mono">
                                                {order.orderNo}
                                              </span>
                                              {order.status !== 'paid' && order.status !== 'cancelled' && (
                                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800">
                                                  Outstanding
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-xs text-gray-500">
                                              {new Date(order.orderDate).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-600 space-y-1">
                                            <div className="flex items-center justify-between">
                                              <span>Seller: {order.sellerAccountName}</span>'''

new_order_card = '''                                      {accountOrders[account.id].map((order: any) => (
                                        <Link
                                          key={order.id}
                                          href={`/orders/${order.id}`}
                                          className="block p-4 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all"
                                        >
                                          <div className="flex items-start justify-between mb-3">
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
                                          </div>
                                          <div className="text-sm text-gray-700 space-y-2">
                                            <div className="flex items-center justify-between py-1">
                                              <span className="font-medium">Seller: <span className="font-normal">{order.sellerAccountName}</span></span>'''

content = content.replace(old_order_card, new_order_card)

# Improve buyer line spacing
content = content.replace(
    '''                                            <div className="flex items-center justify-between">
                                              <span>Buyer: {order.buyerAccountName}</span>''',
    '''                                            <div className="flex items-center justify-between py-1">
                                              <span className="font-medium">Buyer: <span className="font-normal">{order.buyerAccountName}</span></span>'''
)

# Improve items section styling
old_items = '''                                            {order.lines && order.lines.length > 0 && (
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
                                            )}'''

new_items = '''                                            {order.lines && order.lines.length > 0 && (
                                              <div className="mt-2 pt-2 border-t border-gray-200">
                                                <div className="font-semibold text-gray-800 mb-1.5 text-xs uppercase tracking-wide">Items:</div>
                                                <div className="space-y-1">
                                                  {order.lines.slice(0, 3).map((line: any, idx: number) => (
                                                    <div key={idx} className="text-gray-700 flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                                                      <span className="truncate font-medium">{line.productCode}</span>
                                                      <span className="ml-3 whitespace-nowrap text-gray-600">{line.quantity.toLocaleString()} lbs</span>
                                                    </div>
                                                  ))}
                                                  {order.lines.length > 3 && (
                                                    <div className="text-gray-500 text-xs italic pl-2">+{order.lines.length - 3} more items</div>
                                                  )}
                                                </div>
                                              </div>
                                            )}'''

content = content.replace(old_items, new_items)

# Improve total section
old_total = '''                                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
                                              <span className="font-medium text-gray-700">Total:</span>
                                              <span className="font-semibold text-gray-900">
                                                ${order.totalAmount?.toLocaleString()}
                                              </span>
                                            </div>'''

new_total = '''                                            <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-gray-300">
                                              <span className="font-semibold text-gray-800 text-base">Total:</span>
                                              <span className="font-bold text-gray-900 text-lg">
                                                ${order.totalAmount?.toLocaleString()}
                                              </span>
                                            </div>'''

content = content.replace(old_total, new_total)

# Increase spacing between order cards
content = content.replace(
    '<div className="space-y-2 max-h-64 overflow-y-auto">',
    '<div className="space-y-3 max-h-96 overflow-y-auto pr-2">'
)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Improved order popup: wider (600px), better spacing, larger text, cleaner design")
