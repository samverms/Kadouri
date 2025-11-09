'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  FileText,
  ChevronRight,
  ChevronDown,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react'

interface Invoice {
  id: string
  invoiceNo: string
  orderId: string
  orderNo: string
  date: string
  dueDate: string
  sellerId: string
  seller: string
  buyerId: string
  buyer: string
  productId: string
  product: string
  agent: string
  agentId: string
  subtotal: number
  commissionAmount: number
  commissionRate: number
  total: number
  amountPaid: number
  balance: number
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  qboInvoiceId?: string
  qboInvoiceNumber?: string
  createdAt: string
}

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Mock data - will be replaced with API call
  const [invoices] = useState<Invoice[]>([
    {
      id: '1',
      invoiceNo: 'INV-2024-001',
      orderId: '1',
      orderNo: 'ORD-2024-001',
      date: '2024-12-15',
      dueDate: '2025-01-14',
      sellerId: '4',
      seller: 'Guerra Nut Shelling',
      buyerId: '2',
      buyer: 'C&G ENTERPRISES',
      productId: '1',
      product: 'Almonds - Nonpareil - Premium',
      agent: 'John Smith',
      agentId: 'agent1',
      subtotal: 4500,
      commissionAmount: 112.5,
      commissionRate: 2.5,
      total: 4612.5,
      amountPaid: 4612.5,
      balance: 0,
      status: 'paid',
      qboInvoiceId: 'QBO-INV-001',
      qboInvoiceNumber: '1001',
      createdAt: '2024-12-15',
    },
    {
      id: '2',
      invoiceNo: 'INV-2024-015',
      orderId: '2',
      orderNo: 'ORD-2024-015',
      date: '2024-12-20',
      dueDate: '2025-01-19',
      sellerId: '3',
      seller: 'FAMOSO NUT COMPANY',
      buyerId: '1',
      buyer: 'ANC001',
      productId: '2',
      product: 'Walnuts - Chandler - Extra Light',
      agent: 'Sarah Johnson',
      agentId: 'agent2',
      subtotal: 9500,
      commissionAmount: 285.0,
      commissionRate: 3.0,
      total: 9785.0,
      amountPaid: 5000,
      balance: 4785.0,
      status: 'partial',
      qboInvoiceId: 'QBO-INV-002',
      qboInvoiceNumber: '1002',
      createdAt: '2024-12-20',
    },
    {
      id: '3',
      invoiceNo: 'INV-2025-003',
      orderId: '3',
      orderNo: 'ORD-2025-003',
      date: '2025-01-05',
      dueDate: '2025-02-04',
      sellerId: '4',
      seller: 'Guerra Nut Shelling',
      buyerId: '2',
      buyer: 'C&G ENTERPRISES',
      productId: '3',
      product: 'Pecans - Desirable - Fancy',
      agent: 'John Smith',
      agentId: 'agent1',
      subtotal: 7275,
      commissionAmount: 181.88,
      commissionRate: 2.5,
      total: 7456.88,
      amountPaid: 0,
      balance: 7456.88,
      status: 'sent',
      createdAt: '2025-01-05',
    },
    {
      id: '4',
      invoiceNo: 'INV-2025-007',
      orderId: '4',
      orderNo: 'ORD-2025-007',
      date: '2025-01-10',
      dueDate: '2025-02-09',
      sellerId: '3',
      seller: 'FAMOSO NUT COMPANY',
      buyerId: '4',
      buyer: 'Guerra Nut Shelling',
      productId: '4',
      product: 'Pistachios - Kerman - Premium',
      agent: 'Sarah Johnson',
      agentId: 'agent2',
      subtotal: 5000,
      commissionAmount: 150.0,
      commissionRate: 3.0,
      total: 5150.0,
      amountPaid: 0,
      balance: 5150.0,
      status: 'draft',
      createdAt: '2025-01-10',
    },
  ])

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.agent.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-3 w-3" />
      case 'sent':
        return <Clock className="h-3 w-3" />
      case 'paid':
        return <CheckCircle className="h-3 w-3" />
      case 'partial':
        return <DollarSign className="h-3 w-3" />
      case 'overdue':
        return <XCircle className="h-3 w-3" />
      case 'cancelled':
        return <XCircle className="h-3 w-3" />
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-2 text-gray-600">Manage and track all invoices</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search invoices by invoice #, order #, seller, buyer, or agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      {showCreateDialog && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Invoice</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
            </div>
            <form className="space-y-6">
              {/* Select Order */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Select Order</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Number <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="">Select an order</option>
                      <option value="1">ORD-2024-001 - Guerra Nut Shelling → C&G ENTERPRISES</option>
                      <option value="2">ORD-2024-015 - FAMOSO NUT COMPANY → ANC001</option>
                      <option value="3">ORD-2025-003 - Guerra Nut Shelling → C&G ENTERPRISES</option>
                      <option value="4">ORD-2025-007 - FAMOSO NUT COMPANY → Guerra Nut Shelling</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select an order to create an invoice for
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Order Details</p>
                    <p className="text-sm text-gray-600">Select an order to view details</p>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Invoice Details</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Date <span className="text-red-500">*</span>
                    </label>
                    <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <Input type="date" />
                    <p className="text-xs text-gray-500 mt-1">
                      Net 30 days from invoice date
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Number
                    </label>
                    <Input placeholder="Auto-generated if left blank" />
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Terms</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Terms
                    </label>
                    <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="net30">Net 30</option>
                      <option value="net15">Net 15</option>
                      <option value="net60">Net 60</option>
                      <option value="due_on_receipt">Due on Receipt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="draft">Draft</option>
                      <option value="sent">Send to Customer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Options</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Sync to QuickBooks immediately</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Send email notification to customer</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Include commission in invoice total</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Memo
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                  placeholder="Add any additional notes or instructions for the customer..."
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Invoice
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

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoiced</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${invoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ${invoices.reduce((sum, inv) => sum + inv.amountPaid, 0).toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${invoices.reduce((sum, inv) => sum + inv.balance, 0).toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${invoices.reduce((sum, inv) => sum + inv.commissionAmount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-8"></th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
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
                {filteredInvoices.map((invoice) => (
                  <>
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-2 py-2">
                        <button
                          onClick={() =>
                            setExpandedInvoiceId(
                              expandedInvoiceId === invoice.id ? null : invoice.id
                            )
                          }
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedInvoiceId === invoice.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {invoice.invoiceNo}
                        </Link>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Link
                          href={`/orders/${invoice.orderId}`}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {invoice.orderNo}
                        </Link>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                        {new Date(invoice.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                        {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap max-w-[120px] truncate">
                        <Link
                          href={`/accounts/${invoice.buyerId}`}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          title={invoice.buyer}
                        >
                          {invoice.buyer}
                        </Link>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 max-w-[100px] truncate" title={invoice.agent}>
                        {invoice.agent}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        ${invoice.total.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-green-600">
                        ${invoice.amountPaid.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        ${invoice.balance.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex gap-1 justify-end">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                            View
                          </Button>
                          {invoice.status === 'draft' && (
                            <Button size="sm" className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700">
                              Send
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedInvoiceId === invoice.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={12} className="px-6 py-4">
                          <div className="grid grid-cols-4 gap-6">
                            {/* Invoice Details */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Invoice Details
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Invoice Number
                                  </label>
                                  <p className="text-sm text-gray-900 font-mono mt-1">
                                    {invoice.invoiceNo}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Order Reference
                                  </label>
                                  <Link
                                    href={`/orders/${invoice.orderId}`}
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1 flex items-center gap-1"
                                  >
                                    {invoice.orderNo}
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                </div>
                                {invoice.qboInvoiceNumber && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">
                                      QuickBooks Invoice
                                    </label>
                                    <p className="text-sm text-gray-900 mt-1">
                                      {invoice.qboInvoiceNumber}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Status
                                  </label>
                                  <p className="mt-1">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(
                                        invoice.status
                                      )}`}
                                    >
                                      {getStatusIcon(invoice.status)}
                                      {invoice.status}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Parties */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Parties & Product
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Seller
                                  </label>
                                  <Link
                                    href={`/accounts/${invoice.sellerId}`}
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1 block"
                                  >
                                    {invoice.seller}
                                  </Link>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Buyer
                                  </label>
                                  <Link
                                    href={`/accounts/${invoice.buyerId}`}
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1 block"
                                  >
                                    {invoice.buyer}
                                  </Link>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Product
                                  </label>
                                  <Link
                                    href={`/products/${invoice.productId}`}
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1 block"
                                  >
                                    {invoice.product}
                                  </Link>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Agent
                                  </label>
                                  <p className="text-sm text-gray-900 mt-1">{invoice.agent}</p>
                                </div>
                              </div>
                            </div>

                            {/* Financial Details */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Financial Details
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Subtotal
                                  </label>
                                  <p className="text-sm text-gray-900 mt-1">
                                    ${invoice.subtotal.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Commission
                                  </label>
                                  <p className="text-sm text-gray-900 mt-1">
                                    ${invoice.commissionAmount.toFixed(2)}
                                    <span className="text-xs text-gray-500 ml-1">
                                      ({invoice.commissionRate}%)
                                    </span>
                                  </p>
                                </div>
                                <div className="pt-2 border-t border-gray-200">
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Total Amount
                                  </label>
                                  <p className="text-lg font-bold text-gray-900 mt-1">
                                    ${invoice.total.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Payment Status */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Payment Status
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Amount Paid
                                  </label>
                                  <p className="text-sm font-semibold text-green-600 mt-1">
                                    ${invoice.amountPaid.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Balance Due
                                  </label>
                                  <p className="text-sm font-semibold text-gray-900 mt-1">
                                    ${invoice.balance.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">
                                    Due Date
                                  </label>
                                  <p className="text-sm text-gray-900 mt-1">
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                  </p>
                                </div>
                                {invoice.balance > 0 && (
                                  <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 mt-2">
                                    Record Payment
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating a new invoice'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
