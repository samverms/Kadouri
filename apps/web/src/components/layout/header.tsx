'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'
import { User, LogOut, Settings, ChevronDown, Shield, Menu, PanelLeftClose, PanelLeft, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeProvider'

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

interface HeaderProps {
  onMenuClick: () => void
  onCollapseClick: () => void
  sidebarCollapsed: boolean
}

export function Header({ onMenuClick, onCollapseClick, sidebarCollapsed }: HeaderProps) {
  const router = useRouter()
  const { user } = useUser()
  const { theme, toggleTheme } = useTheme()
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
    <header className="border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm fixed top-0 left-0 right-0 z-40">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between px-4 sm:px-6">
        {/* Left: Menu buttons and Branding */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>

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
            <p className="text-xs text-gray-500 dark:text-gray-400">Order Management System</p>
          </div>
        </div>

        {/* Right: Dark Mode Toggle and User Menu */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle dark mode"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabels[userRole as keyof typeof roleLabels]}</p>
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
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
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
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Security Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
    </div>
    </header>
  )
}
