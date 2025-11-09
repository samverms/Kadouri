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
  FileSignature
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
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white">
      <nav className="flex h-full flex-col gap-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
