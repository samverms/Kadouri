'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { ToastProvider } from '@/components/ui/toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <ThemeProvider>
      <ToastProvider>
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onCollapseClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onCollapseClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main className={`mt-16 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        {children}
      </main>
      </ToastProvider>
    </ThemeProvider>
  )
}
