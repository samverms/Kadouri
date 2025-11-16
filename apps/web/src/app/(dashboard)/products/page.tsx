'use client'

import React, { useState, useEffect, Fragment, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { Plus, Search, Package, ChevronRight, ChevronDown, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, Copy, Menu, Eye, EyeOff, Layers, X, Filter } from 'lucide-react'

interface Product {
  id: string
  name: string
  variety?: string
  grade?: string
  active: boolean
  createdAt: string
  uom?: string
  qboItemId?: string
  code?: string
  category?: string
}

interface ColumnVisibility {
  fullName: boolean
  name: boolean
  variety: boolean
  grade: boolean
  category: boolean
  uom: boolean
  active: boolean
}

export default function ProductsPage() {
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
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
    name: '',
    variety: '',
    grade: '',
    category: '',
    uom: '',
    active: ''
  })

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    fullName: true,
    name: true,
    variety: true,
    grade: true,
    category: true,
    uom: false,
    active: true
  })
  const [showColumnVisibilityPanel, setShowColumnVisibilityPanel] = useState(false)
  const columnVisibilityRef = useRef<HTMLDivElement>(null)

  // Column grouping state
  const [groupByColumn, setGroupByColumn] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Show active filter
  const [showActiveOnly, setShowActiveOnly] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:2000/api/products', {
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
      const response = await fetch(`http://localhost:2000/api/products/${productId}`, {
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
    setColumnFilters({
      fullName: '',
      name: '',
      variety: '',
      grade: '',
      category: '',
      uom: '',
      active: ''
    })
  }

  // Check if any column filters are active
  const hasActiveColumnFilters = Object.values(columnFilters).some(value => value !== '')

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
      default:
        return 'Unknown'
    }
  }

  // Filter and sort products
  const processedProducts = useMemo(() => {
    let result = [...products]

    // Apply active status filter
    if (showActiveOnly) {
      result = result.filter(product => product.active)
    }

    // Apply column filters
    if (columnFilters.fullName) {
      result = result.filter(product => {
        const fullName = getFullName(product)
        return fullName.toLowerCase().includes(columnFilters.fullName.toLowerCase())
      })
    }
    if (columnFilters.name) {
      result = result.filter(product =>
        product.name?.toLowerCase().includes(columnFilters.name.toLowerCase())
      )
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
  }, [products, showActiveOnly, columnFilters, searchQuery, sortField, sortDirection])

  // Group products if grouping is enabled
  const groupedProducts = useMemo(() => {
    if (!groupByColumn) {
      return null
    }

    const groups = new Map<string, Product[]>()

    processedProducts.forEach(product => {
      const groupValue = getGroupValue(product, groupByColumn)
      if (!groups.has(groupValue)) {
        groups.set(groupValue, [])
      }
      groups.get(groupValue)!.push(product)
    })

    // Sort groups by key
    const sortedGroups = Array.from(groups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )

    return sortedGroups
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
          <Menu className="h-3 w-3" />
        </button>

        {isOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 space-y-2">
              {/* Filter input */}
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
            </div>
          </div>
        )}
      </div>
    )
  })

  // Render product row
  const renderProductRow = (product: Product) => {
    return (
      <Fragment key={product.id}>
        <tr
          className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors"
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
              <Link
                href={`/products/${product.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {getFullName(product)}
              </Link>
            </td>
          )}
          {columnVisibility.name && (
            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
              {product.name}
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
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                {getCategory(product.name)}
              </span>
            </td>
          )}
          {columnVisibility.uom && (
            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
              {product.uom || '-'}
            </td>
          )}
          {columnVisibility.active && (
            <td className="px-4 py-3 text-center border-r border-gray-200">
              {product.active ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  Inactive
                </span>
              )}
            </td>
          )}
          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex gap-2 justify-end">
              <Link href={`/products/${product.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Edit product"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDeleteProduct(product.id, getFullName(product))}
                title="Delete product"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </td>
        </tr>
        {expandedProductId === product.id && (
          <tr className="bg-gray-50">
            <td colSpan={10} className="px-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Product Details */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Product Details
                  </h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                    {product.code && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Product Code
                        </label>
                        <p className="text-sm text-gray-900 font-mono mt-1">
                          {product.code}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Full Name
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {getFullName(product)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Category
                      </label>
                      <p className="text-sm text-gray-900 mt-1 capitalize">
                        {getCategory(product.name)}
                      </p>
                    </div>
                    {product.uom && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Unit of Measure
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {product.uom}
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

                {/* QuickBooks Integration */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    QuickBooks Integration
                  </h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    {product.qboItemId ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">
                            QuickBooks Item ID
                          </label>
                          <p className="text-sm text-gray-900 font-mono mt-1">
                            {product.qboItemId}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">
                            Sync Status
                          </label>
                          <p className="mt-1">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Connected
                            </span>
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View in QuickBooks
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Not synced with QuickBooks
                        </p>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Sync to QuickBooks
                        </Button>
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

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-gray-600">Manage your product catalog and inventory</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      {/* Search Bar and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products by name, variety, grade, or category..."
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
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                  title="Toggle column visibility"
                >
                  <Eye className="h-4 w-4" />
                  Columns
                </button>

                {showColumnVisibilityPanel && (
                  <div
                    className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Show/Hide Columns</h4>
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

              {/* Group By Dropdown */}
              <div className="relative">
                <select
                  value={groupByColumn || ''}
                  onChange={(e) => {
                    setGroupByColumn(e.target.value || null)
                    setExpandedGroups(new Set())
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap text-sm appearance-none pr-8"
                  title="Group by column"
                >
                  <option value="">No Grouping</option>
                  <option value="category">Group by Category</option>
                  <option value="active">Group by Status</option>
                  <option value="variety">Group by Variety</option>
                  <option value="grade">Group by Grade</option>
                </select>
                <Layers className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

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
          <p className="text-gray-600">Loading products...</p>
        </div>
      )}

      {/* Create Product Dialog */}
      {showCreateDialog && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Create New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="e.g., Almonds" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Code
                  </label>
                  <Input placeholder="Auto-generated if left blank" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variety
                  </label>
                  <Input placeholder="e.g., Nonpareil" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <Input placeholder="e.g., Premium" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="">Select category</option>
                    <option value="nuts">Nuts</option>
                    <option value="dried-fruit">Dried Fruit</option>
                    <option value="seeds">Seeds</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Product
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      {!isLoading && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {/* Header Row */}
                  <tr className="border-b border-gray-300">
                    <th className="w-12 px-2 sm:px-4 bg-gray-50"></th>
                    {columnVisibility.fullName && (
                      <th className="px-4 py-2 text-left bg-gray-50 border-r border-gray-200">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>Product Full Name</span>
                          <ColumnMenu column="fullName" label="Product Full Name" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.name && (
                      <th className="px-4 py-2 text-left bg-gray-50 border-r border-gray-200">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>Short Name</span>
                          <ColumnMenu column="name" label="Short Name" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.variety && (
                      <th className="px-4 py-2 text-left bg-gray-50 border-r border-gray-200">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>Variety</span>
                          <ColumnMenu column="variety" label="Variety" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.grade && (
                      <th className="px-4 py-2 text-left bg-gray-50 border-r border-gray-200">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>Grade</span>
                          <ColumnMenu column="grade" label="Grade" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.category && (
                      <th className="px-4 py-2 text-left bg-gray-50 border-r border-gray-200">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>Category</span>
                          <ColumnMenu column="category" label="Category" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.uom && (
                      <th className="px-4 py-2 text-left bg-gray-50 border-r border-gray-200">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>UOM</span>
                          <ColumnMenu column="uom" label="UOM" />
                        </div>
                      </th>
                    )}
                    {columnVisibility.active && (
                      <th className="px-4 py-2 text-center bg-gray-50 border-r border-gray-200">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span>Status</span>
                          <ColumnMenu column="active" label="Status" />
                        </div>
                      </th>
                    )}
                    <th className="px-4 py-2 text-right bg-gray-50 text-xs font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {groupByColumn && groupedProducts ? (
                    // Render grouped products
                    groupedProducts.map(([groupKey, groupProducts]) => (
                      <React.Fragment key={groupKey}>
                        {/* Group Header Row */}
                        <tr className="bg-blue-50 border-b border-blue-200">
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
                              <span className="text-sm font-semibold text-blue-900">
                                {groupKey}
                              </span>
                              <span className="text-xs text-blue-700 ml-2">
                                ({groupProducts.length} {groupProducts.length === 1 ? 'product' : 'products'})
                              </span>
                            </button>
                          </td>
                        </tr>
                        {/* Group Rows */}
                        {expandedGroups.has(groupKey) && groupProducts.map(product => renderProductRow(product))}
                      </React.Fragment>
                    ))
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
                            <span className="font-semibold text-gray-900">
                              Total Products: <span className="text-blue-600">{aggregations.totalProducts}</span>
                            </span>
                            <span className="text-gray-700">
                              Active: <span className="text-green-600 font-medium">{aggregations.activeProducts}</span>
                            </span>
                            <span className="text-gray-700">
                              Inactive: <span className="text-red-600 font-medium">{aggregations.inactiveProducts}</span>
                            </span>
                          </div>
                          {groupByColumn && (
                            <span className="text-gray-600 text-xs italic">
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
            {processedProducts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
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
