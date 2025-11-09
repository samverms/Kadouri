'use client'

import { useState, useEffect, useRef, Fragment, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

interface OrderLine {
  id: string
  productId: string
  product: string
  variety: string
  size: string
  grade: string
  quantity: number
  unitSize: number
  unitSizeUnit: string
  totalWeight: number
  unitPrice: number
  total: number
}

interface Product {
  id: string
  name: string
  variety: string
  size: string
  grade: string
}


export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState<{ orderId: string; type: string } | null>(null)
  const [orderLines, setOrderLines] = useState<OrderLine[]>([])
  const [commissionRate, setCommissionRate] = useState(0)
  const [numPallets, setNumPallets] = useState('')
  const [conditions, setConditions] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [otherRemarks, setOtherRemarks] = useState('')
  const [activeSearchLineId, setActiveSearchLineId] = useState<string | null>(null)
  const [productSearchQuery, setProductSearchQuery] = useState<{ [lineId: string]: string }>({})
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Mock products list - replace with API call
  const [products] = useState<Product[]>([
    // Almonds
    { id: '1', name: 'Almonds', variety: 'Nonpareil', size: '23/25', grade: 'Fancy' },
    { id: '2', name: 'Almonds', variety: 'Nonpareil', size: '27/30', grade: 'Extra #1' },
    { id: '3', name: 'Almonds', variety: 'Carmel', size: '23/25', grade: 'Supreme' },
    { id: '4', name: 'Almonds', variety: 'Butte', size: '25/27', grade: 'Standard' },
    { id: '5', name: 'Almonds', variety: 'Mission', size: 'Whole', grade: 'Premium' },

    // Walnuts
    { id: '6', name: 'Walnuts', variety: 'Chandler', size: 'Jumbo', grade: 'Extra Light' },
    { id: '7', name: 'Walnuts', variety: 'Chandler', size: 'Large', grade: 'Light' },
    { id: '8', name: 'Walnuts', variety: 'Howard', size: 'Medium', grade: 'Light Amber' },
    { id: '9', name: 'Walnuts', variety: 'Hartley', size: 'Baby', grade: 'Amber' },
    { id: '10', name: 'Walnuts', variety: 'Domestic Light Halves & Pieces', size: 'Halves', grade: 'Extra Light' },
    { id: '11', name: 'Walnuts', variety: 'Domestic Light Halves & Pieces', size: 'Quarters', grade: 'Light' },

    // Pecans
    { id: '12', name: 'Pecans', variety: 'Desirable', size: 'Jumbo', grade: 'Fancy' },
    { id: '13', name: 'Pecans', variety: 'Desirable', size: 'Large', grade: 'Choice' },
    { id: '14', name: 'Pecans', variety: 'Stuart', size: 'Medium', grade: 'Standard' },
    { id: '15', name: 'Pecans', variety: 'Schley', size: 'Mammoth', grade: 'Fancy' },
    { id: '16', name: 'Pecans', variety: 'Western', size: 'Halves', grade: 'Premium' },

    // Pistachios
    { id: '17', name: 'Pistachios', variety: 'Kerman', size: '21/25', grade: 'Extra Fancy' },
    { id: '18', name: 'Pistachios', variety: 'Kerman', size: '23/25', grade: 'Fancy' },
    { id: '19', name: 'Pistachios', variety: 'Kerman', size: '27/30', grade: 'Choice' },
    { id: '20', name: 'Pistachios', variety: 'Golden Hills', size: 'Jumbo', grade: 'Premium' },
    { id: '21', name: 'Pistachios', variety: 'Lost Hills', size: 'Large', grade: 'Standard' },

    // Cashews
    { id: '22', name: 'Cashews', variety: 'W180', size: 'Whole', grade: 'Premium' },
    { id: '23', name: 'Cashews', variety: 'W210', size: 'Whole', grade: 'Grade A' },
    { id: '24', name: 'Cashews', variety: 'W240', size: 'Whole', grade: 'Grade B' },
    { id: '25', name: 'Cashews', variety: 'W320', size: 'Whole', grade: 'Standard' },
    { id: '26', name: 'Cashews', variety: 'Pieces', size: 'SP', grade: 'Split' },

    // Hazelnuts
    { id: '27', name: 'Hazelnuts', variety: 'Oregon', size: '11-12mm', grade: 'Fancy' },
    { id: '28', name: 'Hazelnuts', variety: 'Oregon', size: '13-14mm', grade: 'Extra Fancy' },
    { id: '29', name: 'Hazelnuts', variety: 'Barcelona', size: '15mm+', grade: 'Jumbo' },
    { id: '30', name: 'Hazelnuts', variety: 'Turkish', size: 'Medium', grade: 'Natural' },

    // Macadamias
    { id: '31', name: 'Macadamias', variety: 'Style 0', size: 'Whole', grade: 'Premium' },
    { id: '32', name: 'Macadamias', variety: 'Style 1', size: 'Halves', grade: 'Fancy' },
    { id: '33', name: 'Macadamias', variety: 'Style 2', size: 'Quarters', grade: 'Choice' },
    { id: '34', name: 'Macadamias', variety: 'Hawaiian', size: 'Whole', grade: 'Supreme' },

    // Pine Nuts
    { id: '35', name: 'Pine Nuts', variety: 'Chinese', size: 'Medium', grade: 'Grade A' },
    { id: '36', name: 'Pine Nuts', variety: 'Korean', size: 'Large', grade: 'Premium' },
    { id: '37', name: 'Pine Nuts', variety: 'Mediterranean', size: 'Jumbo', grade: 'Extra Fancy' },

    // Brazil Nuts
    { id: '38', name: 'Brazil Nuts', variety: 'Wild', size: 'Large', grade: 'Fancy' },
    { id: '39', name: 'Brazil Nuts', variety: 'Cultivated', size: 'Medium', grade: 'Choice' },

    // Peanuts
    { id: '40', name: 'Peanuts', variety: 'Runner', size: '38/42', grade: 'Fancy' },
    { id: '41', name: 'Peanuts', variety: 'Virginia', size: 'Jumbo', grade: 'Extra Large' },
    { id: '42', name: 'Peanuts', variety: 'Spanish', size: 'Medium', grade: 'Red Skin' },
    { id: '43', name: 'Peanuts', variety: 'Valencia', size: 'Small', grade: 'Blanched' },
  ])

  const getFilteredProducts = (lineId: string) => {
    const query = productSearchQuery[lineId]
    // If no query or empty query, return all products
    if (!query || query.trim() === '') return products
    // Filter products based on search query
    return products.filter((product) =>
      `${product.name} ${product.variety}`.toLowerCase().includes(query.toLowerCase())
    )
  }

  const addOrderLine = () => {
    const newLine: OrderLine = {
      id: String(Date.now()),
      productId: '',
      product: '',
      variety: '',
      size: '',
      grade: '',
      quantity: 0,
      unitSize: 0,
      unitSizeUnit: 'LBS',
      totalWeight: 0,
      unitPrice: 0,
      total: 0,
    }
    setOrderLines([...orderLines, newLine])
  }

  const removeOrderLine = (id: string) => {
    setOrderLines(orderLines.filter((line) => line.id !== id))
  }

  const handleProductSelect = (lineId: string, product: Product) => {
    const updatedLines = orderLines.map((line) => {
      if (line.id === lineId) {
        return {
          ...line,
          productId: product.id,
          product: product.name,
          variety: product.variety,
          size: product.size,
          grade: product.grade,
        }
      }
      return line
    })
    setOrderLines(updatedLines)
    // Clear search query and close dropdown
    setProductSearchQuery({ ...productSearchQuery, [lineId]: '' })
    setActiveSearchLineId(null)
  }

  const handleProductSearchChange = (lineId: string, query: string, event: React.ChangeEvent<HTMLInputElement>) => {
    setProductSearchQuery({ ...productSearchQuery, [lineId]: query })
    setActiveSearchLineId(lineId)
  }

  const handleInputFocus = (lineId: string, event: React.FocusEvent<HTMLInputElement>) => {
    setActiveSearchLineId(lineId)
    // Initialize search query if not exists
    if (!productSearchQuery[lineId]) {
      setProductSearchQuery({ ...productSearchQuery, [lineId]: '' })
    }
  }

  const updateOrderLine = (id: string, field: keyof OrderLine, value: any) => {
    setOrderLines(
      orderLines.map((line) => {
        if (line.id === id) {
          const updatedLine = { ...line, [field]: value }

          // Auto-calculate total weight (quantity * unitSize)
          if (field === 'quantity' || field === 'unitSize') {
            updatedLine.totalWeight = updatedLine.quantity * updatedLine.unitSize
          }

          // Auto-calculate total (totalWeight * unitPrice)
          if (field === 'quantity' || field === 'unitSize' || field === 'unitPrice') {
            updatedLine.totalWeight = updatedLine.quantity * updatedLine.unitSize
            updatedLine.total = updatedLine.totalWeight * updatedLine.unitPrice
          }

          return updatedLine
        }
        return line
      })
    )
  }

  const calculateGrandTotal = () => {
    return orderLines.reduce((sum, line) => sum + line.total, 0)
  }

  const calculateCommissionAmount = () => {
    const grandTotal = calculateGrandTotal()
    return (grandTotal * commissionRate) / 100
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const isInput = Object.values(inputRefs.current).some(input => input && input.contains(target))
      if (!isInput && activeSearchLineId) {
        setActiveSearchLineId(null)
        setDropdownPosition(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeSearchLineId])

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
    <div className="-mt-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="mt-0.5 text-xs text-gray-600">Manage and track all orders</p>
        </div>
        <Button
          onClick={() => {
            setShowCreateDialog(true)
            // Start with one empty line if no lines exist
            if (orderLines.length === 0) {
              addOrderLine()
            }
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="mb-3">
        <CardContent className="py-3">
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
        <Card className="mb-3 border-blue-200 bg-white">
          <CardHeader className="py-3">
            <CardTitle className="text-lg font-bold">Entry Order</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form className="space-y-4">
              {/* Seller and Buyer Side-by-Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Seller Section */}
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                  <h3 className="text-base font-bold text-blue-900 mb-3">Seller</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Account
                      </label>
                      <div className="flex gap-2">
                        <select className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white">
                          <option value="">WNC001</option>
                          <option value="4">GNC001</option>
                          <option value="3">FAM001</option>
                        </select>

                        <Input
                          placeholder="Account name (auto-filled)"
                          className="flex-[2] bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Billing Address <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white">
                          <option value="">Billing</option>
                          <option value="shipping">Shipping</option>
                        </select>

                        <Input
                          placeholder="Address (auto-filled)"
                          className="flex-1 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Pickup Location <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white">
                          <option value="">Warehouse</option>
                          <option value="billing">Billing</option>
                        </select>

                        <Input
                          placeholder="Location (auto-filled)"
                          className="flex-1 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Contact
                      </label>
                      <select className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white">
                        <option value="">BO ECKER - bo@waterfordnut.com - 209-874-2317</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Sales Confirmation No.
                      </label>
                      <Input placeholder="Enter sales confirmation number..." className="bg-white" />
                    </div>
                  </div>
                </div>

                {/* Buyer Section */}
                <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                  <h3 className="text-base font-bold text-green-900 mb-3">Buyer</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Account
                      </label>
                      <div className="flex gap-2">
                        <select className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white">
                          <option value="">TOOT001</option>
                          <option value="1">ANC001</option>
                          <option value="2">CEN001</option>
                        </select>

                        <Input
                          placeholder="Account name (auto-filled)"
                          className="flex-[2] bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Billing Address <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white">
                          <option value="">Billing</option>
                          <option value="shipping">Shipping</option>
                        </select>

                        <Input
                          placeholder="Address (auto-filled)"
                          className="flex-1 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Ship to Location <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white">
                          <option value="">Billing</option>
                          <option value="warehouse">Warehouse</option>
                        </select>
                        <Input
                          placeholder="Location (auto-filled)"
                          className="flex-1 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Contact
                      </label>
                      <select className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white">
                        <option value="">noemail@email.com - (514) 381-9790</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Purchase Order No.
                      </label>
                      <Input placeholder="Enter purchase order number..." className="bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Tab */}
              <div className="border-b border-gray-200">
                <button
                  type="button"
                  className="px-4 py-2 text-indigo-600 border-b-2 border-indigo-600 font-medium"
                >
                  Products
                </button>
              </div>

              {/* Product List Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900">Product List</h3>
                  <Button type="button" onClick={addOrderLine} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Line</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product / Variety</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Size / Grade</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit Size</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Weight</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderLines.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                            No items added yet. Click "Add Item" to start adding products.
                          </td>
                        </tr>
                      ) : (
                        orderLines.map((line, index) => (
                        <tr key={line.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-bold text-gray-700 align-middle">
                            <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full">
                              {index + 1}
                            </div>
                          </td>

                          {/* Product / Variety - Typeahead */}
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <input
                                ref={(el) => (inputRefs.current[line.id] = el)}
                                type="text"
                                value={productSearchQuery[line.id] || line.product || ''}
                                onChange={(e) => {
                                  setProductSearchQuery({ ...productSearchQuery, [line.id]: e.target.value })
                                  setActiveSearchLineId(line.id)
                                  if (line.product) {
                                    updateOrderLine(line.id, 'product', '')
                                    updateOrderLine(line.id, 'productId', '')
                                  }
                                }}
                                onFocus={(e) => {
                                  setActiveSearchLineId(line.id)
                                  const rect = e.target.getBoundingClientRect()
                                  setDropdownPosition({
                                    top: rect.bottom,
                                    left: rect.left,
                                    width: 450
                                  })
                                }}
                                className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Type to search products..."
                              />
                              <div className="px-2 py-1 text-sm text-gray-600 bg-gray-50 rounded border border-gray-200">
                                {line.variety || 'Variety (auto-filled)'}
                              </div>
                            </div>
                          </td>

                          {/* Size / Grade - Auto-filled from product */}
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <div className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded border border-gray-200">
                                {line.size || 'Size (auto-filled)'}
                              </div>
                              <div className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded border border-gray-200">
                                {line.grade || 'Grade (auto-filled)'}
                              </div>
                            </div>
                          </td>

                          {/* Quantity - Editable */}
                          <td className="px-4 py-4 align-middle">
                            <input
                              type="number"
                              value={line.quantity || ''}
                              onChange={(e) => updateOrderLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </td>

                          {/* Unit Size - Editable */}
                          <td className="px-4 py-4 align-middle">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={line.unitSize || ''}
                                onChange={(e) => updateOrderLine(line.id, 'unitSize', parseFloat(e.target.value) || 0)}
                                className="w-20 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded text-right focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                              <select
                                value={line.unitSizeUnit}
                                onChange={(e) => updateOrderLine(line.id, 'unitSizeUnit', e.target.value)}
                                className="px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="LBS">LBS</option>
                                <option value="KG">KG</option>
                                <option value="TON">TON</option>
                              </select>
                            </div>
                          </td>

                          {/* Total Weight - Calculated (Read-only styled) */}
                          <td className="px-4 py-4 align-middle">
                            <div className="px-4 py-2 text-sm font-bold text-gray-900 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded-md text-right">
                              {line.totalWeight > 0 ? `${line.totalWeight.toLocaleString()} ${line.unitSizeUnit}` : '—'}
                            </div>
                          </td>

                          {/* Unit Price - Editable */}
                          <td className="px-4 py-4 align-middle">
                            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={line.unitPrice || ''}
                                onChange={(e) => updateOrderLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-20 text-right text-sm text-gray-900 focus:outline-none"
                                placeholder="0.00"
                              />
                              <span className="text-xs text-gray-500">/{line.unitSizeUnit}</span>
                            </div>
                          </td>

                          {/* Total - Calculated (Read-only styled) */}
                          <td className="px-4 py-4 align-middle">
                            <div className="px-4 py-2 text-base font-bold text-green-900 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-md text-right">
                              {line.total > 0 ? `$${line.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                            </div>
                          </td>

                          {/* Delete Button */}
                          <td className="px-4 py-4 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => removeOrderLine(line.id)}
                              className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                              title="Remove item"
                            >
                              <span className="text-lg font-bold">×</span>
                            </button>
                          </td>
                        </tr>
                      ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Grand Total and Commission */}
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    {/* Commission Section */}
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Commission Rate:</label>
                      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          className="w-16 text-right text-sm font-medium text-gray-900 focus:outline-none"
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                        <span className="text-sm font-medium text-gray-600">%</span>
                      </div>
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-4 py-2">
                        <span className="text-xs font-medium text-blue-700">Commission Amount:</span>
                        <span className="text-base font-bold text-blue-900">
                          ${calculateCommissionAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Grand Total */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg px-6 py-3">
                      <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Grand Total</div>
                      <div className="text-2xl font-bold text-green-900">
                        ${calculateGrandTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        # of Pallets
                      </label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={numPallets}
                        onChange={(e) => setNumPallets(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Conditions
                      </label>
                      <div className="relative">
                        <textarea
                          className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[80px]"
                          placeholder="- FOB SELLERS PLANT IN CALIFORNIA"
                          value={conditions}
                          onChange={(e) => setConditions(e.target.value)}
                        />
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          <button type="button" className="text-green-600 hover:text-green-700">
                            <Download className="h-4 w-4" />
                          </button>
                          <button type="button" className="text-green-600 hover:text-green-700">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Payment Terms
                      </label>
                      <div className="relative">
                        <textarea
                          className="w-full rounded-md border border-indigo-500 px-3 py-2 min-h-[80px]"
                          placeholder="- NET 30 DAYS"
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                        />
                        <div className="absolute bottom-2 right-2">
                          <span className="text-green-600">●</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Other Remarks
                      </label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[80px]"
                        placeholder="Enter other remarks..."
                        value={otherRemarks}
                        onChange={(e) => setOtherRemarks(e.target.value)}
                      />
                    </div>
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

      {/* Product Dropdown Portal */}
      {activeSearchLineId && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed bg-white border-2 border-blue-500 rounded-lg shadow-2xl max-h-[500px] overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 99999,
          }}
        >
          {getFilteredProducts(activeSearchLineId).map((product) => (
            <button
              key={product.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleProductSelect(activeSearchLineId, product)
                setDropdownPosition(null)
              }}
              className="w-full px-6 py-4 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-200 last:border-b-0"
            >
              <div className="font-semibold text-gray-900 text-base mb-1">{product.name}</div>
              <div className="text-sm text-gray-600">
                {product.variety} • {product.size} • {product.grade}
              </div>
            </button>
          ))}
        </div>,
        document.body
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
                  <Fragment key={order.id}>
                    <tr
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
                  </Fragment>
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
