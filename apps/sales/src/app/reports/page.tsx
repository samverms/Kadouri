'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  FileText,
  Download,
  Calendar,
  Filter,
} from 'lucide-react'

interface ReportCard {
  title: string
  description: string
  icon: any
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [filtersApplied, setFiltersApplied] = useState(false)

  const summaryCards: ReportCard[] = [
    {
      title: 'Total Sales',
      description: 'Last 30 days',
      icon: DollarSign,
      value: '$45,231.89',
      change: '+20.1%',
      changeType: 'positive',
    },
    {
      title: 'Total Orders',
      description: 'Last 30 days',
      icon: FileText,
      value: '128',
      change: '+12.5%',
      changeType: 'positive',
    },
    {
      title: 'Active Accounts',
      description: 'Sellers & Buyers',
      icon: Users,
      value: '45',
      change: '+5',
      changeType: 'positive',
    },
    {
      title: 'Products Sold',
      description: 'Last 30 days',
      icon: Package,
      value: '2,350 lbs',
      change: '+8.2%',
      changeType: 'positive',
    },
  ]

  const reportTypes = [
    {
      id: 'sales-summary',
      title: 'Sales Summary Report',
      description: 'Overview of all sales by date range',
      icon: TrendingUp,
      color: 'blue',
    },
    {
      id: 'commission-report',
      title: 'Commission Report',
      description: 'Agent commissions and earnings breakdown',
      icon: DollarSign,
      color: 'green',
    },
    {
      id: 'customer-history',
      title: 'Customer History',
      description: 'Transaction history by customer',
      icon: Users,
      color: 'purple',
    },
    {
      id: 'product-summary',
      title: 'Product Summary',
      description: 'Sales volume by product and variety',
      icon: Package,
      color: 'orange',
    },
    {
      id: 'order-status',
      title: 'Order Status Report',
      description: 'Current status of all orders',
      icon: FileText,
      color: 'indigo',
    },
    {
      id: 'qbo-sync',
      title: 'QuickBooks Sync Report',
      description: 'Sync status with QuickBooks Online',
      icon: BarChart3,
      color: 'teal',
    },
  ]

  const getReportData = (reportId: string) => {
    switch (reportId) {
      case 'sales-summary':
        return {
          headers: ['Date', 'Description', 'Customer', 'Amount'],
          rows: [
            ['2025-01-15', 'Strawberries - Albion - Grade A', 'Fresh Market Distributors', '$4,500.00'],
            ['2025-01-18', 'Avocados - Hass - Premium', 'Acme Farms Inc.', '$9,500.00'],
            ['2025-01-20', 'Lettuce - Romaine - Grade A', 'Fresh Market Distributors', '$7,275.00'],
          ],
          total: '$21,275.00'
        }
      case 'commission-report':
        return {
          headers: ['Agent', 'Orders', 'Total Sales', 'Commission Rate', 'Commission Earned'],
          rows: [
            ['John Smith', '15', '$48,500.00', '10%', '$4,850.00'],
            ['Sarah Johnson', '12', '$38,200.00', '10%', '$3,820.00'],
            ['Mike Davis', '8', '$22,100.00', '8%', '$1,768.00'],
          ],
          total: '$10,438.00'
        }
      case 'customer-history':
        return {
          headers: ['Customer', 'Total Orders', 'Total Purchases', 'Last Order Date', 'Status'],
          rows: [
            ['Fresh Market Distributors', '24', '$52,300.00', '2025-01-20', 'Active'],
            ['Acme Farms Inc.', '18', '$41,200.00', '2025-01-18', 'Active'],
            ['Organic Foods Co.', '15', '$28,900.00', '2025-01-15', 'Active'],
          ],
          total: '$122,400.00'
        }
      case 'product-summary':
        return {
          headers: ['Product', 'Variety', 'Total Sold', 'Unit', 'Revenue'],
          rows: [
            ['Strawberries', 'Albion', '2,490', 'lbs', '$12,450.00'],
            ['Avocados', 'Hass', '2,596', 'lbs', '$9,850.00'],
            ['Lettuce', 'Romaine', '5,760', 'heads', '$7,200.00'],
          ],
          total: '$29,500.00'
        }
      case 'order-status':
        return {
          headers: ['Order #', 'Date', 'Customer', 'Amount', 'Status'],
          rows: [
            ['ORD-2025-001', '2025-01-15', 'Fresh Market Distributors', '$4,500.00', 'Delivered'],
            ['ORD-2025-002', '2025-01-18', 'Acme Farms Inc.', '$9,500.00', 'Shipped'],
            ['ORD-2025-003', '2025-01-20', 'Fresh Market Distributors', '$7,275.00', 'Pending'],
          ],
          total: '$21,275.00'
        }
      case 'qbo-sync':
        return {
          headers: ['Entity Type', 'Local Records', 'Synced to QBO', 'Pending Sync', 'Last Sync'],
          rows: [
            ['Customers', '45', '42', '3', '2025-01-20 10:30 AM'],
            ['Products', '28', '28', '0', '2025-01-20 10:25 AM'],
            ['Invoices', '128', '115', '13', '2025-01-20 11:00 AM'],
          ],
          total: ''
        }
      default:
        return {
          headers: ['Date', 'Description', 'Customer', 'Amount'],
          rows: [],
          total: '$0.00'
        }
    }
  }

  const handleGenerateReport = (reportId: string) => {
    setSelectedReport(reportId)
    console.log(`Generating report: ${reportId}`, { dateFrom, dateTo })
  }

  const handleApplyFilters = () => {
    setFiltersApplied(true)
    if (selectedReport) {
      // Re-generate current report with new filters
      handleGenerateReport(selectedReport)
    }
  }

  const getChangeColor = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getReportColor = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
    }
    return colors[color] || colors.blue
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="mt-2 text-gray-600">View insights and generate custom reports</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                    <p className="mt-2 flex items-center text-sm">
                      <span className={getChangeColor(card.changeType)}>{card.change}</span>
                      <span className="ml-2 text-gray-500">{card.description}</span>
                    </p>
                  </div>
                  <div className="rounded-full bg-gray-100 p-3">
                    <Icon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Date Range Filter */}
      <Card className={`mb-6 ${filtersApplied ? 'border-blue-300 bg-blue-50' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
            {filtersApplied && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                Active
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {filtersApplied
              ? `Filters applied: ${dateFrom || 'Start'} to ${dateTo || 'Today'}`
              : 'Select date range for reports'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <Calendar className="mr-2 inline h-4 w-4" />
                From Date
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <Calendar className="mr-2 inline h-4 w-4" />
                To Date
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleApplyFilters}
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Available Reports</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => {
            const Icon = report.icon
            const colors = getReportColor(report.color)
            return (
              <Card
                key={report.id}
                className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                  selectedReport === report.id
                    ? `${colors.border} ${colors.bg}`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleGenerateReport(report.id)}
              >
                <CardHeader>
                  <div className="mb-3 flex items-center justify-between">
                    <div className={`rounded-lg ${colors.bg} p-3`}>
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGenerateReport(report.id)
                      }}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Export
                    </Button>
                  </div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Sample Report Preview */}
      {selectedReport && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Report Preview: {reportTypes.find((r) => r.id === selectedReport)?.title}
            </CardTitle>
            <CardDescription>
              Showing data from {dateFrom || 'start'} to {dateTo || 'today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Sample Report Data</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
              </div>

              {/* Dynamic Table */}
              <div className="overflow-x-auto">
                {(() => {
                  const reportData = getReportData(selectedReport)
                  return (
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          {reportData.headers.map((header, index) => (
                            <th
                              key={index}
                              className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 ${
                                index === reportData.headers.length - 1 ? 'text-right' : 'text-left'
                              }`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {reportData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className={`whitespace-nowrap px-4 py-3 text-sm ${
                                  cellIndex === row.length - 1
                                    ? 'text-right font-medium text-gray-900'
                                    : cellIndex === 0
                                    ? 'text-gray-900'
                                    : 'text-gray-600'
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                      {reportData.total && (
                        <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                          <tr>
                            <td
                              colSpan={reportData.headers.length - 1}
                              className="px-4 py-3 text-right text-sm font-semibold text-gray-900"
                            >
                              Total:
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-gray-900">
                              {reportData.total}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
