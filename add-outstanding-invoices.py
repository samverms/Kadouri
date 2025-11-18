#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add outstanding invoices count to the state
content = content.replace(
    '  const [accountOrders, setAccountOrders] = useState<{ [key: string]: any[] }>({})',
    '''  const [accountOrders, setAccountOrders] = useState<{ [key: string]: any[] }>({})
  const [outstandingInvoices, setOutstandingInvoices] = useState<{ [key: string]: number }>({}'''
)

# Update fetchAccountOrders to calculate outstanding invoices
old_fetch = '''  const fetchAccountOrders = async (accountId: string) => {
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
  }'''

new_fetch = '''  const fetchAccountOrders = async (accountId: string) => {
    if (accountOrders[accountId]) return // Already fetched

    setLoadingOrders(accountId)
    try {
      const response = await fetch(`http://localhost:2000/api/invoices?accountId=${accountId}&limit=5`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAccountOrders(prev => ({ ...prev, [accountId]: data }))

        // Count outstanding invoices (not paid)
        const outstanding = data.filter((order: any) =>
          order.status !== 'paid' && order.status !== 'cancelled'
        ).length
        setOutstandingInvoices(prev => ({ ...prev, [accountId]: outstanding }))
      }
    } catch (err) {
      console.error('Fetch orders error:', err)
    } finally {
      setLoadingOrders(null)
    }
  }'''

content = content.replace(old_fetch, new_fetch)

# Add outstanding invoices badge to the orders button
old_icon_button = '''                              <button
                                onClick={(e) => handleToggleOrders(account.id, e)}
                                className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors ${
                                  openOrdersAccountId === account.id
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'hover:bg-purple-50 text-purple-600 hover:text-purple-700'
                                }`}
                              >
                                <FileText className="h-4 w-4" />
                              </button>'''

new_icon_button = '''                              <div className="relative">
                                <button
                                  onClick={(e) => handleToggleOrders(account.id, e)}
                                  className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors ${
                                    openOrdersAccountId === account.id
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'hover:bg-purple-50 text-purple-600 hover:text-purple-700'
                                  }`}
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                                {outstandingInvoices[account.id] > 0 && (
                                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {outstandingInvoices[account.id]}
                                  </span>
                                )}
                              </div>'''

content = content.replace(old_icon_button, new_icon_button)

# Add outstanding badge to each order in the popup
old_order_header = '''                                          <div className="flex items-start justify-between mb-1">
                                            <span className="text-sm font-medium text-blue-600 font-mono">
                                              {order.orderNo}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              {new Date(order.orderDate).toLocaleDateString()}
                                            </span>
                                          </div>'''

new_order_header = '''                                          <div className="flex items-start justify-between mb-1">
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
                                          </div>'''

content = content.replace(old_order_header, new_order_header)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added outstanding invoices indicator with badge count and status labels")
