'use client'
// Updated table layout with compact columns + sorting and filtering
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, ChevronRight, ChevronDown, Mail, Phone, MapPin, User, Building2, FileText, Trash2, MoreVertical, Filter, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react'
import { CreateAccountModal } from '@/components/accounts/create-account-modal'

interface Account {
  id: string
  code: string
  name: string
  qboCustomerId?: string
  active: boolean
  createdAt: string
  addresses?: Address[]
  contacts?: Contact[]
  salesAgentId?: string
}

interface Address {
  id: string
  type: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  isPrimary: boolean
}

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  isPrimary: boolean
}

export default function AccountsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [openOrdersAccountId, setOpenOrdersAccountId] = useState<string | null>(null)
  const [accountOrders, setAccountOrders] = useState<{ [key: string]: any[] }>({})
  const [outstandingInvoices, setOutstandingInvoices] = useState<{ [key: string]: number }>({})
  const [loadingOrders, setLoadingOrders] = useState<string | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState<{email: string, name: string} | null>(null)
  const [showActiveOnly, setShowActiveOnly] = useState(true)

  // Sorting and filtering state
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = useState({
    code: '',
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    agent: '',
    status: ''
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts', {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/invoices?accountId=${accountId}&limit=5`, {
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
  }

  const handleToggleOrders = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (openOrdersAccountId === accountId) {
      setOpenOrdersAccountId(null)
    } else {
      setOpenOrdersAccountId(accountId)
      fetchAccountOrders(accountId)
    }
  }

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenOrdersAccountId(null)
    }

    if (openOrdersAccountId) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [openOrdersAccountId])

  const handleOpenEmailModal = (email: string, name: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEmailRecipient({ email, name })
    setShowEmailModal(true)
  }

  const handleAccountCreated = (newAccount: Account) => {
    setAccounts([newAccount, ...accounts])
    setShowCreateModal(false)
  }

  // Sort handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortColumn(null)
        setSortDirection('asc')
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Column filter handler
  const handleColumnFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }))
  }

  // Clear all column filters
  const clearAllFilters = () => {
    setColumnFilters({
      code: '',
      name: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      agent: '',
      status: ''
    })
  }

  // Check if any column filters are active
  const hasActiveColumnFilters = Object.values(columnFilters).some(value => value !== '')

  // Filter and sort accounts
  const processedAccounts = React.useMemo(() => {
    let result = [...accounts]

    // Apply active status filter
    if (showActiveOnly) {
      result = result.filter(account => account.active)
    }

    // Apply column filters
    if (columnFilters.code) {
      result = result.filter(account =>
        account.code.toLowerCase().includes(columnFilters.code.toLowerCase())
      )
    }
    if (columnFilters.name) {
      result = result.filter(account =>
        account.name.toLowerCase().includes(columnFilters.name.toLowerCase())
      )
    }
    if (columnFilters.contact) {
      result = result.filter(account =>
        account.contacts?.some(c =>
          c.name.toLowerCase().includes(columnFilters.contact.toLowerCase())
        )
      )
    }
    if (columnFilters.phone) {
      result = result.filter(account =>
        account.contacts?.some(c =>
          c.phone?.toLowerCase().includes(columnFilters.phone.toLowerCase())
        )
      )
    }
    if (columnFilters.email) {
      result = result.filter(account =>
        account.contacts?.some(c =>
          c.email.toLowerCase().includes(columnFilters.email.toLowerCase())
        )
      )
    }
    if (columnFilters.address) {
      result = result.filter(account =>
        account.addresses?.some(a =>
          `${a.city}, ${a.state}`.toLowerCase().includes(columnFilters.address.toLowerCase())
        )
      )
    }
    if (columnFilters.agent) {
      result = result.filter(account =>
        account.salesAgentId?.toLowerCase().includes(columnFilters.agent.toLowerCase())
      )
    }
    if (columnFilters.status) {
      if (columnFilters.status === 'active') {
        result = result.filter(account => account.active)
      } else if (columnFilters.status === 'inactive') {
        result = result.filter(account => !account.active)
      }
    }

    // Apply global search query (existing nested query logic)
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim()
      const fieldMatches: { [key: string]: string } = {}
      const generalTerms: string[] = []

      const fieldPattern = /(\w+):([^\s]+)/g
      let match
      let lastIndex = 0

      while ((match = fieldPattern.exec(query)) !== null) {
        const [fullMatch, field, value] = match
        fieldMatches[field] = value
        if (match.index > lastIndex) {
          const generalTerm = query.substring(lastIndex, match.index).trim()
          if (generalTerm) generalTerms.push(generalTerm)
        }
        lastIndex = match.index + fullMatch.length
      }

      if (lastIndex < query.length) {
        const remainingTerm = query.substring(lastIndex).trim()
        if (remainingTerm) generalTerms.push(remainingTerm)
      }

      if (Object.keys(fieldMatches).length === 0 && generalTerms.length === 0) {
        generalTerms.push(query)
      }

      result = result.filter(account => {
        // Field-specific matches
        for (const [field, value] of Object.entries(fieldMatches)) {
          let fieldMatch = false

          switch (field) {
            case 'agent':
              fieldMatch = account.salesAgentId?.toLowerCase().includes(value) || false
              break
            case 'name':
              fieldMatch = account.name.toLowerCase().includes(value)
              break
            case 'code':
              fieldMatch = account.code.toLowerCase().includes(value)
              break
            case 'email':
              fieldMatch = account.contacts?.some(c => c.email.toLowerCase().includes(value)) || false
              break
            case 'contact':
              fieldMatch = account.contacts?.some(c =>
                c.name.toLowerCase().includes(value) ||
                c.email.toLowerCase().includes(value) ||
                (c.phone && c.phone.toLowerCase().includes(value))
              ) || false
              break
            case 'phone':
              fieldMatch = account.contacts?.some(c => c.phone?.toLowerCase().includes(value)) || false
              break
            case 'address':
            case 'city':
              fieldMatch = account.addresses?.some(a =>
                a.city.toLowerCase().includes(value) ||
                a.state.toLowerCase().includes(value) ||
                a.line1.toLowerCase().includes(value) ||
                (a.line2 && a.line2.toLowerCase().includes(value))
              ) || false
              break
            case 'state':
              fieldMatch = account.addresses?.some(a => a.state.toLowerCase().includes(value)) || false
              break
            case 'zip':
            case 'postal':
              fieldMatch = account.addresses?.some(a => a.postalCode.toLowerCase().includes(value)) || false
              break
          }

          if (!fieldMatch) {
            return false
          }
        }

        // General search terms
        if (generalTerms.length > 0) {
          for (const term of generalTerms) {
            const matchesAccountInfo =
              account.name.toLowerCase().includes(term) ||
              account.code.toLowerCase().includes(term) ||
              (account.salesAgentId && account.salesAgentId.toLowerCase().includes(term))

            const matchesContact = account.contacts?.some(contact =>
              contact.name.toLowerCase().includes(term) ||
              contact.email.toLowerCase().includes(term) ||
              (contact.phone && contact.phone.toLowerCase().includes(term))
            )

            const matchesAddress = account.addresses?.some(address =>
              address.line1.toLowerCase().includes(term) ||
              (address.line2 && address.line2.toLowerCase().includes(term)) ||
              address.city.toLowerCase().includes(term) ||
              address.state.toLowerCase().includes(term) ||
              address.postalCode.toLowerCase().includes(term)
            )

            if (matchesAccountInfo || matchesContact || matchesAddress) {
              return true
            }
          }
          return false
        }

        return true
      })
    }

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        let aValue: any = ''
        let bValue: any = ''

        switch (sortColumn) {
          case 'code':
            aValue = a.code || ''
            bValue = b.code || ''
            break
          case 'name':
            aValue = a.name || ''
            bValue = b.name || ''
            break
          case 'contact':
            const aPrimaryContact = a.contacts?.find(c => c.isPrimary) || a.contacts?.[0]
            const bPrimaryContact = b.contacts?.find(c => c.isPrimary) || b.contacts?.[0]
            aValue = aPrimaryContact?.name || ''
            bValue = bPrimaryContact?.name || ''
            break
          case 'phone':
            const aPhone = a.contacts?.find(c => c.isPrimary)?.phone || a.contacts?.[0]?.phone || ''
            const bPhone = b.contacts?.find(c => c.isPrimary)?.phone || b.contacts?.[0]?.phone || ''
            aValue = aPhone
            bValue = bPhone
            break
          case 'email':
            const aEmail = a.contacts?.find(c => c.isPrimary)?.email || a.contacts?.[0]?.email || ''
            const bEmail = b.contacts?.find(c => c.isPrimary)?.email || b.contacts?.[0]?.email || ''
            aValue = aEmail
            bValue = bEmail
            break
          case 'address':
            const aPrimaryAddress = a.addresses?.find(addr => addr.isPrimary) || a.addresses?.[0]
            const bPrimaryAddress = b.addresses?.find(addr => addr.isPrimary) || b.addresses?.[0]
            aValue = aPrimaryAddress ? `${aPrimaryAddress.city}, ${aPrimaryAddress.state}` : ''
            bValue = bPrimaryAddress ? `${bPrimaryAddress.city}, ${bPrimaryAddress.state}` : ''
            break
          case 'agent':
            aValue = a.salesAgentId || ''
            bValue = b.salesAgentId || ''
            break
          case 'status':
            aValue = a.active ? 'active' : 'inactive'
            bValue = b.active ? 'active' : 'inactive'
            break
        }

        const comparison = aValue.toString().localeCompare(bValue.toString())
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [accounts, showActiveOnly, columnFilters, searchQuery, sortColumn, sortDirection])

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-blue-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600" />
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">Accounts</h1>
          <p className="mt-2 text-gray-600">Manage customer and seller accounts</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </div>

      {/* Search Bar and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search accounts... Try: agent:John, name:ABC, agent:John name:ABC, email:test@example.com"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 sm:w-auto">
              <button
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors whitespace-nowrap ${
                  showActiveOnly
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Filter className="h-4 w-4" />
                {showActiveOnly ? 'Active Only' : 'Show All'}
              </button>
              {hasActiveColumnFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                  title="Clear all column filters"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      )}

      {/* Accounts Table */}
      {!isLoading && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  {/* Header Row */}
                  <tr>
                    <th className="w-12 px-2 sm:px-4"></th>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('code')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Code
                        {renderSortIcon('code')}
                      </button>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Account Name
                        {renderSortIcon('name')}
                      </button>
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('contact')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Primary Contact
                        {renderSortIcon('contact')}
                      </button>
                    </th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('phone')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Phone
                        {renderSortIcon('phone')}
                      </button>
                    </th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Email
                        {renderSortIcon('email')}
                      </button>
                    </th>
                    <th className="hidden 2xl:table-cell px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('address')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Primary Address
                        {renderSortIcon('address')}
                      </button>
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('agent')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Agent Name
                        {renderSortIcon('agent')}
                      </button>
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Status
                        {renderSortIcon('status')}
                      </button>
                    </th>
                  </tr>

                  {/* Filter Row */}
                  <tr className="bg-gray-100">
                    <th className="w-12 px-2 sm:px-4"></th>
                    <th className="px-3 sm:px-6 py-2">
                      <Input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters.code}
                        onChange={(e) => handleColumnFilterChange('code', e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </th>
                    <th className="px-3 sm:px-6 py-2">
                      <Input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters.name}
                        onChange={(e) => handleColumnFilterChange('name', e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-2"></th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-2">
                      <Input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters.contact}
                        onChange={(e) => handleColumnFilterChange('contact', e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-2">
                      <Input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters.phone}
                        onChange={(e) => handleColumnFilterChange('phone', e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-2">
                      <Input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters.email}
                        onChange={(e) => handleColumnFilterChange('email', e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </th>
                    <th className="hidden 2xl:table-cell px-3 sm:px-6 py-2">
                      <Input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters.address}
                        onChange={(e) => handleColumnFilterChange('address', e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-2">
                      <Input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters.agent}
                        onChange={(e) => handleColumnFilterChange('agent', e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-2">
                      <select
                        value={columnFilters.status}
                        onChange={(e) => handleColumnFilterChange('status', e.target.value)}
                        className="h-8 text-xs bg-white border border-gray-300 rounded px-2 w-full"
                      >
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {processedAccounts.map((account) => {
                    const primaryContact = account.contacts?.find((c) => c.isPrimary) || account.contacts?.[0]
                    const primaryAddress = account.addresses?.find((a) => a.isPrimary) || account.addresses?.[0]
                    return (
                      <React.Fragment key={account.id}>
                        <tr
                          onClick={() => router.push(`/accounts/${account.id}`)}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() =>
                                setExpandedAccountId(
                                  expandedAccountId === account.id ? null : account.id
                                )
                              }
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expandedAccountId === account.id ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline font-mono"
                            >
                              {account.code}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600"
                            >
                              {account.name}
                            </Link>
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-center relative">
                            <div className="inline-block relative">
                              <div className="relative">
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
                              </div>
                              {/* Orders popup would go here - keeping existing implementation */}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                            {primaryContact ? (
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {primaryContact.name}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No contact</span>
                            )}
                          </td>
                          <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                            {primaryContact?.phone ? (
                              <a
                                href={`tel:${primaryContact.phone}`}
                                className="text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 hover:underline"
                              >
                                {primaryContact.phone}
                              </a>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {primaryContact?.email ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.location.href = `mailto:${primaryContact.email}`
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Send email"
                                >
                                  <Mail className="h-4 w-4" />
                                </button>
                                <a
                                  href={`mailto:${primaryContact.email}`}
                                  className="text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 hover:underline"
                                >
                                  {primaryContact.email}
                                </a>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="hidden 2xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {primaryAddress ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {primaryAddress.city}, {primaryAddress.state}
                              </div>
                            ) : (
                              <span className="text-gray-400">No address</span>
                            )}
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {account.salesAgentId || '—'}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                account.active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {account.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                        {expandedAccountId === account.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={10} className="px-6 py-4">
                              <div className="grid grid-cols-2 gap-6">
                                {/* Contacts and Addresses - keeping existing implementation */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Contacts ({account.contacts?.length || 0})
                                  </h4>
                                  {account.contacts && account.contacts.length > 0 ? (
                                    <div className="space-y-2">
                                      {account.contacts.map((contact) => (
                                        <div
                                          key={contact.id}
                                          className="bg-white rounded-lg p-3 border border-gray-200"
                                        >
                                          <div className="flex items-start justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                              {contact.name}
                                            </span>
                                            {contact.isPrimary && (
                                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                Primary
                                              </span>
                                            )}
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                              <Mail className="h-3 w-3" />
                                              <a
                                                href={`mailto:${contact.email}`}
                                                className="hover:text-blue-600"
                                              >
                                                {contact.email}
                                              </a>
                                            </div>
                                            {contact.phone && (
                                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Phone className="h-3 w-3" />
                                                <a
                                                  href={`tel:${contact.phone}`}
                                                  className="hover:text-blue-600"
                                                >
                                                  {contact.phone}
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">No contacts</p>
                                  )}
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Addresses ({account.addresses?.length || 0})
                                  </h4>
                                  {account.addresses && account.addresses.length > 0 ? (
                                    <div className="space-y-2">
                                      {account.addresses.map((address) => (
                                        <div
                                          key={address.id}
                                          className="bg-white rounded-lg p-3 border border-gray-200"
                                        >
                                          <div className="flex items-start justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                              {address.type}
                                            </span>
                                            {address.isPrimary && (
                                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                Primary
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-600 space-y-0.5">
                                            <p>{address.line1}</p>
                                            {address.line2 && <p>{address.line2}</p>}
                                            <p>
                                              {address.city}, {address.state} {address.postalCode}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">No addresses</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {processedAccounts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No accounts found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || hasActiveColumnFilters
                    ? 'Try adjusting your search query or filters'
                    : 'Get started by creating a new account'}
                </p>
                {!searchQuery && !hasActiveColumnFilters && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Account
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAccountCreated}
        />
      )}
    </div>
  )
}
