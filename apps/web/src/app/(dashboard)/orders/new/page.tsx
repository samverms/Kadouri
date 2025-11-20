'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'

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
  quantity: number
  pricePerUnit: number // price per lb
  commissionPercent: number
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

export default function NewOrderPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { showToast } = useToast()

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
  }])
  const [commissionRate, setCommissionRate] = useState(0)
  const [numPallets, setNumPallets] = useState('')
  const [conditions, setConditions] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [otherRemarks, setOtherRemarks] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

  // Fetch accounts, products, and agents/brokers on mount
  useEffect(() => {
    fetchAccounts()
    fetchProducts()
    fetchAgentsAndBrokers()
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

  const fetchProducts = async () => {
    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products?includeInactive=false`, {
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
    } catch (err) {
      console.error('Fetch products error:', err)
    }
  }

  const fetchAgentsAndBrokers = async () => {
    try {
      const token = await getToken()
      console.log('[NEW ORDER] Token exists:', !!token)

      if (!token) {
        console.error('[NEW ORDER] NO TOKEN - User may not be authenticated')
        return
      }

      // Fetch agents
      const agentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'}/api/agents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      console.log('[NEW ORDER] Agents response:', agentsResponse.status)

      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json()
        console.log('[NEW ORDER] Agents:', agentsData)
        setAgents(agentsData)
      } else {
        console.error('[NEW ORDER] Agents error:', await agentsResponse.text())
      }

      // Fetch brokers
      const brokersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'}/api/brokers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      console.log('[NEW ORDER] Brokers response:', brokersResponse.status)

      if (brokersResponse.ok) {
        const brokersData = await brokersResponse.json()
        console.log('[NEW ORDER] Brokers:', brokersData)
        setBrokers(brokersData)
      } else {
        console.error('[NEW ORDER] Brokers error:', await brokersResponse.text())
      }
    } catch (err) {
      console.error('[NEW ORDER] Error:', err)
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

  // Calculate line commission
  const getLineCommission = (line: OrderLine) => {
    const total = getLineTotal(line)
    return total * (line.commissionPercent / 100)
  }

  // Calculate grand total
  const getGrandTotal = () => {
    return orderLines.reduce((sum, line) => sum + getLineTotal(line), 0)
  }

  // Calculate total commission
  const getTotalCommission = () => {
    return orderLines.reduce((sum, line) => sum + getLineCommission(line), 0)
  }

  const removeOrderLine = (id: string) => {
    if (orderLines.length > 1) {
      setOrderLines(orderLines.filter((line) => line.id !== id))
    }
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

  // Save order
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
        agentUserId: selectedAgent?.id,
        agentName: selectedAgent?.name,
        brokerUserId: selectedBroker?.id,
        brokerName: selectedBroker?.name,
        palletCount: numPallets ? parseInt(numPallets) : undefined,
        terms: paymentTerms,
        notes: `${conditions}\n${otherRemarks}`.trim(),
        status: 'draft',
        lines: orderLines
          .filter(line => line.productId && line.quantity > 0)
          .map(line => ({
            productId: line.productId,
            variantId: line.variantId || undefined,
            quantity: line.quantity,
            unitSize: line.variantSize || 1,
            uom: 'lb', // Default to lb for now
            totalWeight: line.quantity * (line.variantSize || 1),
            unitPrice: line.pricePerUnit,
            commissionPct: line.commissionPercent || 0, // Send as percentage (2 for 2%)
          })),
      }

      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders`, {
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
      showToast('Order created successfully', 'success')
      setTimeout(() => router.push(`/orders/${newOrder.id}`), 500)
    } catch (err: any) {
      console.error('Save order error:', err)
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setIsSaving(false)
    }
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-blue-400">Create New Order</h1>
        </div>

        <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
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
                          {selectedSeller.addresses?.filter(a => a.type === 'billing').map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.line1}, {addr.city}, {addr.state} {addr.postalCode}
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
                          {selectedSeller.addresses?.filter(a => a.type === 'pickup').map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.line1}, {addr.city}, {addr.state} {addr.postalCode}
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
                          {selectedBuyer.addresses?.filter(a => a.type === 'billing').map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.line1}, {addr.city}, {addr.state} {addr.postalCode}
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
                          {selectedBuyer.addresses?.filter(a => a.type === 'shipping').map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.line1}, {addr.city}, {addr.state} {addr.postalCode}
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
              <div key={line.id} className="grid grid-cols-12 gap-1 items-center bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-lg">
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

      {/* Add Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Add New Address for {modalAccountType === 'seller' ? 'Seller' : 'Buyer'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>Address Type *</Label>
                  <select
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white"
                    value={newAddress.type}
                    onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                  >
                    <option value="billing">Billing</option>
                    <option value="shipping">Shipping</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="pickup">Pickup</option>
                  </select>
                </div>

                <div>
                  <Label>Address Line 1 *</Label>
                  <Input
                    value={newAddress.line1}
                    onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                    placeholder="123 Main St"
                    required
                  />
                </div>

                <div>
                  <Label>Address Line 2</Label>
                  <Input
                    value={newAddress.line2}
                    onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                    placeholder="Suite 100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="Los Angeles"
                      required
                    />
                  </div>

                  <div>
                    <Label>State *</Label>
                    <Input
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value.toUpperCase() })}
                      placeholder="CA"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Postal Code *</Label>
                    <Input
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      placeholder="90001"
                      required
                    />
                  </div>

                  <div>
                    <Label>Country *</Label>
                    <Input
                      value={newAddress.country}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value.toUpperCase() })}
                      placeholder="US"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimaryAddress"
                    checked={newAddress.isPrimary}
                    onChange={(e) => setNewAddress({ ...newAddress, isPrimary: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <Label htmlFor="isPrimaryAddress" className="cursor-pointer">Set as primary address</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddAddressModal(false)
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
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddAddress}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Address
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Add New Contact for {modalAccountType === 'seller' ? 'Seller' : 'Buyer'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>Contact Name *</Label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimaryContact"
                    checked={newContact.isPrimary}
                    onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <Label htmlFor="isPrimaryContact" className="cursor-pointer">Set as primary contact</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddContactModal(false)
                      setNewContact({
                        name: '',
                        email: '',
                        phone: '',
                        isPrimary: false,
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddContact}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Contact
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddAgentModal(false)
                      setNewUser({
                        name: '',
                        email: '',
                        phone: '',
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddAgent}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Agent
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Broker Modal */}
      {showAddBrokerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Broker</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddBrokerModal(false)
                      setNewUser({
                        name: '',
                        email: '',
                        phone: '',
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddBroker}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Broker
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

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
