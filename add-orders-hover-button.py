#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state for hover and orders data
old_state = '''  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')'''

new_state = '''  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoveredAccountId, setHoveredAccountId] = useState<string | null>(null)
  const [accountOrders, setAccountOrders] = useState<{ [key: string]: any[] }>({})
  const [loadingOrders, setLoadingOrders] = useState<string | null>(null)'''

content = content.replace(old_state, new_state)

# Add function to fetch orders
fetch_function = '''  const fetchAccounts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:2000/api/accounts', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }

      const data = await response.json()
      setAccounts(data)
    } catch (err) {
      console.error('Fetch accounts error:', err)
      setError('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccountCreated = (newAccount: Account) => {'''

new_fetch_function = '''  const fetchAccounts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:2000/api/accounts', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }

      const data = await response.json()
      setAccounts(data)
    } catch (err) {
      console.error('Fetch accounts error:', err)
      setError('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAccountOrders = async (accountId: string) => {
    if (accountOrders[accountId]) return // Already fetched

    setLoadingOrders(accountId)
    try {
      const response = await fetch(`http://localhost:2000/api/invoices?accountId=${accountId}&limit=5`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAccountOrders(prev => ({ ...prev, [accountId]: data }))
      }
    } catch (err) {
      console.error('Fetch orders error:', err)
    } finally {
      setLoadingOrders(null)
    }
  }

  const handleMouseEnter = (accountId: string) => {
    setHoveredAccountId(accountId)
    fetchAccountOrders(accountId)
  }

  const handleMouseLeave = () => {
    setHoveredAccountId(null)
  }

  const handleAccountCreated = (newAccount: Account) => {'''

content = content.replace(fetch_function, new_fetch_function)

# Add the orders column header
old_header_row = '''                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Contact
                    </th>'''

new_header_row = '''                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Contact
                    </th>'''

content = content.replace(old_header_row, new_header_row)

# Add the orders button cell between account name and primary contact
old_name_contact = '''                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600"
                            >
                              {account.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            {primaryContact ? ('''

new_name_contact = '''                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600"
                            >
                              {account.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center relative">
                            <div
                              className="inline-block"
                              onMouseEnter={() => handleMouseEnter(account.id)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <button className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-purple-50 text-purple-600 hover:text-purple-700 transition-colors">
                                <FileText className="h-4 w-4" />
                              </button>

                              {hoveredAccountId === account.id && (
                                <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-gray-900">Recent Orders</h4>
                                    <Link
                                      href={`/accounts/${account.id}`}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      View All
                                    </Link>
                                  </div>
                                  {loadingOrders === account.id ? (
                                    <div className="text-center py-4 text-sm text-gray-500">
                                      Loading orders...
                                    </div>
                                  ) : accountOrders[account.id]?.length > 0 ? (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {accountOrders[account.id].map((order: any) => (
                                        <Link
                                          key={order.id}
                                          href={`/orders/${order.id}`}
                                          className="block p-2 rounded hover:bg-gray-50 border border-gray-100"
                                        >
                                          <div className="flex items-start justify-between mb-1">
                                            <span className="text-sm font-medium text-blue-600 font-mono">
                                              {order.orderNo}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              {new Date(order.orderDate).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-600 space-y-0.5">
                                            <div>Seller: {order.sellerAccountName}</div>
                                            <div>Buyer: {order.buyerAccountName}</div>
                                            <div className="flex items-center justify-between mt-1">
                                              <span>{order.lines?.length || 0} items</span>
                                              <span className="font-semibold text-gray-900">
                                                ${order.totalAmount?.toLocaleString()}
                                              </span>
                                            </div>
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-sm text-gray-500">
                                      No orders found
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {primaryContact ? ('''

content = content.replace(old_name_contact, new_name_contact)

# Update colspan for expanded row
content = content.replace(
    '<td colSpan={9} className="px-6 py-4">',
    '<td colSpan={10} className="px-6 py-4">'
)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added orders hover button showing last 5 orders")
