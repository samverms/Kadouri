'use client'
// Updated table layout with AG Grid-style features: column menus, visibility, grouping, aggregation
import React, { useState, useEffect, Fragment, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from '@/components/ui/date-picker'
import { useToast } from '@/components/ui/toast'
import { Search, ChevronRight, ChevronDown, Receipt, Calendar, DollarSign, User, Package, Menu, Eye, Layers, ArrowUpDown, ArrowUp, ArrowDown, X, Filter, FilterX } from 'lucide-react'

interface InvoiceLine {
  id: string
  productId: string
  productCode: string
  productDescription: string
  quantity: number
  unitPrice: number
  total: number
  commissionRate: number
  commissionPct?: number
  commissionAmt?: number
}

interface Invoice {
  id: string
  orderNo: string
  qboDocNumber?: string
  qboDocId?: string
  orderDate: string
  status: string
  sellerAccountId: string
  sellerAccountName: string
  sellerAccountCode: string
  buyerAccountId: string
  buyerAccountName: string
  buyerAccountCode: string
  totalAmount: number
  agentId?: string
  agentName?: string
  lines: InvoiceLine[]
}

interface ColumnVisibility {
  invoiceNumber: boolean
  orderNumber: boolean
  date: boolean
  seller: boolean
  buyer: boolean
  agent: boolean
  amount: boolean
  status: boolean
  lines: boolean
}

export default function InvoicesPage() {
  const { getToken } = useAuth()
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<Set<string>>(new Set())
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Date range filter state
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null)

  // Sorting and filtering state
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = useState({
    invoiceNumber: '',
    orderNumber: '',
    date: '',
    seller: '',
    buyer: '',
    agent: '',
    amount: '',
    status: ''
  })

  // Column menu state
  const [openColumnMenu, setOpenColumnMenu] = useState<string | null>(null)
  const columnMenuRef = useRef<HTMLDivElement>(null)

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    invoiceNumber: true,
    orderNumber: true,
    date: true,
    seller: true,
    buyer: true,
    agent: true,
    amount: true,
    status: true,
    lines: true
  })
  const [showColumnVisibilityPanel, setShowColumnVisibilityPanel] = useState(false)
  const columnVisibilityRef = useRef<HTMLDivElement>(null)

  // Column grouping state (multi-select like orders page)
  const [groupByColumn, setGroupByColumn] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showGroupingPanel, setShowGroupingPanel] = useState(false)
  const groupingPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchInvoices()
  }, [searchQuery])

  const fetchInvoices = async () => {
    setIsLoading(true)
    setError('')
    try {
      const token = await getToken()

      // Build query parameters
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      params.append('limit', '1000') // Increase limit to fetch more invoices

      const url = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/invoices${params.toString() ? '?' + params.toString() : ''}`

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }

      const data = await response.json()
      setInvoices(data)
    } catch (err) {
      console.error('Fetch invoices error:', err)
      setError('Failed to load invoices')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpanded = (invoiceId: string) => {
    const newExpanded = new Set(expandedInvoiceIds)
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId)
    } else {
      newExpanded.add(invoiceId)
    }
    setExpandedInvoiceIds(newExpanded)
  }

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
  }, [openColumnMenu, showColumnVisibilityPanel])

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
    // Clear column filters
    setColumnFilters({
      invoiceNumber: '',
      orderNumber: '',
      date: '',
      seller: '',
      buyer: '',
      agent: '',
      amount: '',
      status: ''
    })
    // Clear date range
    setDateRangeStart(null)
    setDateRangeEnd(null)
    // Clear grouping
    setGroupByColumn(null)
    setExpandedGroups(new Set())
    // Clear sorting
    setSortColumn(null)
    setSortDirection('asc')
    // Clear search
    setSearchQuery('')
    showToast('All filters and settings reset', 'info')
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

  // Helper function to set date preset (Today, This Week, etc.)
  const setDatePreset = (preset: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let start: Date | null = null
    let end: Date | null = null

    switch (preset) {
      case 'today':
        start = today
        end = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        break
      case 'thisWeek': {
        const dayOfWeek = today.getDay()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - dayOfWeek)
        start = startOfWeek
        end = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
        break
      }
      case 'thisMonth': {
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      }
      case 'thisQuarter': {
        const quarter = Math.floor(today.getMonth() / 3)
        start = new Date(today.getFullYear(), quarter * 3, 1)
        end = new Date(today.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999)
        break
      }
      case 'thisYear': {
        start = new Date(today.getFullYear(), 0, 1)
        end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
      }
    }

    setDateRangeStart(start)
    setDateRangeEnd(end)
    setOpenColumnMenu(null) // Close the menu after selecting
  }

  // Helper function to bucket dates into ranges (for grouping)
  const getDateRangeBucket = (date: Date): string => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const invoiceDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    const diffTime = today.getTime() - invoiceDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Today
    if (diffDays === 0) return '01_Today'

    // Yesterday
    if (diffDays === 1) return '02_Yesterday'

    // This Week (last 7 days)
    if (diffDays <= 7) return '03_This Week'

    // Last Week (8-14 days ago)
    if (diffDays <= 14) return '04_Last Week'

    // This Month
    if (invoiceDate.getMonth() === today.getMonth() && invoiceDate.getFullYear() === today.getFullYear()) {
      return '05_This Month'
    }

    // Last Month
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    if (invoiceDate.getMonth() === lastMonth.getMonth() && invoiceDate.getFullYear() === lastMonth.getFullYear()) {
      return '06_Last Month'
    }

    // This Quarter
    const currentQuarter = Math.floor(today.getMonth() / 3)
    const invoiceQuarter = Math.floor(invoiceDate.getMonth() / 3)
    if (invoiceQuarter === currentQuarter && invoiceDate.getFullYear() === today.getFullYear()) {
      return '07_This Quarter'
    }

    // This Year
    if (invoiceDate.getFullYear() === today.getFullYear()) {
      return '08_This Year'
    }

    // Last Year
    if (invoiceDate.getFullYear() === today.getFullYear() - 1) {
      return '09_Last Year'
    }

    // Older
    return '10_Older'
  }

  // Get value for grouping
  const getGroupValue = (invoice: Invoice, column: string): string => {
    switch (column) {
      case 'status':
        return invoice.status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'
      case 'buyer':
        return invoice.buyerAccountName || 'Unknown Buyer'
      case 'seller':
        return invoice.sellerAccountName || 'Unknown Seller'
      case 'agent':
        return invoice.agentName || 'No Agent'
      case 'date':
        if (!invoice.orderDate) return 'No Date'
        const exactDate = new Date(invoice.orderDate)
        return exactDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      case 'dateRange':
        if (!invoice.orderDate) return 'No Date'
        const invoiceDate = new Date(invoice.orderDate)
        const bucket = getDateRangeBucket(invoiceDate)
        return bucket.substring(3) // Remove the "01_", "02_" prefix
      default:
        return 'Unknown'
    }
  }

  // Filter and sort invoices
  const processedInvoices = useMemo(() => {
    let result = [...invoices]

    // Apply date range filter (on orderDate)
    if (dateRangeStart || dateRangeEnd) {
      result = result.filter(invoice => {
        const invoiceDate = new Date(invoice.orderDate)
        invoiceDate.setHours(0, 0, 0, 0) // Normalize to start of day

        if (dateRangeStart && dateRangeEnd) {
          const startDate = new Date(dateRangeStart)
          startDate.setHours(0, 0, 0, 0)
          const endDate = new Date(dateRangeEnd)
          endDate.setHours(23, 59, 59, 999) // End of day
          return invoiceDate >= startDate && invoiceDate <= endDate
        } else if (dateRangeStart) {
          const startDate = new Date(dateRangeStart)
          startDate.setHours(0, 0, 0, 0)
          return invoiceDate >= startDate
        } else if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd)
          endDate.setHours(23, 59, 59, 999)
          return invoiceDate <= endDate
        }
        return true
      })
    }

    // Apply column filters
    if (columnFilters.invoiceNumber) {
      result = result.filter(invoice =>
        invoice.qboDocNumber?.toLowerCase().includes(columnFilters.invoiceNumber.toLowerCase())
      )
    }
    if (columnFilters.orderNumber) {
      result = result.filter(invoice =>
        invoice.orderNo.toLowerCase().includes(columnFilters.orderNumber.toLowerCase())
      )
    }
    if (columnFilters.date) {
      result = result.filter(invoice =>
        invoice.orderDate.toLowerCase().includes(columnFilters.date.toLowerCase())
      )
    }
    if (columnFilters.seller) {
      result = result.filter(invoice =>
        invoice.sellerAccountName?.toLowerCase().includes(columnFilters.seller.toLowerCase()) ||
        invoice.sellerAccountCode?.toLowerCase().includes(columnFilters.seller.toLowerCase())
      )
    }
    if (columnFilters.buyer) {
      result = result.filter(invoice =>
        invoice.buyerAccountName?.toLowerCase().includes(columnFilters.buyer.toLowerCase()) ||
        invoice.buyerAccountCode?.toLowerCase().includes(columnFilters.buyer.toLowerCase())
      )
    }
    if (columnFilters.agent) {
      result = result.filter(invoice =>
        invoice.agentName?.toLowerCase().includes(columnFilters.agent.toLowerCase())
      )
    }
    if (columnFilters.amount) {
      result = result.filter(invoice =>
        invoice.totalAmount.toString().includes(columnFilters.amount)
      )
    }
    if (columnFilters.status) {
      result = result.filter(invoice =>
        invoice.status.toLowerCase().includes(columnFilters.status.toLowerCase())
      )
    }

    // Apply global search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(invoice =>
        invoice.qboDocNumber?.toLowerCase().includes(query) ||
        invoice.orderNo.toLowerCase().includes(query) ||
        invoice.sellerAccountName?.toLowerCase().includes(query) ||
        invoice.buyerAccountName?.toLowerCase().includes(query) ||
        invoice.sellerAccountCode?.toLowerCase().includes(query) ||
        invoice.buyerAccountCode?.toLowerCase().includes(query) ||
        invoice.agentName?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        let aValue: any = ''
        let bValue: any = ''

        switch (sortColumn) {
          case 'invoiceNumber':
            aValue = a.qboDocNumber || ''
            bValue = b.qboDocNumber || ''
            break
          case 'orderNumber':
            aValue = a.orderNo || ''
            bValue = b.orderNo || ''
            break
          case 'date':
            aValue = new Date(a.orderDate).getTime()
            bValue = new Date(b.orderDate).getTime()
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
          case 'seller':
            aValue = a.sellerAccountName || ''
            bValue = b.sellerAccountName || ''
            break
          case 'buyer':
            aValue = a.buyerAccountName || ''
            bValue = b.buyerAccountName || ''
            break
          case 'agent':
            aValue = a.agentName || ''
            bValue = b.agentName || ''
            break
          case 'amount':
            aValue = a.totalAmount
            bValue = b.totalAmount
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
          case 'status':
            aValue = a.status || ''
            bValue = b.status || ''
            break
        }

        const comparison = aValue.toString().localeCompare(bValue.toString())
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [invoices, columnFilters, searchQuery, sortColumn, sortDirection, dateRangeStart, dateRangeEnd])

  // Helper function to create nested groups recursively
  const createNestedGroups = (invoices: Invoice[], columns: string[], parentKey: string = ''): any => {
    if (columns.length === 0) {
      return invoices
    }

    const [currentColumn, ...remainingColumns] = columns
    const groups = new Map<string, Invoice[]>()

    invoices.forEach(invoice => {
      const groupValue = getGroupValue(invoice, currentColumn)
      if (!groups.has(groupValue)) {
        groups.set(groupValue, [])
      }
      groups.get(groupValue)!.push(invoice)
    })

    // Sort groups by key
    const sortedGroups = Array.from(groups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )

    return sortedGroups.map(([groupKey, groupInvoices]) => {
      const fullKey = parentKey ? `${parentKey}>${currentColumn}:${groupKey}` : `${currentColumn}:${groupKey}`
      return {
        key: fullKey,
        displayKey: groupKey,
        column: currentColumn,
        invoices: groupInvoices,
        children: remainingColumns.length > 0
          ? createNestedGroups(groupInvoices, remainingColumns, fullKey)
          : null
      }
    })
  }

  // Group invoices if grouping is enabled (supports multi-level grouping)
  const groupedInvoices = useMemo(() => {
    if (!groupByColumn) {
      return null
    }

    return createNestedGroups(processedInvoices, [groupByColumn])
  }, [processedInvoices, groupByColumn])

  // Calculate aggregations
  const aggregations = useMemo(() => {
    const totalInvoices = processedInvoices.length
    const totalAmount = processedInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
    const totalCommission = processedInvoices.reduce((sum, inv) => {
      const invoiceCommission = inv.lines?.reduce((lineSum, line) => {
        return lineSum + (parseFloat(line.commissionAmt as any) || 0)
      }, 0) || 0
      return sum + invoiceCommission
    }, 0)

    // Status counts
    const statusCounts: { [key: string]: number } = {}
    processedInvoices.forEach(inv => {
      const status = inv.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    return {
      totalInvoices,
      totalAmount,
      totalCommission,
      statusCounts
    }
  }, [processedInvoices])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'posted_to_qb':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:text-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })
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
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  >
                    <option value="">All</option>
                    <option value="paid">Paid</option>
                    <option value="posted_to_qb">Posted to QB</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="draft">Draft</option>
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

  // Render invoice row
  const renderInvoiceRow = (invoice: Invoice) => {
    return (
      <Fragment key={invoice.id}>
        <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
          <td className="px-4 py-3">
            <button
              onClick={() => toggleExpanded(invoice.id)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            >
              {expandedInvoiceIds.has(invoice.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </td>
          {columnVisibility.invoiceNumber && (
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 font-mono">
                {invoice.qboDocNumber || 'N/A'}
              </div>
            </td>
          )}
          {columnVisibility.orderNumber && (
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              <Link
                href={`/orders/${invoice.id}`}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-mono"
              >
                {invoice.orderNo}
              </Link>
            </td>
          )}
          {columnVisibility.date && (
            <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                <Calendar className="h-4 w-4 text-gray-400" />
                {formatDate(invoice.orderDate)}
              </div>
            </td>
          )}
          {columnVisibility.seller && (
            <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-700">
              <Link href={`/accounts/${invoice.sellerAccountId}`} className="text-sm hover:underline">
                <div className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">{invoice.sellerAccountName}</div>
                <div className="text-gray-500 dark:text-gray-400 font-mono text-xs">{invoice.sellerAccountCode}</div>
              </Link>
            </td>
          )}
          {columnVisibility.buyer && (
            <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-700">
              <Link href={`/accounts/${invoice.buyerAccountId}`} className="text-sm hover:underline">
                <div className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">{invoice.buyerAccountName}</div>
                <div className="text-gray-500 dark:text-gray-400 font-mono text-xs">{invoice.buyerAccountCode}</div>
              </Link>
            </td>
          )}
          {columnVisibility.agent && (
            <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                {invoice.agentName ? (
                  <>
                    <User className="h-4 w-4 text-gray-400" />
                    {invoice.agentName}
                  </>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">N/A</span>
                )}
              </div>
            </td>
          )}
          {columnVisibility.amount && (
            <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <DollarSign className="h-4 w-4 text-green-600" />
                {formatCurrency(invoice.totalAmount)}
              </div>
            </td>
          )}
          {columnVisibility.status && (
            <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                  invoice.status
                )}`}
              >
                {invoice.status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
              </span>
            </td>
          )}
          {columnVisibility.lines && (
            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                {invoice.lines?.length || 0} items
              </div>
            </td>
          )}
        </tr>
        {expandedInvoiceIds.has(invoice.id) && (
          <tr className="bg-gray-50 dark:bg-gray-800">
            <td colSpan={10} className="px-3 py-2">
              <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                {/* Header Row with Invoice, Date, Buyer, and Seller */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Invoice: </span>
                      <Link
                        href={`/orders/${invoice.id}`}
                        className="text-base font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                      >
                        {invoice.orderNo}
                      </Link>
                    </div>
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(invoice.orderDate)}
                  </div>
                </div>

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Buyer: </span>
                    <Link
                      href={`/accounts/${invoice.buyerAccountId}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                    >
                      {invoice.buyerAccountName}
                    </Link>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Seller: </span>
                    <Link
                      href={`/accounts/${invoice.sellerAccountId}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                    >
                      {invoice.sellerAccountName}
                    </Link>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-4">
                  <div className="bg-white dark:bg-gray-950 rounded border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Item</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Commission %</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Commission Amt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.lines && invoice.lines.length > 0 ? (
                          invoice.lines.map((line, index) => {
                            return (
                              <tr key={line.id} className={index !== invoice.lines.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                  {line.productCode || line.productDescription || 'Unknown Product'}
                                </td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                  {line.quantity?.toLocaleString() || 0} lbs
                                </td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                  ${(line.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                  {line.commissionPct && line.commissionPct > 0 ? `${line.commissionPct}%` : '—'}
                                </td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                  ${(parseFloat(line.commissionAmt as any) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              No line items
                            </td>
                          </tr>
                        )}
                        {/* Total Commission Row */}
                        {invoice.lines && invoice.lines.length > 0 && (
                          <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                            <td colSpan={4} className="px-3 py-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Total Commission:
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap font-semibold">
                              ${invoice.lines.reduce((sum, line) => {
                                return sum + (parseFloat(line.commissionAmt as any) || 0)
                              }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-300 dark:border-gray-600">
                  <div className="text-base font-bold text-gray-900 dark:text-gray-100">Total:</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ${(invoice.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">Invoices</h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">View and manage QuickBooks invoices</p>
        </div>
        <div className="text-sm text-gray-500">
          {invoices.length} total invoices
        </div>
      </div>

      {/* Search Bar and Filters */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-[70%]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search invoices..."
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
                        <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <input
                            type="checkbox"
                            checked={visible}
                            onChange={() => toggleColumnVisibility(key as keyof ColumnVisibility)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {key === 'invoiceNumber' ? 'Invoice #' :
                             key === 'orderNumber' ? 'Order #' :
                             key.replace(/([A-Z])/g, ' $1').trim()}
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
                  <option value="status">Group by Status</option>
                  <option value="buyer">Group by Buyer</option>
                  <option value="seller">Group by Seller</option>
                  <option value="agent">Group by Agent</option>
                  <option value="date">Group by Month</option>
                </select>
                <Layers className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

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
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      )}

      {/* Invoices Table */}
      {!isLoading && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {/* Header Row */}
                  <tr className="border-b border-gray-300 dark:border-gray-700">
                    <th className="w-12 px-2 sm:px-4 bg-gray-50 dark:bg-transparent"></th>
                    {columnVisibility.invoiceNumber && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Invoice #</span>
                          <ColumnMenu column="invoiceNumber" label="Invoice #" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.orderNumber && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Order #</span>
                          <ColumnMenu column="orderNumber" label="Order #" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.date && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Date</span>
                          <ColumnMenu column="date" label="Date" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.seller && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Seller</span>
                          <ColumnMenu column="seller" label="Seller" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.buyer && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Buyer</span>
                          <ColumnMenu column="buyer" label="Buyer" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.agent && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Agent</span>
                          <ColumnMenu column="agent" label="Agent" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.amount && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Amount</span>
                          <ColumnMenu column="amount" label="Amount" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.status && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Status</span>
                          <ColumnMenu column="status" label="Status" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.lines && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Lines</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                  {groupByColumn && groupedInvoices ? (
                    // Render grouped invoices
                    groupedInvoices.map(([groupKey, groupInvoices]: [string, any[]]) => (
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
                                ({groupInvoices.length} {groupInvoices.length === 1 ? 'invoice' : 'invoices'})
                              </span>
                            </button>
                          </td>
                        </tr>
                        {/* Group Rows */}
                        {expandedGroups.has(groupKey) && groupInvoices.map(invoice => renderInvoiceRow(invoice))}
                      </React.Fragment>
                    ))
                  ) : (
                    // Render ungrouped invoices
                    processedInvoices.map(invoice => renderInvoiceRow(invoice))
                  )}
                </tbody>
                {/* Aggregation Footer */}
                {processedInvoices.length > 0 && (
                  <tfoot className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <td colSpan={10} className="px-4 py-3">
                        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                          <div className="flex items-center gap-6">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              Total Invoices: <span className="text-blue-600">{aggregations.totalInvoices}</span>
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              Total Amount: <span className="text-green-600 font-medium">{formatCurrency(aggregations.totalAmount)}</span>
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              Total Commission: <span className="text-purple-600 font-medium">{formatCurrency(aggregations.totalCommission)}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            {Object.entries(aggregations.statusCounts).map(([status, count]) => (
                              <span key={status} className="text-gray-600 dark:text-gray-400">
                                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                  status === 'paid' ? 'bg-green-500' :
                                  status === 'posted_to_qb' ? 'bg-blue-500' :
                                  status === 'confirmed' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`}></span>
                                {status.replace(/_/g, ' ')}: {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {processedInvoices.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No invoices found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery || hasActiveColumnFilters
                    ? 'Try adjusting your search query or filters'
                    : 'No invoices have been synced from QuickBooks yet'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
