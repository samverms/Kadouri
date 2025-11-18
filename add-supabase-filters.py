#!/usr/bin/env python3
# Add Supabase-style inline column filters

# Read the current file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add X icon for clearing filters
content = content.replace(
    "import { Plus, Search, ChevronRight, ChevronDown, Mail, Phone, MapPin, User, Building2, ArrowUpDown, Filter } from 'lucide-react'",
    "import { Plus, Search, ChevronRight, ChevronDown, Mail, Phone, MapPin, User, Building2, ArrowUpDown, Filter, X, ChevronUp } from 'lucide-react'"
)

# 2. Replace statusFilter with column filters
old_state = '''  const [sortField, setSortField] = useState<'code' | 'name' | 'location' | 'status'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')'''

new_state = '''  const [sortField, setSortField] = useState<'code' | 'name' | 'location' | 'status'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = useState({
    code: '',
    name: '',
    location: '',
    status: 'all' as 'all' | 'active' | 'inactive'
  })
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null)'''

content = content.replace(old_state, new_state)

# 3. Update filter logic to use column filters
old_filter = '''  }).filter((account) => {
    // Status filter
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') return account.active
    if (statusFilter === 'inactive') return !account.active
    return true
  }).sort((a, b) => {'''

new_filter = '''  }).filter((account) => {
    // Column filters
    if (columnFilters.code && !account.code.toLowerCase().includes(columnFilters.code.toLowerCase())) {
      return false
    }
    if (columnFilters.name && !account.name.toLowerCase().includes(columnFilters.name.toLowerCase())) {
      return false
    }
    if (columnFilters.location) {
      const location = account.addresses?.find(a => a.isPrimary) || account.addresses?.[0]
      const locationStr = location ? `${location.city}, ${location.state}` : ''
      if (!locationStr.toLowerCase().includes(columnFilters.location.toLowerCase())) {
        return false
      }
    }
    if (columnFilters.status !== 'all') {
      if (columnFilters.status === 'active' && !account.active) return false
      if (columnFilters.status === 'inactive' && account.active) return false
    }
    return true
  }).sort((a, b) => {'''

content = content.replace(old_filter, new_filter)

# 4. Remove the old filter bar
old_filter_bar = '''      {/* Filter Controls */}
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

      {/* Error Message */}'''

new_filter_bar = '''      {/* Error Message */}'''

content = content.replace(old_filter_bar, new_filter_bar)

# 5. Replace table headers with Supabase-style filter headers
old_headers = '''                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
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
                  </tr>
                </thead>'''

new_headers = '''                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="w-8"></th>
                    <th className="px-3 py-2 text-left">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSort('code')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Code
                          {sortField === 'code' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => setOpenFilterColumn(openFilterColumn === 'code' ? null : 'code')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Filter className={`h-3 w-3 ${columnFilters.code ? 'text-blue-600' : ''}`} />
                        </button>
                      </div>
                      {openFilterColumn === 'code' && (
                        <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
                          <Input
                            placeholder="Filter by code..."
                            value={columnFilters.code}
                            onChange={(e) => setColumnFilters({...columnFilters, code: e.target.value})}
                            className="text-sm"
                          />
                          {columnFilters.code && (
                            <button
                              onClick={() => setColumnFilters({...columnFilters, code: ''})}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Clear filter
                            </button>
                          )}
                        </div>
                      )}
                    </th>
                    <th className="px-3 py-2 text-left">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Account Name
                          {sortField === 'name' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => setOpenFilterColumn(openFilterColumn === 'name' ? null : 'name')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Filter className={`h-3 w-3 ${columnFilters.name ? 'text-blue-600' : ''}`} />
                        </button>
                      </div>
                      {openFilterColumn === 'name' && (
                        <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
                          <Input
                            placeholder="Filter by name..."
                            value={columnFilters.name}
                            onChange={(e) => setColumnFilters({...columnFilters, name: e.target.value})}
                            className="text-sm"
                          />
                          {columnFilters.name && (
                            <button
                              onClick={() => setColumnFilters({...columnFilters, name: ''})}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Clear filter
                            </button>
                          )}
                        </div>
                      )}
                    </th>
                    <th className="px-3 py-2 text-left">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSort('location')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Location
                          {sortField === 'location' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => setOpenFilterColumn(openFilterColumn === 'location' ? null : 'location')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Filter className={`h-3 w-3 ${columnFilters.location ? 'text-blue-600' : ''}`} />
                        </button>
                      </div>
                      {openFilterColumn === 'location' && (
                        <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
                          <Input
                            placeholder="Filter by location..."
                            value={columnFilters.location}
                            onChange={(e) => setColumnFilters({...columnFilters, location: e.target.value})}
                            className="text-sm"
                          />
                          {columnFilters.location && (
                            <button
                              onClick={() => setColumnFilters({...columnFilters, location: ''})}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Clear filter
                            </button>
                          )}
                        </div>
                      )}
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
                    <th className="px-3 py-2 text-left">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Status
                          {sortField === 'status' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => setOpenFilterColumn(openFilterColumn === 'status' ? null : 'status')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Filter className={`h-3 w-3 ${columnFilters.status !== 'all' ? 'text-blue-600' : ''}`} />
                        </button>
                      </div>
                      {openFilterColumn === 'status' && (
                        <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-48">
                          <div className="space-y-2">
                            <button
                              onClick={() => setColumnFilters({...columnFilters, status: 'all'})}
                              className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${columnFilters.status === 'all' ? 'bg-blue-50 text-blue-700' : ''}`}
                            >
                              All
                            </button>
                            <button
                              onClick={() => setColumnFilters({...columnFilters, status: 'active'})}
                              className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${columnFilters.status === 'active' ? 'bg-green-50 text-green-700' : ''}`}
                            >
                              Active
                            </button>
                            <button
                              onClick={() => setColumnFilters({...columnFilters, status: 'inactive'})}
                              className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${columnFilters.status === 'inactive' ? 'bg-red-50 text-red-700' : ''}`}
                            >
                              Inactive
                            </button>
                          </div>
                        </div>
                      )}
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>'''

content = content.replace(old_headers, new_headers)

# 6. Add clear all filters button in the search bar area
old_search = '''      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search accounts by name, code, location, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>'''

new_search = '''      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search accounts by name, code, location, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {(columnFilters.code || columnFilters.name || columnFilters.location || columnFilters.status !== 'all') && (
              <Button
                variant="outline"
                onClick={() => setColumnFilters({ code: '', name: '', location: '', status: 'all' })}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>'''

content = content.replace(old_search, new_search)

# Write updated file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('File updated successfully!')
print('- Removed filter bar')
print('- Added Supabase-style inline column filters')
print('- Filter icons in column headers')
print('- Dropdown filter inputs')
print('- Clear filters button')
print('- Sort direction indicators (up/down chevrons)')
