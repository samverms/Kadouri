'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

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

interface Account {
  id: string
  code?: string
  name: string
  addresses?: Address[]
}

interface Product {
  id: string
  name: string
  variety?: string
  size?: string
  grade?: string
}

export default function NewContractPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  // Account search state
  const [selectedSeller, setSelectedSeller] = useState<Account | null>(null)
  const [selectedBuyer, setSelectedBuyer] = useState<Account | null>(null)
  const [sellerCodeSearch, setSellerCodeSearch] = useState('')
  const [sellerNameSearch, setSellerNameSearch] = useState('')
  const [buyerCodeSearch, setBuyerCodeSearch] = useState('')
  const [buyerNameSearch, setBuyerNameSearch] = useState('')
  const [showSellerDropdown, setShowSellerDropdown] = useState(false)
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false)

  // Address selection state
  const [selectedSellerAddress, setSelectedSellerAddress] = useState<Address | null>(null)
  const [selectedBuyerAddress, setSelectedBuyerAddress] = useState<Address | null>(null)

  // Product search state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // Refs for click-outside detection
  const sellerCodeRef = useRef<HTMLInputElement>(null)
  const sellerNameRef = useRef<HTMLInputElement>(null)
  const buyerCodeRef = useRef<HTMLInputElement>(null)
  const buyerNameRef = useRef<HTMLInputElement>(null)
  const productRef = useRef<HTMLInputElement>(null)
  const sellerDropdownRef = useRef<HTMLDivElement>(null)
  const buyerDropdownRef = useRef<HTMLDivElement>(null)
  const productDropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    totalQuantity: '',
    unit: 'lbs',
    pricePerUnit: '',
    validFrom: '',
    validUntil: '',
    brokerName: 'Danny Kadouri',
    brokerAddress: '525 Northern Blvd, Suite 205; Great Neck, NY 11021; USA',
    brokerPhone: '',
    brokerEmail: '',
    terms: '',
    notes: '',
  })

  useEffect(() => {
    fetchAccounts()
    fetchProducts()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Check seller dropdown
      const isSellerInput = sellerCodeRef.current?.contains(target) || sellerNameRef.current?.contains(target)
      const isSellerDropdown = sellerDropdownRef.current?.contains(target)
      if (!isSellerInput && !isSellerDropdown && showSellerDropdown) {
        setShowSellerDropdown(false)
      }

      // Check buyer dropdown
      const isBuyerInput = buyerCodeRef.current?.contains(target) || buyerNameRef.current?.contains(target)
      const isBuyerDropdown = buyerDropdownRef.current?.contains(target)
      if (!isBuyerInput && !isBuyerDropdown && showBuyerDropdown) {
        setShowBuyerDropdown(false)
      }

      // Check product dropdown
      const isProductInput = productRef.current?.contains(target)
      const isProductDropdown = productDropdownRef.current?.contains(target)
      if (!isProductInput && !isProductDropdown && showProductDropdown) {
        setShowProductDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSellerDropdown, showBuyerDropdown, showProductDropdown])

  const fetchAccounts = async () => {
    try {
      const res = await fetch('http://localhost:2000/api/accounts?limit=10000', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:2000/api/products?limit=10000', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  // Account filtering functions
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

  const getFilteredProducts = () => {
    if (!productSearch) return []

    return products.filter(product => {
      const searchStr = `${product.name} ${product.variety || ''} ${product.size || ''} ${product.grade || ''}`.toLowerCase()
      return searchStr.includes(productSearch.toLowerCase())
    }).slice(0, 10)
  }

  // Account selection handlers
  const handleSelectSeller = async (account: Account) => {
    // Fetch full account details with addresses
    try {
      const response = await fetch(`http://localhost:2000/api/accounts/${account.id}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch account details')
      }

      const fullAccount = await response.json()
      setSelectedSeller(fullAccount)
      setSellerCodeSearch(fullAccount.code || '')
      setSellerNameSearch(fullAccount.name || '')
      setShowSellerDropdown(false)

      // Auto-select primary address if available
      const primaryAddress = fullAccount.addresses?.find((addr: Address) => addr.isPrimary)
      if (primaryAddress) setSelectedSellerAddress(primaryAddress)
    } catch (err) {
      console.error('Error fetching seller details:', err)
    }
  }

  const handleSelectBuyer = async (account: Account) => {
    // Fetch full account details with addresses
    try {
      const response = await fetch(`http://localhost:2000/api/accounts/${account.id}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch account details')
      }

      const fullAccount = await response.json()
      setSelectedBuyer(fullAccount)
      setBuyerCodeSearch(fullAccount.code || '')
      setBuyerNameSearch(fullAccount.name || '')
      setShowBuyerDropdown(false)

      // Auto-select primary address if available
      const primaryAddress = fullAccount.addresses?.find((addr: Address) => addr.isPrimary)
      if (primaryAddress) setSelectedBuyerAddress(primaryAddress)
    } catch (err) {
      console.error('Error fetching buyer details:', err)
    }
  }

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setProductSearch(product.name)
    setShowProductDropdown(false)
  }

  // Search change handlers
  const handleSellerCodeChange = (value: string) => {
    setSellerCodeSearch(value)
    setShowSellerDropdown(true)
    if (selectedSeller && value !== selectedSeller.code) {
      setSelectedSeller(null)
      setSelectedSellerAddress(null)
      setSellerNameSearch('')
    }
  }

  const handleSellerNameChange = (value: string) => {
    setSellerNameSearch(value)
    setShowSellerDropdown(true)
    if (selectedSeller && value !== selectedSeller.name) {
      setSelectedSeller(null)
      setSelectedSellerAddress(null)
      setSellerCodeSearch('')
    }
  }

  const handleBuyerCodeChange = (value: string) => {
    setBuyerCodeSearch(value)
    setShowBuyerDropdown(true)
    if (selectedBuyer && value !== selectedBuyer.code) {
      setSelectedBuyer(null)
      setSelectedBuyerAddress(null)
      setBuyerNameSearch('')
    }
  }

  const handleBuyerNameChange = (value: string) => {
    setBuyerNameSearch(value)
    setShowBuyerDropdown(true)
    if (selectedBuyer && value !== selectedBuyer.name) {
      setSelectedBuyer(null)
      setSelectedBuyerAddress(null)
      setBuyerCodeSearch('')
    }
  }

  const handleProductChange = (value: string) => {
    setProductSearch(value)
    setShowProductDropdown(true)
    if (selectedProduct && value !== selectedProduct.name) {
      setSelectedProduct(null)
    }
  }

  const formatAddress = (addr: Address) => {
    return `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSeller || !selectedBuyer || !selectedProduct) {
      alert('Please select seller, buyer, and product')
      return
    }

    setLoading(true)

    try {
      const submitData = {
        sellerId: selectedSeller.id,
        buyerId: selectedBuyer.id,
        productId: selectedProduct.id,
        ...formData,
      }

      const res = await fetch('http://localhost:2000/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create contract')
      }

      const contract = await res.json()
      router.push(`/contracts/${contract.id}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/contracts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-blue-400">Create New Contract</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Parties */}
            <div className="grid grid-cols-2 gap-6">
              {/* Seller */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 p-4 rounded-lg">
                <h3 className="text-base font-bold text-blue-900 dark:text-blue-300 mb-3">Seller</h3>
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
                        required
                      />
                      <Input
                        ref={sellerNameRef}
                        type="text"
                        value={sellerNameSearch}
                        onChange={(e) => handleSellerNameChange(e.target.value)}
                        onFocus={() => setShowSellerDropdown(true)}
                        placeholder="Account name..."
                        className="flex-[2] bg-white dark:bg-gray-800"
                        required
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
                              <div className="font-medium text-gray-900 dark:text-gray-100">{account.name}</div>
                              {account.code && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">Code: {account.code}</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No accounts found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Seller Address Selection */}
                  {selectedSeller && selectedSeller.addresses && selectedSeller.addresses.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Address
                      </label>
                      <select
                        value={selectedSellerAddress?.id || ''}
                        onChange={(e) => {
                          const addr = selectedSeller.addresses?.find(a => a.id === e.target.value)
                          setSelectedSellerAddress(addr || null)
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      >
                        <option value="">Select address...</option>
                        {selectedSeller.addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {formatAddress(addr)} {addr.isPrimary ? '(Primary)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Buyer */}
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 p-4 rounded-lg">
                <h3 className="text-base font-bold text-green-900 dark:text-green-300 mb-3">Buyer</h3>
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
                        required
                      />
                      <Input
                        ref={buyerNameRef}
                        type="text"
                        value={buyerNameSearch}
                        onChange={(e) => handleBuyerNameChange(e.target.value)}
                        onFocus={() => setShowBuyerDropdown(true)}
                        placeholder="Account name..."
                        className="flex-[2] bg-white dark:bg-gray-800"
                        required
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
                              <div className="font-medium text-gray-900 dark:text-gray-100">{account.name}</div>
                              {account.code && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">Code: {account.code}</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No accounts found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Buyer Address Selection */}
                  {selectedBuyer && selectedBuyer.addresses && selectedBuyer.addresses.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Address
                      </label>
                      <select
                        value={selectedBuyerAddress?.id || ''}
                        onChange={(e) => {
                          const addr = selectedBuyer.addresses?.find(a => a.id === e.target.value)
                          setSelectedBuyerAddress(addr || null)
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      >
                        <option value="">Select address...</option>
                        {selectedBuyer.addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {formatAddress(addr)} {addr.isPrimary ? '(Primary)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product & Quantity */}
            <div className="grid grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-sm font-semibold mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <Input
                  ref={productRef}
                  type="text"
                  value={productSearch}
                  onChange={(e) => handleProductChange(e.target.value)}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="Search product..."
                  className="w-full"
                  required
                />

                {/* Product Dropdown */}
                {showProductDropdown && productSearch && (
                  <div
                    ref={productDropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
                  >
                    {getFilteredProducts().length > 0 ? (
                      getFilteredProducts().map((product) => (
                        <div
                          key={product.id}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-b-0"
                          onClick={() => handleSelectProduct(product)}
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                          {(product.variety || product.size || product.grade) && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {[product.variety, product.size, product.grade].filter(Boolean).join(' - ')}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No products found</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Total Quantity</label>
                <Input
                  type="number"
                  required
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                  <option value="cases">cases</option>
                  <option value="units">units</option>
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <label className="block text-sm font-semibold mb-2">Price per Unit ($)</label>
              <Input
                type="number"
                step="0.0001"
                required
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                placeholder="1.50"
              />
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Valid From</label>
                <Input
                  type="date"
                  required
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Valid Until</label>
                <Input
                  type="date"
                  required
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            {/* Broker Information */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Broker Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Broker Name</label>
                  <Input
                    type="text"
                    value={formData.brokerName}
                    onChange={(e) => setFormData({ ...formData, brokerName: e.target.value })}
                    placeholder="Danny Kadouri"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Broker Email</label>
                  <Input
                    type="email"
                    value={formData.brokerEmail}
                    onChange={(e) => setFormData({ ...formData, brokerEmail: e.target.value })}
                    placeholder="broker@kadouriconnection.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Broker Address</label>
                  <Input
                    type="text"
                    value={formData.brokerAddress}
                    onChange={(e) => setFormData({ ...formData, brokerAddress: e.target.value })}
                    placeholder="525 Northern Blvd, Suite 205; Great Neck, NY 11021; USA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Broker Phone</label>
                  <Input
                    type="tel"
                    value={formData.brokerPhone}
                    onChange={(e) => setFormData({ ...formData, brokerPhone: e.target.value })}
                    placeholder="(516) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className="block text-sm font-semibold mb-2">Terms & Conditions</label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Enter terms and conditions..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Internal notes..."
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                {loading ? 'Creating...' : 'Create Contract'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/contracts')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
