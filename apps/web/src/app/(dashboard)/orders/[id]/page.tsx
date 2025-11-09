'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  FileText,
  Building2,
  Package,
  User,
  Calendar,
  DollarSign,
  Download,
  Edit,
  Trash2,
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

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  // Mock data - replace with API call
  const [order] = useState<Order>({
    id: orderId,
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
  })

  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)

  const handleGeneratePDF = async (type: 'seller' | 'buyer' | 'both') => {
    setGeneratingPdf(type)

    try {
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

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="-mt-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/orders')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNo}</h1>
            <p className="text-sm text-gray-600">Order Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold capitalize ${getStatusColor(
            order.status
          )}`}
        >
          {order.status}
        </span>
      </div>

      {/* PDF Generation Buttons */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Generate Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGeneratePDF('seller')}
              disabled={generatingPdf !== null}
            >
              <Download className="mr-2 h-4 w-4" />
              {generatingPdf === 'seller' ? 'Generating...' : 'Seller PDF'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGeneratePDF('buyer')}
              disabled={generatingPdf !== null}
            >
              <Download className="mr-2 h-4 w-4" />
              {generatingPdf === 'buyer' ? 'Generating...' : 'Buyer PDF'}
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleGeneratePDF('both')}
              disabled={generatingPdf !== null}
            >
              <Download className="mr-2 h-4 w-4" />
              {generatingPdf === 'both' ? 'Generating...' : 'Generate Both PDFs'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Information Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Order Number</label>
              <p className="text-sm text-gray-900 font-mono mt-1">{order.orderNo}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Order Date</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900">
                  {new Date(order.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Agent</label>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900">{order.agent}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Commission</label>
              <p className="text-sm text-gray-900 mt-1">
                {order.commissionAmount ? (
                  <>
                    <span className="text-lg font-bold">${order.commissionAmount.toFixed(2)}</span>
                    {order.commissionRate && (
                      <span className="text-xs text-gray-500 ml-2">({order.commissionRate}%)</span>
                    )}
                  </>
                ) : (
                  '-'
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Product & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5" />
              Product & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Product</label>
              <Link
                href={`/products/${order.productId}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1 block"
              >
                {order.product}
              </Link>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Quantity</label>
              <p className="text-sm text-gray-900 mt-1">
                <span className="text-lg font-semibold">{order.quantity.toLocaleString()}</span>{' '}
                {order.unit}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Price per Unit</label>
              <p className="text-sm text-gray-900 mt-1">
                <span className="text-lg font-semibold">${order.price.toFixed(2)}</span>/{order.unit}
              </p>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-500 uppercase">Total Amount</label>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="h-5 w-5 text-green-600" />
                <p className="text-2xl font-bold text-green-900">
                  ${order.total.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              Parties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="text-xs font-medium text-blue-700 uppercase flex items-center gap-1 mb-2">
                <User className="h-3 w-3" />
                Seller
              </label>
              <Link
                href={`/accounts/${order.sellerId}`}
                className="text-base font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              >
                {order.seller}
              </Link>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <label className="text-xs font-medium text-green-700 uppercase flex items-center gap-1 mb-2">
                <User className="h-3 w-3" />
                Buyer
              </label>
              <Link
                href={`/accounts/${order.buyerId}`}
                className="text-base font-semibold text-green-600 hover:text-green-800 hover:underline"
              >
                {order.buyer}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Timeline / History (placeholder) */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 border-l-2 border-green-500 pl-4 py-2">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Order Delivered</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.date).toLocaleDateString()} at 2:30 PM
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-l-2 border-purple-500 pl-4 py-2">
              <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Order Shipped</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.date).toLocaleDateString()} at 9:00 AM
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-l-2 border-blue-500 pl-4 py-2">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Order Confirmed</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()} at 3:15 PM
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-l-2 border-gray-300 pl-4 py-2">
              <div className="flex-shrink-0 w-2 h-2 bg-gray-300 rounded-full mt-1.5"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Order Created</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()} at 10:30 AM
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
