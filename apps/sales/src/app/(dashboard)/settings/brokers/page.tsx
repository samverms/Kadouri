'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { Plus, Search, Briefcase, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, Eye, EyeOff, Filter, FilterX, Mail, Phone, Building2, CheckCircle2, XCircle } from 'lucide-react'
import type { Broker } from '@kadouri/shared'

interface ColumnVisibility {
  name: boolean
  companyName: boolean
  email: boolean
  phone: boolean
  active: boolean
  createdAt: boolean
}

export default function BrokersPage() {
  const { getToken } = useAuth()
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<keyof Broker>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [brokers, setBrokers] = useState<Broker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Column filters state
  const [columnFilters, setColumnFilters] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: ''
  })

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    name: true,
    companyName: true,
    email: true,
    phone: true,
    active: true,
    createdAt: true
  })
  const [showColumnVisibilityPanel, setShowColumnVisibilityPanel] = useState(false)
  const columnVisibilityRef = useRef<HTMLDivElement>(null)

  // Column menu state
  const [openColumnMenu, setOpenColumnMenu] = useState<string | null>(null)
  const columnMenuRef = useRef<HTMLDivElement>(null)

  // Fetch brokers
  useEffect(() => {
    fetchBrokers()
  }, [])

  const fetchBrokers = async () => {
    try {
      setIsLoading(true)
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brokers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch brokers')

      const data = await response.json()
      setBrokers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      showToast('Failed to fetch brokers', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this broker?')) return

    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brokers/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete broker')

      showToast('Broker deleted successfully', 'success')
      fetchBrokers()
    } catch (err) {
      showToast('Failed to delete broker', 'error')
    }
  }

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setOpenColumnMenu(null)
      }
      if (columnVisibilityRef.current && !columnVisibilityRef.current.contains(event.target as Node)) {
        setShowColumnVisibilityPanel(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter and sort brokers
  const filteredBrokers = useMemo(() => {
    let filtered = brokers

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(broker =>
        broker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        broker.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        broker.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        broker.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply active status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(broker =>
        activeFilter === 'active' ? broker.active : !broker.active
      )
    }

    // Apply column filters
    if (columnFilters.name) {
      filtered = filtered.filter(broker =>
        broker.name.toLowerCase().includes(columnFilters.name.toLowerCase())
      )
    }
    if (columnFilters.companyName) {
      filtered = filtered.filter(broker =>
        broker.companyName?.toLowerCase().includes(columnFilters.companyName.toLowerCase())
      )
    }
    if (columnFilters.email) {
      filtered = filtered.filter(broker =>
        broker.email?.toLowerCase().includes(columnFilters.email.toLowerCase())
      )
    }
    if (columnFilters.phone) {
      filtered = filtered.filter(broker =>
        broker.phone?.toLowerCase().includes(columnFilters.phone.toLowerCase())
      )
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? 1 : -1
      if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? -1 : 1

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [brokers, searchQuery, activeFilter, columnFilters, sortField, sortDirection])

  const handleSort = (field: keyof Broker) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const renderSortIcon = (field: keyof Broker) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return sortDirection === 'asc' ?
      <ArrowUp className="h-3 w-3 ml-1" /> :
      <ArrowDown className="h-3 w-3 ml-1" />
  }

  const handleColumnFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }))
  }

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }))
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setActiveFilter('all')
    setColumnFilters({ name: '', companyName: '', email: '', phone: '' })
  }

  const hasActiveFilters = searchQuery || activeFilter !== 'all' || Object.values(columnFilters).some(v => v)

  const renderColumnHeader = (
    label: string,
    field: keyof Broker,
    filterKey: keyof typeof columnFilters
  ) => (
    <div className="relative">
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 font-medium hover:text-foreground/80 transition-colors"
      >
        {label}
        {renderSortIcon(field)}
      </button>
      <Input
        type="text"
        placeholder={`Filter...`}
        value={columnFilters[filterKey]}
        onChange={(e) => handleColumnFilterChange(filterKey, e.target.value)}
        className="mt-2 h-8 text-xs"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">Loading brokers...</CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center text-destructive">{error}</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brokers</h1>
          <p className="text-muted-foreground mt-1">Manage brokersfor your accounts</p>
        </div>
        <Link href="/settings/brokers/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Broker
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search brokers by name, company, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center gap-2"
                >
                  <FilterX className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              <div className="relative" ref={columnVisibilityRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowColumnVisibilityPanel(!showColumnVisibilityPanel)}
                  className="flex items-center gap-2"
                >
                  <EyeOff className="h-4 w-4" />
                  Columns
                </Button>
                {showColumnVisibilityPanel && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-background border rounded-lg shadow-lg p-3 z-50">
                    <div className="text-sm font-medium mb-2">Show/Hide Columns</div>
                    {Object.entries(columnVisibility).map(([col, visible]) => (
                      <label key={col} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted rounded px-2">
                        <input
                          type="checkbox"
                          checked={visible}
                          onChange={() => toggleColumnVisibility(col as keyof ColumnVisibility)}
                          className="rounded"
                        />
                        <span className="text-sm capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Status:</span>
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
            >
              All
            </Button>
            <Button
              variant={activeFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('active')}
              className="gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              Active
            </Button>
            <Button
              variant={activeFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('inactive')}
              className="gap-1"
            >
              <XCircle className="h-3 w-3" />
              Inactive
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {columnVisibility.name && (
                    <th className="text-left p-4 text-sm font-medium">
                      {renderColumnHeader('Name', 'name', 'name')}
                    </th>
                  )}
                  {columnVisibility.companyName && (
                    <th className="text-left p-4 text-sm font-medium">
                      {renderColumnHeader('Company', 'companyName', 'companyName')}
                    </th>
                  )}
                  {columnVisibility.email && (
                    <th className="text-left p-4 text-sm font-medium">
                      {renderColumnHeader('Email', 'email', 'email')}
                    </th>
                  )}
                  {columnVisibility.phone && (
                    <th className="text-left p-4 text-sm font-medium">
                      {renderColumnHeader('Phone', 'phone', 'phone')}
                    </th>
                  )}
                  {columnVisibility.active && (
                    <th className="text-left p-4 text-sm font-medium">
                      <button
                        onClick={() => handleSort('active')}
                        className="flex items-center gap-1 font-medium hover:text-foreground/80 transition-colors"
                      >
                        Status
                        {renderSortIcon('active')}
                      </button>
                    </th>
                  )}
                  {columnVisibility.createdAt && (
                    <th className="text-left p-4 text-sm font-medium">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 font-medium hover:text-foreground/80 transition-colors"
                      >
                        Created
                        {renderSortIcon('createdAt')}
                      </button>
                    </th>
                  )}
                  <th className="text-right p-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBrokers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No brokers found</p>
                      {hasActiveFilters && (
                        <Button
                          variant="link"
                          onClick={clearAllFilters}
                          className="mt-2"
                        >
                          Clear filters
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredBrokers.map((broker) => (
                    <tr key={broker.id} className="hover:bg-muted/50 transition-colors">
                      {columnVisibility.name && (
                        <td className="p-4">
                          <Link
                            href={`/settings/brokers/${broker.id}`}
                            className="font-medium hover:underline"
                          >
                            {broker.name}
                          </Link>
                        </td>
                      )}
                      {columnVisibility.companyName && (
                        <td className="p-4">
                          {broker.companyName ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              {broker.companyName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                      )}
                      {columnVisibility.email && (
                        <td className="p-4">
                          {broker.email ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              {broker.email}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                      )}
                      {columnVisibility.phone && (
                        <td className="p-4">
                          {broker.phone ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              {broker.phone}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                      )}
                      {columnVisibility.active && (
                        <td className="p-4">
                          {broker.active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </td>
                      )}
                      {columnVisibility.createdAt && (
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(broker.createdAt).toLocaleDateString()}
                        </td>
                      )}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/settings/brokers/${broker.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/settings/brokers/${broker.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(broker.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {filteredBrokers.length} of {brokers.length} broker{brokers.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
