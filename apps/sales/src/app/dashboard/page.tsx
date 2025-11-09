'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Target,
  Award,
  Clock,
  Plus,
  FileText,
  Mail,
  Calendar,
  Search,
  Send,
  Bell,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export default function SalesDashboard() {
  const todosRef = useRef<HTMLDivElement>(null)
  const performersRef = useRef<HTMLDivElement>(null)

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 400
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const quickLinks = [
    {
      title: 'Accounts',
      description: 'Manage business accounts and organizations',
      icon: Users,
      href: '/accounts',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Orders',
      description: 'Create and manage customer orders',
      icon: FileText,
      href: '/orders',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Invoices',
      description: 'Generate and track invoices',
      icon: DollarSign,
      href: '/invoices',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ]

  const metrics = [
    {
      title: 'My Monthly Sales',
      value: '$45,231',
      change: '+20.1% from last month',
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'My Commission',
      value: '$4,523',
      change: '10% average rate',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Deals',
      value: '12',
      change: '3 closing this week',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Orders This Month',
      value: '28',
      change: '+12.5% from last month',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  const todos = [
    { task: 'Follow up with Green Valley Farms on strawberry order', priority: 'high', dueDate: 'Today' },
    { task: 'Send quote to Organic Foods Co. for avocado shipment', priority: 'high', dueDate: 'Today' },
    { task: 'Prepare contract for Fresh Market Distributors', priority: 'medium', dueDate: 'Tomorrow' },
    { task: 'Review pricing for new lettuce varieties', priority: 'low', dueDate: 'This Week' },
  ]

  const topPerformers = [
    { name: 'Strawberries - Albion', sold: '2,490 lbs', revenue: '$12,450' },
    { name: 'Avocados - Hass', sold: '2,596 lbs', revenue: '$9,850' },
    { name: 'Lettuce - Romaine', sold: '5,760 heads', revenue: '$7,200' },
    { name: 'Tomatoes - Roma', sold: '1,840 lbs', revenue: '$5,520' },
  ]

  const quickActions = [
    { icon: Search, label: 'Search Accounts/Orders', href: '/search', color: 'bg-blue-500' },
    { icon: Send, label: 'Email Templates', href: '/email/templates', color: 'bg-purple-500' },
    { icon: Calendar, label: 'My Calendar', href: '/calendar', color: 'bg-green-500' },
  ]

  const enhancedMetrics = [
    { label: 'YTD Sales', value: '$542,780', change: '+15.3%', trend: 'up' },
    { label: 'Goal Progress', value: '68%', change: '$204K to goal', trend: 'neutral' },
    { label: 'Pipeline Value', value: '$124,500', change: '8 deals', trend: 'up' },
  ]

  const recentActivity = [
    { customer: 'Green Valley Farms', action: 'Order confirmed', time: '2h ago', type: 'success' },
    { customer: 'Organic Foods Co.', action: 'Deal moved to negotiation', time: '5h ago', type: 'info' },
    { customer: 'Fresh Market Dist.', action: 'Follow-up scheduled', time: '1d ago', type: 'warning' },
    { customer: 'Sunny Orchards', action: 'Quote sent', time: '2d ago', type: 'info' },
  ]

  const topCustomers = [
    { name: 'Green Valley Farms', revenue: '$28,450' },
    { name: 'Organic Foods Co.', revenue: '$21,850' },
    { name: 'Fresh Market Distributors', revenue: '$18,200' },
  ]

  const reminders = [
    { message: 'Follow up with Green Valley Farms - strawberry order', type: 'urgent', time: 'Today' },
    { message: 'Contract renewal - Organic Foods Co.', type: 'warning', time: 'Tomorrow' },
    { message: 'Payment collection - Fresh Market Dist. ($7,200)', type: 'warning', time: 'Today' },
    { message: 'Quote expires - Sunny Orchards', type: 'info', time: '3 days' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 -mt-8">
      <div className="mx-auto max-w-7xl space-y-8 px-8 pb-8">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold">Sales Dashboard</h1>
          <p className="mt-2 text-lg text-blue-100">Welcome back! Here's your sales overview</p>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="mb-6 text-2xl font-bold text-gray-800">Quick Links</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.title} href={link.href}>
                  <div
                    className={`group relative h-32 overflow-hidden rounded-xl ${link.color} p-5 text-white shadow-lg transition-all hover:scale-105 hover:shadow-2xl`}
                  >
                    <div className="absolute -right-2 -top-2 opacity-20">
                      <Icon className="h-24 w-24" />
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <Icon className="h-8 w-8" />
                      <div>
                        <div className="font-bold text-lg leading-tight">{link.title}</div>
                        <div className="text-xs opacity-90 mt-1">{link.description}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Metrics */}
        <div>
          <h2 className="mb-6 text-2xl font-bold text-gray-800">My Metrics</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.title}
                  className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
                >
                  <div className="absolute right-4 top-4 opacity-10">
                    <Icon className="h-20 w-20" />
                  </div>
                  <div className="relative z-10">
                    <div className={`mb-4 inline-flex rounded-lg ${metric.bgColor} p-3`}>
                      <Icon className={`h-6 w-6 ${metric.color}`} />
                    </div>
                    <p className="text-sm font-semibold text-gray-600">{metric.title}</p>
                    <p className="mt-2 text-4xl font-bold text-gray-900">{metric.value}</p>
                    <p className="mt-2 text-sm font-medium text-green-600">{metric.change}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* To-Dos */}
        <div>
          <h2 className="mb-6 text-2xl font-bold text-gray-800">My To-Dos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {todos.map((todo, index) => (
              <div
                key={index}
                className="cursor-pointer rounded-xl bg-white p-4 shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{todo.task}</p>
                </div>
                <div className="flex items-center gap-2 pl-7">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      todo.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : todo.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {todo.priority}
                  </span>
                  <span className="text-xs font-medium text-gray-500">{todo.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Top Performers */}
      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Top Performers</h2>
        <div className="relative group">
          <button
            onClick={() => scroll(performersRef, 'left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3 shadow-xl hover:shadow-2xl text-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => scroll(performersRef, 'right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3 shadow-xl hover:shadow-2xl text-white"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div ref={performersRef} className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {topPerformers.map((product, index) => (
              <div
                key={index}
                className="min-w-[300px] flex-shrink-0 cursor-pointer rounded-xl bg-white p-5 shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-bold text-white">
                    #{index + 1}
                  </div>
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <p className="font-bold text-gray-900 text-lg">{product.name}</p>
                <p className="mt-1 text-sm text-gray-600">{product.sold}</p>
                <p className="mt-3 text-2xl font-bold text-gray-900">{product.revenue}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.label} href={action.href}>
                <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-2xl">
                  <div className="absolute right-4 top-4 opacity-10">
                    <Icon className="h-16 w-16" />
                  </div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`rounded-lg ${action.color} p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-bold text-gray-900">{action.label}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Enhanced Metrics */}
      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Additional Insights</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {enhancedMetrics.map((metric) => (
            <div
              key={metric.label}
              className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
            >
              <div className="absolute right-4 top-4 opacity-10">
                <TrendingUp className="h-16 w-16" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-semibold text-gray-600">{metric.label}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-gray-900">{metric.value}</p>
                  {metric.trend === 'up' && <ArrowUpRight className="h-6 w-6 text-green-600" />}
                  {metric.trend === 'down' && <ArrowDownRight className="h-6 w-6 text-red-600" />}
                </div>
                <p className="mt-2 text-sm font-medium text-gray-500">{metric.change}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Recent Activity</h2>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="min-w-[280px] flex-shrink-0 cursor-pointer rounded-xl bg-white p-4 shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
            >
              <div className="flex items-start justify-between mb-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <p className="text-xs font-medium text-gray-400">{activity.time}</p>
              </div>
              <p className="font-bold text-gray-900 mb-1">{activity.customer}</p>
              <p className="text-sm text-gray-600 mb-3">{activity.action}</p>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  activity.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : activity.type === 'warning'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {activity.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers */}
      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Top Customers by Revenue</h2>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {topCustomers.map((customer, index) => (
            <div
              key={index}
              className="min-w-[280px] flex-shrink-0 cursor-pointer rounded-xl bg-white p-4 shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-bold text-white">
                  #{index + 1}
                </div>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <p className="font-bold text-gray-900 mb-1">{customer.name}</p>
              <p className="text-2xl font-bold text-gray-900">{customer.revenue}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reminders */}
      <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-2xl font-bold text-orange-900">
            <Bell className="h-7 w-7" />
            Important Reminders
          </h3>
          <p className="mt-1 text-sm font-medium text-orange-700">Action items requiring your attention</p>
        </div>
        <div className="space-y-3">
          {reminders.map((reminder, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 rounded-lg p-4 shadow-md transition-all hover:shadow-lg ${
                reminder.type === 'urgent'
                  ? 'bg-red-100 border-2 border-red-300'
                  : reminder.type === 'warning'
                  ? 'bg-yellow-100 border-2 border-yellow-300'
                  : 'bg-blue-100 border-2 border-blue-300'
              }`}
            >
              <AlertCircle
                className={`mt-0.5 h-6 w-6 flex-shrink-0 ${
                  reminder.type === 'urgent'
                    ? 'text-red-600'
                    : reminder.type === 'warning'
                    ? 'text-yellow-600'
                    : 'text-blue-600'
                }`}
              />
              <div className="flex-1">
                <p
                  className={`font-bold ${
                    reminder.type === 'urgent'
                      ? 'text-red-900'
                      : reminder.type === 'warning'
                      ? 'text-yellow-900'
                      : 'text-blue-900'
                  }`}
                >
                  {reminder.message}
                </p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    reminder.type === 'urgent'
                      ? 'text-red-700'
                      : reminder.type === 'warning'
                      ? 'text-yellow-700'
                      : 'text-blue-700'
                  }`}
                >
                  Due: {reminder.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
