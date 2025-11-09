'use client'

import { User } from 'lucide-react'

export function Header() {
  // Default agent name (will be dynamic when Clerk is configured)
  const agentName = 'Agent User'

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between px-6">
        {/* Left: Kaduri Connection Branding */}
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-white font-bold text-lg">KC</span>
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Kaduri Connection
            </h1>
            <p className="text-xs text-gray-500">Order Management System</p>
          </div>
        </div>

        {/* Right: Agent Name */}
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 text-right">{agentName}</p>
            <p className="text-xs text-gray-500 text-right">Sales Agent</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}
