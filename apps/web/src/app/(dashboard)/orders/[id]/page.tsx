'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Save,
  X,
  Edit2,
  Plus,
  Trash2,
  AlertCircle,
  Copy,
  Trash,
  FileText,
  RefreshCw,
  XCircle,
  Clock
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge'

interface OrderLine {
  id?: string
  lineNo: number
  productId: string
  productCode?: string
  productDescription?: string
  sizeGrade: string
  quantity: number
  unitSize: number
  uom: string
  totalWeight: number
  unitPrice: number
  lineTotal?: number
  commissionPct: number
  commissionAmt?: number
}

interface Order {
  id: string
  orderNo: string
  sellerId: string
  buyerId: string
  status: string
  contractNo?: string
  terms?: string
  notes?: string
  lines: OrderLine[]
  seller?: {
    name: string
    code?: string
  }
  buyer?: {
    name: string
    code?: string
  }
  qboDocId?: string
  qboDocNumber?: string
  qboDocType?: 'invoice' | 'estimate'
}

interface OrderActivity {
  id: string
  activityType: string
  description: string
  userName: string
  createdAt: string
}

interface Account {
  id: string
  name: string
  code?: string
}

interface Product {
  id: string
  name: string
  variety?: string
  grade?: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { showToast } = useToast()
  const { getToken } = useAuth()

  console.log('OrderDetailPage mounted, orderId:', orderId)

  // Mode: 'view', 'edit', or 'duplicate'
  const [mode, setMode] = useState<'view' | 'edit' | 'duplicate'>('view')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Tab management
  const [activeTab, setActiveTab] = useState<'details' | 'activities'>('details')

  // Activities
  const [activities, setActivities] = useState<OrderActivity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  // QuickBooks actions
  const [qbLoading, setQbLoading] = useState(false)

  // Order data
  const [order, setOrder] = useState<Order | null>(null)
  const [sellerId, setSellerId] = useState('')
  const [buyerId, setBuyerId] = useState('')
  const [contractNo, setContractNo] = useState('')
  const [terms, setTerms] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('draft')
  const [lines, setLines] = useState<OrderLine[]>([])

  // Reference data
  const [accounts, setAccounts] = useState<Account[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Autocomplete state
  const [sellerSearch, setSellerSearch] = useState('')
  const [buyerSearch, setBuyerSearch] = useState('')
  const [showSellerDropdown, setShowSellerDropdown] = useState(false)
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false)

  // Fetch order data
  useEffect(() => {
    fetchOrder()
    fetchAccounts()
    fetchProducts()
    fetchActivities()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const token = await getToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiUrl}/api/orders/${orderId}`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) throw new Error('Failed to fetch order')

      const data = await response.json()
      setOrder(data)
      setSellerId(data.sellerId)
      setBuyerId(data.buyerId)
      setContractNo(data.contractNo || '')
      setTerms(data.terms || '')
      setNotes(data.notes || '')
      setStatus(data.status)
      setLines(data.lines || [])
      setIsLoading(false)
    } catch (err: any) {
      console.error('Error fetching order:', err)
      setError(err.message)
      setIsLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const token = await getToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiUrl}/api/accounts?limit=10000`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched accounts:', data.length)
        setAccounts(data)
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
    }
  }

  const fetchProducts = async () => {
    try {
      const token = await getToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiUrl}/api/products`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }

  const fetchActivities = async () => {
    setActivitiesLoading(true)
    try {
      const token = await getToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiUrl}/api/orders/${orderId}/activities`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      setActivitiesLoading(false)
    }
  }

  // Filter accounts based on search (memoized for performance)
  const filteredSellers = useMemo(() => {
    if (!sellerSearch || sellerSearch.length < 3) return []
    const searchLower = sellerSearch.toLowerCase()
    return accounts
      .filter(account =>
        account.name.toLowerCase().includes(searchLower) ||
        (account.code && account.code.toLowerCase().includes(searchLower))
      )
      .slice(0, 10)
  }, [accounts, sellerSearch])

  const filteredBuyers = useMemo(() => {
    if (!buyerSearch || buyerSearch.length < 3) return []
    const searchLower = buyerSearch.toLowerCase()
    return accounts
      .filter(account =>
        account.name.toLowerCase().includes(searchLower) ||
        (account.code && account.code.toLowerCase().includes(searchLower))
      )
      .slice(0, 10)
  }, [accounts, buyerSearch])

  const handleEdit = () => {
    // Prevent editing paid orders
    if (order?.status === 'paid') {
      showToast('Cannot edit order - invoice has been paid in QuickBooks', 'error')
      return
    }
    setMode('edit')
  }

  const handleDuplicateMode = () => {
    console.log('Duplicate mode - Current sellerId:', sellerId, 'buyerId:', buyerId)
    console.log('Accounts loaded:', accounts.length)
    setMode('duplicate')
    setStatus('draft') // Reset status to draft for new order

    // Initialize search fields with current seller/buyer names
    const seller = accounts.find(a => a.id === sellerId)
    const buyer = accounts.find(a => a.id === buyerId)
    if (seller) setSellerSearch(seller.name)
    if (buyer) setBuyerSearch(buyer.name)
  }

  const handleCancel = () => {
    setMode('view')
    // Reset to original values
    if (order) {
      setSellerId(order.sellerId)
      setBuyerId(order.buyerId)
      setContractNo(order.contractNo || '')
      setTerms(order.terms || '')
      setNotes(order.notes || '')
      setStatus(order.status)
      setLines(order.lines || [])
    }
  }

  const handleSave = async () => {
    console.log('Saving - sellerId:', sellerId, 'buyerId:', buyerId, 'lines:', lines.length)

    if (!sellerId || !buyerId || lines.length === 0) {
      showToast('Please fill in all required fields and add at least one line item', 'info')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const orderData = {
        sellerId,
        buyerId,
        contractNo: contractNo || undefined,
        terms: terms || undefined,
        notes: notes || undefined,
        status,
        lines: lines.map((line) => ({
          productId: line.productId,
          sizeGrade: line.sizeGrade,
          quantity: line.quantity,
          unitSize: line.unitSize,
          uom: line.uom,
          totalWeight: line.totalWeight,
          unitPrice: line.unitPrice,
          commissionPct: line.commissionPct,
        })),
      }

      const token = await getToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || ''

      if (mode === 'edit') {
        // Update existing order
        const response = await fetch(`${apiUrl}/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: 'include',
          body: JSON.stringify(orderData),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to update order')
        }

        await fetchOrder()
        setMode('view')
        showToast('Order updated successfully', 'success')
      } else if (mode === 'duplicate') {
        // Create new order
        const response = await fetch(`${apiUrl}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: 'include',
          body: JSON.stringify(orderData),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to create order')
        }

        const newOrder = await response.json()
        showToast('Order duplicated successfully', 'success')
        setTimeout(() => router.push(`/orders/${newOrder.id}`), 500)
      }
    } catch (err: any) {
      setError(err.message)
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this order?')) {
      return
    }

    try {
      const token = await getToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiUrl}/api/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete order')
      }

      showToast('Order deleted successfully', 'warning')
      setTimeout(() => router.push('/orders'), 500)
    } catch (err: any) {
      showToast(`Error deleting order: ${err.message}`, 'error')
    }
  }

  const handleAddLine = () => {
    const newLine: OrderLine = {
      lineNo: lines.length + 1,
      productId: '',
      sizeGrade: '',
      quantity: 0,
      unitSize: 0,
      uom: 'CASE',
      totalWeight: 0,
      unitPrice: 0,
      commissionPct: 0,
    }
    setLines([...lines, newLine])
  }

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index))
  }

  const handleLineChange = (index: number, field: keyof OrderLine, value: any) => {
    const updated = [...lines]
    updated[index] = { ...updated[index], [field]: value }

    // Auto-calculate totalWeight if quantity, unitSize, or uom changes
    if (field === 'quantity' || field === 'unitSize') {
      const qty = field === 'quantity' ? value : updated[index].quantity
      const size = field === 'unitSize' ? value : updated[index].unitSize
      updated[index].totalWeight = qty * size
    }

    setLines(updated)
  }

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + (line.quantity * line.unitSize * line.unitPrice), 0)
  }

  const calculateCommissionTotal = () => {
    return lines.reduce((sum, line) => {
      const lineTotal = line.quantity * line.unitSize * line.unitPrice
      return sum + (lineTotal * line.commissionPct)
    }, 0)
  }

  const handleCreateInvoice = async () => {
    if (!confirm('Create invoice in QuickBooks for this order?')) {
      return
    }

    setQbLoading(true)
    try {
      const token = await getToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiUrl}/api/quickbooks/sync/order/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ docType: 'invoice' }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      const result = await response.json()
      showToast(`Invoice #${result.docNumber} created in QuickBooks`, 'success')
      await fetchOrder()
      await fetchActivities()
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setQbLoading(false)
    }
  }

  const handleUpdateInvoice = async () => {
    if (!confirm('Update this invoice in QuickBooks with current order data?')) {
      return
    }

    setQbLoading(true)
    try {
      const token = await getToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiUrl}/api/quickbooks/sync/order/${orderId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update invoice')
      }

      const result = await response.json()
      showToast(`Invoice #${order?.qboDocNumber} updated in QuickBooks`, 'success')
      await fetchOrder()
      await fetchActivities()
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setQbLoading(false)
    }
  }

  const handleVoidInvoice = async () => {
    if (!confirm('Void this invoice in QuickBooks? This action cannot be undone.')) {
      return
    }

    setQbLoading(true)
    try {
      const token = await getToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiUrl}/api/quickbooks/sync/order/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to void invoice')
      }

      showToast('Invoice voided in QuickBooks', 'warning')
      await fetchOrder()
      await fetchActivities()
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setQbLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order_created':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'order_updated':
        return <Edit2 className="h-4 w-4 text-blue-600" />
      case 'invoice_created':
        return <FileText className="h-4 w-4 text-green-600" />
      case 'invoice_updated':
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      case 'invoice_voided':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'payment_received':
        return <Badge className="h-4 w-4 text-green-600" />
      case 'synced_from_qb':
        return <RefreshCw className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading order...</div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Order</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const isEditing = mode === 'edit' || mode === 'duplicate'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-blue-400">
              {mode === 'duplicate' ? 'New Order (Duplicate)' : `Order ${order?.orderNo}`}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-500">
                Status: <span className="capitalize">{mode === 'duplicate' ? status : order?.status}</span>
              </p>
              {order?.qboDocNumber && (
                <Badge variant="outline" className="text-xs">
                  QB Invoice #{order.qboDocNumber}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {mode === 'view' && (
            <>
              <Button
                onClick={handleEdit}
                disabled={order?.status === 'paid'}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={handleDuplicateMode}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={order?.status === 'posted_to_qb' || order?.status === 'paid'}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : mode === 'duplicate' ? 'Save as New' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Paid Order Warning Banner */}
      {order?.status === 'paid' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">Order Paid - Read Only</h3>
            <p className="text-sm text-yellow-700">
              This order has been paid in QuickBooks and cannot be edited.
            </p>
          </div>
        </div>
      )}

      {/* QuickBooks Actions */}
      {mode === 'view' && order && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">QuickBooks Integration</h3>
              <p className="text-sm text-blue-700">
                {!order.qboDocId && 'Create an invoice in QuickBooks for this order'}
                {order.qboDocId && order.status !== 'paid' && 'Update or void the QuickBooks invoice'}
                {order.status === 'paid' && 'Invoice has been paid in QuickBooks'}
              </p>
            </div>
            <div className="flex gap-2">
              {!order.qboDocId && (
                <Button
                  onClick={handleCreateInvoice}
                  disabled={qbLoading}
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {qbLoading ? 'Creating...' : 'Create Invoice in QB'}
                </Button>
              )}
              {order.qboDocId && order.status !== 'paid' && (
                <>
                  <Button
                    onClick={handleUpdateInvoice}
                    disabled={qbLoading}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {qbLoading ? 'Updating...' : 'Update QB Invoice'}
                  </Button>
                  <Button
                    onClick={handleVoidInvoice}
                    disabled={qbLoading}
                    size="sm"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {qbLoading ? 'Voiding...' : 'Void Invoice'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Order Details
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'activities'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activity Log
            {activities.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                {activities.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <>
          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Seller */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seller</CardTitle>
          </CardHeader>
          <CardContent>
            {mode === 'duplicate' ? (
              <div className="relative">
                <Label>Select Seller *</Label>
                <Input
                  type="text"
                  placeholder="Type to search seller..."
                  value={sellerSearch}
                  onChange={(e) => {
                    setSellerSearch(e.target.value)
                    setShowSellerDropdown(true)
                  }}
                  onFocus={() => setShowSellerDropdown(true)}
                  className="mt-1"
                />
                {showSellerDropdown && sellerSearch && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {sellerSearch.length < 3 ? (
                      <div className="px-3 py-2 text-gray-500">Type at least 3 characters to search</div>
                    ) : filteredSellers.length > 0 ? (
                      filteredSellers.map((account) => (
                        <div
                          key={account.id}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            setSellerId(account.id)
                            setSellerSearch(account.name)
                            setShowSellerDropdown(false)
                          }}
                        >
                          <div className="font-medium">{account.name}</div>
                          {account.code && <div className="text-sm text-gray-500">{account.code}</div>}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500">No accounts found</div>
                    )}
                  </div>
                )}
                {sellerId && !sellerSearch && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {accounts.find(a => a.id === sellerId)?.name}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-semibold">{order?.seller?.name || 'Unknown'}</p>
                {order?.seller?.code && (
                  <p className="text-sm text-gray-500">Code: {order.seller.code}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Buyer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buyer</CardTitle>
          </CardHeader>
          <CardContent>
            {mode === 'duplicate' ? (
              <div className="relative">
                <Label>Select Buyer *</Label>
                <Input
                  type="text"
                  placeholder="Type to search buyer..."
                  value={buyerSearch}
                  onChange={(e) => {
                    setBuyerSearch(e.target.value)
                    setShowBuyerDropdown(true)
                  }}
                  onFocus={() => setShowBuyerDropdown(true)}
                  className="mt-1"
                />
                {showBuyerDropdown && buyerSearch && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {buyerSearch.length < 3 ? (
                      <div className="px-3 py-2 text-gray-500">Type at least 3 characters to search</div>
                    ) : filteredBuyers.length > 0 ? (
                      filteredBuyers.map((account) => (
                        <div
                          key={account.id}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            setBuyerId(account.id)
                            setBuyerSearch(account.name)
                            setShowBuyerDropdown(false)
                          }}
                        >
                          <div className="font-medium">{account.name}</div>
                          {account.code && <div className="text-sm text-gray-500">{account.code}</div>}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500">No accounts found</div>
                    )}
                  </div>
                )}
                {buyerId && !buyerSearch && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {accounts.find(a => a.id === buyerId)?.name}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-semibold">{order?.buyer?.name || 'Unknown'}</p>
                {order?.buyer?.code && (
                  <p className="text-sm text-gray-500">Code: {order.buyer.code}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Contract Number</Label>
            {isEditing ? (
              <Input
                value={contractNo}
                onChange={(e) => setContractNo(e.target.value)}
                placeholder="Enter contract number"
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-gray-100">{contractNo || '-'}</p>
            )}
          </div>

          <div>
            <Label>Terms</Label>
            {isEditing ? (
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Enter terms"
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{terms || '-'}</p>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            {isEditing ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter notes"
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{notes || '-'}</p>
            )}
          </div>

          {isEditing && (
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          {isEditing && (
            <Button onClick={handleAddLine} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Line
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {lines.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No line items</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Memo</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Size</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price/lb</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Comm %</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Comm Amt</th>
                    {isEditing && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lines.map((line, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        {isEditing ? (
                          <Select
                            value={line.productId}
                            onValueChange={(value) => {
                              const product = products.find(p => p.id === value)
                              handleLineChange(index, 'productId', value)
                              if (product) {
                                handleLineChange(index, 'productCode', product.name)
                                handleLineChange(index, 'productDescription',
                                  [product.variety, product.grade].filter(Boolean).join(' - '))
                              }
                            }}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm">
                            <div className="font-medium">{line.productCode}</div>
                            <div className="text-gray-500">{line.productDescription}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {isEditing ? (
                          <Input
                            value={line.sizeGrade}
                            onChange={(e) => handleLineChange(index, 'sizeGrade', e.target.value)}
                            className="w-24"
                          />
                        ) : (
                          <span className="text-sm">{line.sizeGrade}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        ) : (
                          <span className="text-sm">{line.quantity}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={line.unitSize}
                            onChange={(e) => handleLineChange(index, 'unitSize', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        ) : (
                          <span className="text-sm">{line.unitSize}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {isEditing ? (
                          <Select
                            value={line.uom}
                            onValueChange={(value) => handleLineChange(index, 'uom', value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CASE">CASE</SelectItem>
                              <SelectItem value="BAG">BAG</SelectItem>
                              <SelectItem value="LBS">LBS</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm">{line.uom}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        ) : (
                          <span className="text-sm">${line.unitPrice.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-medium">
                          ${(line.lineTotal || (line.quantity * line.unitSize * line.unitPrice)).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={line.commissionPct * 100}
                            onChange={(e) => handleLineChange(index, 'commissionPct', (parseFloat(e.target.value) || 0) / 100)}
                            className="w-20"
                          />
                        ) : (
                          <span className="text-sm">{(line.commissionPct * 100).toFixed(2)}%</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-medium text-orange-600">
                          ${(line.commissionAmt || ((line.lineTotal || (line.quantity * line.unitSize * line.unitPrice)) * line.commissionPct)).toFixed(2)}
                        </span>
                      </td>
                      {isEditing && (
                        <td className="px-3 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLine(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          {lines.length > 0 && (
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-lg font-bold">
                    ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-medium">Commission:</span>
                  <span className="text-lg font-bold text-orange-600">
                    ${calculateCommissionTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {/* Activity Tab */}
      {activeTab === 'activities' && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="text-center py-8 text-gray-500">Loading activities...</div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No activities recorded yet</div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="mt-0.5">
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-500">
                          {activity.userName || 'System'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
