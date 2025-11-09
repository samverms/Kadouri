'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Package, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react'

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

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)

  // Mock data - will be replaced with API call
  const [products] = useState<Product[]>([
    {
      id: '1',
      code: 'PRD-001',
      name: 'Almonds',
      variety: 'Nonpareil',
      grade: 'Premium',
      category: 'Nuts',
      qboItemId: 'QBO-ITEM-123',
      active: true,
      createdAt: '2025-01-15',
    },
    {
      id: '2',
      code: 'PRD-002',
      name: 'Walnuts',
      variety: 'Chandler',
      grade: 'Extra Light',
      category: 'Nuts',
      active: true,
      createdAt: '2025-01-16',
    },
    {
      id: '3',
      code: 'PRD-003',
      name: 'Pecans',
      variety: 'Desirable',
      grade: 'Fancy',
      category: 'Nuts',
      qboItemId: 'QBO-ITEM-456',
      active: true,
      createdAt: '2025-01-17',
    },
    {
      id: '4',
      code: 'PRD-004',
      name: 'Pistachios',
      variety: 'Kerman',
      grade: 'Premium',
      category: 'Nuts',
      active: true,
      createdAt: '2025-01-18',
    },
  ])

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.variety?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.grade?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search products by name, code, variety, or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

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
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variety
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QuickBooks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredProducts.map((product) => (
                  <>
                    <tr
                      key={product.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <button
                          onClick={() =>
                            setExpandedProductId(
                              expandedProductId === product.id ? null : product.id
                            )
                          }
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedProductId === product.id ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {product.code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {product.variety || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {product.grade || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.category && (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 capitalize">
                            {product.category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.qboItemId ? (
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Synced
                            </span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            Not Synced
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="outline" size="sm" className="mr-2">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          Delete
                        </Button>
                      </td>
                    </tr>
                    {expandedProductId === product.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-6">
                            {/* Product Details */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                Product Details
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Product Code
                                  </label>
                                  <p className="text-sm text-gray-900 font-mono mt-1">
                                    {product.code}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Full Name
                                  </label>
                                  <p className="text-sm text-gray-900 mt-1">
                                    {[product.name, product.variety, product.grade]
                                      .filter(Boolean)
                                      .join(' - ')}
                                  </p>
                                </div>
                                {product.category && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">
                                      Category
                                    </label>
                                    <p className="text-sm text-gray-900 mt-1 capitalize">
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
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating a new product'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
