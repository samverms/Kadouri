#!/usr/bin/env python3
# Add email column, sorting, and filtering to accounts grid

# Read the current file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add ArrowUpDown import for sort icon
content = content.replace(
    "import { Plus, Search, ChevronRight, ChevronDown, Mail, Phone, MapPin, User, Building2 } from 'lucide-react'",
    "import { Plus, Search, ChevronRight, ChevronDown, Mail, Phone, MapPin, User, Building2, ArrowUpDown, Filter } from 'lucide-react'"
)

# 2. Add state for sorting and filtering after expandedAccountId
old_state = '''  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')'''

new_state = '''  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortField, setSortField] = useState<'code' | 'name' | 'location' | 'status'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')'''

content = content.replace(old_state, new_state)

# 3. Add sorting function after normalizePhone
old_normalize = '''  // Normalize phone number for search (remove all non-digits)
  const normalizePhone = (phone: string) => {
    return phone.replace(/\\D/g, '')
  }

  const filteredAccounts = accounts.filter((account) => {'''

new_normalize = '''  // Normalize phone number for search (remove all non-digits)
  const normalizePhone = (phone: string) => {
    return phone.replace(/\\D/g, '')
  }

  const handleSort = (field: 'code' | 'name' | 'location' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAccounts = accounts.filter((account) => {'''

content = content.replace(old_normalize, new_normalize)

# 4. Add status filter logic before return false
old_filter_end = '''    // Search in addresses
    if (account.addresses?.some(a =>
      a.line1.toLowerCase().includes(query) ||
      a.line2?.toLowerCase().includes(query) ||
      a.city.toLowerCase().includes(query) ||
      a.state.toLowerCase().includes(query) ||
      a.postalCode.toLowerCase().includes(query)
    )) return true

    return false
  })'''

new_filter_end = '''    // Search in addresses
    if (account.addresses?.some(a =>
      a.line1.toLowerCase().includes(query) ||
      a.line2?.toLowerCase().includes(query) ||
      a.city.toLowerCase().includes(query) ||
      a.state.toLowerCase().includes(query) ||
      a.postalCode.toLowerCase().includes(query)
    )) return true

    return false
  }).filter((account) => {
    // Status filter
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') return account.active
    if (statusFilter === 'inactive') return !account.active
    return true
  }).sort((a, b) => {
    // Sorting
    let compareValue = 0

    if (sortField === 'code') {
      compareValue = a.code.localeCompare(b.code)
    } else if (sortField === 'name') {
      compareValue = a.name.localeCompare(b.name)
    } else if (sortField === 'location') {
      const aLocation = (a.addresses?.find(addr => addr.isPrimary) || a.addresses?.[0])
      const bLocation = (b.addresses?.find(addr => addr.isPrimary) || b.addresses?.[0])
      const aCity = aLocation ? `${aLocation.city}, ${aLocation.state}` : ''
      const bCity = bLocation ? `${bLocation.city}, ${bLocation.state}` : ''
      compareValue = aCity.localeCompare(bCity)
    } else if (sortField === 'status') {
      compareValue = (a.active === b.active) ? 0 : a.active ? -1 : 1
    }

    return sortDirection === 'asc' ? compareValue : -compareValue
  })'''

content = content.replace(old_filter_end, new_filter_end)

# 5. Add filter controls before the table (after search bar)
old_card = '''      {/* Error Message */}
      {error && ('''

new_card = '''      {/* Filter Controls */}
      <Card className="mb-4">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Status:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({accounts.length})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className={statusFilter === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Active ({accounts.filter(a => a.active).length})
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
                className={statusFilter === 'inactive' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Inactive ({accounts.filter(a => !a.active).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && ('''

content = content.replace(old_card, new_card)

# 6. Update table headers with sort buttons
old_headers = '''                  <tr>
                    <th className="w-8"></th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>'''

new_headers = '''                  <tr>
                    <th className="w-8"></th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('code')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Code
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Account Name
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('location')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Location
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>'''

content = content.replace(old_headers, new_headers)

# 7. Add email column in table body (after phone column)
old_contact_cell = '''                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                            {primaryContact?.phone ? (
                              <a href={`tel:${primaryContact.phone}`} className="hover:text-blue-600">
                                {primaryContact.phone}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {primaryContact ? (
                              <div>
                                <div className="font-medium text-gray-900">{primaryContact.name}</div>
                                <div className="text-xs text-gray-500">{primaryContact.email}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>'''

new_contact_cell = '''                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
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

content = content.replace(old_contact_cell, new_contact_cell)

# 8. Update expanded row colspan from 8 to 9
content = content.replace(
    '<td colSpan={8} className="px-6 py-4">',
    '<td colSpan={9} className="px-6 py-4">'
)

# Write updated file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('File updated successfully!')
print('- Added email column')
print('- Added sorting for Code, Name, Location, and Status')
print('- Added status filter (All/Active/Inactive)')
print('- Table now has 9 columns')
