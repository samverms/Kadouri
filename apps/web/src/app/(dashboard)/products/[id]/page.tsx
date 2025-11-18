'use client'

import { useState, useEffect } from 'react'
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
  Star,
  Box,
} from 'lucide-react'

interface Product {
  id: string
  code?: string
  name: string
  variety?: string
  grade?: string
  category?: string
  defaultUnitSize?: string
  uom?: string
  active: boolean
  source?: string
  qboItemId?: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
  variants?: ProductVariant[]
}

interface ProductVariant {
  id: string
  productId: string
  sku?: string
  size: string
  sizeUnit: string
  packageType: string
  isDefault: boolean
  active: boolean
  createdAt: string
  updatedAt: string
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

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>(
    'overview'
  )
  const [transactionSearch, setTransactionSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [product, setProduct] = useState<Product | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatedByName, setUpdatedByName] = useState<string>('')

  useEffect(() => {
    fetchProductAndTransactions()
  }, [productId])

  const fetchProductAndTransactions = async () => {
    setIsLoading(true)
    try {
      // Fetch product details
      const productResponse = await fetch(`http://localhost:2000/api/products/${productId}`, {
        credentials: 'include',
      })

      if (productResponse.ok) {
        const productData = await productResponse.json()
        setProduct(productData)

        // Fetch user name if product has updatedBy
        if (productData.updatedBy) {
          fetchUserName(productData.updatedBy)
        }
      }

      // Fetch transactions (orders) containing this product
      const transactionsResponse = await fetch(`http://localhost:2000/api/invoices?productId=${productId}`, {
        credentials: 'include',
      })

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserName = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:2000/api/users/${userId}/name`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUpdatedByName(data.name)
      }
    } catch (err) {
      console.error('Failed to fetch user name:', err)
      setUpdatedByName(userId) // Fallback to userId
    }
  }

  // Helper to get full product name
  const getFullName = () => {
    if (!product) return ''
    return [product.name, product.variety, product.grade].filter(Boolean).join(' - ')
  }

  // Helper to get category from product name
  const getCategory = (productName: string) => {
    const name = productName.toLowerCase()
    if (name.includes('almond')) return 'Almonds'
    if (name.includes('walnut')) return 'Walnuts'
    if (name.includes('pecan')) return 'Pecans'
    if (name.includes('pistachio')) return 'Pistachios'
    return 'Other'
  }

  // Calculate usage statistics
  const totalQuantity = transactions.reduce((sum, txn) => {
    const productLines = txn.lines?.filter((line: any) => line.productId === productId) || []
    return sum + productLines.reduce((lineSum: number, line: any) => lineSum + line.quantity, 0)
  }, 0)

  const totalRevenue = transactions.reduce((sum, txn) => {
    const productLines = txn.lines?.filter((line: any) => line.productId === productId) || []
    return sum + productLines.reduce((lineSum: number, line: any) => lineSum + line.total, 0)
  }, 0)

  const avgPrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0

  // Mock transactions removed - using real data now
  const mockTransactions: Transaction[] = [
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
        txn.sellerAccountName.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        txn.buyerAccountName.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        (txn.agentName && txn.agentName.toLowerCase().includes(transactionSearch.toLowerCase()))
    )
    .sort((a, b) => {
      if (!sortColumn) return 0

      let aVal: any
      let bVal: any

      if (sortColumn === 'seller') {
        aVal = a.sellerAccountName
        bVal = b.sellerAccountName
      } else if (sortColumn === 'buyer') {
        aVal = a.buyerAccountName
        bVal = b.buyerAccountName
      } else if (sortColumn === 'agent') {
        aVal = a.agentName || ''
        bVal = b.agentName || ''
      } else if (sortColumn === 'date') {
        aVal = new Date(a.orderDate).getTime()
        bVal = new Date(b.orderDate).getTime()
      } else {
        aVal = (a as any)[sortColumn]
        bVal = (b as any)[sortColumn]
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">{product && getFullName()}</h1>
              {product && (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    product.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {product.active ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/products/${productId}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" className="text-red-600" disabled>
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
        </nav>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading product details...</p>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && product && activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {product.code && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Product Code</label>
                    <p className="mt-1">
                      <span className="inline-flex items-center rounded bg-blue-100 px-2.5 py-1 text-sm font-mono font-medium text-blue-800">
                        {product.code}
                      </span>
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{getFullName()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Variety</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.variety || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Grade</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.grade || '-'}</p>
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
              </div>

              {/* Compact metadata footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                <span>Created {new Date(product.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>Updated {new Date(product.updatedAt).toLocaleDateString()}</span>
                {updatedByName && (
                  <>
                    <span>•</span>
                    <span>by {updatedByName}</span>
                  </>
                )}
              </div>

              {/* Product Variants - Moved to bottom of main card */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-500">Product Variants</h3>
                  <Link href={`/products/${productId}/edit`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Edit className="mr-1.5 h-3 w-3" />
                      Manage
                    </Button>
                  </Link>
                </div>
                {product.variants && product.variants.filter(v => v.active).length > 0 ? (
                  <div className="space-y-1.5">
                    {product.variants
                      .filter(v => v.active)
                      .map((variant) => (
                        <div
                          key={variant.id}
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            variant.isDefault ? 'bg-blue-50 text-blue-900' : 'text-gray-700'
                          }`}
                        >
                          {variant.isDefault && (
                            <Star className="h-3.5 w-3.5 text-blue-600 fill-blue-600" />
                          )}
                          <span className="font-medium">
                            {variant.size} {variant.sizeUnit} {variant.packageType}
                          </span>
                          {variant.isDefault && (
                            <span className="text-xs text-blue-600">(default)</span>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No variants defined</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-600">Total Orders</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {transactions.length}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-600">Total Quantity</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {totalQuantity.toLocaleString()} lbs
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-600">Total Revenue</div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">
                    ${totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-600">Avg Price</div>
                  <div className="text-2xl font-bold text-orange-900 mt-1">
                    ${avgPrice.toFixed(2)}/lb
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.slice(0, 5).map((txn) => {
                        const productLines = txn.lines?.filter((line: any) => line.productId === productId) || []
                        const quantity = productLines.reduce((sum: number, line: any) => sum + line.quantity, 0)
                        const total = productLines.reduce((sum: number, line: any) => sum + line.total, 0)

                        return (
                          <tr key={txn.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/orders/${txn.id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {txn.orderNo}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {new Date(txn.orderDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <Link
                                href={`/accounts/${txn.sellerAccountId}`}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {txn.sellerAccountName}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <Link
                                href={`/accounts/${txn.buyerAccountId}`}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {txn.buyerAccountName}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {quantity.toLocaleString()} lbs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              ${total.toLocaleString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No transactions found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This product hasn't been used in any orders yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && product && activeTab === 'transactions' && (
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
                    {filteredTransactions.map((txn) => {
                      const productLines = txn.lines?.filter((line: any) => line.productId === productId) || []
                      const quantity = productLines.reduce((sum: number, line: any) => sum + line.quantity, 0)
                      const total = productLines.reduce((sum: number, line: any) => sum + line.total, 0)
                      const avgPrice = quantity > 0 ? total / quantity : 0

                      return (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/orders/${txn.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {txn.orderNo}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Date(txn.orderDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Link
                              href={`/accounts/${txn.sellerAccountId}`}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {txn.sellerAccountName}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Link
                              href={`/accounts/${txn.buyerAccountId}`}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {txn.buyerAccountName}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {quantity.toLocaleString()} lbs
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            ${avgPrice.toFixed(2)}/lb
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            ${total.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {txn.agentName || 'N/A'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
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

    </div>
  )
}
