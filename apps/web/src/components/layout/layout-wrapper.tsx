'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'
import { Sidebar } from './sidebar'

const authRoutes = ['/login', '/login/verify-mfa', '/accept-invitation', '/logout']

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Check if current route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname?.startsWith(route))

  if (isAuthRoute) {
    // Auth pages: no header/sidebar, full page layout
    return <div className="min-h-screen">{children}</div>
  }

  // App pages: with header and sidebar
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="ml-64 mt-16 p-8">{children}</main>
    </div>
  )
}
