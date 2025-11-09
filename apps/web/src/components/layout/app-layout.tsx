'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'
import { Sidebar } from './sidebar'

const publicRoutes = ['/login', '/logout', '/accept-invitation', '/']

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route))

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <Sidebar />
      <main className="ml-64 mt-16 p-8">
        {children}
      </main>
    </>
  )
}
