'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'
import { User, LogOut, Settings, ChevronDown, Shield } from 'lucide-react'

const roleColors = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  manager: 'bg-purple-100 text-purple-800 border-purple-200',
  agent: 'bg-blue-100 text-blue-800 border-blue-200',
  readonly: 'bg-gray-100 text-gray-800 border-gray-200',
}

const roleLabels = {
  admin: 'Administrator',
  manager: 'Manager',
  agent: 'Sales Agent',
  readonly: 'Read Only',
}

export function Header() {
  const router = useRouter()
  const { user } = useUser()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    setShowDropdown(false)
    router.push('/logout')
  }

  const handleSettings = () => {
    setShowDropdown(false)
    router.push('/settings/security')
  }

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'Guest User'
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || 'guest@example.com'
  const userRole = (user?.publicMetadata?.role as string) || 'agent'
  const mfaEnabled = user?.twoFactorEnabled || false

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between px-6">
        {/* Left: Kadouri Connection Branding */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Kadouri Connection Logo"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
          <div className="text-left">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Kadouri Connection
            </h1>
            <p className="text-xs text-gray-500">Order Management System</p>
          </div>
        </div>

        {/* Right: User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{roleLabels[userRole as keyof typeof roleLabels]}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
              <User className="h-5 w-5 text-white" />
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                showDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />

              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                  <span
                    className={`inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium border ${roleColors[userRole as keyof typeof roleColors]}`}
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    {roleLabels[userRole as keyof typeof roleLabels]}
                  </span>
                  {mfaEnabled && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                      <Shield className="h-3 w-3" />
                      <span>MFA Enabled</span>
                    </div>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleSettings}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Security Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
