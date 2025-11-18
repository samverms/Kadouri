#!/usr/bin/env python3
import re

# Read the file
with open('apps/web/src/app/(dashboard)/products/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Recent Transactions section with Usage Statistics + Updated Recent Transactions
old_section = r'''          {/\* Recent Transactions \*/}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Buyer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    \{transactions\.slice\(0, 5\)\.map\(\(txn\) => \(
                      <tr key=\{txn\.id\} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href=\{`/orders/\$\{txn\.id\}`\}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            \{txn\.orderNo\}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          \{new Date\(txn\.date\)\.toLocaleDateString\(\)\}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          \{txn\.seller\}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          \{txn\.buyer\}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          \{txn\.quantity\.toLocaleString\(\)\} \{txn\.unit\}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          \$\{txn\.total\.toLocaleString\(\)\}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          \{txn\.agent\}
                        </td>
                      </tr>
                    \)\)\}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>'''

new_section = '''          {/* Usage Statistics */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-600">Total Orders</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {transactions.length}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-600">Total Quantity</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {totalQuantity.toLocaleString()} lbs
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-600">Total Revenue</div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">
                    ${totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-600">Avg Price</div>
                  <div className="text-2xl font-bold text-orange-900 mt-1">
                    ${avgPrice.toFixed(2)}/lb
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seller
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Buyer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.slice(0, 5).map((txn) => {
                        const productLines = txn.lines?.filter((line: any) => line.productId === productId) || []
                        const quantity = productLines.reduce((sum: number, line: any) => sum + line.quantity, 0)
                        const total = productLines.reduce((sum: number, line: any) => sum + line.total, 0)

                        return (
                          <tr key={txn.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/orders/${txn.id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {txn.orderNo}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(txn.orderDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <Link
                                href={`/accounts/${txn.sellerAccountId}`}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {txn.sellerAccountName}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <Link
                                href={`/accounts/${txn.buyerAccountId}`}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {txn.buyerAccountName}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {quantity.toLocaleString()} lbs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ${total.toLocaleString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This product hasn't been used in any orders yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>'''

content = re.sub(old_section, new_section, content, flags=re.DOTALL)

# Write back
with open('apps/web/src/app/(dashboard)/products/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Product Detail page with usage statistics and proper transaction display")
