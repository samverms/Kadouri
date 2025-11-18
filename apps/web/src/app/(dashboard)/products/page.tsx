'use client'

import React, { useState, useEffect, Fragment, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { DateRangePicker } from '@/components/ui/date-picker'
import { Plus, Search, Package, ChevronRight, ChevronDown, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, Copy, Menu, Eye, EyeOff, Layers, X, Filter, FilterX, CheckCircle, XCircle } from 'lucide-react'

interface ProductVariant {
  id: string
  productId: string
  sku?: string
  size: string
  sizeUnit: string
  packageType: string
  isDefault: boolean
  active: boolean
}

interface Product {
  id: string
  code?: string
  name: string
  variety?: string
  grade?: string
  active: boolean
  source?: string
  archivedAt?: string
  archivedBy?: string
  createdAt: string
  updatedAt: string
  uom?: string
  qboItemId?: string
  category?: string
  variants?: ProductVariant[]
}

interface ColumnVisibility {
  fullName: boolean
  variety: boolean
  grade: boolean
  category: boolean
  defaultVariant: boolean
  uom: boolean
  active: boolean
}

export default function ProductsPage() {
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<keyof Product | 'fullName' | 'category'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Mock data - will be replaced with API call
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Column menu state
  const [openColumnMenu, setOpenColumnMenu] = useState<string | null>(null)
  const columnMenuRef = useRef<HTMLDivElement>(null)

  // Column filters state
  const [columnFilters, setColumnFilters] = useState({
    fullName: '',
    variety: '',
    grade: '',
    category: '',
    uom: '',
    active: ''
  })

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    fullName: true,
    variety: true,
    grade: true,
    category: true,
    defaultVariant: true,
    uom: false,
    active: true
  })
  const [showColumnVisibilityPanel, setShowColumnVisibilityPanel] = useState(false)
  const columnVisibilityRef = useRef<HTMLDivElement>(null)

  // Column grouping state (multi-select like orders page)
  const [groupByColumn, setGroupByColumn] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showGroupingPanel, setShowGroupingPanel] = useState(false)
  const groupingPanelRef = useRef<HTMLDivElement>(null)

  // Show active filter
  const [showActiveOnly, setShowActiveOnly] = useState(true)

  // Date range filter state
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [showActiveOnly])

  const fetchProducts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const includeInactive = !showActiveOnly
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products?includeInactive=${includeInactive}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data)
    } catch (err) {
      console.error('Fetch products error:', err)
      setError('Failed to load products')
    } finally {
      setIsLoading(false)
    }
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

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      // Optimistically update UI
      setProducts(prev => prev.filter(p => p.id !== productId))
      showToast('Product deleted successfully', 'warning')
    } catch (err) {
      console.error('Delete product error:', err)
      showToast('Failed to delete product', 'error')
    }
  }

  const handleSort = (field: keyof Product | 'fullName' | 'category') => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortField('name')
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
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
      fullName: '',
      variety: '',
      grade: '',
      category: '',
      uom: '',
      active: ''
    })
    // Clear date range
    setDateRangeStart(null)
    setDateRangeEnd(null)
    // Clear grouping
    setGroupByColumn([])
    setExpandedGroups(new Set())
    // Clear sorting
    setSortField('name')
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

  // Helper function to get full product name
  const getFullName = (product: Product) => {
    return [product.name, product.variety, product.grade].filter(Boolean).join(' - ')
  }

  // Helper function to intelligently derive category from product name
  const getCategory = (productName: string) => {
    const name = productName.toLowerCase().trim()

    // Nuts
    if (name.includes('almond')) return 'Almonds'
    if (name.includes('walnut')) return 'Walnuts'
    if (name.includes('pecan')) return 'Pecans'
    if (name.includes('pistachio')) return 'Pistachios'
    if (name.includes('cashew')) return 'Cashews'
    if (name.includes('hazelnut') || name.includes('filbert')) return 'Hazelnuts'
    if (name.includes('macadamia')) return 'Macadamias'
    if (name.includes('brazil nut')) return 'Brazil Nuts'
    if (name.includes('pine nut') || name.includes('pinon')) return 'Pine Nuts'

    // Dried Fruits
    if (name.includes('raisin')) return 'Raisins'
    if (name.includes('date')) return 'Dates'
    if (name.includes('fig')) return 'Figs'
    if (name.includes('prune')) return 'Prunes'
    if (name.includes('apricot')) return 'Apricots'
    if (name.includes('cranberr')) return 'Cranberries'
    if (name.includes('cherry') || name.includes('cherries')) return 'Cherries'

    // Seeds
    if (name.includes('pumpkin seed')) return 'Pumpkin Seeds'
    if (name.includes('sunflower seed')) return 'Sunflower Seeds'
    if (name.includes('chia')) return 'Chia Seeds'
    if (name.includes('flax')) return 'Flax Seeds'
    if (name.includes('sesame')) return 'Sesame Seeds'

    // Produce
    if (name.includes('apple')) return 'Apples'
    if (name.includes('orange')) return 'Oranges'
    if (name.includes('grape')) return 'Grapes'
    if (name.includes('berry') || name.includes('berries')) return 'Berries'

    // If we can't determine, capitalize the first word as category
    const words = productName.trim().split(/\s+/)
    if (words.length > 0) {
      return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase() + 's'
    }

    return 'Other'
  }

  // Helper function to format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  }

  // Helper function to get default variant display
  const getDefaultVariant = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return '-'
    const defaultVariant = product.variants.find(v => v.isDefault)
    if (!defaultVariant) return product.variants[0] ?
      `${product.variants[0].size} ${product.variants[0].sizeUnit} ${product.variants[0].packageType}` : '-'
    return `${defaultVariant.size} ${defaultVariant.sizeUnit} ${defaultVariant.packageType}`
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
    const productDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    const diffTime = today.getTime() - productDate.getTime()
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
    if (productDate.getMonth() === today.getMonth() && productDate.getFullYear() === today.getFullYear()) {
      return '05_This Month'
    }

    // Last Month
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    if (productDate.getMonth() === lastMonth.getMonth() && productDate.getFullYear() === lastMonth.getFullYear()) {
      return '06_Last Month'
    }

    // This Quarter
    const currentQuarter = Math.floor(today.getMonth() / 3)
    const productQuarter = Math.floor(productDate.getMonth() / 3)
    if (productQuarter === currentQuarter && productDate.getFullYear() === today.getFullYear()) {
      return '07_This Quarter'
    }

    // This Year
    if (productDate.getFullYear() === today.getFullYear()) {
      return '08_This Year'
    }

    // Last Year
    if (productDate.getFullYear() === today.getFullYear() - 1) {
      return '09_Last Year'
    }

    // Older
    return '10_Older'
  }

  // Get value for grouping
  const getGroupValue = (product: Product, column: string): string => {
    switch (column) {
      case 'category':
        return getCategory(product.name)
      case 'active':
        return product.active ? 'Active' : 'Inactive'
      case 'variety':
        return product.variety || 'No Variety'
      case 'grade':
        return product.grade || 'No Grade'
      case 'uom':
        return product.uom || 'No UOM'
      case 'date':
        if (!product.createdAt) return 'No Date'
        const exactDate = new Date(product.createdAt)
        return exactDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      case 'dateRange':
        if (!product.createdAt) return 'No Date'
        const productDate = new Date(product.createdAt)
        const bucket = getDateRangeBucket(productDate)
        return bucket.substring(3) // Remove the "01_", "02_" prefix
      default:
        return 'Unknown'
    }
  }

  // Filter and sort products
  const processedProducts = useMemo(() => {
    let result = [...products]

    // Note: Active/Inactive filtering now handled by API

    // Apply date range filter (on createdAt)
    if (dateRangeStart || dateRangeEnd) {
      result = result.filter(product => {
        const productDate = new Date(product.createdAt)
        productDate.setHours(0, 0, 0, 0) // Normalize to start of day

        if (dateRangeStart && dateRangeEnd) {
          const startDate = new Date(dateRangeStart)
          startDate.setHours(0, 0, 0, 0)
          const endDate = new Date(dateRangeEnd)
          endDate.setHours(23, 59, 59, 999) // End of day
          return productDate >= startDate && productDate <= endDate
        } else if (dateRangeStart) {
          const startDate = new Date(dateRangeStart)
          startDate.setHours(0, 0, 0, 0)
          return productDate >= startDate
        } else if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd)
          endDate.setHours(23, 59, 59, 999)
          return productDate <= endDate
        }
        return true
      })
    }

    // Apply column filters
    if (columnFilters.fullName) {
      result = result.filter(product => {
        const fullName = getFullName(product)
        return fullName.toLowerCase().includes(columnFilters.fullName.toLowerCase())
      })
    }
    if (columnFilters.variety) {
      result = result.filter(product =>
        product.variety?.toLowerCase().includes(columnFilters.variety.toLowerCase())
      )
    }
    if (columnFilters.grade) {
      result = result.filter(product =>
        product.grade?.toLowerCase().includes(columnFilters.grade.toLowerCase())
      )
    }
    if (columnFilters.category) {
      result = result.filter(product => {
        const category = getCategory(product.name)
        return category.toLowerCase().includes(columnFilters.category.toLowerCase())
      })
    }
    if (columnFilters.uom) {
      result = result.filter(product =>
        product.uom?.toLowerCase().includes(columnFilters.uom.toLowerCase())
      )
    }
    if (columnFilters.active) {
      if (columnFilters.active === 'active') {
        result = result.filter(product => product.active)
      } else if (columnFilters.active === 'inactive') {
        result = result.filter(product => !product.active)
      }
    }

    // Apply global search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((product) => {
        const fullName = getFullName(product)
        const category = getCategory(product.name)

        return (
          product.name?.toLowerCase().includes(query) ||
          fullName.toLowerCase().includes(query) ||
          product.variety?.toLowerCase().includes(query) ||
          product.grade?.toLowerCase().includes(query) ||
          category.toLowerCase().includes(query) ||
          product.uom?.toLowerCase().includes(query)
        )
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortField === 'fullName') {
        aValue = getFullName(a)
        bValue = getFullName(b)
      } else if (sortField === 'category') {
        aValue = getCategory(a.name)
        bValue = getCategory(b.name)
      } else {
        aValue = a[sortField as keyof Product]
        bValue = b[sortField as keyof Product]
      }

      // Handle null/undefined values
      if (aValue == null) aValue = ''
      if (bValue == null) bValue = ''

      // Convert to string for comparison
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })

    return result
  }, [products, showActiveOnly, columnFilters, searchQuery, sortField, sortDirection, dateRangeStart, dateRangeEnd])

  // Helper function to create nested groups recursively
  const createNestedGroups = (products: Product[], columns: string[], parentKey: string = ''): any => {
    if (columns.length === 0) {
      return products
    }

    const [currentColumn, ...remainingColumns] = columns
    const groups = new Map<string, Product[]>()

    products.forEach(product => {
      const groupValue = getGroupValue(product, currentColumn)
      if (!groups.has(groupValue)) {
        groups.set(groupValue, [])
      }
      groups.get(groupValue)!.push(product)
    })

    // Sort groups by key
    const sortedGroups = Array.from(groups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )

    return sortedGroups.map(([groupKey, groupProducts]) => {
      const fullKey = parentKey ? `${parentKey}>${currentColumn}:${groupKey}` : `${currentColumn}:${groupKey}`
      return {
        key: fullKey,
        displayKey: groupKey,
        column: currentColumn,
        products: groupProducts,
        children: remainingColumns.length > 0
          ? createNestedGroups(groupProducts, remainingColumns, fullKey)
          : null
      }
    })
  }

  // Group products if grouping is enabled (supports multi-level grouping)
  const groupedProducts = useMemo(() => {
    if (groupByColumn.length === 0) {
      return null
    }

    return createNestedGroups(processedProducts, groupByColumn)
  }, [processedProducts, groupByColumn])

  // Calculate aggregations
  const aggregations = useMemo(() => {
    const totalProducts = processedProducts.length
    const activeProducts = processedProducts.filter(p => p.active).length
    const inactiveProducts = processedProducts.filter(p => !p.active).length

    return {
      totalProducts,
      activeProducts,
      inactiveProducts
    }
  }, [processedProducts])

  // Column menu component
  const ColumnMenu = React.memo(({ column, label }: { column: string, label: string }) => {
    const isOpen = openColumnMenu === column
    const filterValue = columnFilters[column as keyof typeof columnFilters] || ''
    const hasFilter = filterValue !== '' || (column === 'date' && (dateRangeStart !== null || dateRangeEnd !== null))

    return (
      <div className="relative inline-block" ref={isOpen ? columnMenuRef : null}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpenColumnMenu(isOpen ? null : column)
          }}
          className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Column menu"
        >
          {hasFilter ? <FilterX className="h-3 w-3 text-blue-600" /> : <Menu className="h-3 w-3" />}
        </button>

        {isOpen && (
          <div
            className={`absolute ${column === 'date' ? 'right-0' : 'left-0'} top-full mt-1 ${column === 'date' ? 'min-w-[500px] max-w-[min(600px,calc(100vw-2rem))] max-h-[80vh] overflow-auto' : 'w-56'} bg-white rounded-lg shadow-lg border border-gray-200 z-40`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 space-y-2">
              {/* Special handling for date column */}
              {column === 'date' ? (
                <>
                  <label className="block text-xs font-medium text-teal-700 dark:text-teal-300 mb-1">
                    Quick Presets
                  </label>
                  <div className="space-y-1">
                    <button
                      onClick={() => setDatePreset('today')}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setDatePreset('thisWeek')}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => setDatePreset('thisMonth')}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => setDatePreset('thisQuarter')}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                    >
                      This Quarter
                    </button>
                    <button
                      onClick={() => setDatePreset('thisYear')}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                    >
                      This Year
                    </button>
                  </div>

                  <div className="border-t border-teal-200 dark:border-teal-700 pt-2 mt-2">
                    <label className="block text-xs font-medium text-teal-700 dark:text-teal-300 mb-2">
                      Custom Range
                    </label>
                    <DateRangePicker
                      startDate={dateRangeStart}
                      endDate={dateRangeEnd}
                      onStartDateChange={setDateRangeStart}
                      onEndDateChange={setDateRangeEnd}
                    />
                  </div>

                  {(dateRangeStart || dateRangeEnd) && (
                    <div className="border-t border-teal-200 dark:border-teal-700 pt-2 mt-2">
                      <button
                        onClick={() => {
                          setDateRangeStart(null)
                          setDateRangeEnd(null)
                          setOpenColumnMenu(null)
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Clear Date Filter
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Filter input for non-date columns */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Filter</label>
                    {column === 'active' ? (
                      <select
                        value={filterValue}
                        onChange={(e) => handleColumnFilterChange(column, e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="border-t border-gray-200 pt-2">
                    <button
                      onClick={() => {
                        handleSort(column as any)
                        setSortDirection('asc')
                        setOpenColumnMenu(null)
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <ArrowUp className="h-3 w-3" />
                      Sort Ascending
                    </button>
                    <button
                      onClick={() => {
                        handleSort(column as any)
                        setSortDirection('desc')
                        setOpenColumnMenu(null)
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <ArrowDown className="h-3 w-3" />
                      Sort Descending
                    </button>
                    {sortField === column && (
                      <button
                        onClick={() => {
                          setSortField('name')
                          setOpenColumnMenu(null)
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        <X className="h-3 w-3" />
                        Clear Sort
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  })

  // Render product row
  const renderProductRow = (product: Product) => {
    const isArchived = !product.active
    const isQuickBooks = product.source === 'quickbooks_import'

    return (
      <Fragment key={product.id}>
        <tr
          className={`border-b border-gray-200 transition-colors ${
            isArchived
              ? 'bg-gray-50/50 hover:bg-gray-100/50 opacity-60'
              : 'hover:bg-blue-50/50'
          }`}
        >
          <td className="px-4 py-3">
            <button
              onClick={() =>
                setExpandedProductId(
                  expandedProductId === product.id ? null : product.id
                )
              }
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedProductId === product.id ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </td>
          {columnVisibility.fullName && (
            <td className="px-4 py-3 border-r border-gray-200">
              <div className="flex items-center gap-2">
                {product.code && (
                  <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-mono font-medium text-blue-800">
                    {product.code}
                  </span>
                )}
                <Link
                  href={`/products/${product.id}`}
                  className={`text-sm font-medium hover:underline ${
                    isArchived ? 'text-gray-500' : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  {product.name}
                </Link>
                {isQuickBooks && isArchived && (
                  <span className="inline-flex items-center rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    QB Import
                  </span>
                )}
              </div>
            </td>
          )}
          {columnVisibility.variety && (
            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
              {product.variety || '-'}
            </td>
          )}
          {columnVisibility.grade && (
            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
              {product.grade || '-'}
            </td>
          )}
          {columnVisibility.category && (
            <td className="px-4 py-3 border-r border-gray-200">
              {product.category ? (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                  {product.category}
                </span>
              ) : (
                <span className="text-gray-400 text-xs">-</span>
              )}
            </td>
          )}
          {columnVisibility.defaultVariant && (
            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
              {getDefaultVariant(product)}
            </td>
          )}
          {columnVisibility.uom && (
            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
              {product.uom || '-'}
            </td>
          )}
          {columnVisibility.active && (
            <td className="px-3 py-2 text-center border-r border-gray-200">
              {product.active ? (
                <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mx-auto" />
              )}
            </td>
          )}
          <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200">
            {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' }) : '-'}
          </td>
        </tr>
        {expandedProductId === product.id && (
          <tr className="bg-gray-50">
            <td colSpan={10} className="px-3 py-2">
              <div className="grid grid-cols-2 gap-6">
                {/* Product Details */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Product Details
                  </h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                    {product.code && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Product Code
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-mono mt-1">
                          {product.code}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Full Name
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {getFullName(product)}
                      </p>
                    </div>
                    {product.category && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Category
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                          {product.category}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Status
                      </label>
                      <p className="mt-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            product.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Variants */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Product Variants
                  </h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    {product.variants && product.variants.length > 0 ? (
                      <div className="space-y-2">
                        {product.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className={`flex items-center justify-between p-2.5 rounded-md border ${
                              variant.isDefault
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {variant.isDefault && (
                                <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                                  Default
                                </span>
                              )}
                              <span className="text-sm font-medium text-gray-900">
                                {variant.size} {variant.sizeUnit}
                              </span>
                              <span className="text-sm text-gray-600">
                                {variant.packageType}
                              </span>
                            </div>
                            {!variant.active && (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                Inactive
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        <p className="text-sm">No variants defined</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    )
  }

  // Recursive function to render nested groups
  const renderNestedGroups = (groups: any[], level: number = 0): any => {
    return groups.map(group => (
      <React.Fragment key={group.key}>
        <tr
          className={`border-b ${
            level === 0
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
              : level === 1
              ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}
        >
          <td colSpan={11} style={{ paddingLeft: `${(level + 1) * 16}px` }} className="py-3">
            <button
              onClick={() => toggleGroupExpansion(group.key)}
              className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
            >
              {expandedGroups.has(group.key) ? (
                <ChevronDown
                  className={`h-4 w-4 ${
                    level === 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : level === 1
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                />
              ) : (
                <ChevronRight
                  className={`h-4 w-4 ${
                    level === 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : level === 1
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                />
              )}
              <span
                className={`text-sm font-semibold ${
                  level === 0
                    ? 'text-blue-900 dark:text-blue-200'
                    : level === 1
                    ? 'text-purple-900 dark:text-purple-200'
                    : 'text-gray-900 dark:text-gray-200'
                }`}
              >
                {group.column}: {group.displayKey}
              </span>
              <span
                className={`text-xs ml-2 ${
                  level === 0
                    ? 'text-blue-700 dark:text-blue-300'
                    : level === 1
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                ({group.products.length} {group.products.length === 1 ? 'product' : 'products'})
              </span>
            </button>
          </td>
        </tr>
        {expandedGroups.has(group.key) &&
          (group.children
            ? renderNestedGroups(group.children, level + 1)
            : group.products.map((product: Product) => renderProductRow(product)))}
      </React.Fragment>
    ))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">Products</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Manage your product catalog and inventory</p>
        </div>
        <Link href="/products/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Button>
        </Link>
      </div>

      {/* Search Bar and Filters */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-[70%]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 sm:w-auto">
              {/* Active Toggle Button - Shows/Hides Archived Products */}
              <button
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                  showActiveOnly
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md'
                    : 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700 shadow-md'
                }`}
                title={showActiveOnly ? "Click to show archived QuickBooks products (589 items)" : "Hiding archived products - click to show"}
              >
                {showActiveOnly ? (
                  <>
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Active Only</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span className="text-sm font-medium">Showing All</span>
                  </>
                )}
              </button>

              {/* Group By Multi-Select - Icon Only */}
              <div className="relative" ref={groupingPanelRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowGroupingPanel(!showGroupingPanel)
                  }}
                  className={`flex items-center justify-center p-2.5 rounded-lg border transition-all ${
                    groupByColumn.length > 0
                      ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                  title="Group products"
                >
                  <Layers className="h-5 w-5" />
                  {groupByColumn.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-purple-600 rounded-full">
                      {groupByColumn.length}
                    </span>
                  )}
                </button>

                {showGroupingPanel && (
                  <div
                    className="absolute right-0 top-full mt-1 w-72 max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Group By (Multi-Select)
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Select multiple columns to create nested groups
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { value: 'category', label: 'Category' },
                        { value: 'active', label: 'Status' },
                        { value: 'variety', label: 'Variety' },
                        { value: 'grade', label: 'Grade' },
                        { value: 'uom', label: 'UOM' },
                        { value: 'date', label: 'Created Date (Exact)' },
                        { value: 'dateRange', label: 'Created Date (Range)' }
                      ].map(({ value, label }, index) => {
                        const isSelected = groupByColumn.includes(value)
                        const selectionIndex = groupByColumn.indexOf(value)

                        return (
                          <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded group">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  // Remove this column
                                  setGroupByColumn(groupByColumn.filter(c => c !== value))
                                } else {
                                  // Add this column
                                  setGroupByColumn([...groupByColumn, value])
                                }
                              }}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 flex-1">{label}</span>
                            {isSelected && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                                {selectionIndex + 1}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                    {groupByColumn.length > 0 && (
                      <button
                        onClick={() => {
                          setGroupByColumn([])
                          setExpandedGroups(new Set())
                        }}
                        className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Clear Grouping
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Column Visibility Button - Icon Only */}
              <div className="relative" ref={showColumnVisibilityPanel ? columnVisibilityRef : null}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowColumnVisibilityPanel(!showColumnVisibilityPanel)
                  }}
                  className="flex items-center justify-center p-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all"
                  title="Toggle column visibility"
                >
                  <Eye className="h-5 w-5" />
                </button>

                {showColumnVisibilityPanel && (
                  <div
                    className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-3"
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
                          <span className="text-sm text-gray-700 capitalize">
                            {key === 'fullName' ? 'Full Name' : key === 'uom' ? 'UOM' : key}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Clear All Filters Button - Icon Only */}
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
          <p className="text-gray-600">Loading products...</p>
        </div>
      )}

      {/* Products Table */}
      {!isLoading && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {/* Header Row */}
                  <tr className="border-b border-gray-300 dark:border-gray-700">
                    <th className="w-12 px-2 sm:px-4 bg-gray-50 dark:bg-transparent"></th>
                    {columnVisibility.fullName && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Product Full Name</span>
                          <ColumnMenu column="fullName" label="Product Full Name" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.variety && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Variety</span>
                          <ColumnMenu column="variety" label="Variety" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.grade && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Grade</span>
                          <ColumnMenu column="grade" label="Grade" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.category && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Category</span>
                          <ColumnMenu column="category" label="Category" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.defaultVariant && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Default Variant</span>
                          <ColumnMenu column="defaultVariant" label="Default Variant" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.uom && (
                      <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>UOM</span>
                          <ColumnMenu column="uom" label="UOM" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.active && (
                      <th className="px-4 py-2 text-center bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>Status</span>
                          <ColumnMenu column="active" label="Status" />
                        </div>
                      </th>
                    )}
                    <th className="px-4 py-2 text-left bg-gray-50 dark:bg-transparent border-r border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <span>Last Updated</span>
                        <ColumnMenu column="date" label="Last Updated" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {groupByColumn.length > 0 && groupedProducts ? (
                    // Render nested grouped products
                    renderNestedGroups(groupedProducts)
                  ) : (
                    // Render ungrouped products
                    processedProducts.map(product => renderProductRow(product))
                  )}
                </tbody>
                {/* Aggregation Footer */}
                {processedProducts.length > 0 && (
                  <tfoot className="border-t-2 border-gray-300 bg-gray-100">
                    <tr>
                      <td colSpan={10} className="px-4 py-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-6">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              Total Products: <span className="text-blue-600">{aggregations.totalProducts}</span>
                            </span>
                            <span className="text-gray-700">
                              Active: <span className="text-green-600 font-medium">{aggregations.activeProducts}</span>
                            </span>
                            <span className="text-gray-700">
                              Inactive: <span className="text-red-600 font-medium">{aggregations.inactiveProducts}</span>
                            </span>
                          </div>
                          {groupByColumn.length > 0 && (
                            <span className="text-gray-600 text-xs italic">
                              Grouped by {groupByColumn.join(' > ')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {processedProducts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || hasActiveColumnFilters
                    ? 'Try adjusting your search query or filters'
                    : 'Get started by creating a new product'}
                </p>
                {!searchQuery && !hasActiveColumnFilters && (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Product
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
