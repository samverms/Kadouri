#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/products/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the filteredTransactions logic to work with real API data
old_filter_logic = '''  const filteredTransactions = transactions
    .filter(
      (txn) =>
        txn.orderNo.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        txn.seller.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        txn.buyer.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        txn.agent.toLowerCase().includes(transactionSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortColumn) return 0

      let aVal: any = a[sortColumn as keyof Transaction]
      let bVal: any = b[sortColumn as keyof Transaction]

      if (sortColumn === 'date') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })'''

new_filter_logic = '''  const filteredTransactions = transactions
    .filter(
      (txn) =>
        txn.orderNo.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        txn.sellerAccountName.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        txn.buyerAccountName.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        (txn.agentName && txn.agentName.toLowerCase().includes(transactionSearch.toLowerCase()))
    )
    .sort((a, b) => {
      if (!sortColumn) return 0

      let aVal: any
      let bVal: any

      if (sortColumn === 'seller') {
        aVal = a.sellerAccountName
        bVal = b.sellerAccountName
      } else if (sortColumn === 'buyer') {
        aVal = a.buyerAccountName
        bVal = b.buyerAccountName
      } else if (sortColumn === 'agent') {
        aVal = a.agentName || ''
        bVal = b.agentName || ''
      } else if (sortColumn === 'date') {
        aVal = new Date(a.orderDate).getTime()
        bVal = new Date(b.orderDate).getTime()
      } else {
        aVal = (a as any)[sortColumn]
        bVal = (b as any)[sortColumn]
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })'''

content = content.replace(old_filter_logic, new_filter_logic)

# Update the Transactions tab tbody to use correct data structure
old_tbody = '''                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((txn) => (
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
                          {new Date(txn.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.seller}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.buyer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.quantity.toLocaleString()} {txn.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${txn.price.toFixed(2)}/{txn.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${txn.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.agent}
                        </td>
                      </tr>
                    ))}
                  </tbody>'''

new_tbody = '''                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((txn) => {
                      const productLines = txn.lines?.filter((line: any) => line.productId === productId) || []
                      const quantity = productLines.reduce((sum: number, line: any) => sum + line.quantity, 0)
                      const total = productLines.reduce((sum: number, line: any) => sum + line.total, 0)
                      const avgPrice = quantity > 0 ? total / quantity : 0

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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${avgPrice.toFixed(2)}/lb
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${total.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {txn.agentName || 'N/A'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>'''

content = content.replace(old_tbody, new_tbody)

# Write back
with open('apps/web/src/app/(dashboard)/products/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Transactions tab with correct data structure and clickable links")
