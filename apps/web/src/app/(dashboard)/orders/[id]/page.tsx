'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import {
  Plus,
  ArrowLeft,
  Save,
  Trash2,
  Clock,
  User,
  Upload,
  RefreshCw,
  ExternalLink,
  FileText,
  Download,
  Paperclip,
  StickyNote,
} from 'lucide-react'
import { OrderModals } from './OrderModals'

interface ProductVariant {
  id: string
  productId: string
  sku?: string
  size: string
  sizeUnit: string
  packageType: string
  isDefault: boolean
  active: boolean
}

interface OrderLine {
  id: string
  productId: string
  productName: string
  variantId: string
  variantLabel: string
  variantSize: number // e.g., 15 for "15 lb box"
  packageType?: string // e.g., "case", "box", "bag"
  quantity: number
  pricePerUnit: number // price per lb
  commissionPercent: number
  memo?: string
}

interface Product {
  id: string
  code?: string
  name: string
  variety?: string
  category?: string
  source?: string
  variants?: ProductVariant[]
}

interface Address {
  id: string
  type: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isPrimary: boolean
}

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  isPrimary: boolean
}

interface Account {
  id: string
  code?: string
  name: string
  city?: string
  state?: string
  addresses?: Address[]
  contacts?: Contact[]
}

interface Activity {
  id: string
  activityType: string
  description: string
  userName?: string
  createdAt: string
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const { getToken } = useAuth()
  const { showToast } = useToast()

  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [orderNo, setOrderNo] = useState('')
  const [orderStatus, setOrderStatus] = useState('draft')

  // QuickBooks state
  const [qboDocId, setQboDocId] = useState<string | null>(null)
  const [qboDocNumber, setQboDocNumber] = useState<string | null>(null)
  const [isPostingToQB, setIsPostingToQB] = useState(false)
  const [isUpdatingQB, setIsUpdatingQB] = useState(false)
  const [isGeneratingSellerPDF, setIsGeneratingSellerPDF] = useState(false)
  const [isGeneratingBuyerPDF, setIsGeneratingBuyerPDF] = useState(false)

  // Order state
  const [orderLines, setOrderLines] = useState<OrderLine[]>([{
    id: 'initial-line',
    productId: '',
    productName: '',
    variantId: '',
    variantLabel: '',
    variantSize: 1,
    quantity: 0,
    pricePerUnit: 0,
    commissionPercent: 0,
    memo: '',
  }])
  const [commissionRate, setCommissionRate] = useState(0)
  const [numPallets, setNumPallets] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [contractNo, setContractNo] = useState('')
  const [conditions, setConditions] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [termsOptions, setTermsOptions] = useState<Array<{ id: string; name: string }>>([])
  const [otherRemarks, setOtherRemarks] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'notes' | 'attachments' | 'activity'>('notes')
  const [attachments, setAttachments] = useState<any[]>([])
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [activeLineId, setActiveLineId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<{ [lineId: string]: string }>({})

  // Account selection state
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedSeller, setSelectedSeller] = useState<Account | null>(null)
  const [selectedBuyer, setSelectedBuyer] = useState<Account | null>(null)
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

  // Selected addresses and contacts (NEW: Multiple addresses per account)
  const [selectedSellerBillingAddress, setSelectedSellerBillingAddress] = useState<Address | null>(null)
  const [selectedSellerPickupAddress, setSelectedSellerPickupAddress] = useState<Address | null>(null)
  const [selectedBuyerBillingAddress, setSelectedBuyerBillingAddress] = useState<Address | null>(null)
  const [selectedBuyerShippingAddress, setSelectedBuyerShippingAddress] = useState<Address | null>(null)
  const [selectedSellerContact, setSelectedSellerContact] = useState<Contact | null>(null)
  const [selectedBuyerContact, setSelectedBuyerContact] = useState<Contact | null>(null)

  // Will Pick Up checkbox state
  const [isPickup, setIsPickup] = useState(false)

  // Agent and Broker state
  const [agents, setAgents] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [brokers, setBrokers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string } | null>(null)
  const [selectedBroker, setSelectedBroker] = useState<{ id: string; name: string } | null>(null)

  // Activities state
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)

  // Modal states
  const [showAddAddressModal, setShowAddAddressModal] = useState(false)
  const [showAddContactModal, setShowAddContactModal] = useState(false)
  const [modalAccountType, setModalAccountType] = useState<'seller' | 'buyer'>('seller')
  const [showAddAgentModal, setShowAddAgentModal] = useState(false)
  const [showAddBrokerModal, setShowAddBrokerModal] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showAddVariantModal, setShowAddVariantModal] = useState(false)
  const [productModalLineId, setProductModalLineId] = useState<string | null>(null)
  const [variantModalLineId, setVariantModalLineId] = useState<string | null>(null)

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    variety: '',
    grade: '',
    category: '',
  })

  // New variant form state
  const [newVariant, setNewVariant] = useState({
    size: '',
    sizeUnit: 'lb',
    packageType: 'bag',
  })

  // New address form state
  const [newAddress, setNewAddress] = useState({
    type: 'billing',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    isPrimary: false,
  })

  // New contact form state
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    isPrimary: false,
  })

  // New agent/broker form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
  })

  // Fetch ONLY the order on mount - everything else lazy loads
  useEffect(() => {
    const initializeData = async () => {
      // Fetch only the order (includes seller, buyer, agent, broker, lines via JOIN)
      await fetchOrder()
      // Fetch activities and attachments in background (non-blocking)
      fetchActivities()
      fetchAttachments()
      // Fetch terms options
      fetchTermsOptions()
      // Fetch agents and brokers for dropdowns
      fetchAgentsAndBrokers()
    }
    initializeData()
  }, [orderId])

  // Lazy load accounts when user interacts with seller/buyer fields
  useEffect(() => {
    if ((sellerCodeSearch || sellerNameSearch || buyerCodeSearch || buyerNameSearch) && accounts.length === 0) {
      fetchAccounts()
    }
  }, [sellerCodeSearch, sellerNameSearch, buyerCodeSearch, buyerNameSearch])

  // Lazy load products when user adds a line or focuses on product field
  useEffect(() => {
    if (orderLines.length > 0 && products.length === 0) {
      fetchProducts()
    }
  }, [orderLines.length])

  // DISABLED: Memo generation now happens on the backend
  // Auto-generate memos when line data changes
  // useEffect(() => {
  //   if (products.length === 0) return // Wait for products to load

  //   setOrderLines(prevLines =>
  //     prevLines.map(line => {
  //       // Only auto-generate if memo is empty or hasn't been manually edited
  //       const newMemo = generateMemo(line)
  //       if (!line.memo || line.memo === '') {
  //         return { ...line, memo: newMemo }
  //       }
  //       return line
  //     })
  //   )
  // }, [orderLines.map(l => `${l.productId}-${l.variantId}-${l.quantity}-${l.pricePerUnit}`).join(','), isPickup, products.length])

  const fetchAccounts = async () => {
    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts?limit=200`, {
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
      return data
    } catch (err) {
      console.error('Fetch accounts error:', err)
      return []
    }
  }

  const fetchProducts = async () => {
    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products?includeInactive=false&limit=500`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      // Filter out QuickBooks imports - only show manually uploaded products
      const manualProducts = data.filter((p: Product) => p.source !== 'quickbooks_import')
      setProducts(manualProducts)
      return manualProducts
    } catch (err) {
      console.error('Fetch products error:', err)
      return []
    }
  }

  const fetchAgentsAndBrokers = async () => {
    try {
      const token = await getToken()
      console.log('[EDIT PAGE] Token exists:', !!token)

      if (!token) {
        console.error('[EDIT PAGE] NO TOKEN - User may not be authenticated')
        return { agents: [], brokers: [] }
      }

      // Fetch agents
      const agentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'}/api/agents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      console.log('[EDIT PAGE] Agents response:', agentsResponse.status)
      let agentsData: Array<{ id: string; name: string; email: string }> = []
      if (agentsResponse.ok) {
        agentsData = await agentsResponse.json()
        console.log('[EDIT PAGE] Agents:', agentsData)
        setAgents(agentsData)
      } else {
        console.error('[EDIT PAGE] Agents error:', await agentsResponse.text())
      }

      // Fetch brokers
      const brokersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'}/api/brokers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      console.log('[EDIT PAGE] Brokers response:', brokersResponse.status)
      let brokersData: Array<{ id: string; name: string; email: string }> = []
      if (brokersResponse.ok) {
        brokersData = await brokersResponse.json()
        console.log('[EDIT PAGE] Brokers:', brokersData)
        setBrokers(brokersData)
      } else {
        console.error('[EDIT PAGE] Brokers error:', await brokersResponse.text())
      }

      return { agents: agentsData, brokers: brokersData }
    } catch (err) {
      console.error('[EDIT PAGE] Error:', err)
      return { agents: [], brokers: [] }
    }
  }

  const fetchTermsOptions = async () => {
    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'}/api/terms-options`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setTermsOptions(data.filter((term: any) => term.isActive))
      } else {
        console.error('Failed to fetch terms options:', await response.text())
      }
    } catch (err) {
      console.error('Fetch terms options error:', err)
    }
  }

  const fetchOrder = async () => {
    try {
      setIsLoading(true)
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }

      const orderData = await response.json()

      // Set order metadata
      setOrderNo(orderData.orderNo || '')
      setOrderStatus(orderData.status || 'draft')
      setIsPickup(orderData.isPickup || false)
      setNumPallets(orderData.palletCount?.toString() || '')
      setPoNumber(orderData.poNumber || '')
      setContractNo(orderData.contractNo || '')
      setPaymentTerms(orderData.terms || '')

      // Set QuickBooks data
      setQboDocId(orderData.qboDocId || null)
      setQboDocNumber(orderData.qboDocNumber || null)

      // Parse notes for conditions and remarks
      const orderNotes = orderData.notes || ''
      setNotes(orderNotes)
      const notesParts = orderNotes.split('\n')
      if (notesParts.length > 1) {
        setConditions(notesParts[0] || '')
        setOtherRemarks(notesParts.slice(1).join('\n') || '')
      } else {
        setConditions(orderNotes)
        setOtherRemarks('')
      }

      // Load seller account from JOIN data (already included in orderData)
      if (orderData.seller) {
        const sellerData = orderData.seller
        setSelectedSeller(sellerData)
        setSellerCodeSearch(sellerData.code || '')
        setSellerNameSearch(sellerData.name || '')

        // Set seller addresses - use saved address or auto-select first available
        if (orderData.sellerBillingAddressId) {
          const billingAddr = sellerData.addresses?.find((a: Address) => a.id === orderData.sellerBillingAddressId)
          setSelectedSellerBillingAddress(billingAddr || null)
        } else if (sellerData.addresses?.length > 0) {
          setSelectedSellerBillingAddress(sellerData.addresses[0])
        }

        if (orderData.sellerPickupAddressId) {
          const pickupAddr = sellerData.addresses?.find((a: Address) => a.id === orderData.sellerPickupAddressId)
          setSelectedSellerPickupAddress(pickupAddr || null)
        } else if (sellerData.addresses?.length > 0) {
          setSelectedSellerPickupAddress(sellerData.addresses[0])
        }

        // Set seller contact if available - auto-select first if none saved
        if (orderData.sellerContactId) {
          const contact = sellerData.contacts?.find((c: Contact) => c.id === orderData.sellerContactId)
          setSelectedSellerContact(contact || null)
        } else if (sellerData.contacts?.length > 0) {
          setSelectedSellerContact(sellerData.contacts[0])
        }
      }

      // Load buyer account from JOIN data (already included in orderData)
      if (orderData.buyer) {
        const buyerData = orderData.buyer
        setSelectedBuyer(buyerData)
        setBuyerCodeSearch(buyerData.code || '')
        setBuyerNameSearch(buyerData.name || '')

        // Set buyer addresses - use saved address or auto-select first available
        if (orderData.buyerBillingAddressId) {
          const billingAddr = buyerData.addresses?.find((a: Address) => a.id === orderData.buyerBillingAddressId)
          setSelectedBuyerBillingAddress(billingAddr || null)
        } else if (buyerData.addresses?.length > 0) {
          setSelectedBuyerBillingAddress(buyerData.addresses[0])
        }

        if (orderData.buyerShippingAddressId) {
          const shippingAddr = buyerData.addresses?.find((a: Address) => a.id === orderData.buyerShippingAddressId)
          setSelectedBuyerShippingAddress(shippingAddr || null)
        } else if (buyerData.addresses?.length > 0) {
          setSelectedBuyerShippingAddress(buyerData.addresses[0])
        }

        // Set buyer contact if available - auto-select first if none saved
        if (orderData.buyerContactId) {
          const contact = buyerData.contacts?.find((c: Contact) => c.id === orderData.buyerContactId)
          setSelectedBuyerContact(contact || null)
        } else if (buyerData.contacts?.length > 0) {
          setSelectedBuyerContact(buyerData.contacts[0])
        }
      }

      // Set agent
      if (orderData.agent) {
        setSelectedAgent({
          id: orderData.agent.id,
          name: orderData.agent.name || '',
        })
      }

      // Set broker
      if (orderData.broker) {
        setSelectedBroker({
          id: orderData.broker.id,
          name: orderData.broker.name || '',
        })
      }

      // Load order lines - use product data already included in API response
      if (orderData.lines && orderData.lines.length > 0) {
        const loadedLines: OrderLine[] = orderData.lines.map((line: any) => {
          // Use product data from API response (already included via join)
          const productName = line.product?.name || line.productCode || ''
          const variantSize = line.unitSize || 1

          // Build variant label from line data
          let variantLabel = ''
          if (line.unitSize && line.uom) {
            variantLabel = `${line.unitSize} ${line.uom}`
          }

          return {
            id: line.id || String(Date.now() + Math.random()),
            productId: line.productId || '',
            productName: productName,
            variantId: line.variantId || '',
            variantLabel: variantLabel,
            variantSize: variantSize,
            quantity: line.quantity || 0,
            pricePerUnit: parseFloat(line.unitPrice) || 0,
            // commissionPct is stored as 0-100 in the database (2 for 2%)
            commissionPercent: line.commissionPct ? parseFloat(line.commissionPct) : 0,
            memo: line.memo || '',
          }
        })
        setOrderLines(loadedLines)
      }

    } catch (err) {
      console.error('Fetch order error:', err)
      showToast('Failed to load order', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      setIsLoadingActivities(true)
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/activities?limit=50`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || data || [])
      }
    } catch (err) {
      console.error('Fetch activities error:', err)
    } finally {
      setIsLoadingActivities(false)
    }
  }

  const fetchAttachments = async () => {
    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/attachments`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAttachments(data || [])
      }
    } catch (err) {
      console.error('Fetch attachments error:', err)
    }
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

  const handleSelectSeller = async (account: Account) => {
    // Fetch full account details with addresses and contacts
    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/${account.id}`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch account details')
      }

      const fullAccount = await response.json()
      setSelectedSeller(fullAccount)
      setSellerCodeSearch(fullAccount.code || '')
      setSellerNameSearch(fullAccount.name || '')
      setShowSellerDropdown(false)

      // Auto-select primary address and contact if available
      const primaryAddress = fullAccount.addresses?.find((addr: Address) => addr.isPrimary)
      const primaryContact = fullAccount.contacts?.find((contact: Contact) => contact.isPrimary)

      if (primaryAddress) {
        setSelectedSellerBillingAddress(primaryAddress)
        setSelectedSellerPickupAddress(primaryAddress)
      }
      if (primaryContact) setSelectedSellerContact(primaryContact)
    } catch (err) {
      console.error('Error fetching seller details:', err)
      showToast('Failed to load seller details', 'error')
    }
  }

  const handleSelectBuyer = async (account: Account) => {
    // Fetch full account details with addresses and contacts
    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/${account.id}`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch account details')
      }

      const fullAccount = await response.json()
      setSelectedBuyer(fullAccount)
      setBuyerCodeSearch(fullAccount.code || '')
      setBuyerNameSearch(fullAccount.name || '')
      setShowBuyerDropdown(false)

      // Auto-select primary address and contact if available
      const primaryAddress = fullAccount.addresses?.find((addr: Address) => addr.isPrimary)
      const primaryContact = fullAccount.contacts?.find((contact: Contact) => contact.isPrimary)

      if (primaryAddress) {
        setSelectedBuyerBillingAddress(primaryAddress)
        setSelectedBuyerShippingAddress(primaryAddress)
      }
      if (primaryContact) setSelectedBuyerContact(primaryContact)
    } catch (err) {
      console.error('Error fetching buyer details:', err)
      showToast('Failed to load buyer details', 'error')
    }
  }

  const handleSellerCodeChange = (value: string) => {
    setSellerCodeSearch(value)
    setShowSellerDropdown(true)
    if (selectedSeller && value !== selectedSeller.code) {
      setSelectedSeller(null)
      setSellerNameSearch('')
    }
  }

  const handleSellerNameChange = (value: string) => {
    setSellerNameSearch(value)
    setShowSellerDropdown(true)
    if (selectedSeller && value !== selectedSeller.name) {
      setSelectedSeller(null)
      setSellerCodeSearch('')
    }
  }

  const handleBuyerCodeChange = (value: string) => {
    setBuyerCodeSearch(value)
    setShowBuyerDropdown(true)
    if (selectedBuyer && value !== selectedBuyer.code) {
      setSelectedBuyer(null)
      setBuyerNameSearch('')
    }
  }

  const handleBuyerNameChange = (value: string) => {
    setBuyerNameSearch(value)
    setShowBuyerDropdown(true)
    if (selectedBuyer && value !== selectedBuyer.name) {
      setSelectedBuyer(null)
      setBuyerCodeSearch('')
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

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
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showSellerDropdown, showBuyerDropdown])

  // Filter products based on search
  const getFilteredProducts = (lineId: string) => {
    const query = searchQuery[lineId]
    if (!query || query.trim() === '') return []
    return products.filter((product) => {
      const searchText = `${product.code || ''} ${product.name} ${product.variety || ''} ${product.category || ''}`.toLowerCase()
      return searchText.includes(query.toLowerCase())
    }).slice(0, 10)
  }

  // Order line management
  const addOrderLine = () => {
    const newLine: OrderLine = {
      id: String(Date.now()),
      productId: '',
      productName: '',
      variantId: '',
      variantLabel: '',
      variantSize: 1,
      quantity: 0,
      pricePerUnit: 0,
      commissionPercent: 0,
      memo: '',
    }
    setOrderLines([...orderLines, newLine])
  }

  // Update order line field
  const updateOrderLine = (lineId: string, field: keyof OrderLine, value: string | number) => {
    setOrderLines(orderLines.map(line =>
      line.id === lineId ? { ...line, [field]: value } : line
    ))
  }

  // Calculate line total (qty * variant size * price per lb)
  const getLineTotal = (line: OrderLine) => {
    return line.quantity * line.variantSize * line.pricePerUnit
  }

  // Calculate grand total
  const getGrandTotal = () => {
    return orderLines.reduce((sum, line) => sum + getLineTotal(line), 0)
  }

  // Calculate total commission (total * commission %)
  const getTotalCommission = () => {
    const total = getGrandTotal()
    const commissionPct = orderLines[0]?.commissionPercent || 0
    return total * (commissionPct / 100)
  }

  // Calculate line commission (for display - proportional share)
  const getLineCommission = (line: OrderLine) => {
    const lineTotal = getLineTotal(line)
    return lineTotal * (line.commissionPercent / 100)
  }

  const removeOrderLine = (id: string) => {
    if (orderLines.length > 1) {
      setOrderLines(orderLines.filter((line) => line.id !== id))
    }
  }

  // Generate memo for order line
  const generateMemo = (line: OrderLine): string => {
    if (!line.productId || !line.quantity) return ''

    const product = products.find(p => p.id === line.productId)
    if (!product) return ''

    const variant = product.variants?.find(v => v.id === line.variantId)
    if (!variant) return ''

    // Format: {quantity} {packageType} {productName} {variety} {size}{unit} ${price}/{unit} {pickup/delivery}
    const parts = []

    // Quantity and package type
    if (line.quantity) parts.push(`${line.quantity} ${variant.packageType}${line.quantity > 1 ? 's' : ''}`)

    // Product name
    if (product.name) parts.push(product.name.toLowerCase())

    // Variety (if available)
    if (product.variety) parts.push(product.variety.toLowerCase())

    // Size and unit
    if (variant.size && variant.sizeUnit) parts.push(`${variant.size}${variant.sizeUnit}`)

    // Price per unit
    if (line.pricePerUnit) parts.push(`$${line.pricePerUnit.toFixed(2)}/${variant.sizeUnit}`)

    // Pickup or delivery
    parts.push(isPickup ? 'pick up' : 'delivery')

    return parts.join(' ')
  }

  const handleSelectProduct = (lineId: string, product: Product) => {
    // Find default variant or first active variant
    const defaultVariant = product.variants?.find(v => v.isDefault && v.active)
      || product.variants?.find(v => v.active)

    const variantLabel = defaultVariant
      ? `${defaultVariant.size} ${defaultVariant.sizeUnit} ${defaultVariant.packageType}`
      : ''

    setOrderLines(orderLines.map(line =>
      line.id === lineId
        ? {
            ...line,
            productId: product.id,
            productName: product.name,
            variantId: defaultVariant?.id || '',
            variantLabel: variantLabel,
            variantSize: defaultVariant ? parseFloat(defaultVariant.size) : 1,
            packageType: defaultVariant?.packageType,
          }
        : line
    ))
    setSearchQuery({ ...searchQuery, [lineId]: '' })
    setActiveLineId(null)
  }

  // Handle variant selection
  const handleSelectVariant = (lineId: string, variant: ProductVariant) => {
    const variantLabel = `${variant.size} ${variant.sizeUnit} ${variant.packageType}`
    setOrderLines(orderLines.map(line =>
      line.id === lineId
        ? {
            ...line,
            variantId: variant.id,
            variantLabel: variantLabel,
            variantSize: parseFloat(variant.size),
            packageType: variant.packageType,
          }
        : line
    ))
  }

  // Get variants for a product
  const getProductVariants = (productId: string): ProductVariant[] => {
    const product = products.find(p => p.id === productId)
    return product?.variants?.filter(v => v.active) || []
  }

  // Handle add new product
  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) {
      showToast('Product name is required', 'error')
      return
    }

    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: newProduct.name,
          variety: newProduct.variety || null,
          grade: newProduct.grade || null,
          category: newProduct.category || null,
          active: true,
          source: 'manual',
        }),
      })

      if (!response.ok) throw new Error('Failed to create product')

      const createdProduct = await response.json()

      // Add to products list
      setProducts([...products, createdProduct])

      // Select it for the current line
      if (productModalLineId) {
        handleSelectProduct(productModalLineId, createdProduct)
      }

      // Reset form
      setNewProduct({ name: '', variety: '', grade: '', category: '' })
      setShowAddProductModal(false)
      setProductModalLineId(null)
      showToast('Product created successfully', 'success')
    } catch (err) {
      console.error('Create product error:', err)
      showToast('Failed to create product', 'error')
    }
  }

  // Handle add new variant
  const handleAddVariant = async () => {
    if (!newVariant.size || !variantModalLineId) {
      showToast('Size is required', 'error')
      return
    }

    const line = orderLines.find(l => l.id === variantModalLineId)
    if (!line || !line.productId) {
      showToast('Please select a product first', 'error')
      return
    }

    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${line.productId}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          size: parseFloat(newVariant.size),
          sizeUnit: newVariant.sizeUnit,
          packageType: newVariant.packageType,
          isDefault: false,
          active: true,
        }),
      })

      if (!response.ok) throw new Error('Failed to create variant')

      const createdVariant = await response.json()

      // Update products list with new variant
      setProducts(products.map(p =>
        p.id === line.productId
          ? { ...p, variants: [...(p.variants || []), createdVariant] }
          : p
      ))

      // Select the new variant for the current line
      handleSelectVariant(variantModalLineId, createdVariant)

      // Reset form
      setNewVariant({ size: '', sizeUnit: 'lb', packageType: 'bag' })
      setShowAddVariantModal(false)
      setVariantModalLineId(null)
      showToast('Variant created successfully', 'success')
    } catch (err) {
      console.error('Create variant error:', err)
      showToast('Failed to create variant', 'error')
    }
  }

  // Handle add new address
  const handleAddAddress = async () => {
    const targetAccount = modalAccountType === 'seller' ? selectedSeller : selectedBuyer

    if (!targetAccount) {
      showToast('Please select an account first', 'info')
      return
    }

    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/${targetAccount.id}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(newAddress),
      })

      if (!response.ok) {
        throw new Error('Failed to create address')
      }

      const createdAddress = await response.json()

      // Update the selected account with the new address
      if (modalAccountType === 'seller' && selectedSeller) {
        const updatedSeller = {
          ...selectedSeller,
          addresses: [...(selectedSeller.addresses || []), createdAddress],
        }
        setSelectedSeller(updatedSeller)
        // Set the appropriate address based on type
        if (createdAddress.type === 'billing') {
          setSelectedSellerBillingAddress(createdAddress)
        } else if (createdAddress.type === 'pickup') {
          setSelectedSellerPickupAddress(createdAddress)
        }
      } else if (modalAccountType === 'buyer' && selectedBuyer) {
        const updatedBuyer = {
          ...selectedBuyer,
          addresses: [...(selectedBuyer.addresses || []), createdAddress],
        }
        setSelectedBuyer(updatedBuyer)
        // Set the appropriate address based on type
        if (createdAddress.type === 'billing') {
          setSelectedBuyerBillingAddress(createdAddress)
        } else if (createdAddress.type === 'shipping') {
          setSelectedBuyerShippingAddress(createdAddress)
        }
      }

      // Reset form and close modal
      setNewAddress({
        type: 'billing',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
        isPrimary: false,
      })
      setShowAddAddressModal(false)
      showToast('Address added successfully', 'success')
    } catch (err: any) {
      console.error('Error adding address:', err)
      showToast(`Failed to add address: ${err.message}`, 'error')
    }
  }

  // Handle add new contact
  const handleAddContact = async () => {
    const targetAccount = modalAccountType === 'seller' ? selectedSeller : selectedBuyer

    if (!targetAccount) {
      showToast('Please select an account first', 'info')
      return
    }

    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/${targetAccount.id}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(newContact),
      })

      if (!response.ok) {
        throw new Error('Failed to create contact')
      }

      const createdContact = await response.json()

      // Update the selected account with the new contact
      if (modalAccountType === 'seller' && selectedSeller) {
        const updatedSeller = {
          ...selectedSeller,
          contacts: [...(selectedSeller.contacts || []), createdContact],
        }
        setSelectedSeller(updatedSeller)
        setSelectedSellerContact(createdContact)
      } else if (modalAccountType === 'buyer' && selectedBuyer) {
        const updatedBuyer = {
          ...selectedBuyer,
          contacts: [...(selectedBuyer.contacts || []), createdContact],
        }
        setSelectedBuyer(updatedBuyer)
        setSelectedBuyerContact(createdContact)
      }

      // Reset form and close modal
      setNewContact({
        name: '',
        email: '',
        phone: '',
        isPrimary: false,
      })
      setShowAddContactModal(false)
      showToast('Contact added successfully', 'success')
    } catch (err: any) {
      console.error('Error adding contact:', err)
      showToast(`Failed to add contact: ${err.message}`, 'error')
    }
  }

  // Handle add new agent
  const handleAddAgent = async () => {
    if (!newUser.name) {
      showToast('Please fill in agent name', 'info')
      return
    }

    if (!selectedSeller) {
      showToast('Please select a seller first to associate the agent', 'info')
      return
    }

    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          accountId: selectedSeller.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to create agent')

      const createdAgent = await response.json()

      const newAgent = {
        id: createdAgent.id,
        name: createdAgent.name,
        email: createdAgent.email,
      }
      setAgents([...agents, newAgent])
      setSelectedAgent({ id: newAgent.id, name: newAgent.name })

      setNewUser({ name: '', email: '', phone: '' })
      setShowAddAgentModal(false)
      showToast(`Agent added and associated with ${selectedSeller.name}`, 'success')
    } catch (err: any) {
      showToast(`Failed to add agent: ${err.message}`, 'error')
    }
  }

  // Handle add new broker
  const handleAddBroker = async () => {
    if (!newUser.name) {
      showToast('Please fill in broker name', 'info')
      return
    }

    if (!selectedSeller) {
      showToast('Please select a seller first to associate the broker', 'info')
      return
    }

    try {
      const token = await getToken()
      // Create broker in database
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/brokers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          accountId: selectedSeller.id, // Associate with seller
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create broker')
      }

      const createdBroker = await response.json()

      // Add to brokers list for immediate use
      const newBroker = {
        id: createdBroker.id,
        name: createdBroker.name,
        email: createdBroker.email,
      }
      setBrokers([...brokers, newBroker])
      setSelectedBroker({ id: newBroker.id, name: newBroker.name })

      // Reset form and close modal
      setNewUser({
        name: '',
        email: '',
        phone: '',
      })
      setShowAddBrokerModal(false)
      showToast(`Broker added and associated with ${selectedSeller.name}`, 'success')
    } catch (err: any) {
      console.error('Error adding broker:', err)
      showToast(`Failed to add broker: ${err.message}`, 'error')
    }
  }

  // Update order
  const handleSave = async () => {
    if (!selectedSeller || !selectedBuyer) {
      showToast('Please select both seller and buyer', 'info')
      return
    }

    setIsSaving(true)

    try {
      const orderData = {
        sellerId: selectedSeller.id,
        buyerId: selectedBuyer.id,
        sellerBillingAddressId: selectedSellerBillingAddress?.id,
        sellerPickupAddressId: selectedSellerPickupAddress?.id,
        buyerBillingAddressId: selectedBuyerBillingAddress?.id,
        buyerShippingAddressId: selectedBuyerShippingAddress?.id,
        isPickup,
        agentId: selectedAgent?.id,
        brokerId: selectedBroker?.id,
        poNumber: poNumber || undefined,
        contractNo: contractNo || undefined,
        palletCount: numPallets ? parseInt(numPallets) : undefined,
        terms: paymentTerms,
        notes: notes,
        lines: orderLines
          .filter(line => line.productId && line.quantity > 0)
          .map(line => ({
            productId: line.productId,
            variantId: line.variantId || undefined,
            packageType: line.packageType || undefined,
            quantity: line.quantity,
            unitSize: line.variantSize || 1,
            uom: 'lb', // Default to lb for now
            totalWeight: line.quantity * (line.variantSize || 1),
            unitPrice: line.pricePerUnit,
            commissionPct: line.commissionPercent, // API expects 0-100 (2 for 2%)
            // memo: Backend will auto-generate this
          })),
      }

      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}`, {
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
        console.error('Save failed:', errorData)
        throw new Error(errorData.error || 'Failed to update order')
      }

      const savedOrder = await response.json()
      showToast('Order updated successfully', 'success')
      // Refresh activities after update
      fetchActivities()
    } catch (err: any) {
      console.error('Save order error:', err)
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Post order to QuickBooks as invoice
  const handlePostToQB = async () => {
    if (!selectedSeller || !selectedBuyer) {
      showToast('Please select both seller and buyer before posting to QuickBooks', 'info')
      return
    }

    setIsPostingToQB(true)

    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/quickbooks/sync/order/${orderId}`, {
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
        throw new Error(errorData.error || 'Failed to post to QuickBooks')
      }

      const result = await response.json()

      // Update local state with QB data
      setQboDocId(result.qboDocId)
      setQboDocNumber(result.qboDocNumber)
      setOrderStatus('posted_to_qb')

      showToast(`Invoice #${result.qboDocNumber} created in QuickBooks`, 'success')

      // Refresh activities
      fetchActivities()
    } catch (err: any) {
      console.error('Post to QB error:', err)
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setIsPostingToQB(false)
    }
  }

  // Update existing invoice in QuickBooks
  const handleUpdateQB = async () => {
    if (!qboDocId) {
      showToast('Order has not been posted to QuickBooks yet', 'info')
      return
    }

    setIsUpdatingQB(true)

    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/quickbooks/sync/order/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update QuickBooks invoice')
      }

      showToast('QuickBooks invoice updated successfully', 'success')

      // Refresh activities
      fetchActivities()
    } catch (err: any) {
      console.error('Update QB error:', err)
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setIsUpdatingQB(false)
    }
  }

  // PDF generation handlers
  const handleGenerateSellerPDF = async () => {
    try {
      setIsGeneratingSellerPDF(true)
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'}/api/pdf/invoice/${orderId}/seller`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to generate seller invoice PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-seller-${orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showToast('Seller invoice PDF generated successfully', 'success')
    } catch (error) {
      console.error('Error generating seller PDF:', error)
      showToast('Failed to generate seller invoice PDF', 'error')
    } finally {
      setIsGeneratingSellerPDF(false)
    }
  }

  const handleGenerateBuyerPDF = async () => {
    try {
      setIsGeneratingBuyerPDF(true)
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'}/api/pdf/invoice/${orderId}/buyer`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to generate buyer invoice PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-buyer-${orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showToast('Buyer invoice PDF generated successfully', 'success')
    } catch (error) {
      console.error('Error generating buyer PDF:', error)
      showToast('Failed to generate buyer invoice PDF', 'error')
    } finally {
      setIsGeneratingBuyerPDF(false)
    }
  }

  // Attachment handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingAttachment(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/attachments`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || 'Failed to upload file')
      }

      showToast('File uploaded successfully', 'success')
      await fetchAttachments()
      // Reset the file input
      event.target.value = ''
    } catch (error: any) {
      console.error('File upload error:', error)
      setUploadError(error.message)
      showToast(`Error: ${error.message}`, 'error')
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return
    }

    try {
      const token = await getToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Delete failed' }))
        throw new Error(errorData.error || 'Failed to delete attachment')
      }

      showToast('Attachment deleted successfully', 'success')
      await fetchAttachments()
    } catch (error: any) {
      console.error('Delete attachment error:', error)
      showToast(`Error: ${error.message}`, 'error')
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Format date for activity display
  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Format date for attachments (simpler format)
  const formatAttachmentDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'posted_to_qb':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="p-3 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading order...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-blue-400">
            Order #{orderNo}
          </h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(orderStatus)}`}>
            {orderStatus.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* QuickBooks Integration Buttons */}
          {qboDocId ? (
            <>
              {/* Show QB Invoice Number */}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                QB Invoice #{qboDocNumber}
              </span>
              {/* Update QB Invoice button - only if not paid */}
              {orderStatus !== 'paid' && (
                <Button
                  onClick={handleUpdateQB}
                  disabled={isUpdatingQB}
                  size="sm"
                  variant="outline"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isUpdatingQB ? 'animate-spin' : ''}`} />
                  {isUpdatingQB ? 'Updating...' : 'Update QB'}
                </Button>
              )}
            </>
          ) : (
            /* Post to QB button - only show if not posted yet */
            <Button
              onClick={handlePostToQB}
              disabled={isPostingToQB || orderStatus === 'paid'}
              size="sm"
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
            >
              <Upload className={`h-4 w-4 mr-1 ${isPostingToQB ? 'animate-pulse' : ''}`} />
              {isPostingToQB ? 'Posting...' : 'Post to QB'}
            </Button>
          )}

          {/* Invoice PDF Generation Buttons */}
          <Button
            onClick={handleGenerateSellerPDF}
            disabled={isGeneratingSellerPDF}
            size="sm"
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            <FileText className={`h-4 w-4 mr-1 ${isGeneratingSellerPDF ? 'animate-pulse' : ''}`} />
            {isGeneratingSellerPDF ? 'Generating...' : 'Invoice for Seller'}
          </Button>

          <Button
            onClick={handleGenerateBuyerPDF}
            disabled={isGeneratingBuyerPDF}
            size="sm"
            variant="outline"
            className="border-green-300 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <FileText className={`h-4 w-4 mr-1 ${isGeneratingBuyerPDF ? 'animate-pulse' : ''}`} />
            {isGeneratingBuyerPDF ? 'Generating...' : 'Invoice for Buyer'}
          </Button>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || orderStatus === 'paid'}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Update Order'}
          </Button>
        </div>
      </div>

      {/* Order Entry Form */}
      <Card className="mb-2">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm font-bold">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <form className="space-y-2">
            {/* Seller and Buyer Side-by-Side */}
            <div className="grid grid-cols-2 gap-2">
              {/* Seller Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-2 rounded">
                <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-1.5">Seller</h3>

                <div className="space-y-1.5">
                  <div className="relative">
                    <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      Account <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1">
                      <Input
                        ref={sellerCodeRef}
                        type="text"
                        value={sellerCodeSearch}
                        onChange={(e) => handleSellerCodeChange(e.target.value)}
                        onFocus={() => setShowSellerDropdown(true)}
                        placeholder="Code..."
                        className="flex-1 bg-white dark:bg-gray-800 h-7 text-xs"
                      />

                      <Input
                        ref={sellerNameRef}
                        type="text"
                        value={sellerNameSearch}
                        onChange={(e) => handleSellerNameChange(e.target.value)}
                        onFocus={() => setShowSellerDropdown(true)}
                        placeholder="Account name..."
                        className="flex-[2] bg-white dark:bg-gray-800 h-7 text-xs"
                      />
                    </div>

                    {/* Seller Dropdown */}
                    {showSellerDropdown && (sellerCodeSearch || sellerNameSearch) && (
                      <div
                        ref={sellerDropdownRef}
                        className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-md shadow-lg max-h-60 overflow-auto"
                      >
                        {getFilteredSellerAccounts().length > 0 ? (
                          getFilteredSellerAccounts().map((account) => (
                            <div
                              key={account.id}
                              className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 border-b dark:border-gray-700 last:border-b-0"
                              onClick={() => handleSelectSeller(account)}
                            >
                              <div className="flex gap-2">
                                <span className="font-medium text-blue-900 dark:text-blue-300">{account.code}</span>
                                <span className="text-gray-700 dark:text-gray-400">-</span>
                                <span className="text-gray-900 dark:text-white">{account.name}</span>
                              </div>
                              {account.city && account.state && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {account.city}, {account.state}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">No accounts found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Seller Billing Address */}
                  {selectedSeller && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                        Billing Address <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-1">
                        <select
                          className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:text-white"
                          value={selectedSellerBillingAddress?.id || ''}
                          onChange={(e) => {
                            const address = selectedSeller.addresses?.find(a => a.id === e.target.value)
                            setSelectedSellerBillingAddress(address || null)
                          }}
                        >
                          <option value="">Select billing...</option>
                          {selectedSeller.addresses?.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.line1}, {addr.city}, {addr.state} {addr.postalCode} ({addr.type})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setModalAccountType('seller')
                            setShowAddAddressModal(true)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Seller Pickup Address */}
                  {selectedSeller && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                        Pickup Address <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-1">
                        <select
                          className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:text-white"
                          value={selectedSellerPickupAddress?.id || ''}
                          onChange={(e) => {
                            const address = selectedSeller.addresses?.find(a => a.id === e.target.value)
                            setSelectedSellerPickupAddress(address || null)
                          }}
                        >
                          <option value="">Select pickup...</option>
                          {selectedSeller.addresses?.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.line1}, {addr.city}, {addr.state} {addr.postalCode} ({addr.type})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setModalAccountType('seller')
                            setNewAddress({ ...newAddress, type: 'pickup' })
                            setShowAddAddressModal(true)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Seller Contact */}
                  {selectedSeller && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                        Contact
                      </label>
                      <div className="flex gap-1">
                        <select
                          className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:text-white"
                          value={selectedSellerContact?.id || ''}
                          onChange={(e) => {
                            const contact = selectedSeller.contacts?.find(c => c.id === e.target.value)
                            setSelectedSellerContact(contact || null)
                          }}
                        >
                          <option value="">Select contact...</option>
                          {selectedSeller.contacts?.map((contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name} - {contact.email}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setModalAccountType('seller')
                            setShowAddContactModal(true)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PO Number */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      PO Number
                    </label>
                    <Input
                      type="text"
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="Purchase Order #"
                      className="w-full h-7 text-xs bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Buyer Section */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-2 rounded">
                <h3 className="text-xs font-bold text-green-900 dark:text-green-300 mb-1.5">Buyer</h3>

                <div className="space-y-1.5">
                  <div className="relative">
                    <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      Account <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1">
                      <Input
                        ref={buyerCodeRef}
                        type="text"
                        value={buyerCodeSearch}
                        onChange={(e) => handleBuyerCodeChange(e.target.value)}
                        onFocus={() => setShowBuyerDropdown(true)}
                        placeholder="Code..."
                        className="flex-1 bg-white dark:bg-gray-800 h-7 text-xs"
                      />

                      <Input
                        ref={buyerNameRef}
                        type="text"
                        value={buyerNameSearch}
                        onChange={(e) => handleBuyerNameChange(e.target.value)}
                        onFocus={() => setShowBuyerDropdown(true)}
                        placeholder="Account name..."
                        className="flex-[2] bg-white dark:bg-gray-800 h-7 text-xs"
                      />
                    </div>

                    {/* Buyer Dropdown */}
                    {showBuyerDropdown && (buyerCodeSearch || buyerNameSearch) && (
                      <div
                        ref={buyerDropdownRef}
                        className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-md shadow-lg max-h-60 overflow-auto"
                      >
                        {getFilteredBuyerAccounts().length > 0 ? (
                          getFilteredBuyerAccounts().map((account) => (
                            <div
                              key={account.id}
                              className="px-3 py-2 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/50 border-b dark:border-gray-700 last:border-b-0"
                              onClick={() => handleSelectBuyer(account)}
                            >
                              <div className="flex gap-2">
                                <span className="font-medium text-green-900 dark:text-green-300">{account.code}</span>
                                <span className="text-gray-700 dark:text-gray-400">-</span>
                                <span className="text-gray-900 dark:text-white">{account.name}</span>
                              </div>
                              {account.city && account.state && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {account.city}, {account.state}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">No accounts found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Will Pick Up Checkbox */}
                  {selectedBuyer && (
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        id="isPickup"
                        checked={isPickup}
                        onChange={(e) => setIsPickup(e.target.checked)}
                        className="h-3 w-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <label htmlFor="isPickup" className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                        Will Pick Up
                      </label>
                    </div>
                  )}

                  {/* Buyer Billing Address */}
                  {selectedBuyer && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                        Billing Address <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-1">
                        <select
                          className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:text-white"
                          value={selectedBuyerBillingAddress?.id || ''}
                          onChange={(e) => {
                            const address = selectedBuyer.addresses?.find(a => a.id === e.target.value)
                            setSelectedBuyerBillingAddress(address || null)
                          }}
                        >
                          <option value="">Select billing...</option>
                          {selectedBuyer.addresses?.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.line1}, {addr.city}, {addr.state} {addr.postalCode} ({addr.type})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setModalAccountType('buyer')
                            setShowAddAddressModal(true)
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Buyer Shipping Address (only show if not pickup) */}
                  {selectedBuyer && !isPickup && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                        Shipping Address <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-1">
                        <select
                          className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:text-white"
                          value={selectedBuyerShippingAddress?.id || ''}
                          onChange={(e) => {
                            const address = selectedBuyer.addresses?.find(a => a.id === e.target.value)
                            setSelectedBuyerShippingAddress(address || null)
                          }}
                        >
                          <option value="">Select shipping...</option>
                          {selectedBuyer.addresses?.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.line1}, {addr.city}, {addr.state} {addr.postalCode} ({addr.type})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setModalAccountType('buyer')
                            setNewAddress({ ...newAddress, type: 'shipping' })
                            setShowAddAddressModal(true)
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Buyer Contact */}
                  {selectedBuyer && (
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                        Contact
                      </label>
                      <div className="flex gap-1">
                        <select
                          className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:text-white"
                          value={selectedBuyerContact?.id || ''}
                          onChange={(e) => {
                            const contact = selectedBuyer.contacts?.find(c => c.id === e.target.value)
                            setSelectedBuyerContact(contact || null)
                          }}
                        >
                          <option value="">Select contact...</option>
                          {selectedBuyer.contacts?.map((contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name} - {contact.email}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setModalAccountType('buyer')
                            setShowAddContactModal(true)
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contract Number */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      Sales Contract #
                    </label>
                    <Input
                      type="text"
                      value={contractNo}
                      onChange={(e) => setContractNo(e.target.value)}
                      placeholder="Sales Contract #"
                      className="w-full h-7 text-xs bg-white dark:bg-gray-800"
                    />
                  </div>

                  {/* Pallet Count */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                      Pallet Count
                    </label>
                    <Input
                      type="number"
                      value={numPallets}
                      onChange={(e) => setNumPallets(e.target.value)}
                      placeholder="Number of pallets"
                      className="w-full h-7 text-xs bg-white dark:bg-gray-800"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Agent and Broker Section */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {/* Agent Dropdown */}
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Agent <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded border border-gray-300 dark:border-gray-600 px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:text-white"
                  value={selectedAgent?.id || ''}
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW') {
                      setShowAddAgentModal(true)
                    } else {
                      const agent = agents.find(a => a.id === e.target.value)
                      setSelectedAgent(agent ? { id: agent.id, name: agent.name } : null)
                    }
                  }}
                >
                  <option value="">Select agent...</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} - {agent.email}
                    </option>
                  ))}
                  <option value="ADD_NEW" className="text-blue-600 font-medium">+ Add New</option>
                </select>
              </div>

              {/* Broker Dropdown (Optional) */}
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Broker (Optional)
                </label>
                <select
                  className="w-full rounded border border-gray-300 dark:border-gray-600 px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:text-white"
                  value={selectedBroker?.id || ''}
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW') {
                      setShowAddBrokerModal(true)
                    } else {
                      const broker = brokers.find(b => b.id === e.target.value)
                      setSelectedBroker(broker ? { id: broker.id, name: broker.name } : null)
                    }
                  }}
                >
                  <option value="">Select broker...</option>
                  {brokers.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.name} - {broker.email}
                    </option>
                  ))}
                  <option value="ADD_NEW" className="text-blue-600 font-medium">+ Add New</option>
                </select>
              </div>
            </div>

            {/* Payment Terms Section */}
            <div className="mt-2">
              {/* Payment Terms */}
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Payment Terms
                </label>
                <select
                  className="w-full rounded border border-gray-300 dark:border-gray-600 px-1.5 py-1 text-xs bg-white dark:bg-gray-800 dark:text-white h-7"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                >
                  <option value="">Select terms...</option>
                  {termsOptions.map((term) => (
                    <option key={term.id} value={term.name}>
                      {term.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Product List */}
      <Card className="mt-2">
        <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
          <CardTitle className="text-sm font-bold">Items</CardTitle>
          <Button type="button" onClick={addOrderLine} size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-6 text-xs px-2">
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {/* Header row */}
          <div className="grid grid-cols-12 gap-1 mb-2 px-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Product</div>
            <div className="col-span-2">Variant</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-1 text-right">$/lb</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1 text-right">%</div>
            <div className="col-span-1 text-right">Comm</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-1">
            {orderLines.map((line, index) => (
              <div key={line.id} className="bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-lg space-y-1">
                <div className="grid grid-cols-12 gap-1 items-center">
                {/* Line number */}
                <div className="col-span-1">
                  <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                </div>

                {/* Product name with autocomplete */}
                <div className="col-span-3 relative">
                  <input
                    type="text"
                    value={searchQuery[line.id] || line.productName || ''}
                    onChange={(e) => {
                      setSearchQuery({ ...searchQuery, [line.id]: e.target.value })
                      setActiveLineId(line.id)
                      if (line.productName) {
                        setOrderLines(orderLines.map(l =>
                          l.id === line.id ? { ...l, productId: '', productName: '', variantId: '', variantLabel: '', variantSize: 1, quantity: 0, pricePerUnit: 0, commissionPercent: 0 } : l
                        ))
                      }
                    }}
                    onFocus={() => setActiveLineId(line.id)}
                    className="w-full px-1.5 py-1 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                    placeholder="Search..."
                  />

                  {/* Autocomplete dropdown */}
                  {activeLineId === line.id && (searchQuery[line.id]?.trim() || getFilteredProducts(line.id).length > 0) && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-md shadow-lg max-h-48 overflow-auto">
                      {getFilteredProducts(line.id).map((product) => (
                        <div
                          key={product.id}
                          className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 border-b dark:border-gray-700 last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelectProduct(line.id, product)
                          }}
                        >
                          <span className="text-gray-900 dark:text-white text-sm">
                            {product.name}
                          </span>
                        </div>
                      ))}
                      {/* Add new product option */}
                      <div
                        className="px-3 py-2 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/50 border-t border-gray-200 dark:border-gray-600 text-green-600 dark:text-green-400 font-medium text-sm flex items-center"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setProductModalLineId(line.id)
                          setNewProduct({ ...newProduct, name: searchQuery[line.id] || '' })
                          setShowAddProductModal(true)
                          setActiveLineId(null)
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add New Product
                      </div>
                    </div>
                  )}
                </div>

                {/* Variant dropdown */}
                <div className="col-span-2">
                  {line.productId ? (
                    <div className="flex items-center gap-0.5">
                      <select
                        value={line.variantId}
                        onChange={(e) => {
                          const variant = getProductVariants(line.productId).find(v => v.id === e.target.value)
                          if (variant) handleSelectVariant(line.id, variant)
                        }}
                        className="flex-1 px-1 py-1 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                      >
                        {getProductVariants(line.productId).length === 0 ? (
                          <option value="">No variants</option>
                        ) : (
                          getProductVariants(line.productId).map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.size} {variant.sizeUnit} {variant.packageType}
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setVariantModalLineId(line.id)
                          setShowAddVariantModal(true)
                        }}
                        className="p-1 text-green-600 hover:text-white hover:bg-green-600 rounded transition-all"
                        title="Add new variant"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>

                {/* Quantity */}
                <div className="col-span-1">
                  <input
                    type="number"
                    value={line.quantity || ''}
                    onChange={(e) => updateOrderLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-1 py-1 text-xs text-right text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                    placeholder="0"
                    min="0"
                  />
                </div>

                {/* Price per unit */}
                <div className="col-span-1">
                  <input
                    type="number"
                    value={line.pricePerUnit || ''}
                    onChange={(e) => updateOrderLine(line.id, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                    className="w-full px-1 py-1 text-xs text-right text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Total (calculated) */}
                <div className="col-span-1 text-right flex items-center justify-end">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    ${getLineTotal(line).toFixed(2)}
                  </span>
                </div>

                {/* Commission percent */}
                <div className="col-span-1">
                  <input
                    type="number"
                    value={line.commissionPercent || ''}
                    onChange={(e) => updateOrderLine(line.id, 'commissionPercent', parseFloat(e.target.value) || 0)}
                    className="w-full px-1 py-1 text-xs text-right text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                {/* Commission amount (calculated) */}
                <div className="col-span-1 text-right flex items-center justify-end">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    ${getLineCommission(line).toFixed(2)}
                  </span>
                </div>

                {/* Delete button */}
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeOrderLine(line.id)}
                    className="p-1 text-red-600 hover:text-white hover:bg-red-600 rounded transition-all"
                    title="Remove item"
                    disabled={orderLines.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Memo field */}
              <div className="w-full">
                <input
                  type="text"
                  value={line.memo || ''}
                  onChange={(e) => updateOrderLine(line.id, 'memo', e.target.value)}
                  placeholder="Auto-generated memo (editable)..."
                  className="w-full px-2 py-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none italic"
                />
              </div>
            </div>
            ))}
          </div>

          {/* Totals row */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-1 px-1">
              <div className="col-span-7 text-right font-semibold text-gray-700 dark:text-gray-300 text-sm">
                Totals:
              </div>
              <div className="col-span-1 text-right font-bold text-gray-900 dark:text-white text-sm">
                ${getGrandTotal().toFixed(2)}
              </div>
              <div className="col-span-1"></div>
              <div className="col-span-1 text-right font-bold text-green-600 dark:text-green-400 text-sm">
                ${getTotalCommission().toFixed(2)}
              </div>
              <div className="col-span-2"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes and Attachments Tabs */}
      <Card className="mt-2">
        <CardHeader className="py-2 px-3">
          <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-2 pb-2 px-2 text-sm font-medium transition-colors ${
                activeTab === 'notes'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <StickyNote className="h-4 w-4" />
              Notes
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`flex items-center gap-2 pb-2 px-2 text-sm font-medium transition-colors ${
                activeTab === 'attachments'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Paperclip className="h-4 w-4" />
              Attachments ({attachments.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 pb-2 px-2 text-sm font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Clock className="h-4 w-4" />
              Activity Log ({activities.length})
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          {activeTab === 'notes' ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this order..."
                className="w-full min-h-[120px] px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none resize-y"
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    // Update order with new notes
                    handleSave()
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save Notes
                </Button>
              </div>
            </div>
          ) : activeTab === 'attachments' ? (
            <div className="space-y-3">
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(attachment.fileSize)} • Uploaded {formatAttachmentDate(attachment.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => window.open(attachment.fileUrl, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {attachments.length === 0 && (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <Paperclip className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No attachments yet</p>
                  <p className="text-xs mt-1">Upload files related to this order</p>
                </div>
              )}

              <div className="flex flex-col items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <input
                  type="file"
                  id="attachment-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploadingAttachment}
                />
                <label htmlFor="attachment-upload">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-dashed border-2 cursor-pointer"
                    disabled={isUploadingAttachment}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById('attachment-upload')?.click()
                    }}
                  >
                    {isUploadingAttachment ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 mr-1" />
                        Upload Attachment
                      </>
                    )}
                  </Button>
                </label>
                {uploadError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {isLoadingActivities ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <RefreshCw className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600 animate-spin" />
                  <p className="text-sm">Loading activities...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <Clock className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No activities recorded yet</p>
                  <p className="text-xs mt-1">Activity will appear here as changes are made</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <User className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {activity.userName || 'System'}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {formatActivityDate(activity.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {activity.activityType}
                          </span>
                          {activity.description && `: ${activity.description}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <OrderModals
        showAddAddressModal={showAddAddressModal}
        setShowAddAddressModal={setShowAddAddressModal}
        modalAccountType={modalAccountType}
        newAddress={newAddress}
        setNewAddress={setNewAddress}
        handleAddAddress={handleAddAddress}
        showAddContactModal={showAddContactModal}
        setShowAddContactModal={setShowAddContactModal}
        newContact={newContact}
        setNewContact={setNewContact}
        handleAddContact={handleAddContact}
        showAddAgentModal={showAddAgentModal}
        setShowAddAgentModal={setShowAddAgentModal}
        newUser={newUser}
        setNewUser={setNewUser}
        handleAddAgent={handleAddAgent}
        showAddBrokerModal={showAddBrokerModal}
        setShowAddBrokerModal={setShowAddBrokerModal}
        handleAddBroker={handleAddBroker}
      />

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Almonds"
                    required
                  />
                </div>

                <div>
                  <Label>Variety</Label>
                  <Input
                    value={newProduct.variety}
                    onChange={(e) => setNewProduct({ ...newProduct, variety: e.target.value })}
                    placeholder="Nonpareil"
                  />
                </div>

                <div>
                  <Label>Grade</Label>
                  <Input
                    value={newProduct.grade}
                    onChange={(e) => setNewProduct({ ...newProduct, grade: e.target.value })}
                    placeholder="Supreme"
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Input
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="Nuts"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddProductModal(false)
                      setProductModalLineId(null)
                      setNewProduct({
                        name: '',
                        variety: '',
                        grade: '',
                        category: '',
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddProduct}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Add Product
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Variant Modal */}
      {showAddVariantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Variant</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>Size *</Label>
                  <Input
                    value={newVariant.size}
                    onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                    placeholder="25"
                    required
                  />
                </div>

                <div>
                  <Label>Size Unit</Label>
                  <select
                    value={newVariant.sizeUnit}
                    onChange={(e) => setNewVariant({ ...newVariant, sizeUnit: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                  >
                    <option value="lb">lb</option>
                    <option value="kg">kg</option>
                    <option value="oz">oz</option>
                    <option value="g">g</option>
                  </select>
                </div>

                <div>
                  <Label>Package Type</Label>
                  <select
                    value={newVariant.packageType}
                    onChange={(e) => setNewVariant({ ...newVariant, packageType: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                  >
                    <option value="bag">Bag</option>
                    <option value="box">Box</option>
                    <option value="case">Case</option>
                    <option value="carton">Carton</option>
                    <option value="pallet">Pallet</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddVariantModal(false)
                      setVariantModalLineId(null)
                      setNewVariant({
                        size: '',
                        sizeUnit: 'lb',
                        packageType: 'bag',
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddVariant}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Add Variant
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}
