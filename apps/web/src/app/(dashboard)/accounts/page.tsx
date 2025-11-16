'use client'
// Updated table layout with AG Grid-style features: column menus, visibility, grouping, aggregation
import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, ChevronRight, ChevronDown, Mail, Phone, MapPin, User, Building2, FileText, Trash2, MoreVertical, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, FilterIcon, Menu, Eye, EyeOff, Layers, FilterX } from 'lucide-react'
import { CreateAccountModal } from '@/components/accounts/create-account-modal'
import { DateRangePicker } from '@/components/ui/date-picker'
import { useToast } from '@/components/ui/toast'

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

interface ColumnVisibility {
  code: boolean
  name: boolean
  orders: boolean
  contact: boolean
  phone: boolean
  email: boolean
  address: boolean
  agent: boolean
  status: boolean
}

export default function AccountsPage() {
  const router = useRouter()
  const { showToast } = useToast()
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

  // Date range filter state
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null)

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

  // Column menu state
  const [openColumnMenu, setOpenColumnMenu] = useState<string | null>(null)
  const columnMenuRef = useRef<HTMLDivElement>(null)

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    code: true,
    name: true,
    orders: true,
    contact: true,
    phone: true,
    email: true,
    address: true,
    agent: true,
    status: true
  })
  const [showColumnVisibilityPanel, setShowColumnVisibilityPanel] = useState(false)
  const columnVisibilityRef = useRef<HTMLDivElement>(null)

  // Column grouping state
  const [groupByColumn, setGroupByColumn] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
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

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openOrdersAccountId) {
        setOpenOrdersAccountId(null)
      }

      // Close column menu if clicked outside
      if (openColumnMenu && columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setOpenColumnMenu(null)
      }

      // Close column visibility panel if clicked outside
      if (showColumnVisibilityPanel && columnVisibilityRef.current && !columnVisibilityRef.current.contains(event.target as Node)) {
        setShowColumnVisibilityPanel(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [openOrdersAccountId, openColumnMenu, showColumnVisibilityPanel])

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
    setOpenColumnMenu(null)
  }

  // Column filter handler
  const handleColumnFilterChange = React.useCallback((column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }))
  }, [])

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
    setDateRangeStart(null)
    setDateRangeEnd(null)
    showToast('All filters cleared', 'info')
  }

  // Check if any column filters are active
  const hasActiveColumnFilters = Object.values(columnFilters).some(value => value !== '')

  // Check if any filters are active (column filters OR date range)
  const hasAnyFilters = hasActiveColumnFilters || dateRangeStart !== null || dateRangeEnd !== null

  // Toggle column visibility
  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  // Toggle group expansion
  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  // Date preset handler
  const setDatePreset = (preset: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (preset) {
      case 'today':
        setDateRangeStart(today)
        setDateRangeEnd(today)
        break
      case 'thisWeek':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
        setDateRangeStart(weekStart)
        setDateRangeEnd(today)
        break
      case 'thisMonth':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        setDateRangeStart(monthStart)
        setDateRangeEnd(today)
        break
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3)
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1)
        setDateRangeStart(quarterStart)
        setDateRangeEnd(today)
        break
      case 'thisYear':
        const yearStart = new Date(today.getFullYear(), 0, 1)
        setDateRangeStart(yearStart)
        setDateRangeEnd(today)
        break
    }
  }

  // Get value for grouping
  const getGroupValue = (account: Account, column: string): string => {
    switch (column) {
      case 'code':
        return account.code || 'Unknown'
      case 'name':
        return account.name || 'Unknown'
      case 'contact':
        const contact = account.contacts?.find(c => c.isPrimary) || account.contacts?.[0]
        return contact?.name || 'No Contact'
      case 'phone':
        const phone = account.contacts?.find(c => c.isPrimary)?.phone || account.contacts?.[0]?.phone
        return phone || 'No Phone'
      case 'email':
        const email = account.contacts?.find(c => c.isPrimary)?.email || account.contacts?.[0]?.email
        return email || 'No Email'
      case 'address':
        const address = account.addresses?.find(a => a.isPrimary) || account.addresses?.[0]
        return address ? `${address.city}, ${address.state}` : 'No Address'
      case 'agent':
        return account.salesAgentId || 'No Agent'
      case 'status':
        return account.active ? 'Active' : 'Inactive'
      default:
        return 'Unknown'
    }
  }

  // Filter and sort accounts
  const processedAccounts = useMemo(() => {
    let result = [...accounts]

    // Apply active status filter
    if (showActiveOnly) {
      result = result.filter(account => account.active)
    }

    // Apply date range filter (on createdAt)
    if (dateRangeStart || dateRangeEnd) {
      result = result.filter(account => {
        const accountDate = new Date(account.createdAt)
        accountDate.setHours(0, 0, 0, 0) // Normalize to start of day

        if (dateRangeStart && dateRangeEnd) {
          const startDate = new Date(dateRangeStart)
          startDate.setHours(0, 0, 0, 0)
          const endDate = new Date(dateRangeEnd)
          endDate.setHours(23, 59, 59, 999) // End of day
          return accountDate >= startDate && accountDate <= endDate
        } else if (dateRangeStart) {
          const startDate = new Date(dateRangeStart)
          startDate.setHours(0, 0, 0, 0)
          return accountDate >= startDate
        } else if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd)
          endDate.setHours(23, 59, 59, 999)
          return accountDate <= endDate
        }
        return true
      })
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
  }, [accounts, showActiveOnly, columnFilters, searchQuery, sortColumn, sortDirection, dateRangeStart, dateRangeEnd])

  // Group accounts if grouping is enabled
  const groupedAccounts = useMemo(() => {
    if (!groupByColumn) {
      return null
    }

    const groups = new Map<string, Account[]>()

    processedAccounts.forEach(account => {
      const groupValue = getGroupValue(account, groupByColumn)
      if (!groups.has(groupValue)) {
        groups.set(groupValue, [])
      }
      groups.get(groupValue)!.push(account)
    })

    // Sort groups by key
    const sortedGroups = Array.from(groups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )

    return sortedGroups
  }, [processedAccounts, groupByColumn])

  // Calculate aggregations
  const aggregations = useMemo(() => {
    const totalAccounts = processedAccounts.length
    const activeAccounts = processedAccounts.filter(a => a.active).length
    const inactiveAccounts = processedAccounts.filter(a => !a.active).length

    return {
      totalAccounts,
      activeAccounts,
      inactiveAccounts
    }
  }, [processedAccounts])

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

  // Column menu component
  const ColumnMenu = React.memo(({ column, label }: { column: string, label: string }) => {
    const isOpen = openColumnMenu === column
    const filterValue = columnFilters[column as keyof typeof columnFilters] || ''

    return (
      <div className="relative inline-block" ref={isOpen ? columnMenuRef : null}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpenColumnMenu(isOpen ? null : column)
          }}
          className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Column menu"
        >
          <Menu className="h-3 w-3" />
        </button>

        {isOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 space-y-2">
              {/* Filter input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Filter</label>
                {column === 'status' ? (
                  <select
                    value={filterValue}
                    onChange={(e) => handleColumnFilterChange(column, e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    autoFocus
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                ) : (
                  <Input
                    placeholder={`Filter ${label.toLowerCase()}...`}
                    value={filterValue}
                    onChange={(e) => handleColumnFilterChange(column, e.target.value)}
                    className="text-sm h-8"
                    autoFocus
                  />
                )}
              </div>

              {/* Sort options */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <button
                  onClick={() => {
                    setSortColumn(column)
                    setSortDirection('asc')
                    setOpenColumnMenu(null)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <ArrowUp className="h-3 w-3" />
                  Sort Ascending
                </button>
                <button
                  onClick={() => {
                    setSortColumn(column)
                    setSortDirection('desc')
                    setOpenColumnMenu(null)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <ArrowDown className="h-3 w-3" />
                  Sort Descending
                </button>
                {sortColumn === column && (
                  <button
                    onClick={() => {
                      setSortColumn(null)
                      setOpenColumnMenu(null)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <X className="h-3 w-3" />
                    Clear Sort
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  })

  // Render account row
  const renderAccountRow = (account: Account) => {
    const primaryContact = account.contacts?.find((c) => c.isPrimary) || account.contacts?.[0]
    const primaryAddress = account.addresses?.find((a) => a.isPrimary) || account.addresses?.[0]

    return (
      <React.Fragment key={account.id}>
        <tr
          onClick={() => router.push(`/accounts/${account.id}`)}
          className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
        >
          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() =>
                setExpandedAccountId(
                  expandedAccountId === account.id ? null : account.id
                )
              }
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {expandedAccountId === account.id ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </td>
          {columnVisibility.code && (
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              <Link
                href={`/accounts/${account.id}`}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-mono"
              >
                {account.code}
              </Link>
            </td>
          )}
          {columnVisibility.name && (
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              <Link
                href={`/accounts/${account.id}`}
                className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {account.name}
              </Link>
            </td>
          )}
          {columnVisibility.orders && (
            <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-center border-r border-gray-200 dark:border-gray-700 relative">
              <div className="inline-block relative">
                <div className="relative">
                  <button
                    onClick={(e) => handleToggleOrders(account.id, e)}
                    className={`inline-flex items-center justify-center h-7 w-7 rounded-full transition-colors ${
                      openOrdersAccountId === account.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'hover:bg-purple-50 text-purple-600 hover:text-purple-700'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </button>
                  {outstandingInvoices[account.id] > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {outstandingInvoices[account.id]}
                    </span>
                  )}
                </div>

                {openOrdersAccountId === account.id && (
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-[1125px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 p-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h4>
                      <Link
                        href={`/accounts/${account.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        View All
                      </Link>
                    </div>
                    {loadingOrders === account.id ? (
                      <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                        Loading orders...
                      </div>
                    ) : accountOrders[account.id]?.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {accountOrders[account.id].map((order: any) => (
                          <div key={order.id} className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                            {/* Header Row: Invoice, Status, Date */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Invoice:</span>
                                <Link
                                  href={`/orders/${order.id}`}
                                  className="text-base font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {order.orderNo}
                                </Link>
                                <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                                  order.status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {order.status === 'paid' ? 'Paid' : order.status?.replace(/_/g, ' ').toUpperCase() || 'DRAFT'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(order.orderDate).toLocaleDateString('en-US', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>

                            {/* Buyer/Seller Row */}
                            <div className="flex items-center justify-between mb-5">
                              <div className="text-sm">
                                <span className="text-gray-700 dark:text-gray-300 font-semibold">Buyer:</span>{' '}
                                <Link
                                  href={`/accounts/${order.buyerAccountId}`}
                                  className="text-gray-900 dark:text-gray-100 hover:text-blue-600 hover:underline"
                                >
                                  {order.buyerAccountName}
                                </Link>
                              </div>
                              <div className="text-sm text-right">
                                <span className="text-gray-700 dark:text-gray-300 font-semibold">Seller:</span>{' '}
                                <Link
                                  href={`/accounts/${order.sellerAccountId}`}
                                  className="text-gray-900 dark:text-gray-100 hover:text-blue-600 hover:underline"
                                >
                                  {order.sellerAccountName}
                                </Link>
                              </div>
                            </div>

                            {/* Items Table */}
                            {order.lines && order.lines.length > 0 && (
                              <div className="mb-5">
                                <div className="border border-gray-200 dark:border-gray-700 rounded overflow-x-auto max-w-full">
                                  <table className="w-full text-sm table-fixed">
                                    <colgroup>
                                      <col style={{width: '40%'}} />
                                      <col style={{width: '15%'}} />
                                      <col style={{width: '10%'}} />
                                      <col style={{width: '10%'}} />
                                      <col style={{width: '10%'}} />
                                      <col style={{width: '15%'}} />
                                    </colgroup>
                                    <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                      <tr>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Memo</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Quantity</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Price/lb</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Total</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Comm %</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Comm Amt</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900">
                                      {order.lines.map((line: any, index: number) => {
                                        // Calculate quantity display: e.g., "200 cases × 30 lbs = 6,000 lbs"
                                        const quantity = parseFloat(line.quantity) || 0
                                        const unitSize = parseFloat(line.unitSize) || 0
                                        const totalWeight = parseFloat(line.totalWeight) || (quantity * unitSize)
                                        const uom = line.uom || 'CASE'
                                        const unitPrice = parseFloat(line.unitPrice) || 0
                                        const lineTotal = parseFloat(line.total) || 0

                                        let quantityDisplay = ''
                                        if (uom === 'CASE' && unitSize > 0) {
                                          quantityDisplay = `${quantity.toLocaleString()} cases × ${unitSize} lbs = ${totalWeight.toLocaleString()} lbs`
                                        } else if (uom === 'BAG' && unitSize > 0) {
                                          quantityDisplay = `${quantity.toLocaleString()} bags × ${unitSize} lbs = ${totalWeight.toLocaleString()} lbs`
                                        } else {
                                          quantityDisplay = `${quantity.toLocaleString()} ${uom.toLowerCase()}`
                                        }

                                        return (
                                          <tr key={line.id || index} className={index !== order.lines.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}>
                                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100 text-sm align-top">
                                              <div className="break-words whitespace-normal">
                                                {line.sizeGrade || line.productDescription || line.productCode || 'N/A'}
                                              </div>
                                            </td>
                                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100 text-sm align-top">
                                              <div className="break-words whitespace-normal">{quantityDisplay}</div>
                                            </td>
                                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100 text-sm align-top whitespace-nowrap">
                                              ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100 text-sm align-top whitespace-nowrap">
                                              ${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100 text-sm align-top whitespace-nowrap">
                                              {line.commissionPct > 0 ? `${line.commissionPct}%` : '—'}
                                            </td>
                                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100 text-sm align-top whitespace-nowrap">
                                              ${(parseFloat(line.commissionAmt) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                      {/* Table Total Row */}
                                      <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                                        <td colSpan={3} className="px-2 py-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                                          Total:
                                        </td>
                                        <td className="px-2 py-2 pr-6 text-gray-900 dark:text-gray-100 whitespace-nowrap font-semibold text-sm">
                                          ${order.lines.reduce((sum: number, line: any) => {
                                            return sum + (parseFloat(line.total) || 0)
                                          }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-2 py-2 pl-6 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                                          Total Comm:
                                        </td>
                                        <td className="px-2 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap font-semibold text-sm">
                                          ${order.lines.reduce((sum: number, line: any) => {
                                            return sum + (parseFloat(line.commissionAmt) || 0)
                                          }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                        No orders found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </td>
          )}
          {columnVisibility.contact && (
            <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              {primaryContact ? (
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {primaryContact.name}
                </div>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">No contact</span>
              )}
            </td>
          )}
          {columnVisibility.phone && (
            <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              {primaryContact?.phone ? (
                <a
                  href={`tel:${primaryContact.phone}`}
                  className="text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                >
                  {primaryContact.phone}
                </a>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
              )}
            </td>
          )}
          {columnVisibility.email && (
            <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
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
                    className="text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                  >
                    {primaryContact.email}
                  </a>
                </div>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
              )}
            </td>
          )}
          {columnVisibility.address && (
            <td className="hidden 2xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
              {(() => {
                const primaryAddress = account.addresses?.find((a) => a.isPrimary) || account.addresses?.[0]
                return primaryAddress ? (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {primaryAddress.city}, {primaryAddress.state}
                  </div>
                ) : (
                  <span className="text-gray-400">No address</span>
                )
              })()}
            </td>
          )}
          {columnVisibility.agent && (
            <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {account.salesAgentId || '—'}
              </span>
            </td>
          )}
          {columnVisibility.status && (
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
          )}
        </tr>
        {expandedAccountId === account.id && (
          <tr className="bg-gray-50 dark:bg-gray-800">
            <td colSpan={10} className="px-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Contacts */}
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
                          className="bg-white dark:bg-gray-950 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
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
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <Mail className="h-3 w-3" />
                              <a
                                href={`mailto:${contact.email}`}
                                className="hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {contact.email}
                              </a>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Phone className="h-3 w-3" />
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="hover:text-blue-600 dark:hover:text-blue-400"
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">No contacts</p>
                  )}
                </div>

                {/* Addresses */}
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
                          className="bg-white dark:bg-gray-950 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
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
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">No addresses</p>
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Accounts</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage customer and seller accounts</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </div>

      {/* Search Bar and Filters */}
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
              {/* Column Visibility Button */}
              <div className="relative" ref={showColumnVisibilityPanel ? columnVisibilityRef : null}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowColumnVisibilityPanel(!showColumnVisibilityPanel)
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                  title="Toggle column visibility"
                >
                  <Eye className="h-4 w-4" />
                  Columns
                </button>

                {showColumnVisibilityPanel && (
                  <div
                    className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Show/Hide Columns</h4>
                    <div className="space-y-1.5">
                      {Object.entries(columnVisibility).map(([key, visible]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded">
                          <input
                            type="checkbox"
                            checked={visible}
                            onChange={() => toggleColumnVisibility(key as keyof ColumnVisibility)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {key === 'orders' ? 'Orders' : key}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Group By Dropdown */}
              <div className="relative">
                <select
                  value={groupByColumn || ''}
                  onChange={(e) => {
                    setGroupByColumn(e.target.value || null)
                    setExpandedGroups(new Set())
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap text-sm appearance-none pr-8"
                  title="Group by column"
                >
                  <option value="">No Grouping</option>
                  <option value="agent">Group by Agent</option>
                  <option value="status">Group by Status</option>
                  <option value="address">Group by Address</option>
                </select>
                <Layers className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors whitespace-nowrap ${
                  showActiveOnly
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                {showActiveOnly ? 'Active Only' : 'Show All'}
              </button>

              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <DateRangePicker
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onStartDateChange={setDateRangeStart}
                  onEndDateChange={setDateRangeEnd}
                />
              </div>

              {hasAnyFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center justify-center p-2.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all shadow-sm"
                  title="Clear all filters"
                >
                  <FilterX className="h-5 w-5" />
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
                <thead>
                  {/* Header Row */}
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    <th className="w-12 px-2 sm:px-4 bg-gray-50 dark:bg-gray-800"></th>
                    {columnVisibility.code && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Code</span>
                          <ColumnMenu column="code" label="Code" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.name && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Account Name</span>
                          <ColumnMenu column="name" label="Account Name" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.orders && (
                      <th className="hidden lg:table-cell px-4 py-2 text-center bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Orders</span>
                      </th>
                    )}
                    {columnVisibility.contact && (
                      <th className="hidden md:table-cell px-4 py-2 text-left bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Primary Contact</span>
                          <ColumnMenu column="contact" label="Primary Contact" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.phone && (
                      <th className="hidden xl:table-cell px-4 py-2 text-left bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Phone</span>
                          <ColumnMenu column="phone" label="Phone" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.email && (
                      <th className="hidden xl:table-cell px-4 py-2 text-left bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Email</span>
                          <ColumnMenu column="email" label="Email" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.address && (
                      <th className="hidden 2xl:table-cell px-4 py-2 text-left bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Primary Address</span>
                          <ColumnMenu column="address" label="Primary Address" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.agent && (
                      <th className="hidden lg:table-cell px-4 py-2 text-left bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Agent Name</span>
                          <ColumnMenu column="agent" label="Agent Name" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.status && (
                      <th className="hidden sm:table-cell px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Status</span>
                          <ColumnMenu column="status" label="Status" />
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                  {groupByColumn && groupedAccounts ? (
                    // Render grouped accounts
                    groupedAccounts.map(([groupKey, groupAccounts]) => (
                      <React.Fragment key={groupKey}>
                        {/* Group Header Row */}
                        <tr className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
                          <td colSpan={10} className="px-4 py-3">
                            <button
                              onClick={() => toggleGroupExpansion(groupKey)}
                              className="flex items-center gap-2 w-full text-left"
                            >
                              {expandedGroups.has(groupKey) ? (
                                <ChevronDown className="h-4 w-4 text-blue-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-blue-600" />
                              )}
                              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                {groupKey}
                              </span>
                              <span className="text-xs text-blue-700 dark:text-blue-300 ml-2">
                                ({groupAccounts.length} {groupAccounts.length === 1 ? 'account' : 'accounts'})
                              </span>
                            </button>
                          </td>
                        </tr>
                        {/* Group Rows */}
                        {expandedGroups.has(groupKey) && groupAccounts.map(account => renderAccountRow(account))}
                      </React.Fragment>
                    ))
                  ) : (
                    // Render ungrouped accounts
                    processedAccounts.map(account => renderAccountRow(account))
                  )}
                </tbody>
                {/* Aggregation Footer */}
                {processedAccounts.length > 0 && (
                  <tfoot className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <td colSpan={10} className="px-4 py-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-6">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              Total Accounts: <span className="text-blue-600">{aggregations.totalAccounts}</span>
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              Active: <span className="text-green-600 font-medium">{aggregations.activeAccounts}</span>
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              Inactive: <span className="text-red-600 font-medium">{aggregations.inactiveAccounts}</span>
                            </span>
                          </div>
                          {groupByColumn && (
                            <span className="text-gray-600 dark:text-gray-400 text-xs italic">
                              Grouped by {groupByColumn}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
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

      {/* Email Compose Modal */}
      {showEmailModal && emailRecipient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Compose Email</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To:</label>
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{emailRecipient.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">&lt;{emailRecipient.email}&gt;</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject:</label>
                <Input placeholder="Enter subject" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message:</label>
                <textarea
                  className="w-full h-48 px-3 py-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your message here..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
