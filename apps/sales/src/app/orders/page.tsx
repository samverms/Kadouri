'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  FileText,
  ChevronRight,
  ChevronDown,
  Calendar,
  Building2,
  Package,
  User,
  Download,
} from 'lucide-react'

interface Order {
  id: string
  orderNo: string
  date: string
  seller: string
  sellerId: string
  buyer: string
  buyerId: string
  product: string
  productId: string
  quantity: number
  unit: string
  price: number
  total: number
  agent: string
  agentId: string
  commissionRate?: number
  commissionAmount?: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
}

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState<{ orderId: string; type: string } | null>(null)

  const handleGeneratePDF = async (order: Order, type: 'seller' | 'buyer' | 'both') => {
    setGeneratingPdf({ orderId: order.id, type })

    try {
      // Check if API URL is configured
      if (!process.env.NEXT_PUBLIC_API_URL) {
        alert('API URL not configured. Please set NEXT_PUBLIC_API_URL in .env.local')
        return
      }

      const orderData = {
        orderNo: order.orderNo,
        date: order.date,
        seller: {
          code: order.sellerId,
          name: order.seller,
        },
        buyer: {
          code: order.buyerId,
          name: order.buyer,
        },
        product: {
          code: order.productId,
          name: order.product,
        },
        quantity: order.quantity,
        unit: order.unit,
        price: order.price,
        total: order.total,
        agent: {
          code: order.agentId,
          name: order.agent,
        },
      }

      if (type === 'both') {
        // Generate both PDFs separately
        await Promise.all([
          generateSinglePDF(orderData, 'seller'),
          generateSinglePDF(orderData, 'buyer'),
        ])
      } else {
        await generateSinglePDF(orderData, type)
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      alert(`Error generating PDF: ${error.message || 'Network error or API not available'}`)
    } finally {
      setGeneratingPdf(null)
    }
  }

  const generateSinglePDF = async (orderData: any, type: 'seller' | 'buyer') => {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/pdf/order/${type}`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('PDF generation failed:', errorData)
      throw new Error(errorData.error || errorData.message || 'Unknown error')
    }

    // Get the PDF as a blob
    const blob = await response.blob()

    // Create a blob URL and open it in a new tab
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl, '_blank')

    // Clean up the blob URL after a short delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
  }

  // Mock data - will be replaced with API call
  const [orders] = useState<Order[]>([
    {
      id: '1',
      orderNo: 'ORD-2024-001',
      date: '2024-12-15',
      seller: 'Guerra Nut Shelling',
      sellerId: '4',
      buyer: 'C&G ENTERPRISES',
      buyerId: '2',
      product: 'Almonds - Nonpareil - Premium',
      productId: '1',
      quantity: 1000,
      unit: 'lbs',
      price: 4.5,
      total: 4500,
      agent: 'John Smith',
      agentId: 'agent1',
      commissionRate: 2.5,
      commissionAmount: 112.5,
      status: 'delivered',
      createdAt: '2024-12-15',
    },
    {
      id: '2',
      orderNo: 'ORD-2024-015',
      date: '2024-12-20',
      seller: 'FAMOSO NUT COMPANY',
      sellerId: '3',
      buyer: 'ANC001',
      buyerId: '1',
      product: 'Walnuts - Chandler - Extra Light',
      productId: '2',
      quantity: 2000,
      unit: 'lbs',
      price: 4.75,
      total: 9500,
      agent: 'Sarah Johnson',
      agentId: 'agent2',
      commissionRate: 3.0,
      commissionAmount: 285.0,
      status: 'shipped',
      createdAt: '2024-12-20',
    },
    {
      id: '3',
      orderNo: 'ORD-2025-003',
      date: '2025-01-05',
      seller: 'Guerra Nut Shelling',
      sellerId: '4',
      buyer: 'C&G ENTERPRISES',
      buyerId: '2',
      product: 'Pecans - Desirable - Fancy',
      productId: '3',
      quantity: 1500,
      unit: 'lbs',
      price: 4.85,
      total: 7275,
      agent: 'John Smith',
      agentId: 'agent1',
      commissionRate: 2.5,
      commissionAmount: 181.88,
      status: 'confirmed',
      createdAt: '2025-01-05',
    },
    {
      id: '4',
      orderNo: 'ORD-2025-007',
      date: '2025-01-10',
      seller: 'FAMOSO NUT COMPANY',
      sellerId: '3',
      buyer: 'Guerra Nut Shelling',
      buyerId: '4',
      product: 'Pistachios - Kerman - Premium',
      productId: '4',
      quantity: 800,
      unit: 'lbs',
      price: 6.25,
      total: 5000,
      agent: 'Sarah Johnson',
      agentId: 'agent2',
      commissionRate: 3.0,
      commissionAmount: 150.0,
      status: 'pending',
      createdAt: '2025-01-10',
    },
  ])

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.agent.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="mt-2 text-gray-600">Manage and track all orders</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search orders by order #, seller, buyer, product, or agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      {showCreateDialog && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* Order Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Date <span className="text-red-500">*</span>
                    </label>
                    <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Number
                    </label>
                    <Input placeholder="Auto-generated if left blank" />
                  </div>
                </div>
              </div>

              {/* Seller */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Seller</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Code <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="">Select account</option>
                      <option value="4">GNC001</option>
                      <option value="3">FAM001</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name
                    </label>
                    <Input placeholder="Auto-filled from code" disabled />
                  </div>
                </div>
              </div>

              {/* Buyer */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Buyer</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Code <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="">Select account</option>
                      <option value="1">ANC001</option>
                      <option value="2">CEN001</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name
                    </label>
                    <Input placeholder="Auto-filled from code" disabled />
                  </div>
                </div>
              </div>

              {/* Product */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Product</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Code <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="">Select product</option>
                      <option value="1">PRD-001</option>
                      <option value="2">PRD-002</option>
                      <option value="3">PRD-003</option>
                      <option value="4">PRD-004</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                    </label>
                    <Input placeholder="Auto-filled from code" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variety
                    </label>
                    <Input placeholder="Auto-filled from code" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade
                    </label>
                    <Input placeholder="Auto-filled from code" disabled />
                  </div>
                </div>
              </div>

              {/* Quantity & Pricing */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quantity & Pricing</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <Input type="number" placeholder="e.g., 1000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                      <option value="tons">tons</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Unit <span className="text-red-500">*</span>
                    </label>
                    <Input type="number" step="0.01" placeholder="e.g., 4.50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <Input type="number" step="0.01" placeholder="Calculated automatically" disabled />
                  </div>
                </div>
              </div>

              {/* Agent Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Agent Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Code <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="">Select agent</option>
                      <option value="agent1">AGT-001</option>
                      <option value="agent2">AGT-002</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Name
                    </label>
                    <Input placeholder="Auto-filled from code" disabled />
                  </div>
                </div>
              </div>

              {/* Commission */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Commission</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Rate (%)
                    </label>
                    <Input type="number" step="0.01" placeholder="e.g., 2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Amount
                    </label>
                    <Input type="number" step="0.01" placeholder="Calculated automatically" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Status
                    </label>
                    <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Status
                    </label>
                    <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <Input placeholder="Optional notes" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Order
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

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-8"></th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredOrders.map((order) => (
                  <>
                    <tr
                      key={order.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-2 py-2">
                        <button
                          onClick={() =>
                            setExpandedOrderId(
                              expandedOrderId === order.id ? null : order.id
                            )
                          }
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedOrderId === order.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {order.orderNo}
                        </Link>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                        {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap max-w-[120px] truncate">
                        <Link
                          href={`/accounts/${order.sellerId}`}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          title={order.seller}
                        >
                          {order.seller}
                        </Link>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap max-w-[120px] truncate">
                        <Link
                          href={`/accounts/${order.buyerId}`}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          title={order.buyer}
                        >
                          {order.buyer}
                        </Link>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap max-w-[140px] truncate">
                        <Link
                          href={`/products/${order.productId}`}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          title={order.product}
                        >
                          {order.product}
                        </Link>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 max-w-[100px] truncate" title={order.agent}>
                        {order.agent}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                        <div className="flex flex-col">
                          <span className="font-medium">{order.commissionAmount ? `$${order.commissionAmount.toFixed(2)}` : '-'}</span>
                          {order.commissionRate && (
                            <span className="text-[10px] text-gray-500">
                              ({order.commissionRate}%)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        ${order.total.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex gap-1 justify-end">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs text-red-600">
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={12} className="px-6 py-4">
                          {/* PDF Generation Buttons */}
                          <div className="mb-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGeneratePDF(order, 'seller')}
                              disabled={generatingPdf?.orderId === order.id}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {generatingPdf?.orderId === order.id && generatingPdf?.type === 'seller'
                                ? 'Generating...'
                                : 'Seller PDF'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGeneratePDF(order, 'buyer')}
                              disabled={generatingPdf?.orderId === order.id}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {generatingPdf?.orderId === order.id && generatingPdf?.type === 'buyer'
                                ? 'Generating...'
                                : 'Buyer PDF'}
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleGeneratePDF(order, 'both')}
                              disabled={generatingPdf?.orderId === order.id}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {generatingPdf?.orderId === order.id && generatingPdf?.type === 'both'
                                ? 'Generating...'
                                : 'Generate Both PDFs'}
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-6">
                            {/* Order Information */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Order Information
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Order Number
                                  </label>
                                  <p className="text-sm text-gray-900 font-mono mt-1">
                                    {order.orderNo}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Order Date
                                  </label>
                                  <p className="text-sm text-gray-900 mt-1">
                                    {new Date(order.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Agent
                                  </label>
                                  <p className="text-sm text-gray-900 mt-1">{order.agent}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Commission
                                  </label>
                                  <p className="text-sm text-gray-900 mt-1">
                                    {order.commissionAmount ? (
                                      <>
                                        ${order.commissionAmount.toFixed(2)}
                                        {order.commissionRate && (
                                          <span className="text-xs text-gray-500 ml-1">
                                            ({order.commissionRate}%)
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      '-'
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Status
                                  </label>
                                  <p className="mt-1">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(
                                        order.status
                                      )}`}
                                    >
                                      {order.status}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Product & Pricing */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Product & Pricing
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Product
                                  </label>
                                  <p className="text-sm text-gray-900 mt-1">{order.product}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Quantity
                                  </label>
                                  <p className="text-sm text-gray-900 mt-1">
                                    {order.quantity.toLocaleString()} {order.unit}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Price per Unit
                                  </label>
                                  <p className="text-sm text-gray-900 mt-1">
                                    ${order.price.toFixed(2)}/{order.unit}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Total Amount
                                  </label>
                                  <p className="text-sm font-semibold text-gray-900 mt-1">
                                    ${order.total.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Parties */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Parties
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1 mb-1">
                                    <User className="h-3 w-3" />
                                    Seller
                                  </label>
                                  <Link
                                    href={`/accounts/${order.sellerId}`}
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {order.seller}
                                  </Link>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1 mb-1">
                                    <User className="h-3 w-3" />
                                    Buyer
                                  </label>
                                  <Link
                                    href={`/accounts/${order.buyerId}`}
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {order.buyer}
                                  </Link>
                                </div>
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
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating a new order'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
