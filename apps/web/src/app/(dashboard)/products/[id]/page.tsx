'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Package,
  ExternalLink,
  Edit,
  Trash2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

interface Product {
  id: string
  code: string
  name: string
  variety?: string
  grade?: string
  category?: string
  qboItemId?: string
  active: boolean
  createdAt: string
}

interface Transaction {
  id: string
  orderNo: string
  date: string
  seller: string
  buyer: string
  product: string
  quantity: number
  unit: string
  price: number
  total: number
  agent: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'quickbooks'>(
    'overview'
  )
  const [transactionSearch, setTransactionSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Mock product data - will be replaced with API call
  const product: Product = {
    id: productId,
    code: 'PRD-001',
    name: 'Almonds',
    variety: 'Nonpareil',
    grade: 'Premium',
    category: 'Nuts',
    qboItemId: 'QBO-ITEM-123',
    active: true,
    createdAt: '2025-01-15',
  }

  // Mock transactions - will be replaced with API call
  const transactions: Transaction[] = [
    {
      id: '1',
      orderNo: 'ORD-2024-001',
      date: '2024-12-15',
      seller: 'Guerra Nut Shelling',
      buyer: 'C&G ENTERPRISES',
      product: 'Almonds - Nonpareil - Premium',
      quantity: 1000,
      unit: 'lbs',
      price: 4.5,
      total: 4500,
      agent: 'John Smith',
    },
    {
      id: '2',
      orderNo: 'ORD-2024-015',
      date: '2024-12-20',
      seller: 'FAMOSO NUT COMPANY',
      buyer: 'ANC001',
      product: 'Almonds - Nonpareil - Premium',
      quantity: 2000,
      unit: 'lbs',
      price: 4.75,
      total: 9500,
      agent: 'Sarah Johnson',
    },
    {
      id: '3',
      orderNo: 'ORD-2025-003',
      date: '2025-01-05',
      seller: 'Guerra Nut Shelling',
      buyer: 'C&G ENTERPRISES',
      product: 'Almonds - Nonpareil - Premium',
      quantity: 1500,
      unit: 'lbs',
      price: 4.85,
      total: 7275,
      agent: 'John Smith',
    },
  ]

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="inline h-3 w-3 ml-1" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="inline h-3 w-3 ml-1" />
    )
  }

  const filteredTransactions = transactions
    .filter(
      (txn) =>
        txn.orderNo.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        txn.seller.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        txn.buyer.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        txn.agent.toLowerCase().includes(transactionSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortColumn) return 0

      let aVal: any = a[sortColumn as keyof Transaction]
      let bVal: any = b[sortColumn as keyof Transaction]

      if (sortColumn === 'date') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const fullProductName = [product.name, product.variety, product.grade]
    .filter(Boolean)
    .join(' - ')

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{fullProductName}</h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  product.active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {product.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-gray-600">Product Code: {product.code}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('quickbooks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'quickbooks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            QuickBooks
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Code</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{product.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{fullProductName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Variety</label>
                  <p className="mt-1 text-sm text-gray-900">{product.variety || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Grade</label>
                  <p className="mt-1 text-sm text-gray-900">{product.grade || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="mt-1">
                    {product.category ? (
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 capitalize">
                        {product.category}
                      </span>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
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
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QuickBooks Integration */}
          <Card>
            <CardHeader>
              <CardTitle>QuickBooks Integration</CardTitle>
            </CardHeader>
            <CardContent>
              {product.qboItemId ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Item ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{product.qboItemId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sync Status</label>
                    <p className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Connected
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Synced</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View in QuickBooks
                  </Button>
                  <Button variant="outline" className="w-full">
                    Sync Now
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-4">Not synced with QuickBooks</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Sync to QuickBooks
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Buyer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.slice(0, 5).map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/orders/${txn.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {txn.orderNo}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(txn.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.seller}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.buyer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.quantity.toLocaleString()} {txn.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${txn.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.agent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div>
          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search transactions by order #, seller, buyer, or agent..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        onClick={() => handleSort('orderNo')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Order # {getSortIcon('orderNo')}
                      </th>
                      <th
                        onClick={() => handleSort('date')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Date {getSortIcon('date')}
                      </th>
                      <th
                        onClick={() => handleSort('seller')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Seller {getSortIcon('seller')}
                      </th>
                      <th
                        onClick={() => handleSort('buyer')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Buyer {getSortIcon('buyer')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th
                        onClick={() => handleSort('agent')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Agent {getSortIcon('agent')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/orders/${txn.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {txn.orderNo}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(txn.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.seller}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.buyer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.quantity.toLocaleString()} {txn.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${txn.price.toFixed(2)}/{txn.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${txn.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.agent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No transactions found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {transactionSearch
                      ? 'Try adjusting your search query'
                      : 'No transactions for this product yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'quickbooks' && (
        <Card>
          <CardHeader>
            <CardTitle>QuickBooks Integration Details</CardTitle>
          </CardHeader>
          <CardContent>
            {product.qboItemId ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      QuickBooks Item ID
                    </label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{product.qboItemId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sync Status</label>
                    <p className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Connected & Synced
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Sync</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sync Frequency</label>
                    <p className="mt-1 text-sm text-gray-900">Real-time</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">
                    QuickBooks Item Details
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Item Name:</span>
                      <span className="text-sm font-medium text-gray-900">{fullProductName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Item Type:</span>
                      <span className="text-sm font-medium text-gray-900">Inventory</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Category:</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View in QuickBooks
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Sync Now
                  </Button>
                  <Button variant="outline" className="flex-1 text-red-600">
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Not Connected to QuickBooks
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                  Connect this product to QuickBooks to enable automatic syncing of inventory,
                  pricing, and transaction data.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Connect to QuickBooks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
