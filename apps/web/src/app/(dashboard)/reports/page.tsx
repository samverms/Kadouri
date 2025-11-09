'use client'

import { BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          </div>
          <p className="mt-2 text-gray-600">Analytics and reporting dashboard</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Reports and analytics coming soon...</p>
        </div>
      </div>
    </div>
  )
}
