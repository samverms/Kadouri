'use client'

import React, { useState, useEffect, useRef, Fragment, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from '@/components/ui/date-picker'
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Copy,
  Menu,
  Layers,
  Filter,
  FilterX,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface InvoiceLine {
  id: string
  productId: string
  productCode: string
  productDescription: string
  sizeGrade: string
  quantity: number
  unitSize: number
  uom: string
  totalWeight: number
  unitPrice: number
  total: number
  commissionPct: number
  commissionAmt: number
}

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
  commissionTotal?: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'paid' | 'posted_to_qb' | 'void' | 'inactive'
  createdAt: string
  lines?: InvoiceLine[]
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
  const router = useRouter()
  const { getToken } = useAuth()
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<keyof Order>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [generatingPdf, setGeneratingPdf] = useState<{ orderId: string; type: string } | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)
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

  // Account selection state
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null)
  const [sellerCodeSearch, setSellerCodeSearch] = useState('')
  const [sellerNameSearch, setSellerNameSearch] = useState('')
  const [buyerCodeSearch, setBuyerCodeSearch] = useState('')
  const [buyerNameSearch, setBuyerNameSearch] = useState('')
  const [showSellerDropdown, setShowSellerDropdown] = useState(false)
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false)
  const sellerCodeRef = useRef<HTMLInputElement>(null)
  const sellerNameRef = useRef<HTMLInputElement>(null)
  const buyerCodeRef = useRef<HTMLInputElement>(null)
  const buyerNameRef = useRef<HTMLInputElement>(null)
  const sellerDropdownRef = useRef<HTMLDivElement>(null)
  const buyerDropdownRef = useRef<HTMLDivElement>(null)

  // Date range filter state
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null)

  // Column menu state
  const [openColumnMenu, setOpenColumnMenu] = useState<string | null>(null)
  const columnMenuRef = useRef<HTMLDivElement>(null)

  // Column filters state
  const [columnFilters, setColumnFilters] = useState({
    orderNo: '',
    date: '',
    seller: '',
    buyer: '',
    product: '',
    agent: '',
    total: '',
    commission: '',
    status: ''
  })

  const [showActiveOnly, setShowActiveOnly] = useState(false)

  // Column grouping state
  const [groupByColumn, setGroupByColumn] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showGroupingPanel, setShowGroupingPanel] = useState(false)
  const groupingPanelRef = useRef<HTMLDivElement>(null)

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

  // Account filtering and selection functions
  const getFilteredSellerAccounts = () => {
    if (!sellerCodeSearch && !sellerNameSearch) return []

    return accounts.filter(account => {
      const codeMatch = sellerCodeSearch && account.code?.toLowerCase().includes(sellerCodeSearch.toLowerCase())
      const nameMatch = sellerNameSearch && account.name?.toLowerCase().includes(sellerNameSearch.toLowerCase())
      return codeMatch || nameMatch
    }).slice(0, 10)
  }

  const getFilteredBuyerAccounts = () => {
    if (!buyerCodeSearch && !buyerNameSearch) return []

    return accounts.filter(account => {
      const codeMatch = buyerCodeSearch && account.code?.toLowerCase().includes(buyerCodeSearch.toLowerCase())
      const nameMatch = buyerNameSearch && account.name?.toLowerCase().includes(buyerNameSearch.toLowerCase())
      return codeMatch || nameMatch
    }).slice(0, 10)
  }

  const handleSelectSeller = (account: any) => {
    setSelectedSeller(account)
    setSellerCodeSearch(account.code || '')
    setSellerNameSearch(account.name || '')
    setShowSellerDropdown(false)
  }

  const handleSelectBuyer = (account: any) => {
    setSelectedBuyer(account)
    setBuyerCodeSearch(account.code || '')
    setBuyerNameSearch(account.name || '')
    setShowBuyerDropdown(false)
  }

  const handleSellerCodeChange = (value: string) => {
    setSellerCodeSearch(value)
    setShowSellerDropdown(true)
    // Clear selection if user is typing
    if (selectedSeller && value !== selectedSeller.code) {
      setSelectedSeller(null)
      setSellerNameSearch('')
    }
  }

  const handleSellerNameChange = (value: string) => {
    setSellerNameSearch(value)
    setShowSellerDropdown(true)
    // Clear selection if user is typing
    if (selectedSeller && value !== selectedSeller.name) {
      setSelectedSeller(null)
      setSellerCodeSearch('')
    }
  }

  const handleBuyerCodeChange = (value: string) => {
    setBuyerCodeSearch(value)
    setShowBuyerDropdown(true)
    // Clear selection if user is typing
    if (selectedBuyer && value !== selectedBuyer.code) {
      setSelectedBuyer(null)
      setBuyerNameSearch('')
    }
  }

  const handleBuyerNameChange = (value: string) => {
    setBuyerNameSearch(value)
    setShowBuyerDropdown(true)
    // Clear selection if user is typing
    if (selectedBuyer && value !== selectedBuyer.name) {
      setSelectedBuyer(null)
      setBuyerCodeSearch('')
    }
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

      // Close seller/buyer dropdowns
      const isSellerInput = sellerCodeRef.current?.contains(target) || sellerNameRef.current?.contains(target)
      const isBuyerInput = buyerCodeRef.current?.contains(target) || buyerNameRef.current?.contains(target)
      const isSellerDropdown = sellerDropdownRef.current?.contains(target)
      const isBuyerDropdown = buyerDropdownRef.current?.contains(target)

      if (!isSellerInput && !isSellerDropdown && showSellerDropdown) {
        setShowSellerDropdown(false)
      }
      if (!isBuyerInput && !isBuyerDropdown && showBuyerDropdown) {
        setShowBuyerDropdown(false)
      }

      // Check if click is inside a date picker
      const isDatePicker = target.closest('[data-date-picker="true"]')

      // Close column menu if clicked outside (but not if clicking in date picker)
      if (openColumnMenu && columnMenuRef.current && !columnMenuRef.current.contains(target) && !isDatePicker) {
        setOpenColumnMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeSearchLineId, openColumnMenu, showSellerDropdown, showBuyerDropdown])

  const handleGeneratePDF = async (order: Order, type: 'seller' | 'buyer' | 'both') => {
    setGeneratingPdf({ orderId: order.id, type })

    try {
      // Check if API URL is configured
      if (!process.env.NEXT_PUBLIC_API_URL) {
        showToast('API URL not configured. Please set NEXT_PUBLIC_API_URL in .env.local', 'error')
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
      showToast(`Error generating PDF: ${error.message || 'Network error or API not available'}`, 'error')
    } finally {
      setGeneratingPdf(null)
    }
  }

  const generateSinglePDF = async (orderData: any, type: 'seller' | 'buyer') => {
    const token = await getToken()
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/pdf/order/${type}`

    const response = await fetch(apiUrl, {
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

  const handleDuplicateOrder = async (order: Order) => {
    if (!order.lines || order.lines.length === 0) {
      showToast('Cannot duplicate order: No line items found', 'info')
      return
    }

    setDuplicating(order.id)

    try {
      // Check if API URL is configured
      if (!process.env.NEXT_PUBLIC_API_URL) {
        showToast('API URL not configured. Please set NEXT_PUBLIC_API_URL in .env.local', 'error')
        return
      }

      // Prepare the order data for duplication
      const duplicateData = {
        sellerId: order.sellerId,
        buyerId: order.buyerId,
        lines: order.lines.map(line => ({
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(duplicateData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || errorData.message || 'Failed to duplicate order')
      }

      const newOrder = await response.json()

      // Redirect to the new order detail page
      showToast('Order duplicated successfully', 'success')
      setTimeout(() => router.push(`/orders/${newOrder.id}`), 500)
    } catch (error: any) {
      console.error('Error duplicating order:', error)
      showToast(`Error duplicating order: ${error.message || 'Unknown error'}`, 'error')
    } finally {
      setDuplicating(null)
    }
  }

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrders()
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts?limit=10000`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }

      const data = await response.json()
      setAccounts(data)
    } catch (err) {
      console.error('Fetch accounts error:', err)
    }
  }

  const fetchOrders = async () => {
    setIsLoading(true)
    setError('')
    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/invoices`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()

      // Transform invoice data to match Order interface
      const transformedOrders = data.map((invoice: any) => {
        const lines = invoice.lines || []

        // Format product display
        let productDisplay = 'No Products'
        if (lines.length === 1) {
          productDisplay = `${lines[0].productCode}${lines[0].productDescription ? ' - ' + lines[0].productDescription : ''}`
        } else if (lines.length > 1) {
          productDisplay = `${lines[0].productCode} +${lines.length - 1} more`
        }

        // Calculate commission total from line items
        const commissionTotal = lines.reduce((sum: number, line: any) =>
          sum + (parseFloat(line.commissionAmt) || 0), 0)

        // Get average commission rate (weighted by line total)
        const totalAmount = lines.reduce((sum: number, line: any) => sum + (parseFloat(line.total) || 0), 0)
        const commissionRate = lines.length > 0 && totalAmount > 0
          ? (commissionTotal / totalAmount) * 100
          : 0

        return {
          id: invoice.id,
          orderNo: invoice.orderNo || invoice.qboDocNumber || 'N/A',
          date: invoice.orderDate,
          seller: invoice.sellerAccountName,
          sellerId: invoice.sellerAccountId,
          buyer: invoice.buyerAccountName,
          buyerId: invoice.buyerAccountId,
          product: productDisplay,
          productId: lines[0]?.productId || '',
          quantity: lines.reduce((sum: number, line: any) => sum + (parseFloat(line.quantity) || 0), 0),
          unit: 'lbs',
          price: lines[0]?.unitPrice || 0,
          total: parseFloat(invoice.totalAmount) || 0,
          agent: invoice.agentName || 'Unknown',
          agentId: invoice.agentId || '',
          commissionRate: commissionRate,
          commissionTotal: commissionTotal,
          status: invoice.status || 'pending',
          createdAt: invoice.orderDate,
          lines: lines,
        }
      })

      setOrders(transformedOrders)
    } catch (err) {
      console.error('Fetch orders error:', err)
      setError('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortField('date')
        setSortDirection('desc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setOpenColumnMenu(null)
  }

  const SortIcon = ({ field }: { field: keyof Order }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline" />
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="h-3 w-3 ml-1 inline" /> :
      <ArrowDown className="h-3 w-3 ml-1 inline" />
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
    // Clear column filters
    setColumnFilters({
      orderNo: '',
      date: '',
      seller: '',
      buyer: '',
      product: '',
      agent: '',
      total: '',
      commission: '',
      status: ''
    })
    // Clear date range
    setDateRangeStart(null)
    setDateRangeEnd(null)
    // Clear grouping
    setGroupByColumn([])
    setExpandedGroups(new Set())
    // Clear sorting
    setSortField('date')
    setSortDirection('desc')
    // Clear search
    setSearchQuery('')
    showToast('All filters and settings reset', 'info')
  }

  // Check if any column filters are active
  const hasActiveColumnFilters = Object.values(columnFilters).some(value => value !== '')

  // Check if any filters are active (column filters OR date range)
  const hasAnyFilters = hasActiveColumnFilters || dateRangeStart !== null || dateRangeEnd !== null

  // Toggle group expansion
  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
        // Also remove all child groups
        Array.from(newSet).forEach(key => {
          if (key.startsWith(groupKey + '>')) {
            newSet.delete(key)
          }
        })
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  // Helper function to get date range bucket
  const getDateRangeBucket = (date: Date): string => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const orderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    const diffTime = today.getTime() - orderDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Today
    if (diffDays === 0) {
      return '01_Today'
    }

    // Yesterday
    if (diffDays === 1) {
      return '02_Yesterday'
    }

    // This Week (last 7 days including today)
    if (diffDays >= 0 && diffDays < 7) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - 6)
      const weekEnd = today
      return `03_This Week (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
    }

    // Last Week (7-14 days ago)
    if (diffDays >= 7 && diffDays < 14) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - 13)
      const weekEnd = new Date(today)
      weekEnd.setDate(today.getDate() - 7)
      return `04_Last Week (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
    }

    // This Month
    if (orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear()) {
      return `05_This Month (${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`
    }

    // Last Month
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    if (orderDate.getMonth() === lastMonth.getMonth() && orderDate.getFullYear() === lastMonth.getFullYear()) {
      return `06_Last Month (${lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`
    }

    // This Quarter
    const currentQuarter = Math.floor(today.getMonth() / 3)
    const orderQuarter = Math.floor(orderDate.getMonth() / 3)
    if (orderQuarter === currentQuarter && orderDate.getFullYear() === today.getFullYear()) {
      const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4']
      return `07_This Quarter (${quarterNames[currentQuarter]} ${today.getFullYear()})`
    }

    // Last Quarter
    const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1
    const lastQuarterYear = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear()
    if (orderQuarter === lastQuarter && orderDate.getFullYear() === lastQuarterYear) {
      const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4']
      return `08_Last Quarter (${quarterNames[lastQuarter]} ${lastQuarterYear})`
    }

    // This Year
    if (orderDate.getFullYear() === today.getFullYear()) {
      return `09_This Year (${today.getFullYear()})`
    }

    // Last Year
    if (orderDate.getFullYear() === today.getFullYear() - 1) {
      return `10_Last Year (${today.getFullYear() - 1})`
    }

    // Older (group by year)
    return `11_Older (${orderDate.getFullYear()})`
  }

  // Get value for grouping
  const getGroupValue = (order: Order, column: string): string => {
    switch (column) {
      case 'status':
        return order.status || 'Unknown'
      case 'buyer':
        return order.buyer || 'Unknown Buyer'
      case 'seller':
        return order.seller || 'Unknown Seller'
      case 'agent':
        return order.agent || 'No Agent'
      case 'product':
        return order.product || 'No Product'
      case 'date':
        // Use exact date for grouping
        if (!order.date) return 'No Date'
        const exactDate = new Date(order.date)
        return exactDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      case 'dateRange':
        // Use date range buckets for grouping
        if (!order.date) return 'No Date'
        const orderDate = new Date(order.date)
        const bucket = getDateRangeBucket(orderDate)
        // Remove the numeric prefix for display
        return bucket.substring(3)
      case 'orderValue':
        // Group by order value range
        const total = order.total || 0
        if (total < 1000) {
          return '1. Small Orders (< $1,000)'
        } else if (total < 5000) {
          return '2. Medium Orders ($1,000 - $5,000)'
        } else if (total < 10000) {
          return '3. Large Orders ($5,000 - $10,000)'
        } else {
          return '4. Very Large Orders ($10,000+)'
        }
      case 'paymentStatus':
        // Group by payment status (using order status as proxy)
        const status = order.status || ''
        if (status === 'pending' || status === 'confirmed' || status === 'shipped' || status === 'delivered') {
          return '1. Active Orders'
        } else if (status === 'posted_to_qb') {
          return '2. Posted to QuickBooks'
        } else {
          return '3. Other'
        }
      default:
        return 'Unknown'
    }
  }

  // Helper function to set date preset
  const setDatePreset = (preset: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (preset) {
      case 'today':
        setDateRangeStart(new Date(today))
        setDateRangeEnd(new Date(today))
        break
      case 'thisWeek':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
        setDateRangeStart(weekStart)
        setDateRangeEnd(new Date(today))
        break
      case 'thisMonth':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        setDateRangeStart(monthStart)
        setDateRangeEnd(new Date(today))
        break
      case 'thisQuarter':
        const currentQuarter = Math.floor(today.getMonth() / 3)
        const quarterStartMonth = currentQuarter * 3
        const quarterStart = new Date(today.getFullYear(), quarterStartMonth, 1)
        setDateRangeStart(quarterStart)
        setDateRangeEnd(new Date(today))
        break
      case 'thisYear':
        const yearStart = new Date(today.getFullYear(), 0, 1)
        setDateRangeStart(yearStart)
        setDateRangeEnd(new Date(today))
        break
    }
    setOpenColumnMenu(null)
  }

  // Clear filter for a specific column
  const clearColumnFilter = (column: string) => {
    if (column === 'date') {
      setDateRangeStart(null)
      setDateRangeEnd(null)
    } else {
      setColumnFilters(prev => ({
        ...prev,
        [column]: ''
      }))
    }
    showToast(`${column.charAt(0).toUpperCase() + column.slice(1)} filter cleared`, 'info')
  }

  // Helper to check if column has active filter
  const hasColumnFilter = (column: string): boolean => {
    if (column === 'date') {
      return dateRangeStart !== null || dateRangeEnd !== null
    }
    return (columnFilters[column as keyof typeof columnFilters] || '') !== ''
  }

  // Column menu component
  const ColumnMenu = React.memo(({ column, label }: { column: string, label: string }) => {
    const isOpen = openColumnMenu === column
    const filterValue = columnFilters[column as keyof typeof columnFilters] || ''

    // Check if this column has an active filter
    const hasFilter = column === 'date'
      ? (dateRangeStart !== null || dateRangeEnd !== null)
      : filterValue !== ''

    return (
      <div className="relative inline-block" ref={isOpen ? columnMenuRef : null}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpenColumnMenu(isOpen ? null : column)
          }}
          className={`p-0.5 rounded ${
            hasFilter
              ? 'text-blue-600 bg-blue-100 hover:bg-blue-200'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={hasFilter ? "Filtered - Click to edit" : "Column menu"}
        >
          {hasFilter ? <FilterX className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
        </button>

        {isOpen && (
          <div
            className={`absolute left-0 top-full mt-1 ${column === 'date' ? 'min-w-[500px] max-w-[min(600px,calc(100vw-2rem))] max-h-[80vh] overflow-auto' : 'w-56'} bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-3 space-y-2">
              {/* Date column special filter */}
              {column === 'date' ? (
                <>
                  <label className="block text-xs font-medium text-teal-700 dark:text-teal-300 mb-1">Quick Presets</label>
                  <div className="space-y-1">
                    <button
                      onClick={() => setDatePreset('today')}
                      className="w-full px-2 py-1.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 rounded transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setDatePreset('thisWeek')}
                      className="w-full px-2 py-1.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 rounded transition-colors"
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => setDatePreset('thisMonth')}
                      className="w-full px-2 py-1.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 rounded transition-colors"
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => setDatePreset('thisQuarter')}
                      className="w-full px-2 py-1.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 rounded transition-colors"
                    >
                      This Quarter
                    </button>
                    <button
                      onClick={() => setDatePreset('thisYear')}
                      className="w-full px-2 py-1.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 rounded transition-colors"
                    >
                      This Year
                    </button>
                  </div>
                  <div className="border-t border-teal-200 dark:border-teal-700 pt-2 mt-2">
                    <label className="block text-xs font-medium text-teal-700 dark:text-teal-300 mb-2">Custom Range</label>
                    <DateRangePicker
                      startDate={dateRangeStart}
                      endDate={dateRangeEnd}
                      onStartDateChange={setDateRangeStart}
                      onEndDateChange={setDateRangeEnd}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Filter input for other columns */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Filter</label>
                    {column === 'status' ? (
                      <select
                        value={filterValue}
                        onChange={(e) => handleColumnFilterChange(column, e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="paid">Paid</option>
                        <option value="posted_to_qb">Posted to QB</option>
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
                </>
              )}

              {/* Sort options */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <button
                  onClick={() => {
                    setSortField(column as keyof Order)
                    setSortDirection('asc')
                    setOpenColumnMenu(null)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <ArrowUp className="h-3 w-3" />
                  Sort Ascending
                </button>
                <button
                  onClick={() => {
                    setSortField(column as keyof Order)
                    setSortDirection('desc')
                    setOpenColumnMenu(null)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <ArrowDown className="h-3 w-3" />
                  Sort Descending
                </button>
                {sortField === column && (
                  <button
                    onClick={() => {
                      setSortField('date')
                      setOpenColumnMenu(null)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
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

  const filteredOrders = React.useMemo(() => {
    let result = [...orders]

    // Apply active filter (filter out cancelled, void, inactive orders)
    if (showActiveOnly) {
      result = result.filter(order =>
        order.status !== 'cancelled' &&
        order.status !== 'void' &&
        order.status !== 'inactive'
      )
    }

    // Apply date range filter
    if (dateRangeStart || dateRangeEnd) {
      result = result.filter(order => {
        const orderDate = new Date(order.date)
        orderDate.setHours(0, 0, 0, 0) // Normalize to start of day

        if (dateRangeStart && dateRangeEnd) {
          const startDate = new Date(dateRangeStart)
          startDate.setHours(0, 0, 0, 0)
          const endDate = new Date(dateRangeEnd)
          endDate.setHours(23, 59, 59, 999) // End of day
          return orderDate >= startDate && orderDate <= endDate
        } else if (dateRangeStart) {
          const startDate = new Date(dateRangeStart)
          startDate.setHours(0, 0, 0, 0)
          return orderDate >= startDate
        } else if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd)
          endDate.setHours(23, 59, 59, 999)
          return orderDate <= endDate
        }
        return true
      })
    }

    // Apply column filters
    if (columnFilters.orderNo) {
      result = result.filter(order =>
        order.orderNo.toLowerCase().includes(columnFilters.orderNo.toLowerCase())
      )
    }
    if (columnFilters.date) {
      result = result.filter(order =>
        new Date(order.date).toLocaleDateString().toLowerCase().includes(columnFilters.date.toLowerCase())
      )
    }
    if (columnFilters.seller) {
      result = result.filter(order =>
        order.seller.toLowerCase().includes(columnFilters.seller.toLowerCase())
      )
    }
    if (columnFilters.buyer) {
      result = result.filter(order =>
        order.buyer.toLowerCase().includes(columnFilters.buyer.toLowerCase())
      )
    }
    if (columnFilters.product) {
      result = result.filter(order =>
        order.product.toLowerCase().includes(columnFilters.product.toLowerCase())
      )
    }
    if (columnFilters.agent) {
      result = result.filter(order =>
        order.agent.toLowerCase().includes(columnFilters.agent.toLowerCase())
      )
    }
    if (columnFilters.total) {
      result = result.filter(order =>
        order.total.toString().includes(columnFilters.total)
      )
    }
    if (columnFilters.commission) {
      result = result.filter(order =>
        order.commissionTotal?.toString().includes(columnFilters.commission)
      )
    }
    if (columnFilters.status) {
      result = result.filter(order =>
        order.status === columnFilters.status
      )
    }

    // Apply global search query
    if (searchQuery) {
      result = result.filter(
        (order) =>
          order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.agent.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (aValue == null) return 1
      if (bValue == null) return -1

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })

    return result
  }, [orders, columnFilters, searchQuery, sortField, sortDirection, dateRangeStart, dateRangeEnd, showActiveOnly])

  // Helper function to create nested groups recursively
  const createNestedGroups = (orders: Order[], columns: string[], parentKey: string = ''): any => {
    if (columns.length === 0) {
      return orders
    }

    const [currentColumn, ...remainingColumns] = columns
    const groups = new Map<string, Order[]>()

    orders.forEach(order => {
      const groupValue = getGroupValue(order, currentColumn)
      if (!groups.has(groupValue)) {
        groups.set(groupValue, [])
      }
      groups.get(groupValue)!.push(order)
    })

    // Sort groups by key
    const sortedGroups = Array.from(groups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )

    // Create hierarchical structure
    return sortedGroups.map(([groupKey, groupOrders]) => {
      const fullKey = parentKey ? `${parentKey}>${currentColumn}:${groupKey}` : `${currentColumn}:${groupKey}`
      return {
        key: fullKey,
        displayKey: groupKey,
        column: currentColumn,
        orders: groupOrders,
        children: remainingColumns.length > 0
          ? createNestedGroups(groupOrders, remainingColumns, fullKey)
          : null
      }
    })
  }

  // Group orders if grouping is enabled
  const groupedOrders = React.useMemo(() => {
    if (!groupByColumn || groupByColumn.length === 0) {
      return null
    }

    return createNestedGroups(filteredOrders, groupByColumn)
  }, [filteredOrders, groupByColumn])

  // Calculate aggregations
  const aggregations = React.useMemo(() => {
    const totalOrders = filteredOrders.length
    const totalAmount = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const totalCommission = filteredOrders.reduce((sum, order) => sum + (order.commissionTotal || 0), 0)
    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalOrders,
      totalAmount,
      totalCommission,
      statusCounts
    }
  }, [filteredOrders])

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
        return 'bg-gray-100 text-gray-800 dark:text-gray-200'
    }
  }

  // Render order row
  const renderOrderRow = (order: Order) => {
    return (
      <Fragment key={order.id}>
        <tr
          className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <td className="px-2 py-2 dark:text-gray-300">
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
          <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
            <Link
              href={`/orders/${order.id}`}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
            >
              {order.orderNo}
            </Link>
          </td>
          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
            {new Date(order.date).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })}
          </td>
          <td className="px-3 py-2 whitespace-nowrap max-w-[120px] truncate border-r border-gray-200 dark:border-gray-700">
            <Link
              href={`/accounts/${order.sellerId}`}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              title={order.seller}
            >
              {order.seller}
            </Link>
          </td>
          <td className="px-3 py-2 whitespace-nowrap max-w-[120px] truncate border-r border-gray-200 dark:border-gray-700">
            <Link
              href={`/accounts/${order.buyerId}`}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              title={order.buyer}
            >
              {order.buyer}
            </Link>
          </td>
          <td className="px-3 py-2 whitespace-nowrap max-w-[140px] truncate border-r border-gray-200 dark:border-gray-700">
            <Link
              href={`/products/${order.productId}`}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              title={order.product}
            >
              {order.product}
            </Link>
          </td>
          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 max-w-[100px] truncate border-r border-gray-200 dark:border-gray-700" title={order.agent}>
            {order.agent}
          </td>
          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
            ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
            <div className="flex flex-col">
              <span className="font-medium">{order.commissionTotal ? `$${order.commissionTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</span>
              {order.commissionRate && order.commissionRate > 0 && (
                <span className="text-[10px] text-gray-500">
                  ({order.commissionRate.toFixed(2)}%)
                </span>
              )}
            </div>
          </td>
          <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
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
              <Link href={`/orders/${order.id}`}>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                onClick={() => handleDuplicateOrder(order)}
                disabled={duplicating === order.id}
              >
                <Copy className="h-3 w-3 mr-1" />
                {duplicating === order.id ? 'Duplicating...' : 'Duplicate'}
              </Button>
            </div>
          </td>
        </tr>
        {expandedOrderId === order.id && (
          <tr className="bg-gray-50 dark:bg-gray-800">
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
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Order Information
                  </h4>
                  <div className="bg-white dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Order Number
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-mono mt-1">
                        {order.orderNo}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Order Date
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {new Date(order.date).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Agent
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{order.agent}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Commission
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {order.commissionTotal ? (
                          <>
                            ${order.commissionTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {order.commissionRate && order.commissionRate > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({order.commissionRate.toFixed(2)}%)
                              </span>
                            )}
                          </>
                        ) : (
                          '-'
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
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
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Product & Pricing
                  </h4>
                  <div className="bg-white dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Product
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{order.product}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Quantity
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {order.quantity.toLocaleString()} {order.unit}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Price per Unit
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        ${order.price.toFixed(2)}/{order.unit}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Total Amount
                      </label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        ${order.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Parties
                  </h4>
                  <div className="bg-white dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1 mb-1">
                        <User className="h-3 w-3" />
                        Seller
                      </label>
                      <Link
                        href={`/accounts/${order.sellerId}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
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
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                      >
                        {order.buyer}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              {order.lines && order.lines.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Line Items ({order.lines.length})
                  </h4>
                  <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="w-[15%] px-2 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Memo
                          </th>
                          <th className="w-[25%] px-2 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="w-[12%] px-2 py-2 text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Price/lb
                          </th>
                          <th className="w-[15%] px-2 py-2 text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="w-[12%] px-2 py-2 text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Comm %
                          </th>
                          <th className="w-[15%] px-2 py-2 text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Comm Amt
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-950">
                        {order.lines.map((line) => {
                          const quantityDisplay = (() => {
                            const qty = line.quantity || 0
                            const unitSize = line.unitSize || 0
                            const totalWeight = line.totalWeight || 0
                            const uom = line.uom || 'CASE'

                            if (uom === 'CASE' && unitSize > 0 && totalWeight > 0) {
                              return `${qty.toLocaleString()} cases × ${unitSize.toLocaleString()} lbs = ${totalWeight.toLocaleString()} lbs`
                            } else if (uom === 'BAG' && unitSize > 0 && totalWeight > 0) {
                              return `${qty.toLocaleString()} bags × ${unitSize.toLocaleString()} lbs = ${totalWeight.toLocaleString()} lbs`
                            } else if (uom === 'LBS') {
                              return `${qty.toLocaleString()} lbs`
                            } else if (totalWeight > 0) {
                              return `${totalWeight.toLocaleString()} lbs`
                            }
                            return `${qty.toLocaleString()} ${uom}`
                          })()

                          return (
                            <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-2 py-2 text-[11px] text-gray-900 dark:text-gray-100 break-words">
                                {line.sizeGrade || '-'}
                              </td>
                              <td className="px-2 py-2 text-[11px] text-gray-900 dark:text-gray-100 break-words">
                                {quantityDisplay}
                              </td>
                              <td className="px-2 py-2 text-[11px] text-gray-900 dark:text-gray-100 text-right">
                                ${line.unitPrice?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-2 py-2 text-[11px] font-medium text-gray-900 dark:text-gray-100 text-right">
                                ${line.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                              </td>
                              <td className="px-2 py-2 text-[11px] text-gray-900 dark:text-gray-100 text-right">
                                {line.commissionPct ? `${line.commissionPct.toFixed(2)}%` : '-'}
                              </td>
                              <td className="px-2 py-2 text-[11px] text-gray-900 dark:text-gray-100 text-right">
                                ${line.commissionAmt?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
                        <tr>
                          <td colSpan={3} className="px-2 py-2 text-xs font-semibold text-gray-900 dark:text-gray-100 text-right">
                            Totals:
                          </td>
                          <td className="px-2 py-2 text-xs font-bold text-gray-900 dark:text-gray-100 text-right">
                            ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 py-2 dark:text-gray-300"></td>
                          <td className="px-2 py-2 text-xs font-bold text-orange-600 text-right">
                            ${order.commissionTotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </td>
          </tr>
        )}
      </Fragment>
    )
  }

  return (
    <div className="-mt-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-blue-400">Orders</h1>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">Manage and track all orders</p>
        </div>
        <Link href="/orders/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Search Bar and Filters */}
      <Card className="mb-4">
        <CardContent className="py-3">
          <div className="flex flex-col gap-3">
            {/* Search and Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative w-full sm:w-[70%]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Active Toggle Button - Icon Only */}
              <button
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className={`flex items-center justify-center p-2.5 rounded-lg border transition-all ${
                  showActiveOnly
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md dark:bg-blue-500 dark:border-blue-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
                title={showActiveOnly ? "Show all orders" : "Show active orders only"}
              >
                <Filter className="h-5 w-5" />
              </button>

              {/* Clear All Filters Button - Icon Only, shows when filters are active */}
              {hasAnyFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center justify-center p-2.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all shadow-sm dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/30"
                  title="Clear all filters"
                >
                  <FilterX className="h-5 w-5" />
                </button>
              )}

              {/* Group By Multi-Select - Icon Only */}
              <div className="relative" ref={groupingPanelRef}>
                <button
                  onClick={() => setShowGroupingPanel(!showGroupingPanel)}
                  className={`flex items-center justify-center p-2.5 rounded-lg border transition-all relative ${
                    groupByColumn.length > 0
                      ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 shadow-sm dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/30'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                  }`}
                  title={groupByColumn.length > 0 ? `Grouped by ${groupByColumn.length} column${groupByColumn.length > 1 ? 's' : ''}` : "Group by columns"}
                >
                  <Layers className="h-5 w-5" />
                  {groupByColumn.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-purple-600 rounded-full dark:bg-purple-500">
                      {groupByColumn.length}
                    </span>
                  )}
                </button>
                {showGroupingPanel && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-3">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Group by columns</div>
                      <div className="space-y-2">
                        {[
                          { value: 'status', label: 'Status' },
                          { value: 'buyer', label: 'Buyer' },
                          { value: 'seller', label: 'Seller' },
                          { value: 'product', label: 'Product' },
                          { value: 'agent', label: 'Agent' },
                          { value: 'orderValue', label: 'Order Value Range' },
                          { value: 'paymentStatus', label: 'Payment Status' },
                          { value: 'date', label: 'Date' },
                          { value: 'dateRange', label: 'Date Range' },
                        ].map((option, index) => {
                          const isSelected = groupByColumn.includes(option.value)
                          const currentIndex = groupByColumn.indexOf(option.value)
                          return (
                            <label key={option.value} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setGroupByColumn([...groupByColumn, option.value])
                                  } else {
                                    setGroupByColumn(groupByColumn.filter(col => col !== option.value))
                                  }
                                  setExpandedGroups(new Set())
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{option.label}</span>
                              {isSelected && (
                                <span className="text-xs text-gray-500 bg-blue-100 px-2 py-0.5 rounded">
                                  {currentIndex + 1}
                                </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 flex gap-2">
                        <button
                          onClick={() => {
                            setGroupByColumn([])
                            setExpandedGroups(new Set())
                            setShowGroupingPanel(false)
                          }}
                          className="flex-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setShowGroupingPanel(false)}
                          className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {hasActiveColumnFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
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

      {/* Create Order Dialog */}
      {showCreateDialog && (
        <Card className="mb-3 border-blue-200 bg-white dark:bg-gray-900">
          <CardHeader className="py-3">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">Entry Order</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form className="space-y-4">
              {/* Seller and Buyer Side-by-Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Seller Section */}
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                  <h3 className="text-base font-bold text-blue-900 dark:text-blue-100 mb-3">Seller</h3>

                  <div className="space-y-3">
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Account <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <Input
                          ref={sellerCodeRef}
                          type="text"
                          value={sellerCodeSearch}
                          onChange={(e) => handleSellerCodeChange(e.target.value)}
                          onFocus={() => setShowSellerDropdown(true)}
                          placeholder="Code..."
                          className="flex-1 bg-white dark:bg-gray-800"
                        />

                        <Input
                          ref={sellerNameRef}
                          type="text"
                          value={sellerNameSearch}
                          onChange={(e) => handleSellerNameChange(e.target.value)}
                          onFocus={() => setShowSellerDropdown(true)}
                          placeholder="Account name..."
                          className="flex-[2] bg-white dark:bg-gray-800"
                        />
                      </div>

                      {/* Seller Dropdown */}
                      {showSellerDropdown && (sellerCodeSearch || sellerNameSearch) && (
                        <div
                          ref={sellerDropdownRef}
                          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-700 rounded-md shadow-lg max-h-60 overflow-auto"
                        >
                          {getFilteredSellerAccounts().length > 0 ? (
                            getFilteredSellerAccounts().map((account) => (
                              <div
                                key={account.id}
                                className="px-3 py-2 cursor-pointer hover:bg-blue-100 border-b last:border-b-0"
                                onClick={() => handleSelectSeller(account)}
                              >
                                <div className="flex gap-2">
                                  <span className="font-medium text-blue-900 dark:text-blue-100">{account.code}</span>
                                  <span className="text-gray-700 dark:text-gray-300">-</span>
                                  <span className="text-gray-900 dark:text-gray-100">{account.name}</span>
                                </div>
                                {account.city && account.state && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {account.city}, {account.state}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-gray-500 text-sm">No accounts found</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Billing Address <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select className="w-32 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-800">
                          <option value="">Billing</option>
                          <option value="shipping">Shipping</option>
                        </select>

                        <Input
                          placeholder="Address (auto-filled)"
                          className="flex-1 bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Pickup Location <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select className="w-32 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-800">
                          <option value="">Warehouse</option>
                          <option value="billing">Billing</option>
                        </select>

                        <Input
                          placeholder="Location (auto-filled)"
                          className="flex-1 bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Contact
                      </label>
                      <select className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-800">
                        <option value="">BO ECKER - bo@waterfordnut.com - 209-874-2317</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Sales Confirmation No.
                      </label>
                      <Input placeholder="Enter sales confirmation number..." className="bg-white dark:bg-gray-800" />
                    </div>
                  </div>
                </div>

                {/* Buyer Section */}
                <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                  <h3 className="text-base font-bold text-green-900 mb-3">Buyer</h3>

                  <div className="space-y-3">
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Account <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <Input
                          ref={buyerCodeRef}
                          type="text"
                          value={buyerCodeSearch}
                          onChange={(e) => handleBuyerCodeChange(e.target.value)}
                          onFocus={() => setShowBuyerDropdown(true)}
                          placeholder="Code..."
                          className="flex-1 bg-white dark:bg-gray-800"
                        />

                        <Input
                          ref={buyerNameRef}
                          type="text"
                          value={buyerNameSearch}
                          onChange={(e) => handleBuyerNameChange(e.target.value)}
                          onFocus={() => setShowBuyerDropdown(true)}
                          placeholder="Account name..."
                          className="flex-[2] bg-white"
                        />
                      </div>

                      {/* Buyer Dropdown */}
                      {showBuyerDropdown && (buyerCodeSearch || buyerNameSearch) && (
                        <div
                          ref={buyerDropdownRef}
                          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 rounded-md shadow-lg max-h-60 overflow-auto"
                        >
                          {getFilteredBuyerAccounts().length > 0 ? (
                            getFilteredBuyerAccounts().map((account) => (
                              <div
                                key={account.id}
                                className="px-3 py-2 cursor-pointer hover:bg-green-100 border-b last:border-b-0"
                                onClick={() => handleSelectBuyer(account)}
                              >
                                <div className="flex gap-2">
                                  <span className="font-medium text-green-900">{account.code}</span>
                                  <span className="text-gray-700">-</span>
                                  <span className="text-gray-900 dark:text-gray-100">{account.name}</span>
                                </div>
                                {account.city && account.state && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {account.city}, {account.state}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-gray-500 text-sm">No accounts found</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Billing Address <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select className="w-32 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-800">
                          <option value="">Billing</option>
                          <option value="shipping">Shipping</option>
                        </select>

                        <Input
                          placeholder="Address (auto-filled)"
                          className="flex-1 bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Ship to Location <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select className="w-32 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-800">
                          <option value="">Billing</option>
                          <option value="warehouse">Warehouse</option>
                        </select>
                        <Input
                          placeholder="Location (auto-filled)"
                          className="flex-1 bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Contact
                      </label>
                      <select className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-800">
                        <option value="">noemail@email.com - (514) 381-9790</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Purchase Order No.
                      </label>
                      <Input placeholder="Enter purchase order number..." className="bg-white dark:bg-gray-800" />
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
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Product List</h3>
                  <Button type="button" onClick={addOrderLine} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-transparent">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Line</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Product / Variety</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Size / Grade</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Unit Size</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Total Weight</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
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
                                ref={(el) => { inputRefs.current[line.id] = el }}
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
                                className="w-full px-2 py-1 text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Type to search products..."
                              />
                              <div className="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                {line.variety || 'Variety (auto-filled)'}
                              </div>
                            </div>
                          </td>

                          {/* Size / Grade - Auto-filled from product */}
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <div className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                {line.size || 'Size (auto-filled)'}
                              </div>
                              <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
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
                              className="w-24 px-2 py-1 text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                                className="w-20 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded text-right focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                              <select
                                value={line.unitSizeUnit}
                                onChange={(e) => updateOrderLine(line.id, 'unitSizeUnit', e.target.value)}
                                className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="LBS">LBS</option>
                                <option value="KG">KG</option>
                                <option value="TON">TON</option>
                              </select>
                            </div>
                          </td>

                          {/* Total Weight - Calculated (Read-only styled) */}
                          <td className="px-4 py-4 align-middle">
                            <div className="px-4 py-2 text-sm font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-right">
                              {line.totalWeight > 0 ? `${line.totalWeight.toLocaleString()} ${line.unitSizeUnit}` : '—'}
                            </div>
                          </td>

                          {/* Unit Price - Editable */}
                          <td className="px-4 py-4 align-middle">
                            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={line.unitPrice || ''}
                                onChange={(e) => updateOrderLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-20 text-right text-sm text-gray-900 dark:text-gray-100 focus:outline-none"
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
                <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    {/* Commission Section */}
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Commission Rate:</label>
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          className="w-16 text-right text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none"
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
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 min-h-[80px]"
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
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 min-h-[80px]"
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
          className="fixed bg-white dark:bg-gray-900 border-2 border-blue-500 dark:border-blue-700 rounded-lg shadow-2xl max-h-[500px] overflow-y-auto"
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
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">{product.name}</div>
              <div className="text-sm text-gray-600">
                {product.variety} • {product.size} • {product.grade}
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      )}

      {/* Orders Table */}
      {!isLoading && (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <th className="w-12 px-2 sm:px-4 bg-gray-50 dark:bg-gray-800"></th>
                  <th className={`px-3 py-2 text-left border-r border-gray-200 dark:border-gray-700 ${hasColumnFilter('orderNo') ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <span>Order #</span>
                        {hasColumnFilter('orderNo') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearColumnFilter('orderNo')
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                            title="Clear filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <ColumnMenu column="orderNo" label="Order #" />
                    </div>
                  </th>
                  <th className={`px-3 py-2 text-left border-r border-gray-200 dark:border-gray-700 ${hasColumnFilter('date') ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        {hasColumnFilter('date') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearColumnFilter('date')
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                            title="Clear filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <ColumnMenu column="date" label="Date" />
                    </div>
                  </th>
                  <th className={`px-3 py-2 text-left border-r border-gray-200 dark:border-gray-700 ${hasColumnFilter('seller') ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <span>Seller</span>
                        {hasColumnFilter('seller') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearColumnFilter('seller')
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                            title="Clear filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <ColumnMenu column="seller" label="Seller" />
                    </div>
                  </th>
                  <th className={`px-3 py-2 text-left border-r border-gray-200 dark:border-gray-700 ${hasColumnFilter('buyer') ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <span>Buyer</span>
                        {hasColumnFilter('buyer') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearColumnFilter('buyer')
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                            title="Clear filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <ColumnMenu column="buyer" label="Buyer" />
                    </div>
                  </th>
                  <th className={`px-3 py-2 text-left border-r border-gray-200 dark:border-gray-700 ${hasColumnFilter('product') ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <span>Product</span>
                        {hasColumnFilter('product') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearColumnFilter('product')
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                            title="Clear filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <ColumnMenu column="product" label="Product" />
                    </div>
                  </th>
                  <th className={`px-3 py-2 text-left border-r border-gray-200 dark:border-gray-700 ${hasColumnFilter('agent') ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <span>Agent</span>
                        {hasColumnFilter('agent') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearColumnFilter('agent')
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                            title="Clear filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <ColumnMenu column="agent" label="Agent" />
                    </div>
                  </th>
                  <th className={`px-3 py-2 text-left border-r border-gray-200 dark:border-gray-700 ${hasColumnFilter('total') ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <span>Total</span>
                        {hasColumnFilter('total') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearColumnFilter('total')
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                            title="Clear filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <ColumnMenu column="total" label="Total" />
                    </div>
                  </th>
                  <th className={`px-3 py-2 text-left border-r border-gray-200 dark:border-gray-700 ${hasColumnFilter('commission') ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <span>Commission</span>
                        {hasColumnFilter('commission') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearColumnFilter('commission')
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                            title="Clear filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <ColumnMenu column="commission" label="Commission" />
                    </div>
                  </th>
                  <th className={`px-3 py-2 text-left border-r border-gray-200 dark:border-gray-700 ${hasColumnFilter('status') ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        {hasColumnFilter('status') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearColumnFilter('status')
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                            title="Clear filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <ColumnMenu column="status" label="Status" />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {groupByColumn.length > 0 && groupedOrders ? (
                  // Render grouped orders with nesting
                  (() => {
                    const renderNestedGroups = (groups: any[], level: number = 0): any => {
                      return groups.map((group) => {
                        const indentPx = level * 24
                        const bgColors = ['bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-orange-50']
                        const borderColors = ['border-blue-200', 'border-green-200', 'border-purple-200', 'border-orange-200']
                        const textColors = ['text-blue-900', 'text-green-900', 'text-purple-900', 'text-orange-900']
                        const chevronColors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600']

                        const bgColor = bgColors[level % bgColors.length]
                        const borderColor = borderColors[level % borderColors.length]
                        const textColor = textColors[level % textColors.length]
                        const chevronColor = chevronColors[level % chevronColors.length]

                        const isExpanded = expandedGroups.has(group.key)
                        const totalOrders = group.orders.length
                        const totalAmount = group.orders.reduce((sum: number, order: Order) => sum + (order.total || 0), 0)
                        const totalCommission = group.orders.reduce((sum: number, order: Order) => sum + (order.commissionTotal || 0), 0)

                        return (
                          <React.Fragment key={group.key}>
                            {/* Group Header Row */}
                            <tr className={`${bgColor} border-b ${borderColor}`}>
                              <td colSpan={12} className="py-3" style={{ paddingLeft: `${16 + indentPx}px` }}>
                                <button
                                  onClick={() => toggleGroupExpansion(group.key)}
                                  className="flex items-center gap-2 w-full text-left"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className={`h-4 w-4 ${chevronColor}`} />
                                  ) : (
                                    <ChevronRight className={`h-4 w-4 ${chevronColor}`} />
                                  )}
                                  <span className={`text-sm font-semibold ${textColor} capitalize`}>
                                    {group.column}: {group.displayKey}
                                  </span>
                                  <span className="text-xs text-gray-600 ml-2">
                                    ({totalOrders} {totalOrders === 1 ? 'order' : 'orders'})
                                  </span>
                                  <span className="text-xs text-gray-600 ml-auto mr-4">
                                    Total: ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    {' '} | Commission: ${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </button>
                              </td>
                            </tr>
                            {/* Group Content */}
                            {isExpanded && (
                              <>
                                {group.children ? (
                                  // Render nested sub-groups
                                  renderNestedGroups(group.children, level + 1)
                                ) : (
                                  // Render orders at leaf level
                                  <>
                                    {group.orders.map((order: Order) => renderOrderRow(order))}
                                    {/* Group Subtotal Row */}
                                    <tr className={`${bgColor}/50 border-t-2 ${borderColor}`}>
                                      <td colSpan={8} className="py-2" style={{ paddingLeft: `${16 + indentPx}px`, textAlign: 'right' }}>
                                        <span className={`text-xs font-semibold ${textColor}`}>
                                          Subtotal ({totalOrders} {totalOrders === 1 ? 'order' : 'orders'}):
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-xs font-bold text-green-600 text-right">
                                        ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-3 py-2 text-xs font-bold text-orange-600 text-right">
                                        ${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td colSpan={2}></td>
                                    </tr>
                                  </>
                                )}
                              </>
                            )}
                          </React.Fragment>
                        )
                      })
                    }

                    return renderNestedGroups(groupedOrders)
                  })()
                ) : (
                  // Render ungrouped orders
                  filteredOrders.map((order) => renderOrderRow(order))
                )}
              </tbody>
              {/* Aggregation Footer */}
              {filteredOrders.length > 0 && (
                <tfoot className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <td colSpan={12} className="px-4 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-6">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            Total Orders: <span className="text-blue-600">{aggregations.totalOrders}</span>
                          </span>
                          <span className="text-gray-700">
                            Total Amount: <span className="text-green-600 font-medium">${aggregations.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </span>
                          <span className="text-gray-700">
                            Total Commission: <span className="text-orange-600 font-medium">${aggregations.totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </span>
                        </div>
                        {groupByColumn.length > 0 && (
                          <span className="text-gray-600 text-xs italic">
                            Grouped by: {groupByColumn.map(col => col.charAt(0).toUpperCase() + col.slice(1)).join(' > ')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || hasActiveColumnFilters
                  ? 'Try adjusting your search query or filters'
                  : 'Get started by creating a new order'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  )
}
