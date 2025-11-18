'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Package,
  FileText,
  Receipt,
  Mail,
  BarChart3,
  Settings,
  FileSignature,
  Users,
  X,
  PanelLeftClose
} from 'lucide-react'

const menuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Accounts',
    href: '/accounts',
    icon: Building2,
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: FileText,
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: FileSignature,
  },
  {
    name: 'Invoices',
    href: '/invoices',
    icon: Receipt,
  },
  {
    name: 'Email',
    href: '/email/compose',
    icon: Mail,
    submenu: [
      { name: 'Compose', href: '/email/compose' },
      { name: 'Templates', href: '/email/templates' },
    ],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
  onCollapseClick: () => void
}

export function Sidebar({ isOpen, isCollapsed, onClose, onCollapseClick }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-40 transition-all duration-300
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        w-64
      `}
    >
      {/* Mobile close button */}
      <div className="lg:hidden flex justify-end p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <nav className={`flex h-full flex-col gap-1 ${isCollapsed ? 'p-2' : 'p-4'} overflow-y-auto`}>
        {/* Collapse button next to Dashboard - Desktop only */}
        {!isCollapsed && (
          <div className="hidden lg:flex items-center justify-between px-4 py-2 mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dashboard</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCollapseClick()
              }}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        )}
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onClose()}
              className={`flex items-center gap-3 rounded-lg ${
                isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
              } text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              title={isCollapsed ? item.name : ''}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
