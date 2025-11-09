'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
} from 'lucide-react'

interface Contract {
  id: string
  contractNumber: string
  seller: string
  buyer: string
  product: string
  quantity: string
  pricePerUnit: string
  totalValue: string
  startDate: string
  endDate: string
  status: 'active' | 'pending' | 'expired' | 'cancelled'
  terms: string
}

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showNewContractModal, setShowNewContractModal] = useState(false)

  const contracts: Contract[] = [
    {
      id: '1',
      contractNumber: 'CNT-2025-001',
      seller: 'Acme Farms Inc.',
      buyer: 'Fresh Market Distributors',
      product: 'Strawberries - Albion',
      quantity: '500 lbs/week',
      pricePerUnit: '$4.50/lb',
      totalValue: '$117,000',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'active',
      terms: '52-week supply agreement with weekly deliveries',
    },
    {
      id: '2',
      contractNumber: 'CNT-2025-002',
      seller: 'Green Valley Produce',
      buyer: 'Organic Foods Co.',
      product: 'Avocados - Hass',
      quantity: '300 lbs/week',
      pricePerUnit: '$3.80/lb',
      totalValue: '$59,280',
      startDate: '2025-02-01',
      endDate: '2025-07-31',
      status: 'active',
      terms: '26-week supply agreement, premium grade',
    },
    {
      id: '3',
      contractNumber: 'CNT-2024-045',
      seller: 'Sunny Orchards',
      buyer: 'Restaurant Group LLC',
      product: 'Lettuce - Romaine',
      quantity: '150 heads/week',
      pricePerUnit: '$1.25/head',
      totalValue: '$9,750',
      startDate: '2024-10-01',
      endDate: '2025-03-31',
      status: 'pending',
      terms: 'Seasonal contract, bi-weekly deliveries',
    },
    {
      id: '4',
      contractNumber: 'CNT-2024-038',
      seller: 'Harvest Pride Farms',
      buyer: 'Grocery Chain Inc.',
      product: 'Tomatoes - Beefsteak',
      quantity: '200 lbs/week',
      pricePerUnit: '$2.80/lb',
      totalValue: '$29,120',
      startDate: '2024-06-01',
      endDate: '2024-12-31',
      status: 'expired',
      terms: 'Summer/Fall contract with quality guarantees',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'expired':
        return 'bg-gray-100 text-gray-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'expired':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.product.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || contract.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const stats = [
    {
      title: 'Active Contracts',
      value: contracts.filter((c) => c.status === 'active').length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Approval',
      value: contracts.filter((c) => c.status === 'pending').length,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Total Value',
      value: '$215,150',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Expiring Soon',
      value: '2',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          <p className="mt-2 text-gray-600">Manage supplier and buyer agreements</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowNewContractModal(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Contract
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`rounded-full ${stat.bgColor} p-3`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search contracts by number, seller, buyer, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.map((contract) => (
          <Card key={contract.id} className="border-gray-200 hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <CardTitle className="text-xl">{contract.contractNumber}</CardTitle>
                    <span
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                        contract.status
                      )}`}
                    >
                      {getStatusIcon(contract.status)}
                      {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                    </span>
                  </div>
                  <CardDescription className="text-sm">
                    {contract.seller} → {contract.buyer}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Product</p>
                  <p className="mt-1 text-sm text-gray-900">{contract.product}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Quantity</p>
                  <p className="mt-1 text-sm text-gray-900">{contract.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Price</p>
                  <p className="mt-1 text-sm text-gray-900">{contract.pricePerUnit}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{contract.totalValue}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contract Period</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(contract.startDate).toLocaleDateString()} -{' '}
                    {new Date(contract.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Terms</p>
                  <p className="mt-1 text-sm text-gray-900">{contract.terms}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">No contracts found</p>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}

      {/* New Contract Modal */}
      {showNewContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">New Contract</h2>
              <button
                onClick={() => setShowNewContractModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Contract Number
                  </label>
                  <Input placeholder="CNT-2025-XXX" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Seller</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="">Select Seller...</option>
                    <option value="1">Acme Farms Inc.</option>
                    <option value="2">Green Valley Produce</option>
                    <option value="3">Sunny Orchards</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Buyer</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="">Select Buyer...</option>
                    <option value="1">Fresh Market Distributors</option>
                    <option value="2">Organic Foods Co.</option>
                    <option value="3">Restaurant Group LLC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Product</label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="">Select Product...</option>
                  <option value="1">Strawberries - Albion</option>
                  <option value="2">Avocados - Hass</option>
                  <option value="3">Lettuce - Romaine</option>
                  <option value="4">Tomatoes - Beefsteak</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Quantity</label>
                  <Input placeholder="500 lbs/week" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Price per Unit
                  </label>
                  <Input placeholder="$4.50/lb" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Total Value
                  </label>
                  <Input placeholder="$117,000" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">End Date</label>
                  <Input type="date" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Contract Terms
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={4}
                  placeholder="Enter contract terms and conditions..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewContractModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Contract
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
