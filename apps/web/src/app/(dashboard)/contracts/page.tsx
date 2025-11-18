'use client'

import React, { useEffect, useState, Fragment, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from '@/components/ui/date-picker'
import { Plus, Search, Eye, Calendar, Package, DollarSign, ChevronRight, ChevronDown, User, FileText, Filter, FilterX, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface Contract {
  id: string
  contractNumber: string
  sellerId: string
  buyerId: string
  productId: string
  totalQuantity: string
  remainingQuantity: string
  unit: string
  pricePerUnit: string
  totalValue: string
  currency: string
  validFrom: string
  validUntil: string
  status: string
  createdAt: string
}

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedContractIds, setExpandedContractIds] = useState<Set<string>>(new Set())

  // Date range filter state
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null)

  // Sorting and filtering state
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = useState({
    contractNumber: '',
    seller: '',
    buyer: '',
    product: '',
    amount: '',
    status: ''
  })

  const COMMISSION_RATE = 0.005 // 0.5%

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      const res = await fetch('http://localhost:2000/api/contracts', {
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json()
        console.error('API Error:', res.status, errorData)
        throw new Error(`Failed to fetch contracts: ${errorData.message || res.statusText}`)
      }

      const data = await res.json()
      setContracts(data)
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (contractId: string) => {
    const newExpanded = new Set(expandedContractIds)
    if (newExpanded.has(contractId)) {
      newExpanded.delete(contractId)
    } else {
      newExpanded.add(contractId)
    }
    setExpandedContractIds(newExpanded)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
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

  const handleColumnFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }))
  }

  const clearAllFilters = () => {
    setColumnFilters({
      contractNumber: '',
      seller: '',
      buyer: '',
      product: '',
      amount: '',
      status: ''
    })
    setDateRangeStart(null)
    setDateRangeEnd(null)
    setSearchTerm('')
    setStatusFilter('all')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:text-gray-200 border-gray-300'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'cancelled':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:text-gray-200 border-gray-300'
    }
  }

  const calculateCommission = (totalValue: string) => {
    return parseFloat(totalValue) * COMMISSION_RATE
  }

  // Filter and sort contracts
  const filteredAndSortedContracts = (() => {
    let filtered = contracts.filter((contract) => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter

      // Column filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([key, value]) => {
        if (!value) return true

        switch (key) {
          case 'contractNumber':
            return contract.contractNumber.toLowerCase().includes(value.toLowerCase())
          case 'amount':
            return contract.totalValue.includes(value)
          case 'status':
            return contract.status.toLowerCase().includes(value.toLowerCase())
          default:
            return true
        }
      })

      // Date range filter
      let matchesDateRange = true
      if (dateRangeStart || dateRangeEnd) {
        const contractDate = new Date(contract.validFrom)
        if (dateRangeStart) {
          matchesDateRange = matchesDateRange && contractDate >= dateRangeStart
        }
        if (dateRangeEnd) {
          matchesDateRange = matchesDateRange && contractDate <= dateRangeEnd
        }
      }

      return matchesSearch && matchesStatus && matchesColumnFilters && matchesDateRange
    })

    // Sort
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal: any
        let bVal: any

        switch (sortColumn) {
          case 'contractNumber':
            aVal = a.contractNumber
            bVal = b.contractNumber
            break
          case 'amount':
            aVal = parseFloat(a.totalValue)
            bVal = parseFloat(b.totalValue)
            break
          case 'commission':
            aVal = calculateCommission(a.totalValue)
            bVal = calculateCommission(b.totalValue)
            break
          case 'validFrom':
            aVal = new Date(a.validFrom).getTime()
            bVal = new Date(b.validFrom).getTime()
            break
          case 'validUntil':
            aVal = new Date(a.validUntil).getTime()
            bVal = new Date(b.validUntil).getTime()
            break
          case 'status':
            aVal = a.status
            bVal = b.status
            break
          default:
            return 0
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  })()

  // Calculate summary stats
  const stats = {
    total: contracts.length,
    active: contracts.filter((c) => c.status === 'active').length,
    draft: contracts.filter((c) => c.status === 'draft').length,
    completed: contracts.filter((c) => c.status === 'completed').length,
    totalValue: contracts.reduce((sum, c) => sum + parseFloat(c.totalValue || '0'), 0),
    totalCommission: contracts.reduce((sum, c) => sum + calculateCommission(c.totalValue || '0'), 0),
  }

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' ||
    Object.values(columnFilters).some(v => v !== '') || dateRangeStart !== null || dateRangeEnd !== null

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />
    return sortDirection === 'asc' ?
      <ArrowUp className="h-3 w-3 ml-1 text-blue-600" /> :
      <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-blue-400">Contracts</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Manage purchase agreements and contract draws
          </p>
        </div>
        <Button
          onClick={() => router.push('/contracts/new')}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contracts</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Package className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats.active}</p>
              </div>
              <Calendar className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft</p>
                <p className="text-2xl font-bold mt-1 text-gray-600">{stats.draft}</p>
              </div>
              <Package className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commission (0.5%)</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">
                  ${stats.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="w-full sm:w-[70%]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date Range Picker */}
              <div className="flex items-center gap-2">
                <DateRangePicker
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onStartDateChange={setDateRangeStart}
                  onEndDateChange={setDateRangeEnd}
                />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className={statusFilter === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('draft')}
              >
                Draft
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
                className={statusFilter === 'completed' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contracts ({filteredAndSortedContracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedContracts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {hasActiveFilters
                  ? 'No contracts match your filters'
                  : 'No contracts yet'}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => router.push('/contracts/new')}
                  className="mt-4"
                  variant="outline"
                >
                  Create your first contract
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-transparent">
                    <th className="text-left py-2 px-3 w-8"></th>
                    <th className="text-left py-2 px-3 font-semibold text-xs text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleSort('contractNumber')}
                          className="flex items-center hover:text-blue-600"
                        >
                          CONTRACT #
                          <SortIcon column="contractNumber" />
                        </button>
                      </div>
                      <Input
                        placeholder="Filter..."
                        value={columnFilters.contractNumber}
                        onChange={(e) => handleColumnFilterChange('contractNumber', e.target.value)}
                        className="mt-1 h-7 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-xs text-gray-700 dark:text-gray-300">
                      QUANTITY
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-xs text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleSort('amount')}
                          className="flex items-center hover:text-blue-600"
                        >
                          TOTAL VALUE
                          <SortIcon column="amount" />
                        </button>
                      </div>
                      <Input
                        placeholder="Filter..."
                        value={columnFilters.amount}
                        onChange={(e) => handleColumnFilterChange('amount', e.target.value)}
                        className="mt-1 h-7 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-xs text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleSort('commission')}
                          className="flex items-center hover:text-blue-600"
                        >
                          COMMISSION (0.5%)
                          <SortIcon column="commission" />
                        </button>
                      </div>
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-xs text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleSort('validFrom')}
                          className="flex items-center hover:text-blue-600"
                        >
                          VALID FROM
                          <SortIcon column="validFrom" />
                        </button>
                      </div>
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-xs text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleSort('validUntil')}
                          className="flex items-center hover:text-blue-600"
                        >
                          VALID UNTIL
                          <SortIcon column="validUntil" />
                        </button>
                      </div>
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-xs text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center hover:text-blue-600"
                        >
                          STATUS
                          <SortIcon column="status" />
                        </button>
                      </div>
                      <Input
                        placeholder="Filter..."
                        value={columnFilters.status}
                        onChange={(e) => handleColumnFilterChange('status', e.target.value)}
                        className="mt-1 h-7 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th className="text-right py-2 px-3 font-semibold text-xs text-gray-700 dark:text-gray-300">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedContracts.map((contract) => {
                    const isExpanded = expandedContractIds.has(contract.id)
                    const commission = calculateCommission(contract.totalValue)

                    return (
                      <Fragment key={contract.id}>
                        <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="py-3 px-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpanded(contract.id)
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-blue-600">
                              {contract.contractNumber}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-sm">
                              <span className="font-semibold">
                                {parseFloat(contract.remainingQuantity).toLocaleString()}
                              </span>
                              <span className="text-gray-500">
                                {' '}
                                / {parseFloat(contract.totalQuantity).toLocaleString()}
                              </span>
                              <span className="text-gray-400 ml-1">{contract.unit}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-sm">
                            ${parseFloat(contract.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 font-semibold text-sm text-purple-600">
                            ${commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-sm">
                            {new Date(contract.validFrom).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 text-sm">
                            {new Date(contract.validUntil).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                contract.status
                              )}`}
                            >
                              {contract.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/contracts/${contract.id}`)
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td colSpan={9} className="py-4 px-6">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 mb-1">Product Details</p>
                                  <p className="text-sm font-medium">Product ID: {contract.productId}</p>
                                  <p className="text-sm text-gray-600">Price per {contract.unit}: ${parseFloat(contract.pricePerUnit).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 mb-1">Parties</p>
                                  <p className="text-sm text-gray-600">Seller ID: {contract.sellerId}</p>
                                  <p className="text-sm text-gray-600">Buyer ID: {contract.buyerId}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 mb-1">Commission Breakdown</p>
                                  <p className="text-sm text-gray-600">Rate: 0.5%</p>
                                  <p className="text-sm font-medium text-purple-600">Amount: ${commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
