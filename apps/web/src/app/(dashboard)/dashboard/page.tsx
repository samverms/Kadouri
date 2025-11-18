'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Users, FileText, DollarSign, Shield, UserPlus, Loader2 } from 'lucide-react'

export default function Dashboard() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
  const userRole = (user.publicMetadata?.role as string) || 'agent'
  const mfaEnabled = user.twoFactorEnabled || false

  const roleLabels = {
    admin: 'Administrator',
    manager: 'Manager',
    agent: 'Sales Agent',
    readonly: 'Viewer',
  }

  const sections = [
    {
      title: 'Accounts',
      description: 'Manage business accounts and organizations',
      icon: Users,
      href: '/accounts',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      roles: ['admin', 'manager', 'agent', 'readonly'],
    },
    {
      title: 'Orders',
      description: 'Create and manage customer orders',
      icon: FileText,
      href: '/orders',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      roles: ['admin', 'manager', 'agent', 'readonly'],
    },
    {
      title: 'Invoices',
      description: 'Generate and track invoices',
      icon: DollarSign,
      href: '/invoices',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      roles: ['admin', 'manager', 'agent', 'readonly'],
    },
    {
      title: 'Team Management',
      description: 'Invite and manage team members',
      icon: UserPlus,
      href: '/users',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      roles: ['admin', 'manager'],
    },
  ]

  // Filter sections based on user role
  const availableSections = sections.filter((section) => section.roles.includes(userRole))

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-blue-400">Welcome back, {userName}!</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                You're signed in as <span className="font-semibold">{roleLabels[userRole as keyof typeof roleLabels]}</span>
              </p>
              <p className="mt-1 text-gray-500 dark:text-gray-400">Choose a section to get started with your CRM</p>
            </div>
            {mfaEnabled && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 text-green-700">
                  <Shield className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold">Account Protected</p>
                    <p className="text-xs">MFA is enabled</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableSections.map((section) => {
            const Icon = section.icon
            return (
              <Link key={section.title} href={section.href}>
                <Card className="group cursor-pointer border-2 border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-lg h-full">
                  <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <div className={`mb-6 rounded-full ${section.bgColor} p-6`}>
                      <Icon className={`h-12 w-12 ${section.color}`} />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{section.description}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Role-specific notice */}
        {userRole === 'readonly' && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> You have read-only access. Contact your administrator if you need additional permissions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
