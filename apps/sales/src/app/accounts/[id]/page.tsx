'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'

export default function AccountDetailPage() {
  const params = useParams()
  const [activeTab, setActiveTab] = useState<'overview' | 'addresses' | 'contacts'>('overview')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [transactionSearch, setTransactionSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Mock data - will be replaced with API call
  const account = {
    id: params.id,
    code: 'ACC-001',
    name: 'Fresh Valley Farms',
    qboCustomerId: 'QBO-123',
    active: true,
    createdAt: '2025-01-15',
  }

  const transactions = [
    {
      id: '1',
      orderNo: '2510-0025',
      type: 'seller',
      date: '2025-10-07',
      buyer: 'Fresh Valley Farms',
      seller: 'Western Mixers',
      products: 'LA NOGALERA',
      items: 'PECANS + 1 more',
      total: '$132,930.00',
      agent: 'Agent User',
      commission: '$2.00',
      status: 'confirmed',
    },
    {
      id: '2',
      orderNo: '2510-001',
      type: 'buyer',
      date: '2025-10-06',
      buyer: 'Fresh Valley Farms',
      seller: 'TORA & GLASSER',
      products: 'NIC...',
      items: 'PRUNES',
      total: '$378,000.00',
      agent: 'Agent User',
      commission: '$2.50',
      status: 'confirmed',
    },
    {
      id: '3',
      orderNo: '2510-004',
      type: 'seller',
      date: '2025-10-05',
      buyer: 'Medium Farms',
      seller: 'Fresh Valley Farms',
      products: 'Tools Impex',
      items: 'CORNUT',
      total: '$53,280.00',
      agent: 'Agent User',
      commission: '$2.00',
      status: 'confirmed',
    },
  ]

  const addresses = [
    {
      id: '1',
      type: 'billing',
      line1: '123 Farm Road',
      line2: 'Suite 100',
      city: 'Sacramento',
      state: 'CA',
      postalCode: '95814',
      country: 'US',
      isPrimary: true,
    },
    {
      id: '2',
      type: 'shipping',
      line1: '456 Warehouse Ave',
      city: 'Sacramento',
      state: 'CA',
      postalCode: '95816',
      country: 'US',
      isPrimary: false,
    },
  ]

  const contacts = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@freshvalley.com',
      phone: '(916) 555-0123',
      isPrimary: true,
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@freshvalley.com',
      phone: '(916) 555-0124',
      isPrimary: false,
    },
  ]

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

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter((txn) => {
      const searchLower = transactionSearch.toLowerCase()
      return (
        txn.orderNo.toLowerCase().includes(searchLower) ||
        txn.seller.toLowerCase().includes(searchLower) ||
        txn.buyer.toLowerCase().includes(searchLower) ||
        txn.products.toLowerCase().includes(searchLower) ||
        txn.agent.toLowerCase().includes(searchLower)
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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/accounts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
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
              <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Code: <span className="font-mono">{account.code}</span>
                {account.qboCustomerId && (
                  <span className="ml-3 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Synced to QuickBooks
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Account
            </Button>
            <Button variant="outline" className="text-blue-600 hover:text-blue-700">
              {account.qboCustomerId ? 'Refresh from QBO' : 'Sync to QBO'}
            </Button>
          </div>
        </div>
      </div>

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
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Account Code</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{account.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Account Name</label>
                  <p className="mt-1 text-sm text-gray-900">{account.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        account.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {account.active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(account.createdAt).toLocaleDateString()}
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
                      <p className="mt-1 text-sm text-gray-900 font-mono">
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
                      <tr key={txn.id} className="hover:bg-gray-50">
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
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {txn.type === 'seller' ? 'Seller' : 'Buyer'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{txn.seller}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{txn.buyer}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{txn.products}</div>
                          <div className="text-xs text-gray-500">{txn.items}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{txn.total}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {new Date(txn.date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{txn.agent}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{txn.commission}</span>
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
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Type <span className="text-red-500">*</span>
                      </label>
                      <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                        <option value="billing">Billing</option>
                        <option value="shipping">Shipping</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="pickup">Pickup</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="ml-2 text-sm text-gray-700">Set as primary</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="Street address" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2
                    </label>
                    <Input placeholder="Suite, unit, building, floor, etc." />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Input maxLength={2} placeholder="CA" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code <span className="text-red-500">*</span>
                      </label>
                      <Input placeholder="95814" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Add Address
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {addresses.map((address) => (
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
                    <Button size="sm" variant="outline">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
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
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input placeholder="John Smith" />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="ml-2 text-sm text-gray-700">Set as primary</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input type="email" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <Input type="tel" placeholder="(916) 555-0123" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Add Contact
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {contacts.map((contact) => (
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
                    <Button size="sm" variant="outline">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
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
