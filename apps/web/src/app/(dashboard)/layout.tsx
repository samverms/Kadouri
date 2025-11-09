'use client'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <Sidebar />
      <main className="ml-64 mt-16 p-8 bg-gray-50 min-h-screen">
        {children}
      </main>
    </>
  )
}
