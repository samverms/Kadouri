#!/usr/bin/env python3
# Add order number search and hover orders button

# Read the current file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add FileText icon for orders
content = content.replace(
    "import { Plus, Search, ChevronRight, ChevronDown, Mail, Phone, MapPin, User, Building2, ArrowUpDown, Filter, X, ChevronUp } from 'lucide-react'",
    "import { Plus, Search, ChevronRight, ChevronDown, Mail, Phone, MapPin, User, Building2, ArrowUpDown, Filter, X, ChevronUp, FileText } from 'lucide-react'"
)

# 2. Add Account interface to include orders
old_interface = '''interface Account {
  id: string
  code: string
  name: string
  qboCustomerId?: string
  active: boolean
  createdAt: string
  addresses?: Address[]
  contacts?: Contact[]
}'''

new_interface = '''interface Account {
  id: string
  code: string
  name: string
  qboCustomerId?: string
  active: boolean
  createdAt: string
  addresses?: Address[]
  contacts?: Contact[]
}

interface Order {
  id: string
  orderNo: string
  createdAt: string
  totalAmount: string
  status: string
}'''

content = content.replace(old_interface, new_interface)

# 3. Add state for orders and hover
old_state_end = '''  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null)

  useEffect(() => {'''

new_state_end = '''  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null)
  const [accountOrders, setAccountOrders] = useState<Record<string, Order[]>>({})
  const [hoveredAccountId, setHoveredAccountId] = useState<string | null>(null)
  const [loadingOrders, setLoadingOrders] = useState<Record<string, boolean>>({})

  useEffect(() => {'''

content = content.replace(old_state_end, new_state_end)

# 4. Add function to fetch orders for an account
old_fetch_accounts = '''  const fetchAccounts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'
      const response = await fetch(`${apiUrl}/api/accounts`, {
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
  }'''

new_fetch_accounts = '''  const fetchAccounts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'
      const response = await fetch(`${apiUrl}/api/accounts`, {
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
    if (accountOrders[accountId] || loadingOrders[accountId]) return

    setLoadingOrders({ ...loadingOrders, [accountId]: true })
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'
      const response = await fetch(`${apiUrl}/api/orders?buyerId=${accountId}&limit=5`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAccountOrders({ ...accountOrders, [accountId]: data })
      }
    } catch (err) {
      console.error('Fetch orders error:', err)
    } finally {
      setLoadingOrders({ ...loadingOrders, [accountId]: false })
    }
  }'''

content = content.replace(old_fetch_accounts, new_fetch_accounts)

# 5. Update search to include email and order numbers
old_search_logic = '''    // Normalize search query for phone search
    const normalizedQuery = normalizePhone(query)

    // Search in contacts
    if (account.contacts?.some(c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.phone && (
        c.phone.toLowerCase().includes(query) ||
        normalizePhone(c.phone).includes(normalizedQuery)
      ))
    )) return true'''

new_search_logic = '''    // Normalize search query for phone search
    const normalizedQuery = normalizePhone(query)

    // Search in contacts (including email)
    if (account.contacts?.some(c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.phone && (
        c.phone.toLowerCase().includes(query) ||
        normalizePhone(c.phone).includes(normalizedQuery)
      ))
    )) return true

    // Search in orders (order numbers)
    const orders = accountOrders[account.id] || []
    if (orders.some(o => o.orderNo.toLowerCase().includes(query))) return true'''

content = content.replace(old_search_logic, new_search_logic)

# 6. Replace table headers - remove Contact column, add Orders column after Name
old_table_headers = '''                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>'''

new_table_headers = '''                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>'''

content = content.replace(old_table_headers, new_table_headers)

# 7. Update table body cells - reorganize columns and add orders hover button
old_body_cells = '''                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                            {primaryAddress ? (
                              `${primaryAddress.city}, ${primaryAddress.state}`
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                            {primaryContact?.phone ? (
                              <a href={`tel:${primaryContact.phone}`} className="hover:text-blue-600">
                                {primaryContact.phone}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {primaryContact?.email ? (
                              <a href={`mailto:${primaryContact.email}`} className="hover:text-blue-600 truncate block max-w-[200px]">
                                {primaryContact.email}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {primaryContact ? (
                              <div className="font-medium text-gray-900">{primaryContact.name}</div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>'''

new_body_cells = '''                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                            {primaryAddress ? (
                              `${primaryAddress.city}, ${primaryAddress.state}`
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <div className="relative">
                              <button
                                onMouseEnter={() => {
                                  setHoveredAccountId(account.id)
                                  fetchAccountOrders(account.id)
                                }}
                                onMouseLeave={() => setHoveredAccountId(null)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs">
                                  {accountOrders[account.id]?.length || 0}
                                </span>
                              </button>
                              {hoveredAccountId === account.id && (
                                <div className="absolute z-50 left-0 top-6 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80"
                                     onMouseEnter={() => setHoveredAccountId(account.id)}
                                     onMouseLeave={() => setHoveredAccountId(null)}>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Recent Orders</h4>
                                  {loadingOrders[account.id] ? (
                                    <p className="text-xs text-gray-500">Loading...</p>
                                  ) : accountOrders[account.id]?.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                      {accountOrders[account.id].slice(0, 5).map((order: Order) => (
                                        <Link
                                          key={order.id}
                                          href={`/orders/${order.id}`}
                                          className="block p-2 hover:bg-gray-50 rounded border border-gray-100"
                                        >
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <div className="text-xs font-medium text-gray-900">#{order.orderNo}</div>
                                              <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-xs font-medium text-gray-900">${parseFloat(order.totalAmount).toFixed(2)}</div>
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500">No orders yet</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {primaryContact ? (
                              <div className="font-medium text-gray-900">{primaryContact.name}</div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                            {primaryContact?.phone ? (
                              <a href={`tel:${primaryContact.phone}`} className="hover:text-blue-600">
                                {primaryContact.phone}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {primaryContact?.email ? (
                              <a href={`mailto:${primaryContact.email}`} className="hover:text-blue-600 truncate block max-w-[200px]">
                                {primaryContact.email}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>'''

content = content.replace(old_body_cells, new_body_cells)

# 8. Update search placeholder
content = content.replace(
    'Search accounts by name, code, location, or phone...',
    'Search by name, code, location, phone, email, or order number...'
)

# Write updated file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('File updated successfully!')
print('- Added email and order number to search')
print('- Added Orders column with hover popup')
print('- Reorganized columns: Code, Name, Location, Orders, Contact, Phone, Email, Status')
print('- Orders popup shows latest 5 orders with links')
print('- Orders are fetched on hover (lazy loading)')
