'use client'
// Updated with expandable invoice cards
import { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import {
  ArrowLeft,
  Building2,
  MapPin,
  User,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  FileText,
  Eye,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Calendar,
  DollarSign,
  Package,
} from 'lucide-react'

export default function AccountDetailPage() {
  const params = useParams()
  const accountId = params.id as string
  const [activeTab, setActiveTab] = useState<'overview' | 'addresses' | 'contacts'>('overview')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [transactionSearch, setTransactionSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedTransactionIds, setExpandedTransactionIds] = useState<Set<string>>(new Set())

  const [account, setAccount] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [salesAgentName, setSalesAgentName] = useState<string>('')
  const [updatedByName, setUpdatedByName] = useState<string>('')
  const [addressFormData, setAddressFormData] = useState({
    type: 'billing',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    isPrimary: false,
  })
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    phone: '',
    isPrimary: false,
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [editingAccount, setEditingAccount] = useState(false)
  const [editAccountName, setEditAccountName] = useState('')
  const [editSalesAgentId, setEditSalesAgentId] = useState('')

  const { showToast } = useToast()
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [editingContact, setEditingContact] = useState<any>(null)

  useEffect(() => {
    fetchAccountData()
  }, [accountId])

  // Fetch user names from backend when account data loads
  useEffect(() => {
    if (account) {
      // Fetch sales agent name
      if (account.salesAgentId) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${account.salesAgentId}/name`, {
          credentials: 'include',
        })
        .then(res => res.json())
        .then(data => setSalesAgentName(data.name))
        .catch(() => setSalesAgentName(account.salesAgentId))
      }
      // Fetch updatedBy user name
      if (account.updatedBy) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${account.updatedBy}/name`, {
          credentials: 'include',
        })
        .then(res => res.json())
        .then(data => setUpdatedByName(data.name))
        .catch(() => setUpdatedByName(account.updatedBy))
      }
    }
  }, [account])

  const fetchAccountData = async () => {
    setIsLoading(true)
    setError('')
    try {
      // Fetch account details
      const accountResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/${accountId}`, {
        credentials: 'include',
      })

      if (!accountResponse.ok) {
        throw new Error('Failed to fetch account')
      }

      const accountData = await accountResponse.json()
      setAccount(accountData)

      // Fetch transactions for this account
      const transactionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/invoices?accountId=${accountId}`, {
        credentials: 'include',
      })

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load account data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/${accountId}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(addressFormData),
      })

      if (!response.ok) {
        throw new Error('Failed to add address')
      }

      const newAddress = await response.json()

      // Optimistically update the UI without full page refresh
      setAccount((prev: any) => ({
        ...prev,
        addresses: [...(prev.addresses || []), newAddress],
      }))

      // Reset form and close
      setAddressFormData({
        type: 'billing',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        isPrimary: false,
      })
      setShowAddressForm(false)
      showToast('Address added successfully', 'success')
    } catch (err) {
      console.error('Add address error:', err)
      showToast('Failed to add address', 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/${accountId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(contactFormData),
      })

      if (!response.ok) {
        throw new Error('Failed to add contact')
      }

      const newContact = await response.json()

      // Optimistically update the UI without full page refresh
      setAccount((prev: any) => ({
        ...prev,
        contacts: [...(prev.contacts || []), newContact],
      }))

      // Reset form and close
      setContactFormData({
        name: '',
        email: '',
        phone: '',
        isPrimary: false,
      })
      setShowContactForm(false)
      showToast('Contact added successfully', 'success')
    } catch (err) {
      console.error('Add contact error:', err)
      showToast('Failed to add contact', 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleEditAccount = async () => {
    setFormSubmitting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editAccountName,
          salesAgentId: editSalesAgentId || null,
        }),
      })
      if (!response.ok) throw new Error('Failed to update account')
      setAccount((prev: any) => ({
        ...prev,
        name: editAccountName,
        salesAgentId: editSalesAgentId,
      }))
      setEditingAccount(false)
      showToast('Account updated successfully', 'success')
    } catch (err) {
      showToast('Failed to update account', 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleToggleActive = async () => {
    if (!confirm(`Are you sure you want to ${account.active ? 'deactivate' : 'activate'} this account?`)) {
      return
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          active: !account.active,
        }),
      })
      if (!response.ok) throw new Error('Failed to update account status')

      setAccount((prev: any) => ({
        ...prev,
        active: !prev.active,
      }))
      showToast(`Account ${!account.active ? 'activated' : 'deactivated'} successfully`, 'success')
    } catch (err) {
      showToast('Failed to update account status', 'error')
    }
  }

  const handleAccountTypeChange = async (newType: string) => {
    // Optimistic update - update UI immediately
    setAccount((prev: any) => ({ ...prev, accountType: newType }))

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accountType: newType,
        }),
      })
      if (!response.ok) {
        // Revert on error
        await fetchAccountData()
        throw new Error('Failed to update account type')
      }
      showToast('Account type updated successfully', 'success')
    } catch (err) {
      // Revert on error
      await fetchAccountData()
      showToast('Failed to update account type', 'error')
    }
  }

  const handleUpdateAddress = async () => {
    if (!editingAddress) return
    setFormSubmitting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/addresses/${editingAddress.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingAddress),
      })
      if (!response.ok) throw new Error('Failed to update address')

      // Optimistically update the UI
      setAccount((prev: any) => ({
        ...prev,
        addresses: prev.addresses.map((addr: any) =>
          addr.id === editingAddress.id ? editingAddress : addr
        ),
      }))
      setEditingAddress(null)
      showToast('Address updated successfully', 'success')
    } catch (err) {
      showToast('Failed to update address', 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to delete address')

      // Optimistically update the UI
      setAccount((prev: any) => ({
        ...prev,
        addresses: prev.addresses.filter((addr: any) => addr.id !== addressId),
      }))
      showToast('Address deleted successfully', 'warning')
    } catch (err) {
      showToast('Failed to delete address', 'error')
    }
  }

  const handleUpdateContact = async () => {
    if (!editingContact) return
    setFormSubmitting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/contacts/${editingContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingContact),
      })
      if (!response.ok) throw new Error('Failed to update contact')

      // Optimistically update the UI
      setAccount((prev: any) => ({
        ...prev,
        contacts: prev.contacts.map((contact: any) =>
          contact.id === editingContact.id ? editingContact : contact
        ),
      }))
      setEditingContact(null)
      showToast('Contact updated successfully', 'success')
    } catch (err) {
      showToast('Failed to update contact', 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to delete contact')

      // Optimistically update the UI
      setAccount((prev: any) => ({
        ...prev,
        contacts: prev.contacts.filter((contact: any) => contact.id !== contactId),
      }))
      showToast('Contact deleted successfully', 'warning')
    } catch (err) {
      showToast('Failed to delete contact', 'error')
    }
  }

  const addresses = account?.addresses || []
  const contacts = account?.contacts || []

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'addresses', label: 'Addresses', count: addresses.length },
    { id: 'contacts', label: 'Contacts', count: contacts.length },
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
      return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-50" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3 inline text-blue-600" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline text-blue-600" />
    )
  }

  const toggleExpanded = (transactionId: string) => {
    const newExpanded = new Set(expandedTransactionIds)
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId)
    } else {
      newExpanded.add(transactionId)
    }
    setExpandedTransactionIds(newExpanded)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'posted_to_qb':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:text-gray-200'
    }
  }

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter((txn) => {
      const searchLower = transactionSearch.toLowerCase()
      return (
        txn.orderNo?.toLowerCase().includes(searchLower) ||
        txn.sellerAccountName?.toLowerCase().includes(searchLower) ||
        txn.buyerAccountName?.toLowerCase().includes(searchLower) ||
        txn.lines?.[0]?.productDescription?.toLowerCase().includes(searchLower) ||
        txn.agentName?.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      if (!sortColumn) return 0

      let aValue: any = a[sortColumn as keyof typeof a]
      let bValue: any = b[sortColumn as keyof typeof b]

      // Handle date sorting
      if (sortColumn === 'date') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      // Handle numeric sorting for total
      if (sortColumn === 'total') {
        aValue = parseFloat(aValue.replace(/[$,]/g, ''))
        bValue = parseFloat(bValue.replace(/[$,]/g, ''))
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  if (isLoading) {
    return (
      <div>
        <Link
          href="/accounts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Link>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading account details...</p>
        </div>
      </div>
    )
  }

  if (error || !account) {
    return (
      <div>
        <Link
          href="/accounts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error || 'Account not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/accounts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">{account.name}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Code: <span className="font-mono">{account.code}</span>
                {account.qboCustomerId && (
                  <span className="ml-3 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Synced to QuickBooks
                  </span>
                )}
              </p>
              {account.updatedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {new Date(account.updatedAt).toLocaleString()}
                  {account.updatedBy && <span className="ml-1">by (Customer Service): {updatedByName || account.updatedBy}</span>}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {account.salesAgentId && (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    <User className="mr-1 h-3 w-3" />
                    Sales Agent: {salesAgentName || account.salesAgentId}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setEditAccountName(account.name);
              setEditSalesAgentId(account.salesAgentId || '');
              setEditingAccount(true);
            }}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Account
            </Button>
            <Button variant="outline" className="text-blue-600 hover:text-blue-700">
              {account.qboCustomerId ? 'Refresh from QBO' : 'Sync to QBO'}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Account Modal */}
      {editingAccount && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Edit Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                  placeholder="Enter account name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Agent ID
                </label>
                <Input
                  value={editSalesAgentId}
                  onChange={(e) => setEditSalesAgentId(e.target.value)}
                  placeholder="Enter Clerk user ID for sales agent"
                />
                <p className="text-xs text-gray-500 mt-1">Assign a sales representative to this account</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditAccount} className="bg-blue-600 hover:bg-blue-700" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditingAccount(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Account Code</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">{account.code}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Created Date</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Account Name</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{account.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                    <div className="flex items-center">
                      <button
                        onClick={handleToggleActive}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          account.active ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            account.active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="ml-2 text-sm text-gray-700">
                        {account.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Sales Agent</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {salesAgentName || account.salesAgentId || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Account Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="accountType"
                        value="buyer"
                        checked={(account.accountType || 'both') === 'buyer'}
                        onChange={(e) => handleAccountTypeChange(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Buyer</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="accountType"
                        value="seller"
                        checked={(account.accountType || 'both') === 'seller'}
                        onChange={(e) => handleAccountTypeChange(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Seller</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="accountType"
                        value="both"
                        checked={(account.accountType || 'both') === 'both'}
                        onChange={(e) => handleAccountTypeChange(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Both</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Brokers</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {account.brokerIds && account.brokerIds.length > 0
                      ? `${account.brokerIds.length} broker(s) assigned`
                      : 'No brokers assigned'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>QuickBooks Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {account.qboCustomerId ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        QuickBooks Customer ID
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {account.qboCustomerId}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Sync Status</label>
                      <p className="mt-1">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Connected
                        </span>
                      </p>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View in QuickBooks
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-600 mb-4">
                      This account is not yet synced with QuickBooks
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Sync to QuickBooks
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Orders and confirmations involving this account</CardDescription>
                </div>
                <Link href="/orders">
                  <Button variant="outline" size="sm">
                    View All Orders
                  </Button>
                </Link>
              </div>
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search transactions by order #, seller, buyer, product, or agent..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-12"></th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('seller')}
                      >
                        Seller {getSortIcon('seller')}
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('buyer')}
                      >
                        Buyer {getSortIcon('buyer')}
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('products')}
                      >
                        Product(s) {getSortIcon('products')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('date')}
                      >
                        Date {getSortIcon('date')}
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('agent')}
                      >
                        Agent {getSortIcon('agent')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((txn) => (
                      <Fragment key={txn.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleExpanded(txn.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedTransactionIds.has(txn.id) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <Link
                              href={`/orders/${txn.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline font-mono"
                            >
                              {txn.orderNo}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              txn.type === 'seller'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {txn.type === 'seller' ? 'Seller' : 'Buyer'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/accounts/${txn.sellerAccountId}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                            {txn.sellerAccountName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/accounts/${txn.buyerAccountId}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                            {txn.buyerAccountName}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {txn.lines?.[0]?.productDescription || 'Multiple Products'}
                          </div>
                          <div className="text-xs text-gray-500">{txn.lines?.length || 0} items</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            ${txn.totalAmount?.toLocaleString() || '0'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {new Date(txn.orderDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{txn.agentName || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            ${txn.lines?.reduce((sum: number, line: any) => sum + (parseFloat(line.commissionAmt) || 0), 0).toFixed(2) || '0'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Edit2 className="h-4 w-4 text-gray-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedTransactionIds.has(txn.id) && (
                        <tr className="bg-white border-b border-gray-200">
                          <td colSpan={11} className="px-6 py-4">
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                              {/* Header Row with Invoice, Date, and Status */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <span className="text-sm text-gray-600">Invoice: </span>
                                    <Link
                                      href={`/orders/${txn.id}`}
                                      className="text-base font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {txn.orderNo}
                                    </Link>
                                  </div>
                                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${getStatusColor(txn.status)}`}>
                                    {txn.status?.replace(/_/g, ' ').toUpperCase() || 'DRAFT'}
                                  </span>
                                </div>
                                <div className="text-right text-sm text-gray-600">
                                  {formatDate(txn.orderDate)}
                                </div>
                              </div>

                              {/* Buyer/Seller Row */}
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <span className="text-sm text-gray-600">Buyer: </span>
                                  <Link
                                    href={`/accounts/${txn.buyerAccountId}`}
                                    className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 hover:underline"
                                  >
                                    {txn.buyerAccountName}
                                  </Link>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm text-gray-600">Seller: </span>
                                  <Link
                                    href={`/accounts/${txn.sellerAccountId}`}
                                    className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 hover:underline"
                                  >
                                    {txn.sellerAccountName}
                                  </Link>
                                </div>
                              </div>

                              {/* Items Table */}
                              <div className="mb-4">
                                <div className="text-sm font-semibold text-gray-700 mb-2">ITEMS:</div>
                                <div className="bg-white rounded border border-gray-200">
                                  <table className="min-w-full">
                                    <thead className="border-b border-gray-200">
                                      <tr className="text-xs text-gray-600">
                                        <th className="px-3 py-2 text-left font-medium">Product</th>
                                        <th className="px-3 py-2 text-center font-medium">Qty</th>
                                        <th className="px-3 py-2 text-center font-medium">Commission</th>
                                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {txn.lines?.map((line: any, index: number) => (
                                        <tr key={line.id || index} className={index !== (txn.lines?.length || 0) - 1 ? 'border-b border-gray-100' : ''}>
                                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                                            {line.productCode || line.productDescription || 'Unknown Product'}
                                          </td>
                                          <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                                            {line.quantity?.toLocaleString() || 0} lbs
                                          </td>
                                          <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                                            {line.commissionPct > 0 ? `${line.commissionPct}%` : '-'}
                                          </td>
                                          <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                                            {line.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Total */}
                              <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total:</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                  ${txn.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Manage billing, shipping, and other addresses for this account
            </p>
            <Button
              onClick={() => setShowAddressForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </div>

          {showAddressForm && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>Add New Address</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleAddAddress}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        value={addressFormData.type}
                        onChange={(e) => setAddressFormData({...addressFormData, type: e.target.value})}
                      >
                        <option value="billing">Billing</option>
                        <option value="shipping">Shipping</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="pickup">Pickup</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={addressFormData.isPrimary}
                          onChange={(e) => setAddressFormData({...addressFormData, isPrimary: e.target.checked})}
                        />
                        <span className="ml-2 text-sm text-gray-700">Set as primary</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Street address"
                      value={addressFormData.line1}
                      onChange={(e) => setAddressFormData({...addressFormData, line1: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2
                    </label>
                    <Input
                      placeholder="Suite, unit, building, floor, etc."
                      value={addressFormData.line2}
                      onChange={(e) => setAddressFormData({...addressFormData, line2: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={addressFormData.city}
                        onChange={(e) => setAddressFormData({...addressFormData, city: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Input
                        maxLength={2}
                        placeholder="CA"
                        value={addressFormData.state}
                        onChange={(e) => setAddressFormData({...addressFormData, state: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="95814"
                        value={addressFormData.postalCode}
                        onChange={(e) => setAddressFormData({...addressFormData, postalCode: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={formSubmitting}>
                      {formSubmitting ? 'Adding...' : 'Add Address'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddressForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Edit Address Form */}
          {editingAddress && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>Edit Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        value={editingAddress.type}
                        onChange={(e) => setEditingAddress({...editingAddress, type: e.target.value})}
                      >
                        <option value="billing">Billing</option>
                        <option value="shipping">Shipping</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="pickup">Pickup</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={editingAddress.isPrimary}
                          onChange={(e) => setEditingAddress({...editingAddress, isPrimary: e.target.checked})}
                        />
                        <span className="ml-2 text-sm text-gray-700">Set as primary</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={editingAddress.line1}
                      onChange={(e) => setEditingAddress({...editingAddress, line1: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2
                    </label>
                    <Input
                      value={editingAddress.line2 || ''}
                      onChange={(e) => setEditingAddress({...editingAddress, line2: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={editingAddress.city}
                        onChange={(e) => setEditingAddress({...editingAddress, city: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Input
                        maxLength={2}
                        value={editingAddress.state}
                        onChange={(e) => setEditingAddress({...editingAddress, state: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={editingAddress.postalCode}
                        onChange={(e) => setEditingAddress({...editingAddress, postalCode: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateAddress} className="bg-blue-600 hover:bg-blue-700" disabled={formSubmitting}>
                      {formSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingAddress(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {addresses.map((address: any) => (
              <Card key={address.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg capitalize">{address.type}</CardTitle>
                    </div>
                    {address.isPrimary && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        Primary
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p>{address.country}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => setEditingAddress(address)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteAddress(address.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Manage contacts for this account
            </p>
            <Button
              onClick={() => setShowContactForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>

          {showContactForm && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>Add New Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleAddContact}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="John Smith"
                        value={contactFormData.name}
                        onChange={(e) => setContactFormData({...contactFormData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={contactFormData.isPrimary}
                          onChange={(e) => setContactFormData({...contactFormData, isPrimary: e.target.checked})}
                        />
                        <span className="ml-2 text-sm text-gray-700">Set as primary</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={contactFormData.email}
                      onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      placeholder="(916) 555-0123"
                      value={contactFormData.phone}
                      onChange={(e) => setContactFormData({...contactFormData, phone: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={formSubmitting}>
                      {formSubmitting ? 'Adding...' : 'Add Contact'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowContactForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Edit Contact Form */}
          {editingContact && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>Edit Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={editingContact.name}
                        onChange={(e) => setEditingContact({...editingContact, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={editingContact.isPrimary}
                          onChange={(e) => setEditingContact({...editingContact, isPrimary: e.target.checked})}
                        />
                        <span className="ml-2 text-sm text-gray-700">Set as primary</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={editingContact.email}
                      onChange={(e) => setEditingContact({...editingContact, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      value={editingContact.phone || ''}
                      onChange={(e) => setEditingContact({...editingContact, phone: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateContact} className="bg-blue-600 hover:bg-blue-700" disabled={formSubmitting}>
                      {formSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingContact(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {contacts.map((contact: any) => (
              <Card key={contact.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{contact.name}</CardTitle>
                        {contact.isPrimary && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 mt-1">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                        {contact.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => setEditingContact(contact)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteContact(contact.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
